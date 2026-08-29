import React, { useRef } from 'react';
import {
  X,
  Printer,
  FileText,
  Clock,
  UserCheck,
  CheckCircle2,
  HeartHandshake,
  Calendar,
  User,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { MediationCase } from '../types';

interface MediationAttendanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediationCase: MediationCase;
  userName?: string;
}

const formatLocalDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const cleanStr = dateStr.split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d}/${m}/${y}`;
    }
  }
  return dateStr;
};

export const MediationAttendanceReportModal: React.FC<MediationAttendanceReportModalProps> = ({
  isOpen,
  onClose,
  mediationCase,
  userName
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* CONTAINER MODAL DE PRÉ-VISUALIZAÇÃO */}
      <div className="bg-white w-full max-w-4xl h-[90vh] max-h-[850px] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Relatório Oficial de Atendimento</h3>
              <p className="text-xs text-slate-400">Pré-visualização para impressão e arquivamento</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md active:scale-95"
            >
              <Printer size={15} />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ÁREA DE PRÉ-VISUALIZAÇÃO COM ROLAGEM */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100/70 custom-scrollbar flex justify-center">
          <div 
            ref={printRef}
            className="w-full max-w-[750px] bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200 text-slate-800 space-y-6 text-xs leading-relaxed"
          >
            
            {/* CABEÇALHO OFICIAL SEDUC */}
            <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1">
              <h1 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider">
                GOVERNO DO ESTADO DE MATO GROSSO
              </h1>
              <h2 className="text-[11px] font-bold uppercase text-slate-700">
                SECRETARIA DE ESTADO DE EDUCAÇÃO - SEDUC/MT
              </h2>
              <h3 className="text-[11px] font-semibold uppercase text-slate-600">
                DIRETORIA REGIONAL DE EDUCAÇÃO - DRE SINOP
              </h3>
              <h4 className="text-[11px] font-bold uppercase text-slate-900">
                ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI - COLÍDER/MT
              </h4>
              <div className="pt-2">
                <span className="inline-block px-4 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded-md">
                  RELATÓRIO OFICIAL DE ATENDIMENTO E MEDIAÇÃO ESCOLAR
                </span>
              </div>
            </div>

            {/* TABELA DE IDENTIFICAÇÃO DO CASO */}
            <div className="border border-slate-300 rounded-xl overflow-hidden divide-y divide-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-50 p-2.5 gap-2 text-[11px]">
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[9px] block">Estudante</span>
                  <span className="font-extrabold text-slate-900">{mediationCase.studentName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[9px] block">Turma</span>
                  <span className="font-bold text-slate-800">{mediationCase.className || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[9px] block">Status Atual</span>
                  <span className="font-bold text-slate-800 uppercase">{mediationCase.status || 'EM ANDAMENTO'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[9px] block">Data de Abertura</span>
                  <span className="font-bold text-slate-800">{formatLocalDate(mediationCase.openedAt)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 bg-white p-2.5 gap-2 text-[11px]">
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[9px] block">Tipo de Caso</span>
                  <span className="font-bold text-slate-800 uppercase">{mediationCase.type || 'GERAL'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[9px] block">Nível de Risco</span>
                  <span className="font-bold text-slate-800 uppercase">{mediationCase.severity || 'MÉDIA'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[9px] block">Mediador Responsável</span>
                  <span className="font-bold text-slate-800">{userName ? `${userName} (Mediador)` : 'Mediação Escolar'}</span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 1: RELATO ORIGINAL DO CASO */}
            <div className="space-y-1.5">
              <h5 className="text-[11px] font-black uppercase text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <FileText size={13} className="text-indigo-600" />
                1. Relato Original da Ocorrência / Demanda
              </h5>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed whitespace-pre-wrap">
                {mediationCase.description || 'Nenhum relato inicial registrado.'}
              </div>
            </div>

            {/* SEÇÃO 2: DIÁRIO DE ATENDIMENTOS E EVOLUÇÃO */}
            <div className="space-y-2">
              <h5 className="text-[11px] font-black uppercase text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-indigo-600" />
                2. Diário de Atendimentos & Ações Realizadas
              </h5>

              {mediationCase.logs && mediationCase.logs.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                  {mediationCase.logs.map((log, idx) => (
                    <div key={idx} className="p-3 bg-white space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                          {log.professional || 'Mediador Escolar'}
                        </span>
                        <span className="font-semibold text-slate-400">
                          Data: {formatLocalDate(log.date)}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap pl-1">
                        {log.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 italic text-center">
                  Nenhum atendimento adicional registrado no diário até o momento.
                </div>
              )}
            </div>

            {/* SEÇÃO 3: ROTEIRO & ETAPAS CONCLUÍDAS */}
            <div className="space-y-2">
              <h5 className="text-[11px] font-black uppercase text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                3. Roteiro Restaurativo & Etapas do Processo
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mediationCase.steps?.map((step, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                      step.completed 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                        : 'bg-slate-50/50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        step.completed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {step.completed ? '✓' : idx + 1}
                      </div>
                      <span className="font-semibold truncate text-[10px]">{step.label}</span>
                    </div>
                    {step.date && (
                      <span className="text-[9px] font-bold text-emerald-700 shrink-0">
                        {formatLocalDate(step.date)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SEÇÃO 4: ACORDO RESTAURATIVO / PARECER FINAL */}
            <div className="space-y-1.5">
              <h5 className="text-[11px] font-black uppercase text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-600" />
                4. Acordo Restaurativo Final & Devolutiva Oficial
              </h5>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed whitespace-pre-wrap">
                {mediationCase.feedback || 'Acordo em fase de elaboração ou acompanhamento.'}
              </div>
            </div>

            {/* SEÇÃO 5: ASSINATURAS */}
            <div className="pt-8 space-y-8">
              <p className="text-right text-[10px] text-slate-500">
                Colíder/MT, {todayStr}.
              </p>

              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="border-t border-slate-900 pt-1.5 text-center">
                  <p className="font-bold text-[10px] text-slate-900">{userName || 'Professor(a) Mediador(a)'}</p>
                  <p className="text-[9px] text-slate-500">Mediação Escolar - SEDUC/MT</p>
                </div>

                <div className="border-t border-slate-900 pt-1.5 text-center">
                  <p className="font-bold text-[10px] text-slate-900">Coordenação Pedagógica / Direção</p>
                  <p className="text-[9px] text-slate-500">E.E. André Antônio Maggi</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="border-t border-slate-900 pt-1.5 text-center">
                  <p className="font-bold text-[10px] text-slate-900">{mediationCase.studentName}</p>
                  <p className="text-[9px] text-slate-500">Estudante Atendido(a)</p>
                </div>

                <div className="border-t border-slate-900 pt-1.5 text-center">
                  <p className="font-bold text-[10px] text-slate-900">Responsável Legal</p>
                  <p className="text-[9px] text-slate-500">Assinatura do Pai/Mãe/Responsável</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
          >
            Fechar Visualização
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95"
          >
            <Printer size={16} />
            <span>Imprimir Relatório</span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default MediationAttendanceReportModal;
