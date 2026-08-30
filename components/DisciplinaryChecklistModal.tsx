import React, { useState } from 'react';
import {
  ShieldAlert,
  RotateCcw,
  Scale,
  HeartHandshake,
  FileText,
  CheckSquare,
  Square,
  Printer,
  X,
  AlertTriangle,
  Users,
  Info,
  Clock,
  Send,
  Building2,
  BookOpen
} from 'lucide-react';
import { CivicoMilitarLogoBadge } from '../modules/CivicoMilitarModule';

export interface DisciplinaryChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'FLAGRANTE' | 'REINCIDENCIA' | 'GUIA';
  student?: {
    CodigoAluno?: string;
    studentId?: string;
    Nome?: string;
    studentName?: string;
    Turma?: string;
    className?: string;
    Turno?: string;
    shiftName?: string;
    score?: number;
    guardian_name?: string;
    NomeResponsavel?: string;
    contact_phone?: string;
    TelefoneContato?: string;
  } | null;
  occurrenceCategory?: string;
  occurrenceObservations?: string;
  onGeneratePoliceDoc?: (student: any, category: string, obs: string) => void;
  onGenerateConselhoDoc?: (student: any, category: string, obs: string) => void;
  onGenerateMPDoc?: (student: any, category: string, obs: string) => void;
  onOpenPsychosocial?: (student: any, initialReport: string) => void;
  onOpenMediation?: (student: any, initialReport: string) => void;
  onGenerateTACE?: (student: any, obligationDetails: string) => void;
  onGenerateFicha?: (student: any, category: string, measure: string) => void;
  onGenerateConselhoAta?: (student: any) => void;
  onOpenFICAI?: (student: any) => void;
}

