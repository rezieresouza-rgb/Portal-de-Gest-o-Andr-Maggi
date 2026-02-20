
import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  FileDown, 
  Printer, 
  Search, 
  Filter,
  ArrowRight,
  ShieldCheck,
  FileSearch,
  ShoppingCart,
  Zap,
  Info,
  Loader2
} from 'lucide-react';
import { OFFICIAL_MENUS } from '../constants/menus';
import { Contract } from '../types';
import { INITIAL_CONTRACTS } from '../constants/initialData';

const MenuContractAudit: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);

  // Carrega contratos (priorizando localStorage se existir)
  const contracts: Contract[] = useMemo(() => {
    const saved = localStorage.getItem('merenda_contracts');
    return saved ? JSON.parse(saved) : INITIAL_CONTRACTS;
  }, []);

  // Realiza o cruzamento de dados
  const auditReport = useMemo(() => {
    const weekData = OFFICIAL_MENUS.find(m => m.week === selectedWeek);
    if (!weekData) return null;

    const consolidatedIngredients = new Set<string>();
    weekData.days.forEach(day => {
      day.ingredients.forEach(ing => consolidatedIngredients.add(ing.toUpperCase()));
    });

    const results = Array.from(consolidatedIngredients).map(ingName => {
      // Busca correspondência em qualquer contrato
      let matchedItem = null;
      let matchedContract = null;

      for (const contract of contracts) {
        const item = contract.items.find(i => 
          i.description.toUpperCase().includes(ingName) || 
          ingName.includes(i.description.toUpperCase())
        );
        if (item) {
          matchedItem = item;
          matchedContract = contract;
          break;
        }
      }

      const hasCoverage = !!matchedItem;
      const balanceStatus = matchedItem 
        ? (matchedItem.contractedQuantity - matchedItem.acquiredQuantity) > 0 
        : false;

      return {
        ingredient: ingName,
        status: hasCoverage ? (balanceStatus ? 'COBERTO' : 'SALDO_INSUFICIENTE') : 'NÃO_CONTRATADO',
        contractNumber: matchedContract?.number || '---',
        supplier: matchedContract?.supplierName || 'NÃO VINCULADO',
        unit: matchedItem?.unit || 'N/A',
        suggestedAction: !hasCoverage 
          ? 'Abrir Novo Processo de Dispensa ou Aditivo' 
          : !balanceStatus 
            ? 'Necessário Aditivo de Quantidade (Limite 25%)'
            : 'Liberado para Pedido'
      };
    });

    const coveredCount = results.filter(r => r.status === 'COBERTO').length;
    const missingCount = results.filter(r => r.status === 'NÃO_CONTRATADO').length;
    const warningCount = results.filter(r => r.status === 'SALDO_INSUFICIENTE').length;

    return {
      week: selectedWeek,
      label: weekData.label,
      items: results,
      stats: {
        total: results.length,
        coveredCount,
        missingCount,
        warningCount,
        percent: (coveredCount / results.length) * 100
      }
    };
  }, [selectedWeek, contracts]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById('audit-report-printable');
    if (!element) return setIsExporting(false);

    try {
      const opt = {
        margin: [10, 5, 10, 5],
        filename: `Auditoria_Contratual_Semana_${selectedWeek}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      // @ts-ignore
      await window.html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  if (!auditReport) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* HEADER DE COMANDO */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm no-print">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-xl shadow-emerald-600/20">
              <Scale size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Cruzamento Cardápio x Contratos</h2>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Auditoria de Viabilidade de Fornecimento</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1">
              {[1, 2, 3, 4, 5].map(w => (
                <button 
                  key={w} 
                  onClick={() => setSelectedWeek(w)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                    selectedWeek === w ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Semana {w}
                </button>
              ))}
            </div>
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-6 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
              Exportar Relatório
            </button>
          </div>
        </div>
      </div>

      {/* DASHBOARD DE STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Índice de Cobertura</p>
          <div className="flex items-end gap-2">
            <p className={`text-3xl font-black ${auditReport.stats.percent === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {auditReport.stats.percent.toFixed(0)}%
            </p>
            {auditReport.stats.percent === 100 && <CheckCircle2 size={18} className="text-emerald-500 mb-1" />}
          </div>
          <div className="w-full h-1.5 bg-gray-50 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${auditReport.stats.percent}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Ingredientes Atendidos</p>
          <p className="text-3xl font-black text-emerald-700 mt-2">{auditReport.stats.coveredCount}</p>
        </div>

        <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">Saldos Críticos</p>
          <p className="text-3xl font-black text-amber-700 mt-2">{auditReport.stats.warningCount}</p>
        </div>

        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">Itens Não Contratados</p>
          <p className="text-3xl font-black text-red-700 mt-2">{auditReport.stats.missingCount}</p>
        </div>
      </div>

      {/* ÁREA DE RELATÓRIO DETALHADO */}
      <div id="audit-report-printable" className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-xl space-y-8 print-container">
        <div className="flex justify-between items-center border-b border-gray-100 pb-6">
          <div className="flex items-center gap-4">
             <div className="hidden pdf-show p-2 bg-emerald-900 rounded text-white font-black text-[10px]">Portal Gestão André Maggi</div>
             <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Relatório de Auditoria Contratual</h3>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">
                   Referência: {auditReport.label} • Cardápio Padrão SEDUC-MT
                </p>
             </div>
          </div>
          <div className="text-right">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                <ShieldCheck size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Base Auditada {new Date().getFullYear()}</span>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Ingrediente do Cardápio</th>
                <th className="px-6 py-4 text-center">Status / Vínculo</th>
                <th className="px-6 py-4">Contrato / Fornecedor</th>
                <th className="px-6 py-4 text-right">Ação Recomendada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {auditReport.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <p className="font-black text-gray-900 text-xs uppercase tracking-tight">{item.ingredient}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Unidade Ref: {item.unit}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border-2 ${
                      item.status === 'COBERTO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      item.status === 'SALDO_INSUFICIENTE' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-red-50 text-red-700 border-red-100 animate-pulse'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[10px] font-black text-gray-900 uppercase leading-tight">{item.contractNumber}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 line-clamp-1">{item.supplier}</p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 text-blue-600 font-black text-[9px] uppercase tracking-tighter">
                       <Zap size={10} className={item.status === 'NÃO_CONTRATADO' ? 'text-red-500' : 'text-blue-500'} />
                       {item.suggestedAction}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* NOTAS DE AUDITORIA */}
        <div className="bg-gray-50 p-6 rounded-[2rem] border border-dashed border-gray-200">
           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Info size={14} className="text-blue-500" /> Notas de Auditoria Gestora
           </h4>
           <p className="text-[10px] text-gray-600 leading-relaxed font-medium">
             Este documento foi gerado automaticamente cruzando os ingredientes previstos no Cardápio Semanal Oficial com os itens homologados nos contratos de Pregão Presencial e Chamada Pública de Agricultura Familiar. A falta de cobertura contratual para itens do cardápio impede a execução das refeições planejadas e deve ser saneada com urgência pela gestão financeira.
           </p>
        </div>

        {/* ASSINATURAS PDF */}
        <div className="hidden pdf-show pt-20 grid grid-cols-2 gap-20 text-center">
           <div className="border-t-2 border-black pt-2">
              <p className="text-[10px] font-black uppercase">Responsável pela Merenda</p>
           </div>
           <div className="border-t-2 border-black pt-2">
              <p className="text-[10px] font-black uppercase">Direção / CDCE</p>
           </div>
        </div>
      </div>

      <style>{`
        .pdf-show { display: none; }
        @media print, .pdf-mode {
          .no-print { display: none !important; }
          .pdf-show { display: block !important; }
          .print-container { 
            border: none !important; 
            box-shadow: none !important; 
            width: 100% !important; 
            margin: 0 !important; 
            padding: 0 !important; 
          }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default MenuContractAudit;
