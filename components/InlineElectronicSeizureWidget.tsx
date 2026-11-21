import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Printer,
  PackageCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  Users,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  ClipboardCheck
} from 'lucide-react';
import { supabase } from '../supabaseClient';
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

export const SEIZURE_LOCAL_STORAGE_KEY = 'eecm_electronic_device_seizures_v1';
export const SEIZURE_CLOUD_TEMPLATE_KEY = 'electronic_device_seizure';

export interface InlineSeizureDraft {
  enabled: boolean;
  seizure_time: string;
  seizure_location: string;
  seizure_subject_activity: string;
  device_type: string;
  device_brand_model: string;
  device_color: string;
  device_imei_serial: string;
  seal_number: string;
  screen_condition: ScreenCondition;
  body_condition: BodyCondition;
  power_state: PowerState;
  accessories: string[];
  preexisting_damage_notes: string;
  return_policy: ReturnPolicy;
  student_refused_signature: boolean;
  witness_name: string;
  paed_exception_verified: boolean;
}

export const getLocalTimeNow = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export const getLocalDateIsoNow = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const createDefaultInlineSeizureDraft = (
  suggestedPolicy: ReturnPolicy = 'ALUNO_FIM_TURNO',
  studentIsPaed = false
): InlineSeizureDraft => ({
  enabled: true,
  seizure_time: getLocalTimeNow(),
  seizure_location: 'Sala de Aula',
  seizure_subject_activity: '',
  device_type: 'Celular / Smartphone',
  device_brand_model: '',
  device_color: '',
  device_imei_serial: '',
  seal_number: '',
  screen_condition: 'INTEGRA',
  body_condition: 'INTEGRA',
  power_state: 'LIGADO_DESLIGADO_ALUNO',
  accessories: [],
  preexisting_damage_notes: '',
  return_policy: suggestedPolicy,
  student_refused_signature: false,
  witness_name: '',
  paed_exception_verified: !studentIsPaed
});

export const isElectronicInfractionCategory = (cat?: string): boolean => {
  if (!cat) return false;
  const low = cat.toLowerCase();
  return (
    cat.trim().startsWith('61.') ||
    low.includes('61. utilizar') ||
    low.includes('telefones celulares') ||
    low.includes('aparelhos eletrônicos') ||
    low.includes('aparelhos eletronicos')
  );
};

