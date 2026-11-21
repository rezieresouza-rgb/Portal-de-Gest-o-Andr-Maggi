import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Smartphone,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  UserCheck,
  Users,
  FileText,
  Download,
  Trash2,
  Eye,
  ArrowLeft,
  X,
  ClipboardCheck,
  Scale,
  Database,
  Copy,
  Edit3,
  PackageCheck,
  Info,
  ShieldAlert
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { User } from '../types';
import {
  ElectronicDeviceSeizureRecord,
  ElectronicDeviceSeizureTerm,
  DEVICE_TYPE_OPTIONS,
  SEIZURE_LOCATION_OPTIONS,
  SCREEN_CONDITION_OPTIONS,
  BODY_CONDITION_OPTIONS,
  POWER_STATE_OPTIONS,
  ACCESSORY_OPTIONS,
  ScreenCondition,
  BodyCondition,
  PowerState,
  ReturnPolicy,
  ReturnedToType,
  formatBrDate
} from './ElectronicDeviceSeizureTerm';

const LOCAL_STORAGE_KEY = 'eecm_electronic_device_seizures_v1';

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

const getLocalIsoDate = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getLocalTime = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export interface SeizureStudentOption {
  StudentUuid?: string;
  CodigoAluno?: string;
  Nome: string;
  Turma: string;
  Turno?: string;
  NomeResponsavel?: string;
  TelefoneContato?: string;
  PAED?: string;
}

interface ElectronicDeviceSeizureManagerProps {
  moduleSource: 'CIVICO_MILITAR' | 'COORDENACAO';
  user: User;
  initialStudent?: SeizureStudentOption | null;
  onClearInitialStudent?: () => void;
  onCustodyCountChange?: (count: number) => void;
}

const DEFAULT_REASON =
  'Uso não autorizado de aparelho eletrônico portátil durante atividade escolar, em desacordo com a Lei Federal nº 15.100/2025, Lei Estadual MT nº 12.745/2024 e Regulamento Disciplinar EECM-MT (Item 61).';

const SQL_MIGRATION_SNIPPET = `CREATE TABLE IF NOT EXISTS public.electronic_device_seizures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_number TEXT NOT NULL,
  occurrence_sequence INTEGER NOT NULL DEFAULT 1,
  school_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  module_source TEXT NOT NULL DEFAULT 'CIVICO_MILITAR',
  student_id TEXT, student_code TEXT, student_name TEXT NOT NULL,
  classroom_name TEXT NOT NULL, shift TEXT, guardian_name TEXT, guardian_phone TEXT,
  student_is_paed BOOLEAN DEFAULT false, paed_exception_verified BOOLEAN DEFAULT true,
  seizure_date DATE NOT NULL, seizure_time TEXT NOT NULL, seizure_location TEXT NOT NULL,
  seizure_subject_activity TEXT, seizure_reason TEXT NOT NULL,
  seized_by_name TEXT NOT NULL, seized_by_role TEXT,
  student_refused_signature BOOLEAN DEFAULT false, witness_name TEXT,
  device_type TEXT NOT NULL, device_brand_model TEXT NOT NULL,
  device_color TEXT, device_imei_serial TEXT, seal_number TEXT,
  screen_condition TEXT NOT NULL DEFAULT 'INTEGRA',
  body_condition TEXT NOT NULL DEFAULT 'INTEGRA',
  power_state TEXT NOT NULL DEFAULT 'LIGADO_DESLIGADO_ALUNO',
  accessories JSONB NOT NULL DEFAULT '[]'::jsonb,
  preexisting_damage_notes TEXT,
  return_policy TEXT NOT NULL DEFAULT 'ALUNO_FIM_TURNO',
  status TEXT NOT NULL DEFAULT 'SOB_GUARDA',
  returned_to_type TEXT, receiver_name TEXT, receiver_document TEXT,
  receiver_relationship TEXT, receiver_phone TEXT,
  returned_date DATE, returned_time TEXT, returned_by_name TEXT,
  return_condition_ok BOOLEAN DEFAULT true, return_notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.electronic_device_seizures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.electronic_device_seizures FOR ALL USING (true) WITH CHECK (true);`;

const normalizeRecord = (row: any): ElectronicDeviceSeizureRecord => ({
  id: row.id || generateUUID(),
  protocol_number: row.protocol_number || 'REC-2026-0001',
  occurrence_sequence: Number(row.occurrence_sequence) || 1,
  school_year: Number(row.school_year) || new Date().getFullYear(),
  module_source: row.module_source === 'COORDENACAO' ? 'COORDENACAO' : 'CIVICO_MILITAR',
  student_id: row.student_id || '',
  student_code: row.student_code || '',
  student_name: row.student_name || '',
  classroom_name: row.classroom_name || '',
  shift: row.shift || '',
  guardian_name: row.guardian_name || '',
  guardian_phone: row.guardian_phone || '',
  student_is_paed: Boolean(row.student_is_paed),
  paed_exception_verified: row.paed_exception_verified !== false,
  seizure_date: row.seizure_date || getLocalIsoDate(),
  seizure_time: row.seizure_time || getLocalTime(),
  seizure_location: row.seizure_location || 'Sala de Aula',
  seizure_subject_activity: row.seizure_subject_activity || '',
  seizure_reason: row.seizure_reason || DEFAULT_REASON,
  seized_by_name: row.seized_by_name || '',
  seized_by_role: row.seized_by_role || '',
  student_refused_signature: Boolean(row.student_refused_signature),
  witness_name: row.witness_name || '',
  device_type: row.device_type || 'Celular / Smartphone',
  device_brand_model: row.device_brand_model || '',
  device_color: row.device_color || '',
  device_imei_serial: row.device_imei_serial || '',
  seal_number: row.seal_number || '',
  screen_condition: (row.screen_condition || 'INTEGRA') as ScreenCondition,
  body_condition: (row.body_condition || 'INTEGRA') as BodyCondition,
  power_state: (row.power_state || 'LIGADO_DESLIGADO_ALUNO') as PowerState,
  accessories: Array.isArray(row.accessories) ? row.accessories : [],
  preexisting_damage_notes: row.preexisting_damage_notes || '',
  return_policy: (row.return_policy || 'ALUNO_FIM_TURNO') as ReturnPolicy,
  status: (row.status || 'SOB_GUARDA') as ElectronicDeviceSeizureRecord['status'],
  returned_to_type: row.returned_to_type || null,
  receiver_name: row.receiver_name || '',
  receiver_document: row.receiver_document || '',
  receiver_relationship: row.receiver_relationship || '',
  receiver_phone: row.receiver_phone || '',
  returned_date: row.returned_date || '',
  returned_time: row.returned_time || '',
  returned_by_name: row.returned_by_name || '',
  return_condition_ok: row.return_condition_ok !== false,
  return_notes: row.return_notes || '',
  created_by: row.created_by || '',
  created_at: row.created_at,
  updated_at: row.updated_at
});