export const DisciplinaryChecklistModal: React.FC<DisciplinaryChecklistModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'FLAGRANTE',
  student,
  occurrenceCategory = '',
  occurrenceObservations = '',
  onGeneratePoliceDoc,
  onGenerateConselhoDoc,
  onGenerateMPDoc,
  onOpenPsychosocial,
  onOpenMediation,
  onGenerateTACE,
  onGenerateFicha,
  onGenerateConselhoAta,
  onOpenFICAI
}) => {
  const [activeTab, setActiveTab] = useState<'FLAGRANTE' | 'REINCIDENCIA' | 'GUIA'>(initialMode);

  // States para checkboxes do Flagrante (9 etapas)
  const [flagranteChecks, setFlagranteChecks] = useState<{ [key: string]: boolean }>({
    step1_contencao: true,
    step2_guarda_material: false,
    step3_policia: false,
    step4_conselho_tutelar: false,
    step5_convocacao_pais: true,
    step6_psicossocial: false,
    step7_fato_observado: true,
    step8_oitiva_contraditorio: false,
    step9_ficha_disciplinar: false
  });

  // States para checkboxes da Reincidência (9 etapas)
  const [reincidenciaChecks, setReincidenciaChecks] = useState<{ [key: string]: boolean }>({
    step1_dossie: true,
    step2_escalacao: true,
    step3_estudo_psicossocial: false,
    step4_circulo_mediacao: false,
    step5_celebracao_tace: false,
    step6_copia_conselho_mp: false,
    step7_ficai_infrequencia: false,
    step8_certidao_recusa: false,
    step9_conselho_disciplinar: false
  });

  const toggleFlagranteCheck = (key: string) => {
    setFlagranteChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleReincidenciaCheck = (key: string) => {
    setReincidenciaChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  const studentName = student?.Nome || student?.studentName || 'Estudante Não Selecionado';
  const studentId = student?.CodigoAluno || student?.studentId || '---';
  const studentClass = student?.Turma || student?.className || 'Turma não informada';
  const studentGuardian = student?.NomeResponsavel || student?.guardian_name || 'Responsável Legal não cadastrado';
  const studentPhone = student?.TelefoneContato || student?.contact_phone || '---';

  const flagranteCompletedCount = Object.values(flagranteChecks).filter(Boolean).length;
  const flagranteProgress = Math.round((flagranteCompletedCount / 9) * 100);

  const reincidenciaCompletedCount = Object.values(reincidenciaChecks).filter(Boolean).length;
  const reincidenciaProgress = Math.round((reincidenciaCompletedCount / 9) * 100);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800 my-auto">
        
        {/* Header do Modal */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-amber-400 border border-amber-400/40 shadow-md">
              <Scale size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Assistente & Checklist Procedimental do Gestor
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-800">
                  EECM-MT & ECA
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Segurança Jurídica • Devido Processo Legal • Psicossocial • Mediação • Proteção Integral
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-all"
              title="Imprimir Guia de Conformidade Processual"
            >
              <Printer size={13} /> Imprimir A4
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Card do Aluno em Foco */}
        <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shrink-0">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Discente sob Apuração</span>
            <div className="text-sm font-black text-slate-900 uppercase">{studentName}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Matrícula: {studentId} • Turma: <span className="font-bold text-slate-700">{studentClass}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left md:text-right">
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Responsável Legal</span>
              <div className="text-[11px] font-bold text-slate-800 uppercase flex items-center gap-1">
                <Users size={12} className="text-blue-500" /> {studentGuardian}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Contato: {studentPhone}</div>
            </div>
          </div>
        </div>

        {/* Abas Superiores com Distinção Clara: FLAGRANTE vs REINCIDÊNCIA */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 shrink-0 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('FLAGRANTE')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              activeTab === 'FLAGRANTE'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldAlert size={16} />
            1. Protocolo de Flagrante (Fato Imediato / Gravíssimo)
            <span className="px-2 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-bold ml-1">
              {flagranteProgress}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REINCIDENCIA')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              activeTab === 'REINCIDENCIA'
                ? 'bg-rose-700 text-white shadow-md shadow-rose-700/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <RotateCcw size={16} />
            2. Protocolo de Reincidência (Processo Contínuo / TACE)
            <span className="px-2 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-bold ml-1">
              {reincidenciaProgress}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GUIA')}
            className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'GUIA'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen size={15} />
            Matriz Legal
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
          
          {/* ======================================================== */}
          {/* ABA 1: PROTOCOLO DE FLAGRANTE (FALTA GRAVE IMEDIATA) */}
          {/* ======================================================== */}
          {activeTab === 'FLAGRANTE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-950 text-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldAlert size={24} className="text-red-600 shrink-0" />
                  <div>
                    <span className="font-black uppercase tracking-wide block">Definição Operacional de Flagrante</span>
                    <p className="text-[11px] text-red-800 font-medium mt-0.5 leading-relaxed">
                      O discente foi surpreendido no ato ou logo após cometer infração penal, ato infracional ou falta gravíssima (drogas, arma branca/faca, agressão física violenta, dano doloso ou ameaça grave).
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-black uppercase text-red-700 block">Tempo de Ação</span>
                  <span className="text-xs font-black text-red-900 bg-red-200/70 px-2.5 py-1 rounded-lg inline-block">0 a 24h</span>
                </div>
              </div>

              {/* Lista de Passos do Flagrante */}
              <div className="space-y-2.5">
                
                {/* Passo 1 */}
                <div className={`p-4 rounded-2xl border transition-all ${flagranteChecks.step1_contencao ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleFlagranteCheck('step1_contencao')} className="mt-0.5 text-blue-600">
                        {flagranteChecks.step1_contencao ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Passo 1: Contenção Segura & Preservação da Dignidade
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Cessar o fato imediatamente. Conduzir o aluno a um espaço reservado e seguro. <strong>Vedado o uso de algemas, agressões verbais ou qualquer exposição vexatória perante a comunidade escolar</strong> (Art. 18 do ECA e Art. 27 do Regulamento EECM).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className={`p-4 rounded-2xl border transition-all ${flagranteChecks.step2_guarda_material ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleFlagranteCheck('step2_guarda_material')} className="mt-0.5 text-blue-600">
                        {flagranteChecks.step2_guarda_material ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Passo 2: Guarda Cautelar de Objetos / Material Ilícito
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Se houver substâncias entorpecentes, facas, canivetes, eletrônicos ou objetos danificados, acondicionar em envelope lacrado com presença de 2 servidores como testemunhas para entrega à autoridade policial (Art. 38 § 2º EECM).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className={`p-4 rounded-2xl border transition-all ${flagranteChecks.step3_policia ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleFlagranteCheck('step3_policia')} className="mt-0.5 text-blue-600">
                        {flagranteChecks.step3_policia ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Passo 3: Acionamento Imediato da Polícia Militar / Civil (B.O. - Art. 29 EECM)
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Nos casos de drogas, armas, agressão física violenta com lesão ou dano qualificado ao patrimônio, lavrar ofício requisitório de Boletim de Ocorrência formal.
                        </p>
                      </div>
                    </div>
                    {onGeneratePoliceDoc && (
                      <button
                        type="button"
                        onClick={() => onGeneratePoliceDoc(student, occurrenceCategory, occurrenceObservations)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 transition-all shadow-xs"
                      >
                        <FileText size={12} /> Gerar Ofício B.O.
                      </button>
                    )}
                  </div>
                </div>

                {/* Passo 4 */}
                <div className={`p-4 rounded-2xl border transition-all ${flagranteChecks.step4_conselho_tutelar ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleFlagranteCheck('step4_conselho_tutelar')} className="mt-0.5 text-blue-600">
                        {flagranteChecks.step4_conselho_tutelar ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Passo 4: Comunicação Formal ao Conselho Tutelar (Arts. 22 e 29 EECM c/c ECA)
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Remessa de ofício ao Conselho Tutelar para garantia dos direitos protetivos do adolescente e acompanhamento da família (Art. 136 do ECA).
                        </p>
                      </div>
                    </div>
                    {onGenerateConselhoDoc && (
                      <button
                        type="button"
                        onClick={() => onGenerateConselhoDoc(student, occurrenceCategory, occurrenceObservations)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 transition-all shadow-xs"
                      >
                        <FileText size={12} /> Ofício Tutelar
                      </button>
                    )}
                  </div>
                </div>

                {/* Passo 5 */}
                <div className={`p-4 rounded-2xl border transition-all ${flagranteChecks.step5_convocacao_pais ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleFlagranteCheck('step5_convocacao_pais')} className="mt-0.5 text-blue-600">
                        {flagranteChecks.step5_convocacao_pais ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Passo 5: Convocação Presencial Urgente da Família / Responsável
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Contato telefônico imediato e registro em ata da convocação presencial com a Gestão Educacional-Militar e Direção Escolar (Art. 16 § 1º e Art. 24 EECM).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 6: Acolhimento Psicossocial de Emergência */}
                <div className={`p-4 rounded-2xl border transition-all ${flagranteChecks.step6_psicossocial ? 'bg-emerald-50/40 border-emerald-200' : 'bg-blue-50/60 border-blue-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleFlagranteCheck('step6_psicossocial')} className="mt-0.5 text-blue-600">
                        {flagranteChecks.step6_psicossocial ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <HeartHandshake size={14} className="text-blue-600" />
                          <span className="text-xs font-black text-blue-950 uppercase">
                            Passo 6: Acolhimento e Escuta Psicossocial de Emergência (Lei 13.935/19)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Atendimento imediato pelo Psicólogo ou Assistente Social escolar para estabilização da crise, acolhimento humanizado e triagem de vulnerabilidades (violência doméstica, ideação suicida, dependência química).
                        </p>
                      </div>
                    </div>
                    {onOpenPsychosocial && (
                      <button
                        type="button"
                        onClick={() => onOpenPsychosocial(student, occurrenceObservations || 'Encaminhamento urgente decorrente de flagrante em falta grave.')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 transition-all shadow-xs"
                      >
                        <HeartHandshake size={12} /> Encaminhar Psicossocial
                      </button>
                    )}
                  </div>
                </div>

                {/* Passo 7: Auto de Constatação e Fato Observado */}
                <div className={`p-4 rounded-2xl border transition-all ${flagranteChecks.step7_fato_observado ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleFlagranteCheck('step7_fato_observado')} className="mt-0.5 text-blue-600">
                        {flagranteChecks.step7_fato_observado ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Passo 7: Lavratura do Relatório de Fato Observado (Art. 36 e 38 EECM)
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Registro detalhado dos fatos contendo: data, hora, local exato, servidores que presenciaram, testemunhas e declaração preliminar dos fatos.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 8: Oitiva e Contraditório */}
                <div className={`p-4 rounded-2xl border transition-all ${flagranteChecks.step8_oitiva_contraditorio ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleFlagranteCheck('step8_oitiva_contraditorio')} className="mt-0.5 text-blue-600">
                        {flagranteChecks.step8_oitiva_contraditorio ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Passo 8: Oitiva do Discente Acompanhado dos Responsáveis (Ampla Defesa)
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Garantia do contraditório (Art. 5º, LV da CF/88). Ouvir as razões do aluno, verificar eventuais causas de justificação (Art. 33), atenuantes (Art. 34) e agravantes (Art. 35).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 9: Aplicação da Medida Disciplinar */}
                <div className={`p-4 rounded-2xl border transition-all ${flagranteChecks.step9_ficha_disciplinar ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleFlagranteCheck('step9_ficha_disciplinar')} className="mt-0.5 text-blue-600">
                        {flagranteChecks.step9_ficha_disciplinar ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Passo 9: Lavratura da Ficha de Medida Disciplinar (Art. 16 / Anexo II)
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Aplicação da Suspensão de Sala de Aula (de 1 a 3 dias) acompanhada do cronograma de atividades pedagógicas e Estudo Orientado na unidade escolar. Cientificar sobre prazo de 2 dias úteis para pedido de reconsideração (Art. 44).
                        </p>
                      </div>
                    </div>
                    {onGenerateFicha && (
                      <button
                        type="button"
                        onClick={() => onGenerateFicha(student, occurrenceCategory, 'Suspensão de Sala de Aula')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 transition-all shadow-xs"
                      >
                        <FileText size={12} /> Gerar Ficha
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 2: PROTOCOLO DE REINCIDÊNCIA (PROCESSO CONTINUADO) */}
          {/* ======================================================== */}
          {activeTab === 'REINCIDENCIA' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <RotateCcw size={24} className="text-rose-700 shrink-0" />
                  <div>
                    <span className="font-black uppercase tracking-wide block">Definição de Reincidência Disciplinar</span>
                    <p className="text-[11px] text-rose-800 font-medium mt-0.5 leading-relaxed">
                      O discente apresenta padrão reiterado de faltas ao longo do ano letivo (mesma classificação ou acúmulo de faltas leves/médias), com decréscimo da nota de atitude para Comportamento Regular, Insuficiente ou Incompatível.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-black uppercase text-rose-700 block">Tempo de Ação</span>
                  <span className="text-xs font-black text-rose-900 bg-rose-200/70 px-2.5 py-1 rounded-lg inline-block">Processual</span>
                </div>
              </div>

              {/* Lista de Passos da Reincidência */}
              <div className="space-y-2.5">
                
                {/* Passo 1 */}
                <div className={`p-4 rounded-2xl border transition-all ${reincidenciaChecks.step1_dossie ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleReincidenciaCheck('step1_dossie')} className="mt-0.5 text-blue-600">
                        {reincidenciaChecks.step1_dossie ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Passo 1: Diagnóstico Cronológico no Radar de Reincidência
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Conferir o histórico do discente, quantitativo total de faltas e categorização das infrações recorrentes. Verificar aplicação da circunstância agravante do <strong>Art. 35, Inciso III</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className={`p-4 rounded-2xl border transition-all ${reincidenciaChecks.step2_escalacao ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleReincidenciaCheck('step2_escalacao')} className="mt-0.5 text-blue-600">
                        {reincidenciaChecks.step2_escalacao ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Passo 2: Escalação Proporcional da Penalidade (Arts. 15, 16 e 18 §2º)
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Elevação regulamentar: faltas leves reiteradas ➔ Advertência Escrita; faltas médias reiteradas ➔ Suspensão; ações sociais de reparação ampliadas de até 5 para até 10 dias letivos.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 3: Estudo de Caso Psicossocial */}
                <div className={`p-4 rounded-2xl border transition-all ${reincidenciaChecks.step3_estudo_psicossocial ? 'bg-emerald-50/40 border-emerald-200' : 'bg-blue-50/60 border-blue-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleReincidenciaCheck('step3_estudo_psicossocial')} className="mt-0.5 text-blue-600">
                        {reincidenciaChecks.step3_estudo_psicossocial ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <HeartHandshake size={14} className="text-blue-600" />
                          <span className="text-xs font-black text-blue-950 uppercase">
                            Passo 3: Estudo de Caso Multidisciplinar Psicossocial (Lei 13.935/19)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Acompanhamento contínuo da Psicologia e Assistência Social para diagnosticar as causas de fundo da indisciplina recorrente (dificuldades cognitivas, problemas emocionais, negligência familiar, bullying).
                        </p>
                      </div>
                    </div>
                    {onOpenPsychosocial && (
                      <button
                        type="button"
                        onClick={() => onOpenPsychosocial(student, 'Estudo de caso e acompanhamento psicossocial por reincidência disciplinar continuada.')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 transition-all shadow-xs"
                      >
                        <HeartHandshake size={12} /> Acompanhar Psicossocial
                      </button>
                    )}
                  </div>
                </div>

                {/* Passo 4: Mediação Escolar / Círculo Restaurativo */}
                <div className={`p-4 rounded-2xl border transition-all ${reincidenciaChecks.step4_circulo_mediacao ? 'bg-emerald-50/40 border-emerald-200' : 'bg-amber-50/60 border-amber-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleReincidenciaCheck('step4_circulo_mediacao')} className="mt-0.5 text-blue-600">
                        {reincidenciaChecks.step4_circulo_mediacao ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Scale size={14} className="text-amber-700" />
                          <span className="text-xs font-black text-amber-950 uppercase">
                            Passo 4: Sessão de Mediação Escolar / Círculo Restaurativo Familiar
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Realização de sessão de conciliação e práticas restaurativas (Art. 22 § 1º EECM) reunindo aluno, pais, coordenador e monitor para construção coletiva do compromisso de superação da indisciplina.
                        </p>
                      </div>
                    </div>
                    {onOpenMediation && (
                      <button
                        type="button"
                        onClick={() => onOpenMediation(student, 'Mediação e círculo restaurativo familiar para alinhamento de conduta disciplinar.')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 transition-all shadow-xs"
                      >
                        <Scale size={12} /> Abrir Mediação
                      </button>
                    )}
                  </div>
                </div>

                {/* Passo 5: Celebração do TACE */}
                <div className={`p-4 rounded-2xl border transition-all ${reincidenciaChecks.step5_celebracao_tace ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleReincidenciaCheck('step5_celebracao_tace')} className="mt-0.5 text-blue-600">
                        {reincidenciaChecks.step5_celebracao_tace ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Passo 5: Celebração Formal do TACE (Art. 22 / Anexo III)
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Assinatura voluntária do Termo de Ajustamento de Conduta Escolar pela Gestão Militar, Direção, Responsáveis e 2 Testemunhas, pactuando ações educativas e metas de comportamento.
                        </p>
                      </div>
                    </div>
                    {onGenerateTACE && (
                      <button
                        type="button"
                        onClick={() => onGenerateTACE(student, 'Compromisso de adequação disciplinar, cumprimento das rotinas cívico-militares e ações educativas.')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 transition-all shadow-xs"
                      >
                        <FileText size={12} /> Gerar TACE
                      </button>
                    )}
                  </div>
                </div>

                {/* Passo 6: Cópia ao Conselho Tutelar e MP */}
                <div className={`p-4 rounded-2xl border transition-all ${reincidenciaChecks.step6_copia_conselho_mp ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleReincidenciaCheck('step6_copia_conselho_mp')} className="mt-0.5 text-blue-600">
                        {reincidenciaChecks.step6_copia_conselho_mp ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Passo 6: Encaminhamento Obrigatório de Cópia ao Conselho Tutelar (Art. 22 § 4º)
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Remessa de 1 via do TACE assinado ao Conselho Tutelar para conhecimento, fiscalização e acompanhamento tutelar.
                        </p>
                      </div>
                    </div>
                    {onGenerateConselhoDoc && (
                      <button
                        type="button"
                        onClick={() => onGenerateConselhoDoc(student, 'Encaminhamento formal de Termo de Ajustamento de Conduta Escolar (Art. 22 § 4º EECM).', '')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 transition-all shadow-xs"
                      >
                        <Send size={12} /> Ofício Tutelar
                      </button>
                    )}
                  </div>
                </div>

                {/* Passo 7: Verificação de Infrequência Escolar & Emissão da FICAI (Art. 56, II do ECA) */}
                <div className={`p-4 rounded-2xl border transition-all ${reincidenciaChecks.step7_ficai_infrequencia ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/60 border-rose-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleReincidenciaCheck('step7_ficai_infrequencia')} className="mt-0.5 text-blue-600">
                        {reincidenciaChecks.step7_ficai_infrequencia ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <FileText size={14} className="text-rose-600" />
                          <span className="text-xs font-black text-rose-950 uppercase">
                            Passo 7: Infrequência Escolar & Expedição de FICAI (Art. 56, II do ECA)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Se a reincidência for acompanhada de faltas escolares não justificadas ou evasão (acima de 10% a 30% do total de aulas), emitir a Ficha de Comunicação de Aluno Infrequente (FICAI Online) para notificação do Conselho Tutelar e Promotoria.
                        </p>
                      </div>
                    </div>
                    {onOpenFICAI && (
                      <button
                        type="button"
                        onClick={() => onOpenFICAI(student)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 transition-all shadow-xs"
                      >
                        <FileText size={12} /> Emitir FICAI (ECA)
                      </button>
                    )}
                  </div>
                </div>

                {/* Passo 8: Em Caso de Recusa ou Ruptura */}
                <div className={`p-4 rounded-2xl border transition-all ${reincidenciaChecks.step8_certidao_recusa ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleReincidenciaCheck('step8_certidao_recusa')} className="mt-0.5 text-blue-600">
                        {reincidenciaChecks.step8_certidao_recusa ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Passo 8: Expediente à Promotoria da Infância / MP (Art. 26 e Art. 22 § 6º)
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Se houver recusa dos pais em assinar o TACE ou descumprimento injustificado das ações acordadas: lavrar certidão de recusa e remeter expediente à Promotoria de Justiça.
                        </p>
                      </div>
                    </div>
                    {onGenerateMPDoc && (
                      <button
                        type="button"
                        onClick={() => onGenerateMPDoc(student, 'Recusa de responsáveis na execução de medidas pedagógicas / quebra de TACE (Art. 26 EECM).', '')}
                        className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 transition-all shadow-xs"
                      >
                        <FileText size={12} /> Expediente MP
                      </button>
                    )}
                  </div>
                </div>

                {/* Passo 9: Instauração do Conselho Disciplinar */}
                <div className={`p-4 rounded-2xl border transition-all ${reincidenciaChecks.step9_conselho_disciplinar ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => toggleReincidenciaCheck('step9_conselho_disciplinar')} className="mt-0.5 text-blue-600">
                        {reincidenciaChecks.step9_conselho_disciplinar ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-slate-400" />}
                      </button>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Passo 9: Instauração do Conselho de Ensino Disciplinar (Arts. 30 e 54 a 61)
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Se o aluno atingir o Comportamento Incompatível (&lt; 2,0): instaurar colegiado disciplinar para deliberação de Transferência Educativa, lavrando a respectiva Ata Oficial do Conselho.
                        </p>
                      </div>
                    </div>
                    {onGenerateConselhoAta && (
                      <button
                        type="button"
                        onClick={() => onGenerateConselhoAta(student)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 transition-all shadow-xs"
                      >
                        <FileText size={12} /> Ata do Conselho
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 3: MATRIZ DE DISTINÇÃO LEGAL (GUIA COMPARATIVO) */}
          {/* ======================================================== */}
          {activeTab === 'GUIA' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
                  <Scale size={16} className="text-blue-600" />
                  Quadro Comparativo de Competências e Prazos (EECM-MT & Legislação)
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase font-black text-[9px] pb-2">
                        <th className="pb-2">Critério</th>
                        <th className="pb-2 text-red-700">🚨 Casos de Flagrante</th>
                        <th className="pb-2 text-rose-700">🔄 Casos de Reincidência</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2.5 font-bold text-slate-900">Momento da Ocorrência</td>
                        <td className="py-2.5 text-red-900">Surpreendido no ato ou logo após</td>
                        <td className="py-2.5 text-rose-900">Acúmulo reiterado ao longo do tempo</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-900">Tempo de Resposta</td>
                        <td className="py-2.5 text-slate-700">Imediato (0 a 24 horas)</td>
                        <td className="py-2.5 text-slate-700">Processual (Acompanhamento contínuo)</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-900">Polícia / B.O. (Art. 29)</td>
                        <td className="py-2.5 text-red-700 font-bold">Obrigatório nos atos infracionais/crimes</td>
                        <td className="py-2.5 text-slate-600">Apenas se a reincidência for criminosa</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-900">Atuação Psicossocial (Lei 13.935)</td>
                        <td className="py-2.5 text-slate-700">Acolhimento de emergência / contenção de crise</td>
                        <td className="py-2.5 text-blue-700 font-bold">Estudo de caso sociofamiliar e causas de fundo</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-900">Mediação Escolar (Art. 22 § 1º)</td>
                        <td className="py-2.5 text-slate-700">Pactuação de cessação de conflito imediato</td>
                        <td className="py-2.5 text-amber-700 font-bold">Círculo restaurativo e compromisso familiar</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-900">Instrumento Principal</td>
                        <td className="py-2.5 text-slate-700">Ofício B.O. + Ficha Disciplinar (Suspensão)</td>
                        <td className="py-2.5 text-rose-800 font-bold">TACE (Anexo III) + Conselho Disciplinar</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-slate-900">Conselho Tutelar / MP</td>
                        <td className="py-2.5 text-slate-700">Notificação imediata para garantia de direitos</td>
                        <td className="py-2.5 text-slate-700">Cópia do TACE / Certidão de recusa (Art. 26)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer do Modal */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 text-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase">
            Escola Estadual Cívico-Militar André Maggi • SEDUC-MT
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 hover:bg-black text-white transition-all shadow-md"
            >
              Concluir & Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