export const loadAllElectronicSeizures = async (): Promise<ElectronicDeviceSeizureRecord[]> => {
  let localList: ElectronicDeviceSeizureRecord[] = [];
  try {
    const saved = localStorage.getItem(SEIZURE_LOCAL_STORAGE_KEY);
    if (saved) localList = JSON.parse(saved) || [];
  } catch {
    localList = [];
  }

  try {
    const { data, error } = await supabase
      .from('civic_documents')
      .select('*')
      .eq('template', SEIZURE_CLOUD_TEMPLATE_KEY);

    if (!error && Array.isArray(data)) {
      const map = new Map<string, ElectronicDeviceSeizureRecord>();
      localList.forEach(r => map.set(r.id, r));
      data.forEach((d: any) => {
        if (d.content) {
          map.set(d.id, {
            ...d.content,
            id: d.id,
            accessories: Array.isArray(d.content.accessories) ? d.content.accessories : []
          });
        }
      });
      const merged = Array.from(map.values()).sort((a, b) =>
        (b.seizure_date || '').localeCompare(a.seizure_date || '') ||
        (b.created_at || '').localeCompare(a.created_at || '')
      );
      try {
        localStorage.setItem(SEIZURE_LOCAL_STORAGE_KEY, JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch {
    // fallback localList
  }

  return localList;
};

export const saveElectronicSeizureRecord = async (
  record: ElectronicDeviceSeizureRecord,
  currentList: ElectronicDeviceSeizureRecord[]
): Promise<ElectronicDeviceSeizureRecord[]> => {
  const exists = currentList.some(r => r.id === record.id);
  const nextList = exists
    ? currentList.map(r => (r.id === record.id ? record : r))
    : [record, ...currentList];

  try {
    localStorage.setItem(SEIZURE_LOCAL_STORAGE_KEY, JSON.stringify(nextList));
  } catch {}

  try {
    await supabase.from('civic_documents').upsert(
      [
        {
          id: record.id,
          template: SEIZURE_CLOUD_TEMPLATE_KEY,
          date: record.seizure_date,
          timestamp: Date.now(),
          student_name: record.student_name,
          student_class: record.classroom_name,
          content: record
        }
      ],
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Aviso ao sincronizar termo de recolhimento:', err);
  }

  return nextList;
};

export const computeNextProtocolNumber = (list: ElectronicDeviceSeizureRecord[]): string => {
  const year = new Date().getFullYear();
  let maxSeq = 0;
  list.forEach(r => {
    const m = (r.protocol_number || '').match(new RegExp(`^REC-${year}-(\\d+)$`));
    if (m) {
      const n = Number(m[1]);
      if (n > maxSeq) maxSeq = n;
    }
  });
  return `REC-${year}-${String(maxSeq + 1).padStart(4, '0')}`;
};

interface InlineSeizureFormSectionProps {
  draft: InlineSeizureDraft;
  onChange: (next: InlineSeizureDraft) => void;
  occurrenceSequence: number;
  studentIsPaed: boolean;
}

export const InlineSeizureFormSection: React.FC<InlineSeizureFormSectionProps> = ({
  draft,
  onChange,
  occurrenceSequence,
  studentIsPaed
}) => {
  const update = (patch: Partial<InlineSeizureDraft>) => onChange({ ...draft, ...patch });

  const toggleAccessory = (acc: string) => {
    const next = draft.accessories.includes(acc)
      ? draft.accessories.filter(a => a !== acc)
      : [...draft.accessories, acc];
    update({ accessories: next });
  };

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 overflow-hidden transition-all">
      {/* Cabeçalho com toggle */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={e => update({ enabled: e.target.checked })}
            className="w-4 h-4 accent-amber-400 rounded"
          />
          <div className="flex items-center gap-2">
            <Smartphone size={15} className="text-amber-300 shrink-0" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider block leading-tight">
                Termo de Recolhimento de Aparelho Eletrônico Integrado
              </span>
              <span className="text-[9px] text-blue-200 font-medium block">
                Lei Federal 15.100/2025 • Lei MT 12.745/2024 • Já salva e gera o Termo A4 junto com esta medida
              </span>
            </div>
          </div>
        </label>

        <span
          className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
            occurrenceSequence >= 2 ? 'bg-rose-500 text-white' : 'bg-white/15 text-blue-100'
          }`}
        >
          {occurrenceSequence}ª ocorrência no ano
        </span>
      </div>

      {draft.enabled && (
        <div className="p-4 space-y-3.5 text-slate-800">
          {studentIsPaed && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-300 space-y-1.5">
              <div className="flex items-start gap-2 text-[10px] text-indigo-950 font-semibold">
                <ShieldAlert size={14} className="text-indigo-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Aluno PAED (Art. 3º Lei 15.100/2025):</strong> confirme que o dispositivo não está sendo utilizado por necessidade de acessibilidade, inclusão, TEA ou saúde.
                </span>
              </div>
              <label className="flex items-center gap-2 text-[10px] font-black text-indigo-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.paed_exception_verified}
                  onChange={e => update({ paed_exception_verified: e.target.checked })}
                  className="accent-indigo-700"
                />
                Confirmo que o aparelho não se enquadra nas exceções legais de acessibilidade/saúde.
              </label>
            </div>
          )}

          {/* Linha 1: Tipo + Marca/Modelo + Cor */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-4">
              <label className="text-[9px] font-black uppercase text-slate-600 block mb-1">Tipo de Aparelho</label>
              <select
                value={draft.device_type}
                onChange={e => update({ device_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
              >
                {DEVICE_TYPE_OPTIONS.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-5">
              <label className="text-[9px] font-black uppercase text-slate-600 block mb-1">Marca e Modelo *</label>
              <input
                type="text"
                value={draft.device_brand_model}
                onChange={e => update({ device_brand_model: e.target.value })}
                placeholder="Ex: Samsung A15, iPhone 11, Redmi..."
                required={draft.enabled}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-[9px] font-black uppercase text-slate-600 block mb-1">Cor</label>
              <input
                type="text"
                value={draft.device_color}
                onChange={e => update({ device_color: e.target.value })}
                placeholder="Ex: Preto"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Linha 2: Hora + Local + IMEI/Lacre */}
          <div className="grid grid-cols-2 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-2">
              <label className="text-[9px] font-black uppercase text-slate-600 block mb-1">Hora</label>
              <input
                type="time"
                value={draft.seizure_time}
                onChange={e => update({ seizure_time: e.target.value })}
                className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="text-[9px] font-black uppercase text-slate-600 block mb-1">Local / Ambiente</label>
              <select
                value={draft.seizure_location}
                onChange={e => update({ seizure_location: e.target.value })}
                className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
              >
                {SEIZURE_LOCATION_OPTIONS.map(loc => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="text-[9px] font-black uppercase text-slate-600 block mb-1">Disciplina (Opcional)</label>
              <input
                type="text"
                value={draft.seizure_subject_activity}
                onChange={e => update({ seizure_subject_activity: e.target.value })}
                placeholder="Ex: Matemática"
                className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-[9px] font-black uppercase text-slate-600 block mb-1">IMEI / Lacre (Opc.)</label>
              <input
                type="text"
                value={draft.seal_number}
                onChange={e => update({ seal_number: e.target.value })}
                placeholder="Ex: ENV-04"
                className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Vistoria de Condições Físicas */}
          <div className="p-3 rounded-xl bg-white border border-blue-100 space-y-2.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-900 flex items-center gap-1.5">
              <ClipboardCheck size={12} /> Vistoria das Condições do Aparelho no Ato do Recolhimento
            </p>

            {/* Tela */}
            <div>
              <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Estado da Tela:</span>
              <div className="flex flex-wrap gap-1">
                {SCREEN_CONDITION_OPTIONS.map(opt => {
                  const active = draft.screen_condition === opt.value;
                  const cls =
                    opt.value === 'INTEGRA'
                      ? active
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : opt.value === 'TRINCADA' || opt.value === 'QUEBRADA'
                      ? active
                        ? 'bg-rose-600 text-white border-rose-700'
                        : 'bg-rose-50 text-rose-900 border-rose-200'
                      : active
                      ? 'bg-amber-600 text-white border-amber-700'
                      : 'bg-amber-50 text-amber-900 border-amber-200';
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update({ screen_condition: opt.value })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all ${cls}`}
                    >
                      {opt.short}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Carcaça & Funcionamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Carcaça / Câmera:</span>
                <select
                  value={draft.body_condition}
                  onChange={e => update({ body_condition: e.target.value as BodyCondition })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-900"
                >
                  {BODY_CONDITION_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Funcionamento:</span>
                <select
                  value={draft.power_state}
                  onChange={e => update({ power_state: e.target.value as PowerState })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-900"
                >
                  {POWER_STATE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Acessórios */}
            <div>
              <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Acessórios Junto:</span>
              <div className="flex flex-wrap gap-1">
                {ACCESSORY_OPTIONS.map(acc => {
                  const active = draft.accessories.includes(acc);
                  return (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => toggleAccessory(acc)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
              <input
                type="text"
                value={draft.preexisting_damage_notes}
                onChange={e => update({ preexisting_damage_notes: e.target.value })}
                placeholder="Avarias pré-existentes / observações da vistoria (opcional — ex: trinca no canto superior...)"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Regra de Devolução + Recusa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => update({ return_policy: 'ALUNO_FIM_TURNO' })}
              className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                draft.return_policy === 'ALUNO_FIM_TURNO'
                  ? 'border-blue-600 bg-white shadow-xs'
                  : 'border-slate-200 bg-white/50 hover:bg-white'
              }`}
            >
              <p className="text-[10px] font-black uppercase text-slate-900">Devolução ao(à) Estudante</p>
              <p className="text-[9px] text-slate-500 font-medium">Ao término do turno letivo</p>
            </button>

            <button
              type="button"
              onClick={() => update({ return_policy: 'RESPONSAVEL_LEGAL' })}
              className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                draft.return_policy === 'RESPONSAVEL_LEGAL'
                  ? 'border-emerald-600 bg-white shadow-xs'
                  : 'border-slate-200 bg-white/50 hover:bg-white'
              }`}
            >
              <p className="text-[10px] font-black uppercase text-slate-900">Somente Responsável Legal</p>
              <p className="text-[9px] text-slate-500 font-medium">Pai/Mãe com documento oficial</p>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10px]">
            <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.student_refused_signature}
                onChange={e => update({ student_refused_signature: e.target.checked })}
                className="accent-rose-600"
              />
              Estudante recusou-se a assinar
            </label>
            <input
              type="text"
              value={draft.witness_name}
              onChange={e => update({ witness_name: e.target.value })}
              placeholder="Testemunha (opcional)"
              className="flex-1 min-w-[160px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold"
            />
          </div>

          <p className="text-[9px] font-semibold text-blue-900/80 flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-blue-700 shrink-0" />
            LGPD: peça ao estudante para desligar o aparelho na entrega. A escola não solicita senhas nem acessa dados.
          </p>
        </div>
      )}
    </div>
  );
};

interface QuickSeizurePrintAndReturnModalProps {
  record: ElectronicDeviceSeizureRecord | null;
  initialMode: 'print' | 'return';
  currentUserName: string;
  onClose: () => void;
  onUpdated: (updated: ElectronicDeviceSeizureRecord) => void;
}

export const QuickSeizurePrintAndReturnModal: React.FC<QuickSeizurePrintAndReturnModalProps> = ({
  record,
  initialMode,
  currentUserName,
  onClose,
  onUpdated
}) => {
  const [mode, setMode] = useState<'print' | 'return'>(initialMode);
  const [saving, setSaving] = useState(false);
  const [returnForm, setReturnForm] = useState({
    returned_to_type: 'RESPONSAVEL' as ReturnedToType,
    receiver_name: '',
    receiver_document: '',
    receiver_relationship: 'Mãe',
    receiver_phone: '',
    returned_date: getLocalDateIsoNow(),
    returned_time: getLocalTimeNow(),
    returned_by_name: currentUserName || '',
    return_condition_ok: true,
    return_notes: ''
  });

  useEffect(() => {
    if (!record) return;
    setMode(initialMode);
    const defaultType: ReturnedToType = record.return_policy === 'ALUNO_FIM_TURNO' ? 'ALUNO' : 'RESPONSAVEL';
    setReturnForm({
      returned_to_type: defaultType,
      receiver_name: defaultType === 'ALUNO' ? record.student_name : record.guardian_name || '',
      receiver_document: '',
      receiver_relationship: defaultType === 'ALUNO' ? 'Próprio(a) Estudante' : 'Mãe',
      receiver_phone: record.guardian_phone || '',
      returned_date: getLocalDateIsoNow(),
      returned_time: getLocalTimeNow(),
      returned_by_name: currentUserName || '',
      return_condition_ok: true,
      return_notes: ''
    });
  }, [record, initialMode, currentUserName]);

  if (!record) return null;

  const handleSwitchType = (nextType: ReturnedToType) => {
    setReturnForm(prev => ({
      ...prev,
      returned_to_type: nextType,
      receiver_name: nextType === 'ALUNO' ? record.student_name : record.guardian_name || '',
      receiver_relationship: nextType === 'ALUNO' ? 'Próprio(a) Estudante' : 'Mãe',
      receiver_phone: record.guardian_phone || prev.receiver_phone
    }));
  };

  const handleConfirmReturn = async (printAfter: boolean) => {
    if (!returnForm.receiver_name.trim()) {
      alert('Informe o nome completo de quem está retirando o aparelho.');
      return;
    }
    setSaving(true);
    try {
      const updated: ElectronicDeviceSeizureRecord = {
        ...record,
        status: returnForm.returned_to_type === 'RESPONSAVEL' ? 'DEVOLVIDO_RESPONSAVEL' : 'DEVOLVIDO_ALUNO',
        returned_to_type: returnForm.returned_to_type,
        receiver_name: returnForm.receiver_name.trim().toUpperCase(),
        receiver_document: returnForm.receiver_document.trim(),
        receiver_relationship: returnForm.receiver_relationship.trim(),
        receiver_phone: returnForm.receiver_phone.trim(),
        returned_date: returnForm.returned_date,
        returned_time: returnForm.returned_time,
        returned_by_name: returnForm.returned_by_name.trim() || currentUserName,
        return_condition_ok: returnForm.return_condition_ok,
        return_notes: returnForm.return_notes.trim(),
        updated_at: new Date().toISOString()
      };
      onUpdated(updated);
      if (printAfter) {
        setMode('print');
        setTimeout(() => window.print(), 220);
      } else {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="quick-seizure-print-overlay fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 print:static print:inset-auto print:bg-white print:p-0 print:overflow-visible">
      <style>{`
        @media print {
          .quick-seizure-print-overlay {
            position: static !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
        }
      `}</style>

      {mode === 'print' ? (
        <div className="max-w-[850px] mx-auto space-y-4 print:max-w-none print:space-y-0">
          <div className="no-print bg-white rounded-2xl border border-slate-200 p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                {record.protocol_number} • {record.occurrence_sequence}ª Ocorrência
              </span>
              <h3 className="text-sm font-black uppercase text-slate-900">
                Termo de Recolhimento e Devolução — {record.student_name}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {record.status === 'SOB_GUARDA' && (
                <button
                  type="button"
                  onClick={() => setMode('return')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase flex items-center gap-1.5"
                >
                  <PackageCheck size={14} /> Registrar Devolução
                </button>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase flex items-center gap-1.5 shadow-md"
              >
                <Printer size={14} /> Imprimir (1 Folha A4)
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <ElectronicDeviceSeizureTerm record={record} />
        </div>
      ) : (
        <div className="no-print max-w-2xl mx-auto my-6 bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Devolução de Aparelho • {record.protocol_number}
              </span>
              <h3 className="text-base font-black uppercase">Registrar Devolução ao Responsável ou Estudante</h3>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white">
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <p className="font-black uppercase text-slate-900">
                {record.student_name} • {record.classroom_name}
              </p>
              <p className="font-bold text-blue-800 mt-0.5">
                {record.device_type} — {record.device_brand_model} {record.device_color ? `(${record.device_color})` : ''}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Recolhido em {formatBrDate(record.seizure_date)} às {record.seizure_time} • Tela:{' '}
                <strong>{SCREEN_CONDITION_OPTIONS.find(o => o.value === record.screen_condition)?.short}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSwitchType('RESPONSAVEL')}
                className={`p-3 rounded-2xl border-2 text-left flex items-start gap-2.5 ${
                  returnForm.returned_to_type === 'RESPONSAVEL' ? 'border-emerald-600 bg-emerald-50/70' : 'border-slate-200'
                }`}
              >
                <Users size={17} className={returnForm.returned_to_type === 'RESPONSAVEL' ? 'text-emerald-700 mt-0.5' : 'text-slate-400 mt-0.5'} />
                <div>
                  <p className="text-xs font-black uppercase text-slate-900">Pai / Mãe / Responsável</p>
                  <p className="text-[10px] text-slate-500">Retirada presencial com documento</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchType('ALUNO')}
                className={`p-3 rounded-2xl border-2 text-left flex items-start gap-2.5 ${
                  returnForm.returned_to_type === 'ALUNO' ? 'border-blue-600 bg-blue-50/70' : 'border-slate-200'
                }`}
              >
                <UserCheck size={17} className={returnForm.returned_to_type === 'ALUNO' ? 'text-blue-700 mt-0.5' : 'text-slate-400 mt-0.5'} />
                <div>
                  <p className="text-xs font-black uppercase text-slate-900">Próprio(a) Estudante</p>
                  <p className="text-[10px] text-slate-500">Fim do turno / autorizado pela gestão</p>
                </div>
              </button>
            </div>

            {record.return_policy === 'RESPONSAVEL_LEGAL' && returnForm.returned_to_type === 'ALUNO' && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-semibold flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <span>A regra original era devolução somente ao Responsável Legal. Registre a autorização nas observações, se necessário.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nome Completo de Quem Recebe *</label>
                <input
                  type="text"
                  value={returnForm.receiver_name}
                  onChange={e => setReturnForm(prev => ({ ...prev, receiver_name: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Parentesco / Vínculo</label>
                <input
                  type="text"
                  value={returnForm.receiver_relationship}
                  onChange={e => setReturnForm(prev => ({ ...prev, receiver_relationship: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">RG ou CPF</label>
                <input
                  type="text"
                  value={returnForm.receiver_document}
                  onChange={e => setReturnForm(prev => ({ ...prev, receiver_document: e.target.value }))}
                  placeholder="RG ou CPF"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Data</label>
                <input
                  type="date"
                  value={returnForm.returned_date}
                  onChange={e => setReturnForm(prev => ({ ...prev, returned_date: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Hora</label>
                <input
                  type="time"
                  value={returnForm.returned_time}
                  onChange={e => setReturnForm(prev => ({ ...prev, returned_time: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <label className="flex items-center gap-2 font-bold text-emerald-800 cursor-pointer">
                <input
                  type="radio"
                  checked={returnForm.return_condition_ok}
                  onChange={() => setReturnForm(prev => ({ ...prev, return_condition_ok: true }))}
                  className="accent-emerald-600"
                />
                Confere — entregue nas mesmas condições físicas registradas na entrada
              </label>
              <label className="flex items-center gap-2 font-bold text-rose-800 cursor-pointer">
                <input
                  type="radio"
                  checked={!returnForm.return_condition_ok}
                  onChange={() => setReturnForm(prev => ({ ...prev, return_condition_ok: false }))}
                  className="accent-rose-600"
                />
                Registrar ressalva na entrega
              </label>
              <input
                type="text"
                value={returnForm.return_notes}
                onChange={e => setReturnForm(prev => ({ ...prev, return_notes: e.target.value }))}
                placeholder="Observação / ressalva opcional..."
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setMode('print')}
              className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase"
            >
              Ver Termo
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleConfirmReturn(false)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} /> Confirmar Devolução
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleConfirmReturn(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase flex items-center gap-1.5 shadow-md"
            >
              <Printer size={14} /> Confirmar & Imprimir Recibo A4
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