const ElectronicDeviceSeizureManager: React.FC<ElectronicDeviceSeizureManagerProps> = ({
  moduleSource,
  user,
  initialStudent,
  onClearInitialStudent,
  onCustodyCountChange
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'print'>('list');
  const [records, setRecords] = useState<ElectronicDeviceSeizureRecord[]>([]);
  const [students, setStudents] = useState<SeizureStudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbTableMissing, setDbTableMissing] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Filtros da lista
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'SOB_GUARDA' | 'DEVOLVIDO_RESPONSAVEL' | 'DEVOLVIDO_ALUNO'>('TODOS');
  const [classFilter, setClassFilter] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');

  // Impressão ativa
  const [printingRecord, setPrintingRecord] = useState<ElectronicDeviceSeizureRecord | null>(null);
  const [printingBlank, setPrintingBlank] = useState(false);

  // Edição vs Novo
  const [editingId, setEditingId] = useState<string | null>(null);

  // Busca de estudante no formulário
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Campos do formulário de recolhimento
  const defaultRoleLabel =
    moduleSource === 'CIVICO_MILITAR' ? 'Monitoria / Gestão Cívico-Militar' : 'Coordenação Pedagógica / Gestão Escolar';

  const createEmptyForm = () => ({
    student_id: '',
    student_code: '',
    student_name: '',
    classroom_name: '',
    shift: '',
    guardian_name: '',
    guardian_phone: '',
    student_is_paed: false,
    paed_exception_verified: false,
    seizure_date: getLocalIsoDate(),
    seizure_time: getLocalTime(),
    seizure_location: 'Sala de Aula',
    seizure_subject_activity: '',
    seizure_reason: DEFAULT_REASON,
    seized_by_name: user?.name || '',
    seized_by_role: defaultRoleLabel,
    student_refused_signature: false,
    witness_name: '',
    device_type: 'Celular / Smartphone',
    device_brand_model: '',
    device_color: '',
    device_imei_serial: '',
    seal_number: '',
    screen_condition: 'INTEGRA' as ScreenCondition,
    body_condition: 'INTEGRA' as BodyCondition,
    power_state: 'LIGADO_DESLIGADO_ALUNO' as PowerState,
    accessories: [] as string[],
    preexisting_damage_notes: '',
    return_policy: 'ALUNO_FIM_TURNO' as ReturnPolicy
  });

  const [form, setForm] = useState(createEmptyForm);

  // Modal de Devolução
  const [returnModalRecord, setReturnModalRecord] = useState<ElectronicDeviceSeizureRecord | null>(null);
  const [returnForm, setReturnForm] = useState({
    returned_to_type: 'RESPONSAVEL' as ReturnedToType,
    receiver_name: '',
    receiver_document: '',
    receiver_relationship: 'Mãe',
    receiver_phone: '',
    returned_date: getLocalIsoDate(),
    returned_time: getLocalTime(),
    returned_by_name: user?.name || '',
    return_condition_ok: true,
    return_notes: ''
  });

  const lastAppliedInitialStudentRef = useRef<string | null>(null);

  const showNotice = (type: 'success' | 'info' | 'error', text: string) => {
    setFeedbackBanner({ type, text });
    window.setTimeout(() => {
      setFeedbackBanner(prev => (prev?.text === text ? null : prev));
    }, 5000);
  };

  // Salvar backup local
  const persistLocal = (list: ElectronicDeviceSeizureRecord[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore quota errors
    }
  };

  // Carregar registros e estudantes ativos
  useEffect(() => {
    let active = true;

    const loadAll = async () => {
      setLoading(true);

      // 1. Estudantes ativos
      try {
        const { data: stData } = await supabase
          .from('students')
          .select('id, name, registration_number, guardian_name, contact_phone, paed, enrollments(status, classrooms(name, shift))')
          .order('name');

        if (active && stData) {
          const mapped: SeizureStudentOption[] = stData
            .map((s: any) => {
              const activeEnr =
                s.enrollments?.find((e: any) => e.status === 'ATIVO') ||
                s.enrollments?.find((e: any) => e.status === 'MATRICULADO' || e.status === 'CURSANDO') ||
                s.enrollments?.find((e: any) => e.status === 'RECLASSIFICADO');
              if (!activeEnr) return null;
              return {
                StudentUuid: s.id,
                CodigoAluno: s.registration_number || '',
                Nome: s.name || '',
                Turma: activeEnr.classrooms?.name || 'SEM TURMA',
                Turno: activeEnr.classrooms?.shift || '',
                NomeResponsavel: s.guardian_name || '',
                TelefoneContato: s.contact_phone || '',
                PAED: s.paed ? 'Sim' : 'Não'
              };
            })
            .filter(Boolean) as SeizureStudentOption[];
          setStudents(mapped);
        }
      } catch (err) {
        console.warn('Erro ao carregar estudantes no módulo de recolhimento:', err);
      }

      // 2. Registros de recolhimento (Supabase com fallback localStorage)
      try {
        const { data, error } = await supabase
          .from('electronic_device_seizures')
          .select('*')
          .order('seizure_date', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          const msg = `${error.code || ''} ${error.message || ''}`.toLowerCase();
          if (msg.includes('42p01') || msg.includes('pgrst205') || msg.includes('does not exist') || msg.includes('could not find')) {
            if (active) setDbTableMissing(true);
          }
          const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (active && savedLocal) {
            setRecords((JSON.parse(savedLocal) || []).map(normalizeRecord));
          }
        } else if (active) {
          setDbTableMissing(false);
          const list = (data || []).map(normalizeRecord);
          setRecords(list);
          persistLocal(list);
        }
      } catch {
        const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (active && savedLocal) {
          setRecords((JSON.parse(savedLocal) || []).map(normalizeRecord));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAll();
    return () => {
      active = false;
    };
  }, []);

  // Notificar contador de custódia para a sidebar do módulo pai
  useEffect(() => {
    const inCustody = records.filter(r => r.status === 'SOB_GUARDA').length;
    onCustodyCountChange?.(inCustody);
  }, [records, onCustodyCountChange]);

  // Calcular contagem anterior do aluno no ano letivo
  const getStudentYearCount = (studentCode?: string, studentName?: string, excludeId?: string | null) => {
    const currentYear = new Date().getFullYear();
    const normName = (studentName || '').trim().toUpperCase();
    const normCode = (studentCode || '').trim();
    return records.filter(r => {
      if (excludeId && r.id === excludeId) return false;
      if (r.school_year !== currentYear) return false;
      if (normCode && r.student_code && r.student_code.trim() === normCode) return true;
      return Boolean(normName && r.student_name.trim().toUpperCase() === normName);
    }).length;
  };

  // Gerar próximo protocolo sequencial anual (REC-2026-0001)
  const nextProtocolNumber = useMemo(() => {
    const year = new Date().getFullYear();
    let maxSeq = 0;
    records.forEach(r => {
      const m = r.protocol_number.match(new RegExp(`^REC-${year}-(\\d+)$`));
      if (m) {
        const n = Number(m[1]);
        if (n > maxSeq) maxSeq = n;
      }
    });
    return `REC-${year}-${String(maxSeq + 1).padStart(4, '0')}`;
  }, [records]);

  // Aplicar estudante pré-selecionado vindo de atalho (ex: Item 61 no Cívico-Militar)
  const applySelectedStudent = (st: SeizureStudentOption) => {
    const prevCount = getStudentYearCount(st.CodigoAluno, st.Nome, editingId);
    const suggestedPolicy: ReturnPolicy = prevCount >= 1 ? 'RESPONSAVEL_LEGAL' : 'ALUNO_FIM_TURNO';
    const isPaed = st.PAED === 'Sim';

    setForm(prev => ({
      ...prev,
      student_id: st.StudentUuid || '',
      student_code: st.CodigoAluno || '',
      student_name: st.Nome,
      classroom_name: st.Turma,
      shift: st.Turno || '',
      guardian_name: st.NomeResponsavel || '',
      guardian_phone: st.TelefoneContato || '',
      student_is_paed: isPaed,
      paed_exception_verified: !isPaed,
      return_policy: suggestedPolicy
    }));
    setStudentSearch(st.Nome);
    setShowStudentDropdown(false);
  };

  useEffect(() => {
    if (!initialStudent) {
      lastAppliedInitialStudentRef.current = null;
      return;
    }
    const key = `${initialStudent.CodigoAluno || ''}|${initialStudent.Nome}`;
    if (lastAppliedInitialStudentRef.current === key) return;
    lastAppliedInitialStudentRef.current = key;

    setEditingId(null);
    setForm(createEmptyForm());
    setTimeout(() => {
      applySelectedStudent(initialStudent);
      setViewMode('form');
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStudent, records.length]);

  const currentFormPastCount = useMemo(
    () => getStudentYearCount(form.student_code, form.student_name, editingId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.student_code, form.student_name, editingId, records]
  );

  const currentFormOccurrenceSeq = editingId
    ? records.find(r => r.id === editingId)?.occurrence_sequence || currentFormPastCount + 1
    : currentFormPastCount + 1;

  const previewRecord: ElectronicDeviceSeizureRecord = useMemo(() => {
    const existing = editingId ? records.find(r => r.id === editingId) : null;
    return {
      id: existing?.id || 'preview',
      protocol_number: existing?.protocol_number || nextProtocolNumber,
      occurrence_sequence: currentFormOccurrenceSeq,
      school_year: existing?.school_year || new Date().getFullYear(),
      module_source: existing?.module_source || moduleSource,
      student_id: form.student_id,
      student_code: form.student_code,
      student_name: form.student_name || 'SELECIONE O ESTUDANTE',
      classroom_name: form.classroom_name || '---',
      shift: form.shift,
      guardian_name: form.guardian_name,
      guardian_phone: form.guardian_phone,
      student_is_paed: form.student_is_paed,
      paed_exception_verified: form.paed_exception_verified,
      seizure_date: form.seizure_date,
      seizure_time: form.seizure_time,
      seizure_location: form.seizure_location,
      seizure_subject_activity: form.seizure_subject_activity,
      seizure_reason: form.seizure_reason,
      seized_by_name: form.seized_by_name || user?.name || '',
      seized_by_role: form.seized_by_role,
      student_refused_signature: form.student_refused_signature,
      witness_name: form.witness_name,
      device_type: form.device_type,
      device_brand_model: form.device_brand_model || '---',
      device_color: form.device_color,
      device_imei_serial: form.device_imei_serial,
      seal_number: form.seal_number,
      screen_condition: form.screen_condition,
      body_condition: form.body_condition,
      power_state: form.power_state,
      accessories: form.accessories,
      preexisting_damage_notes: form.preexisting_damage_notes,
      return_policy: form.return_policy,
      status: existing?.status || 'SOB_GUARDA',
      returned_to_type: existing?.returned_to_type || null,
      receiver_name: existing?.receiver_name || '',
      receiver_document: existing?.receiver_document || '',
      receiver_relationship: existing?.receiver_relationship || '',
      receiver_phone: existing?.receiver_phone || '',
      returned_date: existing?.returned_date || '',
      returned_time: existing?.returned_time || '',
      returned_by_name: existing?.returned_by_name || '',
      return_condition_ok: existing?.return_condition_ok,
      return_notes: existing?.return_notes || ''
    };
  }, [editingId, records, nextProtocolNumber, currentFormOccurrenceSeq, moduleSource, form, user?.name]);

  const filteredStudentOptions = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students.slice(0, 10);
    return students
      .filter(
        s =>
          s.Nome.toLowerCase().includes(q) ||
          (s.CodigoAluno || '').toLowerCase().includes(q) ||
          s.Turma.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [students, studentSearch]);

  const availableClasses = useMemo(() => {
    return Array.from(new Set(records.map(r => r.classroom_name).filter(Boolean))).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter(r => {
      if (statusFilter !== 'TODOS' && r.status !== statusFilter) return false;
      if (classFilter !== 'TODAS' && r.classroom_name !== classFilter) return false;
      if (q) {
        const hay = `${r.protocol_number} ${r.student_name} ${r.student_code || ''} ${r.classroom_name} ${r.device_brand_model} ${r.device_type} ${r.guardian_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, statusFilter, classFilter, searchQuery]);

  const kpis = useMemo(() => {
    const sobGuarda = records.filter(r => r.status === 'SOB_GUARDA').length;
    const devResp = records.filter(r => r.status === 'DEVOLVIDO_RESPONSAVEL').length;
    const devAluno = records.filter(r => r.status === 'DEVOLVIDO_ALUNO').length;
    const year = new Date().getFullYear();
    const yearRecs = records.filter(r => r.school_year === year);
    const countsByStudent: Record<string, { count: number; maxSeq: number }> = {};
    yearRecs.forEach(r => {
      const k = r.student_code || r.student_name.toUpperCase();
      if (!countsByStudent[k]) countsByStudent[k] = { count: 0, maxSeq: 0 };
      countsByStudent[k].count += 1;
      countsByStudent[k].maxSeq = Math.max(countsByStudent[k].maxSeq, r.occurrence_sequence || 1);
    });
    const reincidentes = Object.values(countsByStudent).filter(v => v.count >= 2 || v.maxSeq >= 2).length;
    return { sobGuarda, devResp, devAluno, totalYear: yearRecs.length, reincidentes };
  }, [records]);

  const toggleAccessory = (acc: string) => {
    setForm(prev => ({
      ...prev,
      accessories: prev.accessories.includes(acc)
        ? prev.accessories.filter(a => a !== acc)
        : [...prev.accessories, acc]
    }));
  };

  const handleStartNew = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setStudentSearch('');
    onClearInitialStudent?.();
    setViewMode('form');
  };

  const handleEditRecord = (rec: ElectronicDeviceSeizureRecord) => {
    setEditingId(rec.id);
    setForm({
      student_id: rec.student_id || '',
      student_code: rec.student_code || '',
      student_name: rec.student_name,
      classroom_name: rec.classroom_name,
      shift: rec.shift || '',
      guardian_name: rec.guardian_name || '',
      guardian_phone: rec.guardian_phone || '',
      student_is_paed: Boolean(rec.student_is_paed),
      paed_exception_verified: rec.paed_exception_verified !== false,
      seizure_date: rec.seizure_date,
      seizure_time: rec.seizure_time,
      seizure_location: rec.seizure_location,
      seizure_subject_activity: rec.seizure_subject_activity || '',
      seizure_reason: rec.seizure_reason,
      seized_by_name: rec.seized_by_name,
      seized_by_role: rec.seized_by_role || defaultRoleLabel,
      student_refused_signature: Boolean(rec.student_refused_signature),
      witness_name: rec.witness_name || '',
      device_type: rec.device_type,
      device_brand_model: rec.device_brand_model,
      device_color: rec.device_color || '',
      device_imei_serial: rec.device_imei_serial || '',
      seal_number: rec.seal_number || '',
      screen_condition: rec.screen_condition,
      body_condition: rec.body_condition,
      power_state: rec.power_state,
      accessories: rec.accessories || [],
      preexisting_damage_notes: rec.preexisting_damage_notes || '',
      return_policy: rec.return_policy
    });
    setStudentSearch(rec.student_name);
    setViewMode('form');
  };

  const handleSaveSeizure = async (printAfter: boolean) => {
    if (!form.student_name.trim() || !form.classroom_name.trim()) {
      showNotice('error', 'Selecione o(a) estudante e a turma antes de salvar.');
      return;
    }
    if (!form.device_brand_model.trim()) {
      showNotice('error', 'Informe a marca e o modelo do aparelho eletrônico.');
      return;
    }
    if (!form.seized_by_name.trim()) {
      showNotice('error', 'Informe o nome do(a) servidor(a) responsável pelo recolhimento.');
      return;
    }
    if (form.student_is_paed && !form.paed_exception_verified) {
      showNotice(
        'error',
        'Confirme na caixa de verificação PAED que o aparelho não está sendo usado por necessidade de acessibilidade, inclusão ou saúde (Art. 3º Lei 15.100/2025).'
      );
      return;
    }

    setSaving(true);
    try {
      const existing = editingId ? records.find(r => r.id === editingId) : null;
      const nowIso = new Date().toISOString();

      const payload: ElectronicDeviceSeizureRecord = {
        id: existing?.id || generateUUID(),
        protocol_number: existing?.protocol_number || nextProtocolNumber,
        occurrence_sequence: existing?.occurrence_sequence || currentFormOccurrenceSeq,
        school_year: existing?.school_year || new Date().getFullYear(),
        module_source: existing?.module_source || moduleSource,
        student_id: form.student_id || '',
        student_code: form.student_code || '',
        student_name: form.student_name.trim().toUpperCase(),
        classroom_name: form.classroom_name.trim().toUpperCase(),
        shift: form.shift || '',
        guardian_name: form.guardian_name.trim(),
        guardian_phone: form.guardian_phone.trim(),
        student_is_paed: form.student_is_paed,
        paed_exception_verified: form.student_is_paed ? form.paed_exception_verified : true,
        seizure_date: form.seizure_date,
        seizure_time: form.seizure_time,
        seizure_location: form.seizure_location,
        seizure_subject_activity: form.seizure_subject_activity.trim(),
        seizure_reason: form.seizure_reason.trim() || DEFAULT_REASON,
        seized_by_name: form.seized_by_name.trim(),
        seized_by_role: form.seized_by_role.trim(),
        student_refused_signature: form.student_refused_signature,
        witness_name: form.witness_name.trim(),
        device_type: form.device_type,
        device_brand_model: form.device_brand_model.trim(),
        device_color: form.device_color.trim(),
        device_imei_serial: form.device_imei_serial.trim(),
        seal_number: form.seal_number.trim(),
        screen_condition: form.screen_condition,
        body_condition: form.body_condition,
        power_state: form.power_state,
        accessories: form.accessories,
        preexisting_damage_notes: form.preexisting_damage_notes.trim(),
        return_policy: form.return_policy,
        status: existing?.status || 'SOB_GUARDA',
        returned_to_type: existing?.returned_to_type || null,
        receiver_name: existing?.receiver_name || '',
        receiver_document: existing?.receiver_document || '',
        receiver_relationship: existing?.receiver_relationship || '',
        receiver_phone: existing?.receiver_phone || '',
        returned_date: existing?.returned_date || '',
        returned_time: existing?.returned_time || '',
        returned_by_name: existing?.returned_by_name || '',
        return_condition_ok: existing?.return_condition_ok ?? true,
        return_notes: existing?.return_notes || '',
        created_by: existing?.created_by || user?.name || '',
        created_at: existing?.created_at || nowIso,
        updated_at: nowIso
      };

      const dbRow = {
        ...payload,
        returned_date: payload.returned_date || null
      };

      if (!dbTableMissing) {
        const { error } = existing
          ? await supabase.from('electronic_device_seizures').update(dbRow).eq('id', payload.id)
          : await supabase.from('electronic_device_seizures').insert([dbRow]);

        if (error) {
          const msg = `${error.code || ''} ${error.message || ''}`.toLowerCase();
          if (msg.includes('42p01') || msg.includes('pgrst205') || msg.includes('does not exist') || msg.includes('could not find')) {
            setDbTableMissing(true);
          } else {
            console.warn('Supabase sync warning:', error.message);
          }
        }
      }

      const nextList = existing
        ? records.map(r => (r.id === payload.id ? payload : r))
        : [payload, ...records];
      setRecords(nextList);
      persistLocal(nextList);
      onClearInitialStudent?.();
      setEditingId(null);

      if (printAfter) {
        setPrintingBlank(false);
        setPrintingRecord(payload);
        setViewMode('print');
        setTimeout(() => window.print(), 220);
      } else {
        setViewMode('list');
        showNotice('success', `Protocolo ${payload.protocol_number} salvo com sucesso.`);
      }
    } finally {
      setSaving(false);
    }
  };

  const openReturnModal = (rec: ElectronicDeviceSeizureRecord) => {
    const defaultType: ReturnedToType = rec.return_policy === 'ALUNO_FIM_TURNO' ? 'ALUNO' : 'RESPONSAVEL';
    setReturnModalRecord(rec);
    setReturnForm({
      returned_to_type: defaultType,
      receiver_name: defaultType === 'ALUNO' ? rec.student_name : rec.guardian_name || '',
      receiver_document: '',
      receiver_relationship: defaultType === 'ALUNO' ? 'Próprio(a) Estudante' : 'Mãe',
      receiver_phone: rec.guardian_phone || '',
      returned_date: getLocalIsoDate(),
      returned_time: getLocalTime(),
      returned_by_name: user?.name || '',
      return_condition_ok: true,
      return_notes: ''
    });
  };

  const handleSwitchReturnType = (nextType: ReturnedToType) => {
    if (!returnModalRecord) return;
    setReturnForm(prev => ({
      ...prev,
      returned_to_type: nextType,
      receiver_name:
        nextType === 'ALUNO'
          ? returnModalRecord.student_name
          : returnModalRecord.guardian_name || '',
      receiver_relationship: nextType === 'ALUNO' ? 'Próprio(a) Estudante' : 'Mãe',
      receiver_phone: returnModalRecord.guardian_phone || prev.receiver_phone
    }));
  };

  const handleConfirmReturn = async (printAfter: boolean) => {
    if (!returnModalRecord) return;
    if (!returnForm.receiver_name.trim()) {
      showNotice('error', 'Informe o nome completo de quem está retirando o aparelho.');
      return;
    }
    if (!returnForm.returned_by_name.trim()) {
      showNotice('error', 'Informe o nome do(a) servidor(a) que está realizando a devolução.');
      return;
    }

    setSaving(true);
    try {
      const updated: ElectronicDeviceSeizureRecord = {
        ...returnModalRecord,
        status: returnForm.returned_to_type === 'RESPONSAVEL' ? 'DEVOLVIDO_RESPONSAVEL' : 'DEVOLVIDO_ALUNO',
        returned_to_type: returnForm.returned_to_type,
        receiver_name: returnForm.receiver_name.trim().toUpperCase(),
        receiver_document: returnForm.receiver_document.trim(),
        receiver_relationship: returnForm.receiver_relationship.trim(),
        receiver_phone: returnForm.receiver_phone.trim(),
        returned_date: returnForm.returned_date,
        returned_time: returnForm.returned_time,
        returned_by_name: returnForm.returned_by_name.trim(),
        return_condition_ok: returnForm.return_condition_ok,
        return_notes: returnForm.return_notes.trim(),
        updated_at: new Date().toISOString()
      };

      if (!dbTableMissing) {
        const { error } = await supabase
          .from('electronic_device_seizures')
          .update({
            status: updated.status,
            returned_to_type: updated.returned_to_type,
            receiver_name: updated.receiver_name,
            receiver_document: updated.receiver_document,
            receiver_relationship: updated.receiver_relationship,
            receiver_phone: updated.receiver_phone,
            returned_date: updated.returned_date || null,
            returned_time: updated.returned_time,
            returned_by_name: updated.returned_by_name,
            return_condition_ok: updated.return_condition_ok,
            return_notes: updated.return_notes,
            updated_at: updated.updated_at
          })
          .eq('id', updated.id);

        if (error) {
          console.warn('Supabase return update warning:', error.message);
        }
      }

      const nextList = records.map(r => (r.id === updated.id ? updated : r));
      setRecords(nextList);
      persistLocal(nextList);
      setReturnModalRecord(null);

      if (printAfter) {
        setPrintingBlank(false);
        setPrintingRecord(updated);
        setViewMode('print');
        setTimeout(() => window.print(), 220);
      } else {
        showNotice('success', `Devolução do protocolo ${updated.protocol_number} registrada com sucesso.`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (rec: ElectronicDeviceSeizureRecord) => {
    if (!window.confirm(`Deseja realmente excluir o protocolo ${rec.protocol_number} (${rec.student_name})?`)) return;
    if (!dbTableMissing) {
      await supabase.from('electronic_device_seizures').delete().eq('id', rec.id);
    }
    const nextList = records.filter(r => r.id !== rec.id);
    setRecords(nextList);
    persistLocal(nextList);
    showNotice('info', `Protocolo ${rec.protocol_number} removido.`);
  };

  const handleOpenPrintRecord = (rec: ElectronicDeviceSeizureRecord) => {
    setPrintingBlank(false);
    setPrintingRecord(rec);
    setViewMode('print');
  };

  const handleOpenBlankPrint = () => {
    setPrintingRecord(null);
    setPrintingBlank(true);
    setViewMode('print');
  };

  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      showNotice('info', 'Nenhum registro nos filtros atuais para exportar.');
      return;
    }
    const rows = filteredRecords.map(r => ({
      Protocolo: r.protocol_number,
      'Nº Ocorrência Ano': `${r.occurrence_sequence}ª`,
      Status:
        r.status === 'SOB_GUARDA'
          ? 'SOB GUARDA NA ESCOLA'
          : r.status === 'DEVOLVIDO_RESPONSAVEL'
          ? 'DEVOLVIDO AO RESPONSÁVEL'
          : 'DEVOLVIDO AO ESTUDANTE',
      'Data Recolhimento': formatBrDate(r.seizure_date),
      Hora: r.seizure_time,
      Estudante: r.student_name,
      'Código SEDUC': r.student_code || '',
      Turma: r.classroom_name,
      Turno: r.shift || '',
      'Responsável Cadastro': r.guardian_name || '',
      Telefone: r.guardian_phone || '',
      Local: r.seizure_location,
      'Tipo Aparelho': r.device_type,
      'Marca / Modelo': r.device_brand_model,
      Cor: r.device_color || '',
      'IMEI / Série': r.device_imei_serial || '',
      'Condição Tela': SCREEN_CONDITION_OPTIONS.find(o => o.value === r.screen_condition)?.short || r.screen_condition,
      'Condição Carcaça': BODY_CONDITION_OPTIONS.find(o => o.value === r.body_condition)?.short || r.body_condition,
      Funcionamento: POWER_STATE_OPTIONS.find(o => o.value === r.power_state)?.short || r.power_state,
      Acessórios: (r.accessories || []).join(', ') || 'Nenhum',
      'Avarias Pré-existentes': r.preexisting_damage_notes || '',
      'Regra Devolução': r.return_policy === 'ALUNO_FIM_TURNO' ? 'Aluno (Fim do Turno)' : 'Somente Responsável Legal',
      'Recolhido Por': r.seized_by_name,
      'Devolvido A': r.returned_to_type === 'RESPONSAVEL' ? 'Responsável Legal' : r.returned_to_type === 'ALUNO' ? 'Estudante' : '',
      'Nome Recebedor': r.receiver_name || '',
      'RG / CPF': r.receiver_document || '',
      'Data Devolução': formatBrDate(r.returned_date),
      'Hora Devolução': r.returned_time || '',
      'Entregue Por': r.returned_by_name || '',
      'Conferência Devolução': r.status === 'SOB_GUARDA' ? '' : r.return_condition_ok !== false ? 'CONFERE' : `RESSALVA: ${r.return_notes || ''}`
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Recolhimentos');
    XLSX.writeFile(wb, `Recolhimento_Eletronicos_EECM_${new Date().getFullYear()}.xlsx`);
  };

  const handleCopySql = () => {
    navigator.clipboard?.writeText(SQL_MIGRATION_SNIPPET);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 3000);
  };

  // MODO IMPRESSÃO ISOLADO (1 folha A4 limpa)
  if (viewMode === 'print') {
    return (
      <div className="space-y-5 animate-in fade-in duration-300 pb-16">
        <div className="no-print bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft size={14} /> Voltar à Lista
            </button>
            <div>
              <h3 className="text-sm font-black uppercase text-slate-900">
                {printingBlank
                  ? 'Modelo Oficial em Branco — Termo de Recolhimento (A4)'
                  : `Termo Oficial — Protocolo ${printingRecord?.protocol_number}`}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Layout calibrado para <strong>1 página A4 Retrato</strong> com cabeçalho SEDUC-MT / EECM e recibo de devolução incluso.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {printingRecord && printingRecord.status === 'SOB_GUARDA' && (
              <button
                type="button"
                onClick={() => openReturnModal(printingRecord)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase flex items-center gap-1.5 shadow-sm"
              >
                <PackageCheck size={14} /> Registrar Devolução
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <Printer size={15} /> Imprimir Termo (1 Folha A4)
            </button>
          </div>
        </div>

        <ElectronicDeviceSeizureTerm record={printingRecord} blankMode={printingBlank} />

        {/* Modal de devolução acessível também a partir da tela de impressão */}
        {returnModalRecord && renderReturnModal()}
      </div>
    );
  }

  function renderReturnModal() {
    if (!returnModalRecord) return null;
    const isPolicyMismatch =
      returnModalRecord.return_policy === 'RESPONSAVEL_LEGAL' && returnForm.returned_to_type === 'ALUNO';

    return (
      <div className="no-print fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Baixa de Custódia • {returnModalRecord.protocol_number}
              </span>
              <h3 className="text-base font-black uppercase tracking-tight">
                Registrar Devolução de Aparelho Eletrônico
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setReturnModalRecord(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Resumo do Aparelho Sob Guarda */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-slate-900">
                  {returnModalRecord.student_name} • {returnModalRecord.classroom_name}
                </p>
                <p className="text-xs font-bold text-blue-800 mt-0.5">
                  {returnModalRecord.device_type} — {returnModalRecord.device_brand_model}
                  {returnModalRecord.device_color ? ` (${returnModalRecord.device_color})` : ''}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Vistoria na entrada:{' '}
                  <strong>
                    Tela {SCREEN_CONDITION_OPTIONS.find(o => o.value === returnModalRecord.screen_condition)?.short}
                  </strong>{' '}
                  •{' '}
                  <strong>
                    Carcaça {BODY_CONDITION_OPTIONS.find(o => o.value === returnModalRecord.body_condition)?.short}
                  </strong>
                  {returnModalRecord.accessories.length > 0
                    ? ` • Acessórios: ${returnModalRecord.accessories.join(', ')}`
                    : ''}
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
                Recolhido em {formatBrDate(returnModalRecord.seizure_date)} às {returnModalRecord.seizure_time}
              </span>
            </div>

            {/* Seletor: Responsável Legal OU Próprio Estudante */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                A quem o aparelho está sendo devolvido?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSwitchReturnType('RESPONSAVEL')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                    returnForm.returned_to_type === 'RESPONSAVEL'
                      ? 'border-emerald-600 bg-emerald-50/70'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Users size={18} className={returnForm.returned_to_type === 'RESPONSAVEL' ? 'text-emerald-700 mt-0.5' : 'text-slate-400 mt-0.5'} />
                  <div>
                    <p className="text-xs font-black uppercase text-slate-900">Pai / Mãe / Responsável Legal</p>
                    <p className="text-[11px] text-slate-500">Retirada presencial mediante documento oficial</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchReturnType('ALUNO')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                    returnForm.returned_to_type === 'ALUNO'
                      ? 'border-blue-600 bg-blue-50/70'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <UserCheck size={18} className={returnForm.returned_to_type === 'ALUNO' ? 'text-blue-700 mt-0.5' : 'text-slate-400 mt-0.5'} />
                  <div>
                    <p className="text-xs font-black uppercase text-slate-900">Próprio(a) Estudante</p>
                    <p className="text-[11px] text-slate-500">Liberação ao término do turno / autorizada pela gestão</p>
                  </div>
                </button>
              </div>

              {isPolicyMismatch && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-start gap-2">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    No recolhimento foi definida devolução exclusiva ao <strong>Responsável Legal</strong>. Caso a gestão/monitoria tenha autorizado a entrega excepcional ao estudante, recomenda-se registrar a justificativa nas observações abaixo.
                  </span>
                </div>
              )}
            </div>

            {/* Dados do Recebedor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                  Nome Completo de Quem Recebe *
                </label>
                <input
                  type="text"
                  value={returnForm.receiver_name}
                  onChange={e => setReturnForm(prev => ({ ...prev, receiver_name: e.target.value }))}
                  placeholder="Nome completo do responsável ou estudante..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold uppercase text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                  Parentesco / Vínculo
                </label>
                {returnForm.returned_to_type === 'RESPONSAVEL' ? (
                  <select
                    value={returnForm.receiver_relationship}
                    onChange={e => setReturnForm(prev => ({ ...prev, receiver_relationship: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                  >
                    <option value="Mãe">Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Avó / Avô">Avó / Avô</option>
                    <option value="Irmão / Irmã (maior de idade)">Irmão / Irmã (maior de idade)</option>
                    <option value="Tutor / Responsável Legal">Tutor / Responsável Legal</option>
                    <option value="Outro Autorizado pela Família">Outro Autorizado pela Família</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={returnForm.receiver_relationship}
                    onChange={e => setReturnForm(prev => ({ ...prev, receiver_relationship: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                  />
                )}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                  RG ou CPF {returnForm.returned_to_type === 'RESPONSAVEL' ? '(Recomendado)' : '(Opcional)'}
                </label>
                <input
                  type="text"
                  value={returnForm.receiver_document}
                  onChange={e => setReturnForm(prev => ({ ...prev, receiver_document: e.target.value }))}
                  placeholder="Ex: RG 1234567-8 ou CPF..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                  Telefone de Contato
                </label>
                <input
                  type="text"
                  value={returnForm.receiver_phone}
                  onChange={e => setReturnForm(prev => ({ ...prev, receiver_phone: e.target.value }))}
                  placeholder="(66) 99999-9999"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                  Servidor(a) que Efetuou a Entrega *
                </label>
                <input
                  type="text"
                  value={returnForm.returned_by_name}
                  onChange={e => setReturnForm(prev => ({ ...prev, returned_by_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Data da Devolução</label>
                <input
                  type="date"
                  value={returnForm.returned_date}
                  onChange={e => setReturnForm(prev => ({ ...prev, returned_date: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Hora da Devolução</label>
                <input
                  type="time"
                  value={returnForm.returned_time}
                  onChange={e => setReturnForm(prev => ({ ...prev, returned_time: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Conferência de Integridade na Entrega */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Conferência Física no Ato da Devolução
              </p>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-emerald-800 cursor-pointer">
                  <input
                    type="radio"
                    checked={returnForm.return_condition_ok}
                    onChange={() => setReturnForm(prev => ({ ...prev, return_condition_ok: true }))}
                    className="accent-emerald-600"
                  />
                  Confere — entregue nas mesmas condições físicas registradas na entrada
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-rose-800 cursor-pointer">
                  <input
                    type="radio"
                    checked={!returnForm.return_condition_ok}
                    onChange={() => setReturnForm(prev => ({ ...prev, return_condition_ok: false }))}
                    className="accent-rose-600"
                  />
                  Registrar ressalva / observação na entrega
                </label>
              </div>
              <textarea
                rows={2}
                value={returnForm.return_notes}
                onChange={e => setReturnForm(prev => ({ ...prev, return_notes: e.target.value }))}
                placeholder="Observações opcionais da devolução ou ressalvas..."
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setReturnModalRecord(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleConfirmReturn(false)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} /> Confirmar Devolução
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleConfirmReturn(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <Printer size={14} /> Confirmar & Imprimir Recibo A4
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* FEEDBACK BANNER */}
      {feedbackBanner && (
        <div
          className={`no-print p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : feedbackBanner.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <span>{feedbackBanner.text}</span>
          <button type="button" onClick={() => setFeedbackBanner(null)} className="opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* AVISO OPCIONAL SE TABELA SUPABASE AINDA NÃO FOI CRIADA */}
      {dbTableMissing && (
        <div className="no-print p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-amber-950">
            <Database size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black uppercase text-[11px]">
                Armazenamento Local Ativo (Tabela Supabase pendente)
              </p>
              <p className="font-medium text-amber-900/90 mt-0.5">
                Seus termos já estão sendo salvos normalmente neste navegador. Para sincronizar em nuvem entre todos os computadores da escola, execute o script{' '}
                <code className="font-mono bg-amber-100 px-1 rounded">create_electronic_device_seizures.sql</code> no SQL Editor do Supabase.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopySql}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black uppercase flex items-center gap-1.5 shrink-0"
          >
            <Copy size={13} /> {sqlCopied ? 'SQL Copiado!' : 'Copiar SQL'}
          </button>
        </div>
      )}

      {/* CABEÇALHO DO SUBMÓDULO */}
      <div className="no-print bg-white rounded-[2rem] border border-slate-200/80 shadow-sm p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
            <Smartphone size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
                Recolhimento e Devolução de Aparelhos Eletrônicos
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-black uppercase">
                Lei 15.100/2025 • Lei MT 12.745/2024 • Item 61
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Vistoria de condições físicas na entrada, controle de custódia escolar, termo timbrado em 1 folha A4 e recibo de devolução ao responsável ou estudante.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenBlankPrint}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black uppercase flex items-center gap-1.5 transition-all"
            title="Imprimir folha A4 em branco para uso offline/emergencial"
          >
            <FileText size={14} /> Modelo em Branco
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-black uppercase flex items-center gap-1.5 transition-all"
          >
            <Download size={14} /> Excel
          </button>
          {viewMode === 'list' ? (
            <button
              type="button"
              onClick={handleStartNew}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
            >
              <Plus size={15} /> Novo Recolhimento
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setEditingId(null);
                onClearInitialStudent?.();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-black uppercase flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Voltar à Custódia
            </button>
          )}
        </div>
      </div>

      {/* KPIs DE CUSTÓDIA (OCULTO NA IMPRESSÃO) */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => {
            setViewMode('list');
            setStatusFilter('SOB_GUARDA');
          }}
          className={`text-left p-5 rounded-3xl border transition-all ${
            kpis.sobGuarda > 0
              ? 'bg-amber-50/80 border-amber-300 hover:border-amber-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">Sob Guarda Agora</span>
            <Clock size={16} className={kpis.sobGuarda > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400'} />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-1">{kpis.sobGuarda}</p>
          <p className="text-[11px] font-semibold text-amber-800/80 mt-0.5">
            {kpis.sobGuarda === 1 ? 'aparelho aguardando retirada' : 'aparelhos aguardando retirada'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setViewMode('list');
            setStatusFilter('DEVOLVIDO_RESPONSAVEL');
          }}
          className="text-left p-5 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Devolvidos ao Responsável</span>
            <Users size={16} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-1">{kpis.devResp}</p>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">Retirados por pai/mãe/responsável</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setViewMode('list');
            setStatusFilter('DEVOLVIDO_ALUNO');
          }}
          className="text-left p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Devolvidos ao Estudante</span>
            <UserCheck size={16} className="text-blue-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-1">{kpis.devAluno}</p>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">Liberados ao término do turno</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setViewMode('list');
            setStatusFilter('TODOS');
          }}
          className="text-left p-5 rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Total no Ano • Reincidentes</span>
            <Scale size={16} className="text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {kpis.totalYear}{' '}
            <span className="text-sm font-black text-rose-600">({kpis.reincidentes} reinc.)</span>
          </p>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">Histórico consolidado {new Date().getFullYear()}</p>
        </button>
      </div>

      {/* MODO 1: LISTA DE CUSTÓDIA E HISTÓRICO */}
      {viewMode === 'list' && (
        <div className="no-print bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Barra de Filtros */}
          <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
              {(
                [
                  { id: 'TODOS', label: `Todos (${records.length})` },
                  { id: 'SOB_GUARDA', label: `Sob Guarda (${kpis.sobGuarda})` },
                  { id: 'DEVOLVIDO_RESPONSAVEL', label: `Resp. Legal (${kpis.devResp})` },
                  { id: 'DEVOLVIDO_ALUNO', label: `Estudante (${kpis.devAluno})` }
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all ${
                    statusFilter === tab.id ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
              >
                <option value="TODAS">Todas as Turmas</option>
                {availableClasses.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar aluno, protocolo ou modelo..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Lista / Tabela */}
          {loading ? (
            <div className="p-14 text-center text-xs font-bold uppercase text-slate-400">
              Carregando livro de custódia de aparelhos eletrônicos...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-14 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Smartphone size={28} />
              </div>
              <p className="text-sm font-black uppercase text-slate-700">Nenhum recolhimento encontrado</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Clique em <strong>Novo Recolhimento</strong> para registrar um aparelho com vistoria completa de condições físicas e emitir o Termo A4 timbrado.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={handleStartNew}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase inline-flex items-center gap-1.5"
                >
                  <Plus size={14} /> Registrar Primeiro Recolhimento
                </button>
                <button
                  type="button"
                  onClick={handleOpenBlankPrint}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase inline-flex items-center gap-1.5"
                >
                  <Printer size={14} /> Imprimir Modelo em Branco
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRecords.map(rec => {
                const screenShort =
                  SCREEN_CONDITION_OPTIONS.find(o => o.value === rec.screen_condition)?.short || rec.screen_condition;
                const bodyShort =
                  BODY_CONDITION_OPTIONS.find(o => o.value === rec.body_condition)?.short || rec.body_condition;
                const hasDamage = rec.screen_condition !== 'INTEGRA' || rec.body_condition !== 'INTEGRA';

                return (
                  <div
                    key={rec.id}
                    className={`p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors ${
                      rec.status === 'SOB_GUARDA' ? 'bg-amber-50/25' : ''
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                          {rec.protocol_number}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            rec.occurrence_sequence >= 2
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rec.occurrence_sequence}ª Ocorrência
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            rec.status === 'SOB_GUARDA'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : rec.status === 'DEVOLVIDO_RESPONSAVEL'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-blue-100 text-blue-900 border border-blue-200'
                          }`}
                        >
                          {rec.status === 'SOB_GUARDA'
                            ? 'Sob Guarda na Escola'
                            : rec.status === 'DEVOLVIDO_RESPONSAVEL'
                            ? 'Devolvido ao Responsável'
                            : 'Devolvido ao Estudante'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {formatBrDate(rec.seizure_date)} às {rec.seizure_time} • {rec.seizure_location}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <h4 className="text-sm font-black uppercase text-slate-900">{rec.student_name}</h4>
                        <span className="text-xs font-bold text-blue-700 uppercase">
                          {rec.classroom_name} {rec.shift ? `• ${rec.shift}` : ''}
                        </span>
                        {rec.guardian_name && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            Resp.: {rec.guardian_name} {rec.guardian_phone ? `• ${rec.guardian_phone}` : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-black text-slate-800">
                          📱 {rec.device_type}: {rec.device_brand_model}
                          {rec.device_color ? ` (${rec.device_color})` : ''}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold ${
                            hasDamage ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          Tela: {screenShort} • Carcaça: {bodyShort}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                          Regra:{' '}
                          {rec.return_policy === 'RESPONSAVEL_LEGAL'
                            ? 'Somente Responsável Legal'
                            : 'Estudante (Fim do Turno)'}
                        </span>
                      </div>

                      {rec.status !== 'SOB_GUARDA' && (
                        <p className="text-[11px] font-semibold text-emerald-800">
                          ✓ Retirado por <strong>{rec.receiver_name}</strong>
                          {rec.receiver_relationship ? ` (${rec.receiver_relationship})` : ''} em{' '}
                          {formatBrDate(rec.returned_date)} às {rec.returned_time} • Entregue por {rec.returned_by_name}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {rec.status === 'SOB_GUARDA' && (
                        <button
                          type="button"
                          onClick={() => openReturnModal(rec)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase flex items-center gap-1.5 shadow-sm"
                        >
                          <PackageCheck size={14} /> Registrar Devolução
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenPrintRecord(rec)}
                        className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-[11px] font-black uppercase flex items-center gap-1.5"
                      >
                        <Printer size={13} /> Termo A4
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditRecord(rec)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                        title="Editar registro"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(rec)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                        title="Excluir registro"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODO 2: FORMULÁRIO DE RECOLHIMENTO + VISTORIA + PRÉVIA AO VIVO */}
      {viewMode === 'form' && (
        <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 items-start">
          {/* FORMULÁRIO */}
          <div className="no-print 2xl:col-span-6 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                  {editingId ? `Editando Protocolo ${previewRecord.protocol_number}` : `Novo Protocolo • ${nextProtocolNumber}`}
                </span>
                <h3 className="text-base font-black uppercase text-slate-900">
                  Registro de Recolhimento e Vistoria do Aparelho
                </h3>
              </div>
              <span
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${
                  currentFormOccurrenceSeq >= 2
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-blue-50 text-blue-800'
                }`}
              >
                {currentFormOccurrenceSeq}ª Ocorrência no Ano
              </span>
            </div>

            {/* SEÇÃO 1: ESTUDANTE */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Users size={13} /> 1. Estudante & Contexto do Recolhimento
              </h4>

              <div className="relative">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Buscar Estudante Ativo (Nome, Código SEDUC ou Turma) *
                </label>
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onFocus={() => setShowStudentDropdown(true)}
                    onChange={e => {
                      setStudentSearch(e.target.value);
                      setShowStudentDropdown(true);
                    }}
                    placeholder="Digite o nome do(a) estudante..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {showStudentDropdown && filteredStudentOptions.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {filteredStudentOptions.map(st => {
                      const past = getStudentYearCount(st.CodigoAluno, st.Nome, editingId);
                      return (
                        <button
                          key={`${st.CodigoAluno}-${st.Nome}`}
                          type="button"
                          onClick={() => applySelectedStudent(st)}
                          className="w-full px-4 py-2.5 text-left hover:bg-blue-50 flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="text-xs font-black uppercase text-slate-900">{st.Nome}</p>
                            <p className="text-[10px] font-bold text-slate-500">
                              {st.Turma} • {st.Turno || '---'} • Cód: {st.CodigoAluno || '---'}
                              {st.NomeResponsavel ? ` • Resp: ${st.NomeResponsavel}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {st.PAED === 'Sim' && (
                              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[9px] font-black uppercase">
                                PAED
                              </span>
                            )}
                            {past > 0 && (
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-black uppercase">
                                {past} anterior{past > 1 ? 'es' : ''}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Card do Estudante Selecionado */}
              {form.student_name && (
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs">
                    <p className="font-black uppercase text-blue-950">{form.student_name}</p>
                    <p className="text-[11px] font-bold text-blue-800">
                      {form.classroom_name} {form.shift ? `• ${form.shift}` : ''}{' '}
                      {form.student_code ? `• Cód. ${form.student_code}` : ''}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Responsável: <strong>{form.guardian_name || 'Não cadastrado'}</strong>{' '}
                      {form.guardian_phone ? `• ${form.guardian_phone}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        student_id: '',
                        student_code: '',
                        student_name: '',
                        classroom_name: '',
                        shift: '',
                        guardian_name: '',
                        guardian_phone: '',
                        student_is_paed: false,
                        paed_exception_verified: false
                      }));
                      setStudentSearch('');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[10px] font-black uppercase text-slate-600 hover:text-rose-700"
                  >
                    Trocar
                  </button>
                </div>
              )}

              {/* ALERTA LEGAL PAED / INCLUSÃO */}
              {form.student_is_paed && (
                <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-300 space-y-2">
                  <div className="flex items-start gap-2.5 text-xs text-indigo-950">
                    <ShieldAlert size={18} className="text-indigo-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black uppercase text-[11px]">
                        Verificação Obrigatória — Estudante PAED (Art. 3º Lei 15.100/2025 e Lei MT 12.745/2024)
                      </p>
                      <p className="text-[11px] font-medium mt-0.5 leading-snug">
                        A legislação federal e estadual assegura o uso de dispositivos eletrônicos quando estritamente necessários para <strong>acessibilidade, inclusão, TEA ou condições de saúde</strong>.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-start gap-2 text-xs font-bold text-indigo-950 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={form.paed_exception_verified}
                      onChange={e => setForm(prev => ({ ...prev, paed_exception_verified: e.target.checked }))}
                      className="mt-0.5 accent-indigo-700"
                    />
                    <span>
                      Confirmo que o aparelho recolhido <strong>não</strong> se enquadra nas exceções de acessibilidade, inclusão ou saúde previstas em lei.
                    </span>
                  </label>
                </div>
              )}

              {/* ALERTA DE REINCIDÊNCIA */}
              {form.student_name && currentFormOccurrenceSeq >= 2 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-semibold flex items-start gap-2">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Reincidência detectada ({currentFormOccurrenceSeq}ª ocorrência neste ano):</strong> a regra de devolução foi sugerida automaticamente para <strong>Exclusiva ao Responsável Legal</strong> (você pode ajustar abaixo se necessário).
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Data</label>
                  <input
                    type="date"
                    value={form.seizure_date}
                    onChange={e => setForm(prev => ({ ...prev, seizure_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Hora</label>
                  <input
                    type="time"
                    value={form.seizure_time}
                    onChange={e => setForm(prev => ({ ...prev, seizure_time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Local / Ambiente</label>
                  <select
                    value={form.seizure_location}
                    onChange={e => setForm(prev => ({ ...prev, seizure_location: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  >
                    {SEIZURE_LOCATION_OPTIONS.map(loc => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                    Disciplina / Atividade (Opcional)
                  </label>
                  <input
                    type="text"
                    value={form.seizure_subject_activity}
                    onChange={e => setForm(prev => ({ ...prev, seizure_subject_activity: e.target.value }))}
                    placeholder="Ex: Matemática, Intervalo, Formatura..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                    Servidor(a) Responsável *
                  </label>
                  <input
                    type="text"
                    value={form.seized_by_name}
                    onChange={e => setForm(prev => ({ ...prev, seized_by_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Motivo / Síntese do Ocorrido
                </label>
                <textarea
                  rows={2}
                  value={form.seizure_reason}
                  onChange={e => setForm(prev => ({ ...prev, seizure_reason: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                />
              </div>

              {/* REGRA DE DEVOLUÇÃO */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 block">
                  Regra de Devolução Definida no Ato
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, return_policy: 'ALUNO_FIM_TURNO' }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.return_policy === 'ALUNO_FIM_TURNO'
                        ? 'border-blue-600 bg-blue-50/70'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-black uppercase text-slate-900">Devolução ao(à) Estudante</p>
                    <p className="text-[10px] font-medium text-slate-500">Ao término do turno letivo (sugerido 1ª ocorrência)</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, return_policy: 'RESPONSAVEL_LEGAL' }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.return_policy === 'RESPONSAVEL_LEGAL'
                        ? 'border-emerald-600 bg-emerald-50/70'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-black uppercase text-slate-900">Somente Responsável Legal</p>
                    <p className="text-[10px] font-medium text-slate-500">Pai/Mãe com documento oficial (sugerido 2ª+ ocorrência)</p>
                  </button>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: IDENTIFICAÇÃO E VISTORIA DE CONDIÇÕES FÍSICAS */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <ClipboardCheck size={14} /> 2. Aparelho e Condições Físicas na Entrada (Vistoria)
              </h4>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1.5">Tipo de Aparelho</label>
                <div className="flex flex-wrap gap-1.5">
                  {DEVICE_TYPE_OPTIONS.map(tp => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, device_type: tp }))}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all ${
                        form.device_type === tp
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                    Marca e Modelo *
                  </label>
                  <input
                    type="text"
                    value={form.device_brand_model}
                    onChange={e => setForm(prev => ({ ...prev, device_brand_model: e.target.value }))}
                    placeholder="Ex: Samsung Galaxy A15, iPhone 11, Redmi Note 13..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Cor</label>
                  <input
                    type="text"
                    value={form.device_color}
                    onChange={e => setForm(prev => ({ ...prev, device_color: e.target.value }))}
                    placeholder="Ex: Preto, Azul..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                    IMEI ou Nº de Série (Opcional)
                  </label>
                  <input
                    type="text"
                    value={form.device_imei_serial}
                    onChange={e => setForm(prev => ({ ...prev, device_imei_serial: e.target.value }))}
                    placeholder="Se visível / informado"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                    Nº do Envelope / Lacre (Opcional)
                  </label>
                  <input
                    type="text"
                    value={form.seal_number}
                    onChange={e => setForm(prev => ({ ...prev, seal_number: e.target.value }))}
                    placeholder="Ex: ENV-04"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Estado da Tela */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1.5">Estado da Tela / Display</label>
                <div className="flex flex-wrap gap-1.5">
                  {SCREEN_CONDITION_OPTIONS.map(opt => {
                    const active = form.screen_condition === opt.value;
                    const tone =
                      opt.value === 'INTEGRA'
                        ? active
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-emerald-50/60 text-emerald-900 border-emerald-200'
                        : opt.value === 'TRINCADA' || opt.value === 'QUEBRADA'
                        ? active
                          ? 'bg-rose-600 text-white border-rose-700'
                          : 'bg-rose-50/60 text-rose-900 border-rose-200'
                        : active
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-amber-50/60 text-amber-900 border-amber-200';
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, screen_condition: opt.value }))}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all ${tone}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Carcaça / Traseira / Câmera */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1.5">Carcaça / Traseira / Câmera</label>
                <div className="flex flex-wrap gap-1.5">
                  {BODY_CONDITION_OPTIONS.map(opt => {
                    const active = form.body_condition === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, body_condition: opt.value }))}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all ${
                          active
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estado de Funcionamento */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1.5">Estado de Funcionamento na Entrega</label>
                <div className="flex flex-wrap gap-1.5">
                  {POWER_STATE_OPTIONS.map(opt => {
                    const active = form.power_state === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, power_state: opt.value }))}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all ${
                          active
                            ? 'bg-blue-700 text-white border-blue-800'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Acessórios */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1.5">
                  Acessórios Entregues Junto com o Aparelho
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ACCESSORY_OPTIONS.map(acc => {
                    const active = form.accessories.includes(acc);
                    return (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => toggleAccessory(acc)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {acc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Avarias pré-existentes */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Descrição de Avarias Pré-existentes / Observações da Vistoria
                </label>
                <textarea
                  rows={2}
                  value={form.preexisting_damage_notes}
                  onChange={e => setForm(prev => ({ ...prev, preexisting_damage_notes: e.target.value }))}
                  placeholder="Ex: Trinca no canto superior esquerdo da tela; capinha transparente com adesivo; câmera traseira arranhada..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                />
              </div>

              {/* Recusa de Assinatura / Testemunha */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.student_refused_signature}
                    onChange={e => setForm(prev => ({ ...prev, student_refused_signature: e.target.checked }))}
                    className="accent-rose-600"
                  />
                  Estudante recusou-se a assinar o termo (registrar testemunha)
                </label>
                <input
                  type="text"
                  value={form.witness_name}
                  onChange={e => setForm(prev => ({ ...prev, witness_name: e.target.value }))}
                  placeholder="Nome do(a) servidor(a) testemunha (opcional ou obrigatório em caso de recusa)"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
                />
              </div>

              {/* Nota LGPD */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-[11px] text-blue-950 font-medium flex items-start gap-2">
                <ShieldCheck size={15} className="text-blue-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Privacidade (LGPD):</strong> solicite que o próprio estudante desligue o aparelho antes de lacrar/guardar. Nunca solicite senhas nem acesse o conteúdo do dispositivo.
                </span>
              </div>
            </div>

            {/* AÇÕES DO FORMULÁRIO */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setViewMode('list');
                  setEditingId(null);
                  onClearInitialStudent?.();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveSeizure(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} /> {editingId ? 'Salvar Alterações' : 'Salvar Registro'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveSeizure(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Printer size={14} /> Salvar & Imprimir Termo A4
              </button>
            </div>
          </div>

          {/* PRÉVIA AO VIVO DO DOCUMENTO A4 */}
          <div className="2xl:col-span-6 space-y-2">
            <div className="no-print flex items-center justify-between px-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Eye size={14} className="text-blue-600" /> Pré-visualização em Tempo Real (1 Folha A4)
              </span>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Info size={12} /> Inclui Recibo de Devolução na parte inferior
              </span>
            </div>
            <ElectronicDeviceSeizureTerm record={previewRecord} />
          </div>
        </div>
      )}

      {/* MODAL DE DEVOLUÇÃO */}
      {returnModalRecord && renderReturnModal()}
    </div>
  );
};

export default ElectronicDeviceSeizureManager;
