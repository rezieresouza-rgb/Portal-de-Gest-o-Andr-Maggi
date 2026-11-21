import React from 'react';

export type ScreenCondition =
  | 'INTEGRA'
  | 'RISCADA'
  | 'PELICULA_DANIFICADA'
  | 'TRINCADA'
  | 'QUEBRADA';

export type BodyCondition =
  | 'INTEGRA'
  | 'ARRANHOES'
  | 'TRASEIRA_TRINCADA'
  | 'CAMERA_BOTOES_AVARIADOS';

export type PowerState =
  | 'LIGADO_DESLIGADO_ALUNO'
  | 'DESCARREGADO_DESLIGADO'
  | 'NAO_LIGA';

export type ReturnPolicy = 'ALUNO_FIM_TURNO' | 'RESPONSAVEL_LEGAL';

export type SeizureStatus = 'SOB_GUARDA' | 'DEVOLVIDO_ALUNO' | 'DEVOLVIDO_RESPONSAVEL';

export type ReturnedToType = 'ALUNO' | 'RESPONSAVEL';

export interface ElectronicDeviceSeizureRecord {
  id: string;
  protocol_number: string;
  occurrence_id?: string;
  occurrence_sequence: number;
  school_year: number;
  module_source: 'CIVICO_MILITAR' | 'COORDENACAO';

  // Estudante
  student_id?: string;
  student_code?: string;
  student_name: string;
  classroom_name: string;
  shift?: string;
  guardian_name?: string;
  guardian_phone?: string;
  student_is_paed?: boolean;
  paed_exception_verified?: boolean;

  // Recolhimento
  seizure_date: string;
  seizure_time: string;
  seizure_location: string;
  seizure_subject_activity?: string;
  seizure_reason: string;
  seized_by_name: string;
  seized_by_role?: string;
  student_refused_signature?: boolean;
  witness_name?: string;

  // Aparelho & Condições Físicas
  device_type: string;
  device_brand_model: string;
  device_color?: string;
  device_imei_serial?: string;
  seal_number?: string;
  screen_condition: ScreenCondition;
  body_condition: BodyCondition;
  power_state: PowerState;
  accessories: string[];
  preexisting_damage_notes?: string;

  // Política e Status
  return_policy: ReturnPolicy;
  status: SeizureStatus;

  // Devolução
  returned_to_type?: ReturnedToType | null;
  receiver_name?: string;
  receiver_document?: string;
  receiver_relationship?: string;
  receiver_phone?: string;
  returned_date?: string;
  returned_time?: string;
  returned_by_name?: string;
  return_condition_ok?: boolean;
  return_notes?: string;

