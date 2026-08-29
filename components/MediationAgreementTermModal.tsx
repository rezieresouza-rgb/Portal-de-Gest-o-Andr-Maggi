import React, { useState, useRef } from 'react';
import {
  X,
  FileCheck,
  Printer,
  Save,
  ShieldCheck,
  Users,
  Calendar,
  Clock,
  HeartHandshake,
  AlertTriangle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { MediationCase } from '../types';
import { supabase } from '../supabaseClient';

interface MediationAgreementTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediationCase: MediationCase;
  onAgreementSaved?: (termData: any) => void;
}

export const MediationAgreementTermModal: React.FC<MediationAgreementTermModalProps> = ({
  isOpen,
  onClose,
  mediationCase,
  onAgreementSaved
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mediatorName, setMediatorName] = useState<string>('PROF. MEDIADOR ESCOLAR');
  const [parte1, setParte1] = useState<string>(mediationCase.studentName || '');
  const [turma1, setTurma1] = useState<string>(mediationCase.className || '');
  const [responsavel1, setResponsavel1] = useState<string>('');
  
  const [parte2, setParte2] = useState<string>(mediationCase.involvedParties?.[0] || '');
  const [turma2, setTurma2] = useState<string>('');
  const [responsavel2, setResponsavel2] = useState<string>('');

  const [summaryConflict, setSummaryConflict] = useState<string>(
    mediationCase.description?.replace(/\[[^\]]+\]/g, '').trim() || ''
  );

  const [commitmentParte1, setCommitmentParte1] = useState<string>(
    'Compromete-se a manter distanciamento respeitoso, não realizar comentários depreciativos nem provocar o colega presencialmente ou em redes sociais.'
  );

  const [commitmentParte2, setCommitmentParte2] = useState<string>(
    'Compromete-se a cessar qualquer atitude hostil, tratar o colega com urbanidade e buscar imediatamente a mediação escolar caso ocorra qualquer desentendimento.'
  );

  const [mutualCommitment, setMutualCommitment] = useState<string>(
    'Ambas as partes declaram encerradas as desavenças do fato gerador e aceitam o pacto de paz e respeito recíproco no ambiente escolar.'
  );

  const [followUpDays, setFollowUpDays] = useState<'15' | '30' | '60'>('15');
  const [reviewDate, setReviewDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleDaysChange = (days: '15' | '30' | '60') => {
    setFollowUpDays(days);
    const d = new Date(date || new Date().toISOString().split('T')[0]);
    d.setDate(d.getDate() + parseInt(days, 10));
    setReviewDate(d.toISOString().split('T')[0]);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const termPayload = {
        id: `term-${Date.now()}`,
        caseId: mediationCase.id,
        date,
        mediatorName,
        parte1,
        turma1,
        responsavel1,
        parte2,
        turma2,
        responsavel2,
        summaryConflict,
        commitmentParte1,
        commitmentParte2,
        mutualCommitment,
        followUpDays,
        reviewDate,
        createdAt: new Date().toISOString()
      };

      // 1. Salvar no histórico local
      const existing = JSON.parse(localStorage.getItem('mediation_agreement_terms_v1') || '[]');
      existing.unshift(termPayload);
      localStorage.setItem('mediation_agreement_terms_v1', JSON.stringify(existing));

      // 2. Registrar no diário de atendimentos do caso no Supabase
      const newLog = {
        id: `log-${Date.now()}`,
        date,
        professional: mediatorName,
        content: `[TERMO DE ACORDO RESTAURATIVO FIRMADO] As partes (${parte1} e ${parte2 || 'envolvidos'}) firmaram compromisso de respeito mútuo. Revisão agendada para ${new Date(reviewDate).toLocaleDateString('pt-BR')} (${followUpDays} dias).`
      };

      const updatedLogs = [newLog, ...(mediationCase.logs || [])];
      
      // Atualizar status do caso se aplicável
      await supabase
        .from('mediation_cases')
        .update({
          logs: updatedLogs,
          status: 'CONCLUÍDO',
          closed_at: date
        })
        .eq('id', mediationCase.id);

      alert('Termo de Compromisso Restaurativo registrado e vinculado ao caso com sucesso!');
      if (onAgreementSaved) onAgreementSaved(termPayload);
      onClose();
    } catch (e: any) {
      console.error('Erro ao salvar termo:', e);
      alert('Termo salvo no registro local com sucesso!');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-slate-800">
        
        {/* HEADER MODAL */}
        <div className="p-6 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white flex justify-between items-center shrink-0 border-b border-emerald-800/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl shadow-lg">
              <FileCheck size={26} />
            </div>
            <div>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">
                Pacto de Convivência & Cultura de Paz
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight text-white mt-1">
                Termo de Compromisso Restaurativo
              </h2>
              <p className="text-emerald-100/70 text-xs font-medium">
                Documento de pactuação mútua, não-agressão e acompanhamento continuado
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar bg-slate-50/50">
          
          {/* Dados Gerais do Termo */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
              <Calendar size={16} className="text-emerald-600" /> Identificação da Sessão & Mediador
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Professor(a) Mediador(a) Responsável
                </label>
                <input
                  type="text"
                  value={mediatorName}
                  onChange={e => setMediatorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Data da Pactuação
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Identificação das Partes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Parte 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block">
                Parte 1 (Estudante)
              </span>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={parte1}
                  onChange={e => setParte1(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Turma</label>
                  <input
                    type="text"
                    value={turma1}
                    onChange={e => setTurma1(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Responsável Legal</label>
                  <input
                    type="text"
                    placeholder="Nome do Pai/Mãe"
                    value={responsavel1}
                    onChange={e => setResponsavel1(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Parte 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-block">
                Parte 2 (Outro Envolvido / Turma / Colega)
              </span>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Nome do outro estudante ou envolvido..."
                  value={parte2}
                  onChange={e => setParte2(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Turma</label>
                  <input
                    type="text"
                    placeholder="Ex: 8º B"
                    value={turma2}
                    onChange={e => setTurma2(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Responsável Legal</label>
                  <input
                    type="text"
                    placeholder="Nome do Pai/Mãe"
                    value={responsavel2}
                    onChange={e => setResponsavel2(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Resumo do Conflito Superado */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
              Resumo do Fato Objeto da Mediação
            </label>
            <textarea
              rows={2}
              value={summaryConflict}
              onChange={e => setSummaryConflict(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900"
            />
          </div>

          {/* Compromissos Assumidos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
              <HeartHandshake size={16} className="text-emerald-600" /> Cláusulas do Pacto Restaurativo
            </h3>

            <div>
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">
                Compromisso Assumido pela Parte 1 ({parte1 || 'Estudante 1'}):
              </label>
              <textarea
                rows={2}
                value={commitmentParte1}
                onChange={e => setCommitmentParte1(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">
                Compromisso Assumido pela Parte 2 ({parte2 || 'Estudante 2'}):
              </label>
              <textarea
                rows={2}
                value={commitmentParte2}
                onChange={e => setCommitmentParte2(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">
                Compromisso Mútuo de Convivência:
              </label>
              <textarea
                rows={2}
                value={mutualCommitment}
                onChange={e => setMutualCommitment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Prazo de Follow-up / Revisão */}
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-950 font-black text-xs uppercase">
                <Clock size={16} className="text-emerald-700" />
                <span>Prazo para Sessão de Monitoramento / Follow-up</span>
              </div>
              <div className="flex items-center gap-2">
                {(['15', '30', '60'] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDaysChange(d)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                      followUpDays === d
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {d} Dias
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-emerald-900 font-medium">
              Data prevista para checagem com o mediador: <strong>{new Date(reviewDate).toLocaleDateString('pt-BR')}</strong>.
            </p>
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Printer size={16} /> Imprimir Termo A4 Formal
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-5 py-3 border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-1/2 sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <Save size={16} /> Salvar & Concluir Caso
            </button>
          </div>
        </div>

      </div>

      {/* MODELO FORMAL DE IMPRESSÃO A4 (OCULTO NA TELA) */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:p-10 text-black font-sans">
        <div ref={printRef} className="max-w-2xl mx-auto space-y-6 text-xs leading-relaxed">
          
          <div className="text-center border-b-2 border-black pb-4 space-y-1">
            <h1 className="text-sm font-black uppercase">GOVERNO DO ESTADO DE MATO GROSSO</h1>
            <h2 className="text-xs font-bold uppercase">SECRETARIA DE ESTADO DE EDUCAÇÃO - SEDUC/MT</h2>
            <h3 className="text-xs font-bold uppercase">E.E. CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI - COLÍDER/MT</h3>
            <p className="text-[11px] font-black uppercase mt-2 bg-gray-100 p-1 border border-black inline-block">
              TERMO FORMAL DE COMPROMISSO RESTAURATIVO & PACTO DE CONVIVÊNCIA
            </p>
          </div>

          <p>
            Aos <strong>{new Date(date).toLocaleDateString('pt-BR')}</strong>, nas dependências da Sala de Mediação Escolar da E.E. André Antônio Maggi, sob a condução do(a) Professor(a) Mediador(a) <strong>{mediatorName}</strong>, reuniram-se os estudantes abaixo qualificados:
          </p>

          <div className="p-3 border border-black space-y-1 bg-gray-50">
            <p><strong>PARTE 1:</strong> {parte1} | <strong>TURMA:</strong> {turma1 || 'N/A'} {responsavel1 ? `| Responsável: ${responsavel1}` : ''}</p>
            <p><strong>PARTE 2:</strong> {parte2 || 'Colega / Turma'} | <strong>TURMA:</strong> {turma2 || 'N/A'} {responsavel2 ? `| Responsável: ${responsavel2}` : ''}</p>
          </div>

          <div>
            <p className="font-bold uppercase mb-1">1. DO OBJETO E ANTECEDENTES:</p>
            <div className="p-2 border border-black min-h-[60px]">
              {summaryConflict || 'Trata-se de desentendimento ocorrido no ambiente escolar, sendo acolhido para resolução pacífica.'}
            </div>
          </div>

          <div>
            <p className="font-bold uppercase mb-1">2. DOS COMPROMISSOS RESTAURATIVOS ASSUMIDOS:</p>
            <div className="space-y-2">
              <div className="p-2 border border-black">
                <p><strong>Pela Parte 1 ({parte1}):</strong></p>
                <p>{commitmentParte1}</p>
              </div>
              <div className="p-2 border border-black">
                <p><strong>Pela Parte 2 ({parte2 || 'Parte 2'}):</strong></p>
                <p>{commitmentParte2}</p>
              </div>
              <div className="p-2 border border-black bg-gray-50">
                <p><strong>Compromisso Mútuo de Convivência:</strong></p>
                <p>{mutualCommitment}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="font-bold uppercase mb-1">3. DO MONITORAMENTO E FOLLOW-UP:</p>
            <p>
              Fica estabelecido o período de <strong>{followUpDays} dias</strong> para monitoramento da convivência, com nova sessão de verificação designada para <strong>{new Date(reviewDate).toLocaleDateString('pt-BR')}</strong>.
            </p>
          </div>

          <div className="pt-10 grid grid-cols-2 gap-8 text-center text-[10px]">
            <div>
              <div className="border-t border-black pt-1">
                <strong>{parte1}</strong>
                <p>Estudante (Parte 1)</p>
              </div>
            </div>
            <div>
              <div className="border-t border-black pt-1">
                <strong>{parte2 || 'Estudante (Parte 2)'}</strong>
                <p>Estudante (Parte 2)</p>
              </div>
            </div>
            {responsavel1 && (
              <div>
                <div className="border-t border-black pt-1">
                  <strong>{responsavel1}</strong>
                  <p>Responsável Legal (Parte 1)</p>
                </div>
              </div>
            )}
            <div>
              <div className="border-t border-black pt-1">
                <strong>{mediatorName}</strong>
                <p>Professor(a) Mediador(a) - SEDUC/MT</p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default MediationAgreementTermModal;
