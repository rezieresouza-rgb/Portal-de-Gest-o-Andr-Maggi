import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileCheck,
  CheckCircle2,
  Award,
  Building,
  UserCheck,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { Contract, ContractStatus } from '../types';
import { supabase } from '../supabaseClient';

interface SettlementDeclarationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  stats: {
    totalValue: number;
    totalSpent: number;
    remainingValue: number;
    daysRemaining: number;
  };
  paymentGuides: any[];
  consumptionStatements: any[];
  onDeclarationEmitted?: () => void;
}

const SettlementDeclarationModal: React.FC<SettlementDeclarationModalProps> = ({
  isOpen,
  onClose,
  contract,
  stats,
  paymentGuides,
  consumptionStatements,
  onDeclarationEmitted
}) => {
  const todayLong = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('preview');
  const [supplierRepName, setSupplierRepName] = useState('');
  const [supplierRepCpf, setSupplierRepCpf] = useState('');
  const [supplierRepRole, setSupplierRepRole] = useState('Representante Legal / Procurador');
  const [schoolDirector, setSchoolDirector] = useState('Direção Escolar / Presidente do CDCE');
  const [schoolManager, setSchoolManager] = useState('Gestor(a) da Alimentação Escolar');
  const [issueCityDate, setIssueCityDate] = useState(`Colíder - MT, ${todayLong}`);
  const [customObservations, setCustomObservations] = useState(
    'Atestamos que todo o objeto pactuado no instrumento contratual foi entregue a contento, vistoriado e conferido pela equipe técnica, com todos os valores faturados devidamente quitados, inexistindo débitos ou pendências mútuas.'
  );
  const [autoCompleteContract, setAutoCompleteContract] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const handleDownloadPdf = async () => {
    setIsProcessing(true);
    try {
      // 1. Gravar evento de quitação se ainda não gravado
      await recordSettlementEvent();

      // 2. Gerar PDF via html2pdf
      const element = document.getElementById('settlement-declaration-printable');
      if (element && (window as any).html2pdf) {
        await (window as any).html2pdf().set({
          margin: [8, 8, 8, 8],
          filename: `Declaracao_Quitacao_Contrato_${contract.number.replace(/[\/\\:]/g, '-')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save();
      } else {
        window.print();
      }
    } catch (e: any) {
      console.error('Erro ao gerar PDF da quitação:', e);
      alert('Erro ao gerar PDF: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = async () => {
    await recordSettlementEvent();
    window.print();
  };

  const recordSettlementEvent = async () => {
    try {
      if (autoCompleteContract && contract.status !== ContractStatus.COMPLETED) {
        await supabase
          .from('contracts')
          .update({ status: ContractStatus.COMPLETED })
          .eq('id', contract.id);
      }

      await supabase.from('contract_events').insert({
        contract_id: contract.id,
        type: 'QUITACAO',
        description: `Emissão da Declaração Oficial de Quitação de Débitos do Contrato ${contract.number} (${contract.supplierName})`,
        value: stats.totalSpent,
        responsible: 'Gestor da Merenda / CDCE',
        date: new Date().toISOString().split('T')[0]
      });

      if (onDeclarationEmitted) {
        onDeclarationEmitted();
      }
    } catch (error) {
      console.warn('Erro ao registrar histórico de quitação:', error);
    }
  };

  const totalContractedItems = contract.items?.length || 0;
  const totalItemsFulfilled = contract.items?.filter(i => i.acquiredQuantity >= i.contractedQuantity).length || 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-gray-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col relative z-[9999] shadow-2xl border border-gray-100">
        
        {/* Modal Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex justify-between items-center shadow-lg no-print">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
              <Award size={30} className="text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-400 text-emerald-950 text-[9px] font-black uppercase rounded-full tracking-wider">
                  Cumprimento na Íntegra
                </span>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                  Declaração de Quitação de Débitos
                </h3>
              </div>
              <p className="text-xs font-bold text-emerald-100 uppercase opacity-90 mt-0.5">
                Contrato {contract.number} • {contract.supplierName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-emerald-900/50 p-1 rounded-xl border border-emerald-600/40 mr-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'preview' ? 'bg-white text-emerald-900 shadow-md' : 'text-emerald-100 hover:text-white'}`}
              >
                Pré-visualizar Documento
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'config' ? 'bg-white text-emerald-900 shadow-md' : 'text-emerald-100 hover:text-white'}`}
              >
                Configurar Assinaturas
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-white"
              title="Fechar"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100 text-gray-900">
          
          {/* TAB 1: Configuração das Assinaturas e Informações Adicionais */}
          {activeTab === 'config' && (
            <div className="max-w-3xl mx-auto space-y-6 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm animate-in fade-in">
              <div>
                <h4 className="text-base font-black text-gray-900 uppercase flex items-center gap-2">
                  <UserCheck size={18} className="text-emerald-600" /> Dados dos Signatários e Emissão
                </h4>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Personalize os nomes e qualificações que constarão nos campos de assinatura do documento oficial.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase">Representante Legal do Fornecedor</label>
                  <input
                    type="text"
                    placeholder="Nome completo do representante"
                    value={supplierRepName}
                    onChange={(e) => setSupplierRepName(e.target.value.toUpperCase())}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs uppercase outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase">CPF / Documento do Representante</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={supplierRepCpf}
                    onChange={(e) => setSupplierRepCpf(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase">Cargo / Função do Representante</label>
                  <input
                    type="text"
                    value={supplierRepRole}
                    onChange={(e) => setSupplierRepRole(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase">Localidade e Data da Declaração</label>
                  <input
                    type="text"
                    value={issueCityDate}
                    onChange={(e) => setIssueCityDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase">Representante da Direção / CDCE</label>
                  <input
                    type="text"
                    value={schoolDirector}
                    onChange={(e) => setSchoolDirector(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-700 uppercase">Representante da Alimentação Escolar</label>
                  <input
                    type="text"
                    value={schoolManager}
                    onChange={(e) => setSchoolManager(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-700 uppercase">Observações Adicionais / Ressalvas</label>
                <textarea
                  rows={3}
                  value={customObservations}
                  onChange={(e) => setCustomObservations(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoCompleteContract}
                    onChange={(e) => setAutoCompleteContract(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded-lg accent-emerald-600 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-black text-gray-800 uppercase">Atualizar status para "CONCLUÍDO"</p>
                    <p className="text-[10px] text-gray-500 font-medium">Marca formalmente o contrato como encerrado no sistema.</p>
                  </div>
                </label>

                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Ver Pré-visualização A4
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Visualização A4 Oficial Imprimível */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              
              {/* Barra de Ações Rápidas no topo da prévia */}
              <div className="max-w-[210mm] mx-auto flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm no-print">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <FileText size={16} className="text-emerald-600" />
                  <span>Documento em formato A4 institucional pronto para impressão ou download em PDF.</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrint}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Printer size={15} /> Imprimir
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    disabled={isProcessing}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Download size={15} /> {isProcessing ? 'Gerando...' : 'Baixar PDF Oficial'}
                  </button>
                </div>
              </div>

              {/* DOCUMENTO OFICIAL A4 */}
              <div
                id="settlement-declaration-printable"
                className="bg-white p-12 md:p-14 shadow-xl border border-gray-200 mx-auto max-w-[210mm] min-h-[297mm] text-gray-900 font-sans flex flex-col justify-between"
                style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              >
                {/* Cabeçalho Institucional Oficial */}
                <div>
                  <div className="flex items-center justify-between border-b-2 border-gray-900 pb-6 mb-6">
                    <div className="flex items-center gap-5">
                      <img src="/logo-escola.png" alt="Brasão / Logo Escola" className="w-20 h-auto object-contain" />
                      <div>
                        <h2 className="text-[13px] font-black uppercase tracking-tight text-gray-900 leading-tight">
                          GOVERNO DO ESTADO DE MATO GROSSO
                        </h2>
                        <h3 className="text-[11px] font-black uppercase text-gray-700 tracking-tight leading-tight">
                          SECRETARIA DE ESTADO DE EDUCAÇÃO - SEDUC/MT
                        </h3>
                        <p className="text-[10px] font-black uppercase text-gray-900 mt-1">
                          ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI
                        </p>
                        <p className="text-[9px] font-bold text-gray-600 uppercase">
                          CDCE DA ESC. EST. DE ENS. FUN. ANDRÉ A. MAGGI • CNPJ: 11.906.357/0001-50
                        </p>
                        <p className="text-[8px] font-medium text-gray-500 uppercase mt-0.5">
                          Avenida Borba Gato, nº 80, Colíder-MT • CEP 78500-000 • escola.153830@edu.mt.gov.br
                        </p>
                      </div>
                    </div>

                    <div className="text-right pl-4 border-l border-gray-200">
                      <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase tracking-widest rounded-md mb-1">
                        Execução Integral
                      </span>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Termo Oficial</p>
                      <p className="text-sm font-black text-gray-900">QUIT-CT {contract.number}</p>
                    </div>
                  </div>

                  {/* Título do Documento */}
                  <div className="text-center my-6">
                    <h1 className="text-base font-black uppercase tracking-wider text-gray-950 border-b border-t border-gray-200 py-2 inline-block px-8">
                      DECLARAÇÃO DE QUITAÇÃO DE DÉBITOS E CUMPRIMENTO INTEGRAL
                    </h1>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mt-1">
                      Termo de Recebimento Definitivo e Desoneração Obrigacional
                    </p>
                  </div>

                  {/* Quadro de Qualificação */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-[10px] space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-black text-gray-500 uppercase">Unidade Concedente (CDCE):</span>
                        <p className="font-bold text-gray-900 uppercase">CDCE DA E.E. CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI (CNPJ: 11.906.357/0001-50)</p>
                      </div>
                      <div>
                        <span className="font-black text-gray-500 uppercase">Empresa / Contratada:</span>
                        <p className="font-bold text-gray-900 uppercase">{contract.supplierFullName || contract.supplierName} {contract.supplierCnpj ? `(CNPJ: ${contract.supplierCnpj})` : ''}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-200">
                      <div>
                        <span className="font-black text-gray-500 uppercase">Contrato Administrativo:</span>
                        <p className="font-bold text-gray-900">Nº {contract.number}</p>
                      </div>
                      <div>
                        <span className="font-black text-gray-500 uppercase">Modalidade / Tipo:</span>
                        <p className="font-bold text-gray-900 uppercase">{contract.type}</p>
                      </div>
                      <div>
                        <span className="font-black text-gray-500 uppercase">Vigência Executada:</span>
                        <p className="font-bold text-gray-900">{formatDate(contract.startDate)} a {formatDate(contract.endDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Texto Legal da Declaração */}
                  <div className="space-y-3.5 text-justify text-[10.5px] leading-relaxed text-gray-800">
                    <p>
                      O <strong>CONSELHO DELIBERATIVO DA COMUNIDADE ESCOLAR (CDCE)</strong> da <strong>ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI</strong>, no exercício de suas prerrogativas de fiscalização e gestão dos recursos descentralizados da Alimentação Escolar (SEDUC/MT e FNDE/PNAE), <strong>DECLARA E CERTIFICA</strong>, para os devidos fins de direito, prestação de contas e prova junto aos órgãos de controle:
                    </p>

                    <p>
                      <strong>1. ADIMPLEMENTO PLENO DO OBJETO:</strong> A empresa acima qualificada executou na íntegra o fornecimento de gêneros alimentícios contratados, tendo entregue satisfatoriamente as quantidades solicitadas, as quais foram regularmente atestadas e conferidas em peso, qualidade e acondicionamento pela equipe responsável do setor de merenda escolar desta Unidade de Ensino.
                    </p>

                    <p>
                      <strong>2. REGULARIDADE E QUITAÇÃO FINANCEIRA:</strong> Todas as Guias de Recebimento de Gêneros Alimentícios e respectivos Extratos de Consumo emitidos no decorrer da execução contratual foram formalmente atestados, liquidados e pagos através dos fundos competentes da alimentação escolar, <strong>não restando qualquer débito, pendência financeira, saldo a pagar ou obrigação pecuniária residual</strong> pendente de cumprimento por parte deste CDCE / Unidade Escolar perante a Contratada.
                    </p>

                    <p>
                      <strong>3. QUITAÇÃO RECÍPROCA:</strong> Por estarem justas, certas e adimplidas todas as cláusulas e condições pactuadas, as partes conferem-se mútua, plena, geral, rasa e irrevogável quitação com relação às obrigações decorrentes do <strong>Contrato nº {contract.number}</strong>, considerando-o <strong>CUMPRIDO NA ÍNTEGRA E DEFINITIVAMENTE ENCERRADO</strong> para todos os efeitos administrativos e jurídicos.
                    </p>

                    {customObservations && (
                      <p className="p-3 bg-gray-50 border-l-4 border-emerald-600 rounded-r-lg text-[9.5px] italic text-gray-700">
                        <strong>Observação da Gestão:</strong> {customObservations}
                      </p>
                    )}
                  </div>

                  {/* Quadro Demonstrativo Resumo */}
                  <div className="my-6 border border-gray-200 rounded-xl overflow-hidden text-[9px]">
                    <div className="bg-gray-100 px-4 py-2 font-black uppercase text-gray-700 border-b border-gray-200 flex justify-between items-center">
                      <span>Demostrativo Consolidado de Execução e Liquidação</span>
                      <span className="text-emerald-700 font-bold">100% Liquidado</span>
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-[8px] font-black text-gray-500 uppercase border-b border-gray-200">
                          <th className="px-4 py-2">Valor Global Contratado</th>
                          <th className="px-4 py-2 text-center">Valor Total Fornecido</th>
                          <th className="px-4 py-2 text-center">Guias de Recebimento</th>
                          <th className="px-4 py-2 text-center">Extratos Liquidados</th>
                          <th className="px-4 py-2 text-right">Saldo Devedor Residual</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="font-bold text-gray-800">
                          <td className="px-4 py-2.5">R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2.5 text-center text-emerald-700 font-black">R$ {stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2.5 text-center">{paymentGuides.length} guias</td>
                          <td className="px-4 py-2.5 text-center">{consumptionStatements.length} extratos</td>
                          <td className="px-4 py-2.5 text-right font-black text-emerald-700">R$ 0,00 (Quitado)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bloco de Data e Assinaturas */}
                <div className="pt-4 mt-4">
                  <p className="text-center font-bold text-gray-800 text-[10px] mb-12">
                    {issueCityDate}
                  </p>

                  <div className="grid grid-cols-3 gap-6 text-center text-[9px]">
                    {/* Assinatura Direção */}
                    <div className="flex flex-col items-center">
                      <div className="w-full border-t border-gray-900 mb-2"></div>
                      <p className="font-black text-gray-900 uppercase">{schoolDirector}</p>
                      <p className="font-medium text-gray-500 uppercase">Presidente do CDCE / Diretor(a)</p>
                      <p className="text-[8px] text-gray-400 uppercase mt-0.5">E.E. André Antônio Maggi</p>
                    </div>

                    {/* Assinatura Merenda */}
                    <div className="flex flex-col items-center">
                      <div className="w-full border-t border-gray-900 mb-2"></div>
                      <p className="font-black text-gray-900 uppercase">{schoolManager}</p>
                      <p className="font-medium text-gray-500 uppercase">Comissão de Recebimento</p>
                      <p className="text-[8px] text-gray-400 uppercase mt-0.5">Setor de Alimentação Escolar</p>
                    </div>

                    {/* Assinatura Fornecedor */}
                    <div className="flex flex-col items-center">
                      <div className="w-full border-t border-gray-900 mb-2"></div>
                      <p className="font-black text-gray-900 uppercase">{supplierRepName || contract.supplierName}</p>
                      <p className="font-medium text-gray-500 uppercase">{supplierRepRole}</p>
                      <p className="text-[8px] text-gray-400 uppercase mt-0.5">{supplierRepCpf ? `CPF: ${supplierRepCpf}` : (contract.supplierCnpj ? `CNPJ: ${contract.supplierCnpj}` : 'Contratada')}</p>
                    </div>
                  </div>

                  <div className="text-center text-[7.5px] font-bold text-gray-400 uppercase mt-8 pt-4 border-t border-gray-100">
                    Documento emitido eletronicamente via Portal de Gestão André Maggi • Validação conforme prestação de contas SEDUC-MT / TCE-MT
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default SettlementDeclarationModal;