  // Auditoria
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export const DEVICE_TYPE_OPTIONS = [
  'Celular / Smartphone',
  'Fone de Ouvido Bluetooth',
  'Smartwatch / Relógio Inteligente',
  'Caixa de Som Portátil',
  'Tablet',
  'Outro Eletrônico'
] as const;

export const SEIZURE_LOCATION_OPTIONS = [
  'Sala de Aula',
  'Pátio / Recreio / Intervalo',
  'Corredor / Área Comum',
  'Quadra Poliesportiva',
  'Laboratório / Biblioteca',
  'Refeitório',
  'Outro Ambiente Escolar'
] as const;

export const SCREEN_CONDITION_OPTIONS: { value: ScreenCondition; label: string; short: string }[] = [
  { value: 'INTEGRA', label: 'Íntegra (sem danos aparentes)', short: 'Íntegra' },
  { value: 'RISCADA', label: 'Riscada / arranhada', short: 'Riscada' },
  { value: 'PELICULA_DANIFICADA', label: 'Película trincada/danificada', short: 'Película danif.' },
  { value: 'TRINCADA', label: 'Tela trincada', short: 'Tela trincada' },
  { value: 'QUEBRADA', label: 'Tela quebrada / vazada / sem imagem', short: 'Quebrada / s/ imagem' }
];

export const BODY_CONDITION_OPTIONS: { value: BodyCondition; label: string; short: string }[] = [
  { value: 'INTEGRA', label: 'Íntegra', short: 'Íntegra' },
  { value: 'ARRANHOES', label: 'Arranhões / marcas de uso', short: 'Marcas de uso' },
  { value: 'TRASEIRA_TRINCADA', label: 'Traseira trincada / quebrada', short: 'Traseira trincada' },
  { value: 'CAMERA_BOTOES_AVARIADOS', label: 'Câmera / botões avariados', short: 'Câmera/Botões avariados' }
];

export const POWER_STATE_OPTIONS: { value: PowerState; label: string; short: string }[] = [
  { value: 'LIGADO_DESLIGADO_ALUNO', label: 'Ligado (desligado pelo aluno na entrega)', short: 'Ligado (desligado na entrega)' },
  { value: 'DESCARREGADO_DESLIGADO', label: 'Descarregado / Desligado', short: 'Descarregado / Desligado' },
  { value: 'NAO_LIGA', label: 'Não liga / inoperante', short: 'Não liga' }
];

export const ACCESSORY_OPTIONS = [
  'Capinha protetora',
  'Película',
  'Chip SIM',
  'Cartão SD',
  'Fone de ouvido',
  'Carregador / Cabo',
  'Suporte / PopSocket'
] as const;

export const formatBrDate = (iso?: string | null): string => {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
};

export interface PrefilledTermStudent {
  name?: string;
  code?: string;
  className?: string;
  shift?: string;
  guardianName?: string;
  guardianPhone?: string;
}

interface ElectronicDeviceSeizureTermProps {
  record?: ElectronicDeviceSeizureRecord | null;
  blankMode?: boolean;
  prefilledStudent?: PrefilledTermStudent | null;
}

const CheckBoxMark: React.FC<{ checked?: boolean; label: string; wrap?: boolean }> = ({
  checked,
  label,
  wrap = false
}) => (
  <span className={`${wrap ? 'flex items-start gap-1.5' : 'inline-flex items-center gap-1 mr-2.5 whitespace-nowrap'}`}>
    <span
      className={`inline-flex items-center justify-center w-3 h-3 shrink-0 ${wrap ? 'mt-0.5' : ''} border rounded-[2px] text-[8px] font-black leading-none ${
        checked
          ? 'bg-slate-900 border-slate-900 text-white term-chk-checked'
          : 'bg-white border-slate-600 text-transparent'
      }`}
    >
      ✓
    </span>
    <span className={checked ? 'font-bold text-slate-950' : 'text-slate-700'}>{label}</span>
  </span>
);

export const ElectronicDeviceSeizureTerm: React.FC<ElectronicDeviceSeizureTermProps> = ({
  record,
  blankMode = false,
  prefilledStudent = null
}) => {
  const isBlank = blankMode || !record;
  const r = !isBlank ? record : null;

  const displayStudentName = isBlank ? prefilledStudent?.name || '\u00A0' : r!.student_name;
  const displayStudentCode = isBlank ? prefilledStudent?.code || '\u00A0' : r!.student_code || '---';
  const displayStudentClass = isBlank ? prefilledStudent?.className || '\u00A0' : r!.classroom_name;
  const displayStudentShift = isBlank ? prefilledStudent?.shift || '\u00A0' : r!.shift || '---';
  const displayGuardianName = isBlank ? prefilledStudent?.guardianName || '\u00A0' : r!.guardian_name || 'Não informado no cadastro';
  const displayGuardianPhone = isBlank ? prefilledStudent?.guardianPhone || '\u00A0' : r!.guardian_phone || 'Não informado';

  const isReturned = Boolean(r && r.status !== 'SOB_GUARDA');
  const accessoriesList = r?.accessories || [];
  const hasNoAccessories = !isBlank && accessoriesList.length === 0;

  return (
    <div className="termo-recolhimento-a4 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 max-w-[820px] mx-auto text-slate-900 select-text">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6.5mm 8.5mm;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body, #root, #root > div, main {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          #root .termo-recolhimento-a4 {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            width: 100% !important;
            background: #ffffff !important;
            font-size: 9.2px !important;
            line-height: 1.24 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #root .termo-recolhimento-a4 .term-header-logos img {
            height: 46px !important;
            max-height: 46px !important;
          }
          #root .termo-recolhimento-a4 .term-header-logos img.term-logo-escola {
            height: 50px !important;
            max-height: 50px !important;
          }
          #root .termo-recolhimento-a4 .term-title-bar {
            background-color: #1e3a8a !important;
            color: #ffffff !important;
            padding: 4px 10px !important;
            margin: 4px 0 5px 0 !important;
            border-radius: 4px !important;
          }
          #root .termo-recolhimento-a4 .term-title-bar * {
            color: #ffffff !important;
            background: transparent !important;
          }
          #root .termo-recolhimento-a4 .term-legal-box {
            background-color: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            border-left: 3px solid #1e3a8a !important;
            padding: 4.5px 7px !important;
            margin-bottom: 5px !important;
            font-size: 7.7px !important;
            line-height: 1.25 !important;
          }
          #root .termo-recolhimento-a4 .term-section {
            border: 1px solid #334155 !important;
            border-radius: 4px !important;
            margin-bottom: 5px !important;
            overflow: hidden !important;
          }
          #root .termo-recolhimento-a4 .term-section-hdr {
            background-color: #e2e8f0 !important;
            color: #0f172a !important;
            padding: 2.5px 7px !important;
            font-size: 8px !important;
            border-bottom: 1px solid #334155 !important;
          }
          #root .termo-recolhimento-a4 .term-return-hdr {
            background-color: #0f172a !important;
            color: #ffffff !important;
            padding: 3px 8px !important;
            font-size: 8.2px !important;
          }
          #root .termo-recolhimento-a4 .term-return-hdr * {
            color: #ffffff !important;
            background: transparent !important;
          }
          #root .termo-recolhimento-a4 .term-chk-checked {
            background-color: #0f172a !important;
            border-color: #0f172a !important;
            color: #ffffff !important;
          }
          #root .termo-recolhimento-a4 .term-body-pad {
            padding: 4.5px 7px !important;
          }
          #root .termo-recolhimento-a4 .term-sig-row {
            padding-top: 16px !important;
            padding-bottom: 2px !important;
          }
          #root .termo-recolhimento-a4 .term-return-divider {
            margin: 6px 0 5px 0 !important;
          }
        }
      `}</style>

      {/* CABEÇALHO INSTITUCIONAL OFICIAL */}
      <div className="term-header-logos flex items-center justify-between gap-3 pb-2 border-b-2 border-slate-900">
        <div className="w-16 flex items-center justify-start shrink-0">
          <img
            src="/brasao_mt.png"
            alt="Brasão do Estado de Mato Grosso"
            className="h-12 w-auto object-contain"
            onError={e => {
              (e.currentTarget as HTMLImageElement).src = '/SEDUC 2.jpg';
            }}
          />
        </div>
        <div className="text-center flex-1 leading-tight">
          <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-slate-600">
            Governo do Estado de Mato Grosso • Secretaria de Estado de Educação (SEDUC-MT)
          </p>
          <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500">
            Diretoria Regional de Educação de Sinop — Colíder-MT
          </p>
          <h1 className="text-[13px] font-black uppercase tracking-tight text-slate-950 mt-0.5">
            ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI
          </h1>
          <p className="text-[7.5px] font-bold uppercase tracking-widest text-blue-900">
            GESTÃO DISCIPLINAR CÍVICO-MILITAR E COORDENAÇÃO PEDAGÓGICA
          </p>
        </div>
        <div className="w-16 flex items-center justify-end shrink-0">
          <img
            src="/logo-escola-oficial.png"
            alt="Brasão EECM André Antônio Maggi"
            className="term-logo-escola h-13 w-auto object-contain"
            onError={e => {
              (e.currentTarget as HTMLImageElement).src = '/logo-escola.png';
            }}
          />
        </div>
      </div>

      {/* TARJA DE TÍTULO + PROTOCOLO */}
      <div className="term-title-bar bg-blue-900 text-white rounded-md px-3 py-1.5 my-2 flex items-center justify-between gap-2">
        <div className="font-black uppercase tracking-wider text-[10.5px]">
          TERMO DE RECOLHIMENTO, GUARDA TEMPORÁRIA E DEVOLUÇÃO DE APARELHO ELETRÔNICO
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[9px] font-black uppercase">
          <span className="px-2 py-0.5 border border-white/40 rounded">
            {isBlank ? 'PROT.: REC-2026-______' : `PROT.: ${r!.protocol_number}`}
          </span>
          <span className="px-2 py-0.5 border border-white/40 rounded">
            {isBlank ? 'OCORR.: ___ª' : `${r!.occurrence_sequence}ª OCORRÊNCIA`}
          </span>
        </div>
      </div>

      {/* BLOCO 1 — FUNDAMENTAÇÃO LEGAL E GARANTIA DE PRIVACIDADE */}
      <div className="term-legal-box bg-slate-50 border border-slate-300 border-l-4 border-l-blue-900 rounded px-2.5 py-1.5 mb-2 text-[8.5px] leading-snug text-slate-800 text-justify">
        <span className="font-black uppercase text-blue-950">Fundamentação Legal: </span>
        Lavra-se o presente termo em cumprimento à <strong>Lei Federal nº 15.100, de 13/01/2025</strong> (Arts. 1º a 4º — proibição do uso de aparelhos eletrônicos portáteis pessoais durante aulas, recreios e intervalos na educação básica, ressalvadas as exceções pedagógicas e de acessibilidade/saúde), regulamentada pelo <strong>Decreto Federal nº 12.385, de 18/02/2025</strong>; à <strong>Lei Estadual de Mato Grosso nº 12.745, de 06/12/2024</strong> (DOE-MT de 09/12/2024 — proibição de celulares e telas digitais nas salas de aula da rede pública estadual) e ao <strong>Manual Orientativo da SEDUC-MT</strong>; ao <strong>ECA (Lei Federal nº 8.069/1990, Arts. 53 e 56)</strong>; e ao <strong>Regulamento Disciplinar das EECM-MT (Falta Média — Item 61)</strong>.{' '}
        <span className="font-bold text-slate-900">Privacidade (CF Art. 5º, X/XII e LGPD Lei nº 13.709/2018):</span> a unidade escolar realiza exclusivamente a <strong>guarda física temporária</strong> do bem, não exige senhas de desbloqueio e não acessa dados pessoais nele contidos.
      </div>

      {/* BLOCO 2 — DADOS DO ESTUDANTE E DO FATO */}
      <div className="term-section border border-slate-700 rounded mb-2 overflow-hidden">
        <div className="term-section-hdr bg-slate-200 px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-700 flex justify-between">
          <span>1. Identificação do Estudante e Registro do Recolhimento</span>
          {!isBlank && r?.student_is_paed && (
            <span className="text-blue-900 font-black">
              [PAED: Exceção legal Art. 3º verificada]
            </span>
          )}
        </div>
        <div className="term-body-pad p-2 space-y-1.5 text-[9.5px]">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-6 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Nome do(a) Estudante</span>
              <span className="font-black uppercase text-slate-950">{displayStudentName}</span>
            </div>
            <div className="col-span-2 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Cód. SEDUC</span>
              <span className="font-bold text-slate-900">{displayStudentCode}</span>
            </div>
            <div className="col-span-2 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Turma</span>
              <span className="font-black uppercase text-slate-950">{displayStudentClass}</span>
            </div>
            <div className="col-span-2 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Turno</span>
              <span className="font-bold uppercase text-slate-900">{displayStudentShift}</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Responsável Legal (Cadastro Escolar)</span>
              <span className="font-bold uppercase text-slate-900">{displayGuardianName}</span>
            </div>
            <div className="col-span-5 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Telefone / WhatsApp do Responsável</span>
              <span className="font-bold text-slate-900">{displayGuardianPhone}</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-2 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Data</span>
              <span className="font-bold text-slate-900">{isBlank ? '___/___/2026' : formatBrDate(r!.seizure_date)}</span>
            </div>
            <div className="col-span-2 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Hora</span>
              <span className="font-bold text-slate-900">{isBlank ? '___:___' : r!.seizure_time}</span>
            </div>
            <div className="col-span-4 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Local / Ambiente</span>
              <span className="font-bold uppercase text-slate-900">{isBlank ? '\u00A0' : r!.seizure_location}</span>
            </div>
            <div className="col-span-4 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Disciplina / Atividade</span>
              <span className="font-bold uppercase text-slate-900">{isBlank ? '\u00A0' : r!.seizure_subject_activity || '---'}</span>
            </div>
          </div>

          <div className="pb-0.5">
            <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Motivo / Síntese do Ocorrido</span>
            {isBlank ? (
              <div className="space-y-3 pt-2.5">
                <div className="border-b border-slate-400" />
                <div className="border-b border-slate-400" />
              </div>
            ) : (
              <div className="border-b border-slate-400 pb-0.5 font-medium text-slate-900">
                {r!.seizure_reason}
              </div>
            )}
          </div>

          <div className="pt-0.5 flex flex-wrap items-center gap-y-1 text-[8.8px]">
            <span className="font-black uppercase text-slate-800 mr-2">Regra de Devolução Definida:</span>
            <CheckBoxMark
              checked={!isBlank && r!.return_policy === 'ALUNO_FIM_TURNO'}
              label="Ao(à) próprio(a) estudante ao término do turno letivo"
            />
            <CheckBoxMark
              checked={!isBlank && r!.return_policy === 'RESPONSAVEL_LEGAL'}
              label="Exclusivamente ao(à) Pai/Mãe/Responsável Legal (c/ documento oficial)"
            />
          </div>
        </div>
      </div>

      {/* BLOCO 3 — VISTORIA E CONDIÇÕES FÍSICAS DO APARELHO */}
      <div className="term-section border border-slate-700 rounded mb-2 overflow-hidden">
        <div className="term-section-hdr bg-slate-200 px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-700">
          2. Identificação do Aparelho e Vistoria de Condições Físicas (Ato do Recolhimento)
        </div>
        <div className="term-body-pad p-2 space-y-1.5 text-[9.2px]">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-3 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Tipo de Aparelho</span>
              <span className="font-black uppercase text-slate-950">{isBlank ? '\u00A0' : r!.device_type}</span>
            </div>
            <div className="col-span-4 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Marca / Modelo</span>
              <span className="font-black uppercase text-slate-950">{isBlank ? '\u00A0' : r!.device_brand_model}</span>
            </div>
            <div className="col-span-2 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Cor</span>
              <span className="font-bold uppercase text-slate-900">{isBlank ? '\u00A0' : r!.device_color || '---'}</span>
            </div>
            <div className="col-span-3 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">IMEI / Nº Série / Envelope-Lacre</span>
              <span className="font-bold text-slate-900">
                {isBlank
                  ? '\u00A0'
                  : [r!.device_imei_serial, r!.seal_number ? `Lacre: ${r!.seal_number}` : ''].filter(Boolean).join(' • ') || 'Não informado'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1 pt-0.5 text-[8.7px]">
            <div className="flex flex-wrap items-center">
              <span className="font-black uppercase text-slate-800 mr-2 min-w-[110px]">Estado da Tela:</span>
              {SCREEN_CONDITION_OPTIONS.map(opt => (
                <CheckBoxMark key={opt.value} checked={!isBlank && r!.screen_condition === opt.value} label={opt.short} />
              ))}
            </div>

            <div className="flex flex-wrap items-center">
              <span className="font-black uppercase text-slate-800 mr-2 min-w-[110px]">Carcaça / Câmera:</span>
              {BODY_CONDITION_OPTIONS.map(opt => (
                <CheckBoxMark key={opt.value} checked={!isBlank && r!.body_condition === opt.value} label={opt.short} />
              ))}
            </div>

            <div className="flex flex-wrap items-center">
              <span className="font-black uppercase text-slate-800 mr-2 min-w-[110px]">Funcionamento:</span>
              {POWER_STATE_OPTIONS.map(opt => (
                <CheckBoxMark key={opt.value} checked={!isBlank && r!.power_state === opt.value} label={opt.short} />
              ))}
            </div>

            <div className="flex items-start">
              <span className="font-black uppercase text-slate-800 mr-2 min-w-[110px] shrink-0">Acessórios Junto:</span>
              <div className="flex-1 flex flex-wrap items-center gap-y-0.5">
                {ACCESSORY_OPTIONS.map(acc => (
                  <CheckBoxMark key={acc} checked={!isBlank && accessoriesList.includes(acc)} label={acc} />
                ))}
                <CheckBoxMark checked={hasNoAccessories} label="Nenhum acessório" />
              </div>
            </div>
          </div>

          <div className="pt-0.5">
            <span className="text-[7px] font-black uppercase text-slate-500 block leading-none mb-0.5">
              Descrição de Avarias Pré-existentes / Observações da Vistoria (Conferido na presença do estudante)
            </span>
            {isBlank ? (
              <div className="space-y-3 pt-2">
                <div className="border-b border-slate-400" />
                <div className="border-b border-slate-400" />
              </div>
            ) : (
              <div className="border border-slate-300 rounded px-2 py-1 min-h-[26px] bg-slate-50/70 text-[8.8px] font-medium text-slate-900">
                {r!.preexisting_damage_notes?.trim() || 'Nenhuma avaria adicional observada além das condições assinaladas acima.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BLOCO 4 — CIÊNCIA E ASSINATURAS DO RECOLHIMENTO */}
      <div className="term-section border border-slate-700 rounded mb-2 overflow-hidden">
        <div className="term-section-hdr bg-slate-200 px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-700 flex items-center justify-between">
          <span>3. Ciência e Assinaturas no Ato do Recolhimento</span>
          <span className="font-semibold normal-case text-[8px]">
            <CheckBoxMark
              checked={!isBlank && Boolean(r!.student_refused_signature)}
              label="Estudante recusou-se a assinar (suprido por testemunha)"
            />
          </span>
        </div>
        <div className="term-body-pad px-2.5 py-1.5">
          <p className="text-[8.3px] text-slate-700 leading-snug">
            Declaro estar ciente do recolhimento temporário do aparelho eletrônico acima descrito, conforme a legislação federal, estadual (MT) e regimento escolar vigentes, concordando com a descrição das condições físicas registradas nesta vistoria.
          </p>

          <div className="term-sig-row grid grid-cols-3 gap-5 pt-6 pb-1 text-center">
            <div>
              <div className="border-t border-slate-800 pt-1">
                <p className="text-[8px] font-black uppercase text-slate-900">
                  {isBlank ? 'Servidor(a) Responsável' : r!.seized_by_name}
                </p>
                <p className="text-[7px] font-bold uppercase text-slate-500">
                  {isBlank ? 'Nome / Cargo / Matrícula' : r!.seized_by_role || 'Servidor(a) Responsável pelo Recolhimento'}
                </p>
              </div>
            </div>
            <div>
              <div className="border-t border-slate-800 pt-1">
                <p className="text-[8px] font-black uppercase text-slate-900">
                  {isBlank
                    ? 'Assinatura do(a) Estudante'
                    : r!.student_refused_signature
                    ? 'RECUSOU-SE A ASSINAR'
                    : r!.student_name}
                </p>
                <p className="text-[7px] font-bold uppercase text-slate-500">Estudante (Ciência e Vistoria)</p>
              </div>
            </div>
            <div>
              <div className="border-t border-slate-800 pt-1">
                <p className="text-[8px] font-black uppercase text-slate-900">
                  {isBlank ? 'Testemunha (se necessário)' : r!.witness_name || 'Testemunha (opcional)'}
                </p>
                <p className="text-[7px] font-bold uppercase text-slate-500">Servidor(a) Testemunha</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIVISOR VISUAL PARA O RECIBO DE DEVOLUÇÃO */}
      <div className="term-return-divider border-t-2 border-dashed border-slate-400 my-2" />

      {/* BLOCO 5 — TERMO E RECIBO DE DEVOLUÇÃO */}
      <div className="term-section border border-slate-900 rounded overflow-hidden">
        <div className="term-return-hdr bg-slate-900 text-white px-2.5 py-1 text-[8.8px] font-black uppercase tracking-wider flex items-center justify-between">
          <span>4. Termo e Recibo de Devolução do Aparelho Eletrônico</span>
          <span className="text-[8px] font-bold">
            {isBlank
              ? 'PREENCHER NA RETIRADA'
              : isReturned
              ? `STATUS: DEVOLVIDO (${r!.returned_to_type === 'RESPONSAVEL' ? 'RESPONSÁVEL' : 'ESTUDANTE'})`
              : 'STATUS: AGUARDANDO DEVOLUÇÃO'}
          </span>
        </div>

        <div className="term-body-pad p-2 space-y-1.5 text-[9.2px]">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[8.8px]">
            <div className="flex flex-wrap items-center">
              <span className="font-black uppercase text-slate-800 mr-2">Aparelho Devolvido a:</span>
              <CheckBoxMark
                checked={Boolean(isReturned && r!.returned_to_type === 'RESPONSAVEL')}
                label="Pai / Mãe / Responsável Legal"
              />
              <CheckBoxMark
                checked={Boolean(isReturned && r!.returned_to_type === 'ALUNO')}
                label="Próprio(a) Estudante (autorizado pela Gestão/Monitoria)"
              />
            </div>
            <div className="font-bold text-slate-800 whitespace-nowrap">
              Data: <span className="font-black">{isReturned && r?.returned_date ? formatBrDate(r.returned_date) : '___/___/2026'}</span>
              {'  •  '}
              Hora: <span className="font-black">{isReturned && r?.returned_time ? r.returned_time : '___:___'}</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-5 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">
                Nome Completo de Quem Recebe (Responsável ou Estudante)
              </span>
              <span className="font-black uppercase text-slate-950">
                {isReturned ? r!.receiver_name || '\u00A0' : '\u00A0'}
              </span>
            </div>
            <div className="col-span-3 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Parentesco / Vínculo</span>
              <span className="font-bold uppercase text-slate-900">
                {isReturned ? r!.receiver_relationship || (r!.returned_to_type === 'ALUNO' ? 'Próprio Estudante' : '---') : '\u00A0'}
              </span>
            </div>
            <div className="col-span-2 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">RG ou CPF</span>
              <span className="font-bold text-slate-900">
                {isReturned ? r!.receiver_document || '---' : '\u00A0'}
              </span>
            </div>
            <div className="col-span-2 border-b border-slate-400 pb-0.5">
              <span className="text-[7px] font-black uppercase text-slate-500 block leading-none">Telefone</span>
              <span className="font-bold text-slate-900">
                {isReturned ? r!.receiver_phone || '---' : '\u00A0'}
              </span>
            </div>
          </div>

          <div className="text-[8.4px] space-y-1 pt-0.5">
            <div>
              <CheckBoxMark
                wrap
                checked={Boolean(isReturned && r!.return_condition_ok !== false)}
                label="CONFERE — Declaro receber o aparelho eletrônico e eventuais acessórios acima descritos nas mesmas condições físicas em que foram recolhidos, conferidos neste ato, dando plena quitação à unidade escolar."
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <CheckBoxMark checked={Boolean(isReturned && r!.return_condition_ok === false)} label="RESSALVA:" />
              <span className="flex-1 border-b border-slate-400 font-medium text-slate-900 min-h-[13px]">
                {isReturned && r?.return_notes ? r.return_notes : '\u00A0'}
              </span>
            </div>
          </div>

          <div className="term-sig-row grid grid-cols-2 gap-10 pt-6 pb-1 text-center">
            <div>
              <div className="border-t border-slate-800 pt-1">
                <p className="text-[8px] font-black uppercase text-slate-900">
                  {isReturned && r?.receiver_name ? r.receiver_name : 'Assinatura de Quem Recebe'}
                </p>
                <p className="text-[7px] font-bold uppercase text-slate-500">
                  {isReturned
                    ? r!.returned_to_type === 'RESPONSAVEL'
                      ? 'Pai / Mãe / Responsável Legal'
                      : 'Estudante (Recebimento Autorizado)'
                    : 'Responsável Legal ou Estudante'}
                </p>
              </div>
            </div>
            <div>
              <div className="border-t border-slate-800 pt-1">
                <p className="text-[8px] font-black uppercase text-slate-900">
                  {isReturned && r?.returned_by_name ? r.returned_by_name : 'Servidor(a) que Efetuou a Entrega'}
                </p>
                <p className="text-[7px] font-bold uppercase text-slate-500">
                  Coordenação Pedagógica / Monitoria Cívico-Militar — EECM André Antônio Maggi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RODAPÉ INSTITUCIONAL */}
      <div className="mt-1.5 pt-1 border-t border-slate-300 flex items-center justify-between text-[7.5px] font-bold uppercase text-slate-500">
        <span>Colíder-MT • EECM André Antônio Maggi • Controle de Recolhimento de Eletrônicos</span>
        <span>
          {isBlank ? 'Modelo Oficial em Branco — Lei 15.100/2025 & Lei MT 12.745/2024' : `Protocolo ${r!.protocol_number} • Via Única Escolar`}
        </span>
      </div>
    </div>
  );
};

export default ElectronicDeviceSeizureTerm;
