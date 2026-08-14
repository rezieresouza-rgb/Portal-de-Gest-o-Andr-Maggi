
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  AlertCircle, 
  Wallet, 
  ShieldCheck, 
  Package, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  GraduationCap,
  FileText,
  PieChart as PieChartIcon,
  Clock,
  ArrowUpRight,
  Sparkles,
  Printer,
  FileDown,
  X
} from 'lucide-react';
import { Contract } from '../types';
import { INITIAL_CONTRACTS } from '../constants/initialData';
import { useStudents } from '../hooks/useStudents';
import { supabase } from '../supabaseClient';

const Dashboard: React.FC = () => {
  const { students } = useStudents();
  const studentCount = students.length;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [paymentGuides, setPaymentGuides] = useState<any[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [showDebtDeclarationModal, setShowDebtDeclarationModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Carrega contratos e guias de recebimento (do Supabase com fallback local/mock)
  useEffect(() => {
    const fetchContractsData = async () => {
      try {
        setIsLoadingContracts(true);
        const { data, error } = await supabase
          .from('contracts')
          .select(`
            *,
            supplier:suppliers (name),
            items:contract_items (*)
          `);

        if (!error && data && data.length > 0) {
          const formatted: Contract[] = data.map((c: any) => ({
            id: c.id,
            number: c.number,
            supplierId: c.supplier_id,
            supplierName: c.supplier?.name || 'Desconhecido',
            startDate: c.start_date,
            endDate: c.end_date,
            status: c.status,
            type: c.type,
            items: (c.items || []).map((i: any) => ({
              id: i.id,
              description: i.description,
              contractedQuantity: Number(i.contracted_quantity || 0),
              acquiredQuantity: Number(i.acquired_quantity || 0),
              unit: i.unit,
              unitPrice: Number(i.unit_price || 0),
              brand: i.brand
            }))
          }));
          setContracts(formatted);
        } else {
          const saved = localStorage.getItem('merenda_contracts');
          let parsed: Contract[] = saved ? JSON.parse(saved) : [];
          const guaranteedContracts = INITIAL_CONTRACTS.map(initial => {
            const existing = parsed.find(p => p.number === initial.number);
            if (!existing) return initial;
            const syncedItems = initial.items.map(initialItem => {
              const existingItem = existing.items.find(ei => ei.description === initialItem.description);
              return existingItem ? { ...initialItem, acquiredQuantity: existingItem.acquiredQuantity } : initialItem;
            });
            return { ...initial, items: [...syncedItems] };
          });
          setContracts(guaranteedContracts);
        }

        // Buscar Guias de Recebimento
        const { data: guidesData, error: guidesErr } = await supabase
          .from('payment_guides')
          .select(`
            *,
            statement:consumption_statements(id, statement_number, payment_date, invoice_number)
          `);

        if (!guidesErr && guidesData) {
          setPaymentGuides(guidesData);
        }
      } catch (err) {
        console.error("Erro ao carregar contratos no Dashboard:", err);
      } finally {
        setIsLoadingContracts(false);
      }
    };

    fetchContractsData();
  }, []);

  // Carrega o controle de estoque para alertas físicos
  const inventoryAlerts = useMemo(() => {
    const saved = localStorage.getItem('seduc_inventory_v3');
    if (!saved) return [];
    try {
      const items = JSON.parse(saved);
      return items.filter((item: any) => (item.previousBalance + item.entries - item.outputs) < item.min);
    } catch {
      return [];
    }
  }, []);

  // Estatísticas de Guias por Contrato (Pagas vs Em Aberto)
  const perContractGuideStats = useMemo(() => {
    const map: Record<string, { totalGuidesValue: number; paidGuidesValue: number; openGuidesValue: number; guidesCount: number; openGuidesCount: number; paidGuidesCount: number }> = {};

    contracts.forEach(c => {
      const cGuides = paymentGuides.filter(g => g.contract_id === c.id);
      const paidG = cGuides.filter(g => (g.statement && g.statement.payment_date) || g.status === 'PAGO');
      const openG = cGuides.filter(g => !(g.statement && g.statement.payment_date) && g.status !== 'PAGO');

      map[c.id] = {
        totalGuidesValue: cGuides.reduce((sum, g) => sum + Number(g.total_value || 0), 0),
        paidGuidesValue: paidG.reduce((sum, g) => sum + Number(g.total_value || 0), 0),
        openGuidesValue: openG.reduce((sum, g) => sum + Number(g.total_value || 0), 0),
        guidesCount: cGuides.length,
        openGuidesCount: openG.length,
        paidGuidesCount: paidG.length
      };
    });

    return map;
  }, [contracts, paymentGuides]);

  // Consolidação Estratégica dos Contratos e Guias
  const stats = useMemo(() => {
    let globalValue = 0;
    let totalSpent = 0;
    let expiringSoonCount = 0;
    let criticalContractItems: { label: string, consumed: number, remaining: string, contractNumber: string }[] = [];

    const today = new Date();

    contracts.forEach(c => {
      const end = new Date(c.endDate);
      const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 60 && diffDays >= 0) {
        expiringSoonCount++;
      }

      (c.items || []).forEach(item => {
        const val = item.contractedQuantity * item.unitPrice;
        const spent = item.acquiredQuantity * item.unitPrice;
        globalValue += val;
        totalSpent += spent;
        const consumedPercent = item.contractedQuantity > 0 ? (item.acquiredQuantity / item.contractedQuantity) * 100 : 0;
        if (consumedPercent > 70) {
          criticalContractItems.push({
            label: item.description,
            contractNumber: c.number,
            consumed: consumedPercent,
            remaining: `${(item.contractedQuantity - item.acquiredQuantity).toFixed(1)} ${item.unit}`
          });
        }
      });
    });

    // Totais Consolidados de Guias de Recebimento
    const totalPaidGuidesSum = paymentGuides
      .filter(g => (g.statement && g.statement.payment_date) || g.status === 'PAGO')
      .reduce((sum, g) => sum + Number(g.total_value || 0), 0);

    const totalOpenGuidesSum = paymentGuides
      .filter(g => !(g.statement && g.statement.payment_date) && g.status !== 'PAGO')
      .reduce((sum, g) => sum + Number(g.total_value || 0), 0);

    const totalGuidesSum = paymentGuides.reduce((sum, g) => sum + Number(g.total_value || 0), 0);
    const openGuidesCount = paymentGuides.filter(g => !(g.statement && g.statement.payment_date) && g.status !== 'PAGO').length;
    const paidGuidesCount = paymentGuides.filter(g => (g.statement && g.statement.payment_date) || g.status === 'PAGO').length;

    const remainingValue = Math.max(0, globalValue - totalSpent);
    const executionPercent = globalValue > 0 ? (totalSpent / globalValue) * 100 : 0;

    return {
      globalValue,
      totalSpent,
      remainingValue,
      executionPercent,
      contractsCount: contracts.length,
      expiringSoonCount,
      criticalContractItems: criticalContractItems.sort((a, b) => b.consumed - a.consumed).slice(0, 5),
      totalPaidGuidesSum,
      totalOpenGuidesSum,
      totalGuidesSum,
      openGuidesCount,
      paidGuidesCount,
      totalGuidesCount: paymentGuides.length
    };
  }, [contracts, paymentGuides]);

  const chartData = [
    { name: 'Valor Executado (Recebido)', valor: stats.totalSpent },
    { name: 'Saldo Disponível em Contrato', valor: stats.remainingValue },
  ];

  const COLORS = ['#10b981', '#3b82f6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 w-full min-w-0">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1 w-full">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h2 className="text-lg sm:text-2xl font-black text-gray-900 uppercase tracking-tight truncate">Painel Geral da Merenda Escolar</h2>
            <div className="flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase shrink-0 border border-emerald-200">
               <ShieldCheck size={12} className="shrink-0 text-emerald-600" /> Sincronização em Tempo Real
            </div>
          </div>
          <p className="text-gray-500 font-bold text-xs sm:text-sm truncate mt-1">Consolidação financeira de contratos e monitoramento de beneficiários ({studentCount} alunos)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setShowDebtDeclarationModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
          >
            <FileDown size={18} /> Declaração de Débitos (PDF)
          </button>
          <div className="text-left md:text-right shrink-0 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Atualizado Em</p>
            <p className="text-xs font-black text-emerald-700">{new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* CENTRAL DE ALERTAS DE ESTOQUE FÍSICO */}
      {inventoryAlerts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-top-4 duration-500 w-full min-w-0">
          <div className="bg-red-50 border border-red-100 p-4 sm:p-6 rounded-[2.5rem] shadow-sm min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 bg-red-600 text-white rounded-2xl animate-pulse shrink-0 shadow-lg shadow-red-600/30">
                  <AlertTriangle size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-lg font-black text-red-900 uppercase tracking-tight truncate">Alertas de Reposição Imediata no Estoque</h3>
                  <p className="text-red-700 text-[10px] sm:text-xs font-bold uppercase tracking-tighter truncate">Estoque físico abaixo do mínimo de segurança estipulado</p>
                </div>
              </div>
              <span className="bg-red-200 text-red-800 text-[10px] font-black px-3 py-1.5 rounded-full uppercase shrink-0 self-start sm:self-center border border-red-300">
                {inventoryAlerts.length} Itens em Risco
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full min-w-0">
              {inventoryAlerts.map((item: any) => {
                const current = item.previousBalance + item.entries - item.outputs;
                const deficit = item.min - current;
                return (
                  <div key={item.id} className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm flex items-center justify-between group hover:border-red-400 transition-all min-w-0 gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 bg-red-50 text-red-500 rounded-xl shrink-0">
                        <Package size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-gray-900 uppercase leading-tight truncate">{item.name}</p>
                        <p className="text-[9px] text-red-500 font-black uppercase mt-0.5 truncate">Faltam: {deficit.toLocaleString('pt-BR')} {item.unit}</p>
                      </div>
                    </div>
                    <button className="p-2 text-gray-300 group-hover:text-red-600 transition-colors shrink-0">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CARD DESTAQUE: DEMONSTRATIVO CONSOLIDADO DE GUIAS DE RECEBIMENTO & DÉBITOS */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-slate-700/50 min-w-0 w-full">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-red-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 w-fit">
              <Sparkles size={12} /> Lançamentos Fiscais de Recebimento
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Resumo das Guias de Recebimento & Débitos em Aberto
            </h3>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Consolidação calculada diretamente a partir das Guias de Recebimento emitidas. Separação de guias quitadas com Nota Fiscal e montante exato de débitos lançados pendentes de quitação.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowDebtDeclarationModal(true)}
              className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-red-600/30 flex items-center gap-2"
            >
              <FileDown size={18} /> Imprimir Declaração (PDF)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-700/60 relative z-10">
          {/* Item 1: Total Lançado */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Guias Lançadas</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              R$ {stats.totalGuidesSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
              {stats.totalGuidesCount} guias emitidas no sistema
            </p>
          </div>

          {/* Item 2: Guias Pagas */}
          <div className="bg-emerald-950/40 p-5 rounded-2xl border border-emerald-500/30">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Guias Já Pagas (Quitadas)</p>
              <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                {stats.paidGuidesCount} Quitadas
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              R$ {stats.totalPaidGuidesSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] font-bold text-emerald-500/80 uppercase mt-1">
              Liquidadas com Nota Fiscal
            </p>
          </div>

          {/* Item 3: Débitos em Aberto */}
          <div className="bg-red-950/40 p-5 rounded-2xl border border-red-500/30">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Débitos em Aberto (Pagar)</p>
              <span className="text-[9px] font-black bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full animate-pulse">
                {stats.openGuidesCount} Em Aberto
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-red-400 mt-1">
              R$ {stats.totalOpenGuidesSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] font-bold text-red-400/80 uppercase mt-1">
              Soma das guias a liquidar
            </p>
          </div>
        </div>
      </div>

      {/* PAINEL DE CONTRATOS - CARDS INFORMATIVOS GERAIS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <FileText size={14} className="text-emerald-600" /> Acompanhamento de Guias: Pagas vs. Lançadas em Aberto
          </h3>
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase">
            {stats.contractsCount} Contratos Registrados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full min-w-0">
          
          {/* CARD 1: VALORES JÁ PAGOS / EXECUTADOS */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-[2.5rem] text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-md text-white rounded-2xl shrink-0">
                  <TrendingUp size={24} />
                </div>
                <span className="text-[10px] font-black bg-white/20 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-widest">
                  {stats.executionPercent.toFixed(1)}% Pago
                </span>
              </div>
              <h3 className="text-emerald-100 text-[10px] font-black uppercase tracking-widest">Valores Já Pagos (Executados)</h3>
              <p className="text-2xl sm:text-3xl font-black mt-2 leading-none tracking-tight">
                R$ {stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-bold text-emerald-100 uppercase">
              <span>Entregas liquidadas e recebidas</span>
              <ArrowUpRight size={14} />
            </div>
          </div>

          {/* CARD 2: VALORES A PAGAR / SALDO PENDENTE */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-6 rounded-[2.5rem] text-white shadow-xl shadow-blue-600/20 relative overflow-hidden flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-md text-white rounded-2xl shrink-0">
                  <PieChartIcon size={24} />
                </div>
                <span className="text-[10px] font-black bg-white/20 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-widest">
                  {(100 - stats.executionPercent).toFixed(1)}% A Pagar
                </span>
              </div>
              <h3 className="text-blue-100 text-[10px] font-black uppercase tracking-widest">Valores A Pagar (Saldo Pendente)</h3>
              <p className="text-2xl sm:text-3xl font-black mt-2 leading-none tracking-tight">
                R$ {stats.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-bold text-blue-100 uppercase">
              <span>Saldo a liquidar nos contratos</span>
              <Clock size={14} />
            </div>
          </div>

          {/* CARD 3: VALOR GLOBAL CONTRATADO */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm min-w-0 flex flex-col justify-between hover:border-emerald-200 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                  <Wallet size={24} />
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase shrink-0">
                  Teto Orçamentário
                </span>
              </div>
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Valor Global Contratado</h3>
              <p className="text-2xl sm:text-3xl font-black mt-2 text-gray-900 leading-none tracking-tight truncate">
                R$ {stats.globalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50 text-[10px] font-bold text-gray-400 uppercase truncate">
              {stats.contractsCount} Contratos Homologados
            </div>
          </div>

          {/* CARD 4: BENEFICIÁRIOS & ATENDIMENTO */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm min-w-0 flex flex-col justify-between hover:border-amber-200 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
                  <GraduationCap size={24} />
                </div>
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase shrink-0">
                  SEDUC / CDCE
                </span>
              </div>
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Alunos Atendidos</h3>
              <p className="text-2xl sm:text-3xl font-black mt-2 text-gray-900 leading-none tracking-tight truncate">
                {studentCount} Alunos
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-amber-600 uppercase">
              <span>{stats.expiringSoonCount} Contratos próx. ao vencimento</span>
              <Clock size={12} />
            </div>
          </div>

        </div>
      </div>

      {/* CRONOGRAMA FINANCEIRO & BARRAS DE COMPARAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 w-full min-w-0">
        
        {/* GRÁFICO DE COMPARAÇÃO DE EXECUÇÃO */}
        <div className="bg-white p-6 sm:p-8 rounded-[3rem] border border-gray-100 shadow-sm min-w-0 w-full">
          <div className="flex items-center justify-between mb-6 gap-2 min-w-0">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-tight truncate">Execução Financeira Global</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Executado x Saldo Disponível</p>
            </div>
            <div className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase shrink-0">
              {stats.executionPercent.toFixed(0)}% Concluído
            </div>
          </div>

          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10, fontWeight: 800}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="valor" radius={[16, 16, 0, 0]} barSize={80}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* BARRA VISUAL INTEGRADA */}
          <div className="mt-6 pt-6 border-t border-gray-50 space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase">
              <span className="text-emerald-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                Executado: R$ {stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-blue-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                Saldo: R$ {stats.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-blue-100 h-3 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${stats.executionPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* ALERTAS DE ITENS DE CONTRATO COM CONSUMO > 70% */}
        <div className="bg-white p-6 sm:p-8 rounded-[3rem] border border-gray-100 shadow-sm min-w-0 w-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 gap-2 min-w-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-tight truncate">Itens Contratuais em Limite Crítico</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Produtos com mais de 70% do saldo executado</p>
              </div>
              <span className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl shrink-0"><AlertCircle size={20} /></span>
            </div>

            <div className="space-y-5 w-full min-w-0">
              {stats.criticalContractItems.length > 0 ? stats.criticalContractItems.map((item, i) => (
                <div key={i} className="min-w-0 w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-amber-200 transition-all">
                  <div className="flex justify-between items-start mb-2 gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-gray-900 uppercase leading-tight truncate">{item.label}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 truncate">
                        Contrato: <b className="text-gray-700">{item.contractNumber}</b> • Restam: <b className="text-blue-600">{item.remaining}</b>
                      </p>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase shrink-0 ${item.consumed >= 90 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.consumed.toFixed(0)}% Usado
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 rounded-full ${
                        item.consumed >= 90 ? 'bg-red-500' : 'bg-amber-500'
                      }`} 
                      style={{ width: `${Math.min(100, item.consumed)}%` }}
                    />
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 min-w-0 w-full">
                  <div className="inline-flex p-4 bg-emerald-50 text-emerald-600 rounded-full mb-3 shrink-0">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-gray-900 font-black uppercase text-xs tracking-widest truncate">Execução Sob Controle</p>
                  <p className="text-gray-400 text-[10px] font-bold mt-1 truncate">Nenhum item contratual ultrapassou o limite crítico de 70%.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase">
            <span>Monitoramento Automático de Saldo</span>
            <Sparkles size={14} className="text-emerald-500" />
          </div>
        </div>

      </div>

      {/* DETALHAMENTO DE VALORES PAGOS X A PAGAR POR CONTRATO */}
      <div className="bg-white p-6 sm:p-8 rounded-[3rem] border border-gray-100 shadow-sm min-w-0 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <Wallet className="text-emerald-600" size={20} /> Acompanhamento Detalhado dos Contratos e Guias
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Guias Pagas (Quitadas com NF) vs. Guias em Aberto (Débitos Lançados)</p>
          </div>
          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 uppercase">
            {contracts.length} Contratos Auditados
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100">
                <th className="px-6 py-4">Contrato / Fornecedor</th>
                <th className="px-6 py-4 text-center">Guias Lançadas</th>
                <th className="px-6 py-4 text-right">Total das Guias</th>
                <th className="px-6 py-4 text-right">Guias Pagas</th>
                <th className="px-6 py-4 text-right">Guias em Aberto (Débito)</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.map(c => {
                const gStats = perContractGuideStats[c.id] || { totalGuidesValue: 0, paidGuidesValue: 0, openGuidesValue: 0, guidesCount: 0, openGuidesCount: 0, paidGuidesCount: 0 };

                return (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-900 text-xs uppercase leading-tight">{c.number}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase truncate mt-0.5">{c.supplierName}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-700 text-xs">
                      <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-black text-[10px]">{gStats.guidesCount} Guias</span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900 text-xs">
                      R$ {gStats.totalGuidesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 text-xs">
                      R$ {gStats.paidGuidesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-blue-600 text-xs">
                      <span className={gStats.openGuidesValue > 0 ? 'text-red-600 bg-red-50 px-2 py-1 rounded-md' : 'text-gray-400'}>
                        R$ {gStats.openGuidesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {gStats.openGuidesCount > 0 ? (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[9px] font-black uppercase rounded-full">
                          {gStats.openGuidesCount} Pendentes
                        </span>
                      ) : gStats.guidesCount > 0 ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase rounded-full">
                          100% Quitadas
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-400 text-[9px] font-black uppercase rounded-full">
                          Sem Guias
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-300 font-black uppercase text-xs">
                    Nenhum contrato cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EMISSÃO DA DECLARAÇÃO DE DÉBITOS EM ABERTO (PDF) */}
      {showDebtDeclarationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20">
            {/* Modal Header */}
            <div className="p-6 bg-gray-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg">
                  <FileText size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Declaração de Débitos de Guias em Aberto</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Documento oficial pronto para impressão em PDF</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    setIsGeneratingPDF(true);
                    try {
                      const element = document.getElementById('debt-declaration-pdf');
                      if (element && (window as any).html2pdf) {
                        const opt = {
                          margin: [10, 10, 10, 10],
                          filename: `Declaracao_Debitos_Guias_Em_Aberto_${new Date().toISOString().split('T')[0]}.pdf`,
                          image: { type: 'jpeg', quality: 0.98 },
                          html2canvas: { scale: 2, useCORS: true },
                          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                        };
                        await (window as any).html2pdf().set(opt).from(element).save();
                      } else {
                        window.print();
                      }
                    } catch (e) {
                      console.error("Erro na impressão do PDF:", e);
                      window.print();
                    } finally {
                      setIsGeneratingPDF(false);
                    }
                  }}
                  disabled={isGeneratingPDF}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Printer size={16} /> {isGeneratingPDF ? 'Gerando PDF...' : 'Baixar PDF / Imprimir'}
                </button>
                <button
                  onClick={() => setShowDebtDeclarationModal(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body / PDF Element */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100 custom-scrollbar">
              <div id="debt-declaration-pdf" className="bg-white p-10 max-w-3xl mx-auto shadow-md rounded-xl text-gray-900 font-sans space-y-6 border border-gray-200">
                {/* Header Timbrado */}
                <div className="text-center border-b-2 border-gray-800 pb-4 space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-700">ESTADO DE MATO GROSSO • SECRETARIA DE ESTADO DE EDUCAÇÃO - SEDUC</p>
                  <h1 className="text-base font-black uppercase text-gray-900">ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ MAGGI</h1>
                  <p className="text-[10px] font-bold text-gray-600 uppercase">CÓDIGO INEP: 51007890 • COLÍDER / MT</p>
                  <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">CONSELHO DELIBERATIVO DA COMUNIDADE ESCOLAR - CDCE • ALIMENTAÇÃO ESCOLAR</p>
                </div>

                {/* Document Title */}
                <div className="text-center my-6">
                  <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 underline decoration-red-600 decoration-2 underline-offset-4">
                    DECLARAÇÃO DE DÉBITOS DE GUIAS EM ABERTO
                  </h2>
                  <p className="text-[10px] font-bold uppercase text-gray-500 mt-1">
                    Demonstrativo Oficial de Guias de Recebimento Pendentes de Quitação Financeira
                  </p>
                </div>

                {/* Declaratory Text */}
                <div className="text-xs text-gray-800 leading-relaxed text-justify space-y-2">
                  <p>
                    Declaramos, para os devidos fins de direito, prestação de contas e fiscalização financeira perante a Secretaria de Estado de Educação de Mato Grosso (SEDUC/MT) e órgãos de controle, que a Unidade Escolar <b>E.E. André Maggi</b> apresenta o seguinte demonstrativo consolidado de <b>Guias de Recebimento</b> lançadas no sistema e pendentes de quitação financeira por fornecedor na presente data:
                  </p>
                </div>

                {/* Table of Debts */}
                <div className="my-6">
                  <table className="w-full text-left border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-800 border-b border-gray-300">
                        <th className="p-2 border-r border-gray-300">Nº Contrato</th>
                        <th className="p-2 border-r border-gray-300">Fornecedor / Licitante</th>
                        <th className="p-2 border-r border-gray-300 text-center">Guias Lançadas</th>
                        <th className="p-2 border-r border-gray-300 text-right">Valor Guias (R$)</th>
                        <th className="p-2 border-r border-gray-300 text-right text-emerald-800">Guias Pagas (R$)</th>
                        <th className="p-2 text-right font-black text-red-700 bg-red-50">Débito em Aberto (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300 text-[10px]">
                      {contracts.map(c => {
                        const gStats = perContractGuideStats[c.id] || { totalGuidesValue: 0, paidGuidesValue: 0, openGuidesValue: 0, guidesCount: 0, openGuidesCount: 0, paidGuidesCount: 0 };

                        return (
                          <tr key={c.id}>
                            <td className="p-2 border-r border-gray-300 font-bold">{c.number}</td>
                            <td className="p-2 border-r border-gray-300 font-bold uppercase">{c.supplierName}</td>
                            <td className="p-2 border-r border-gray-300 text-center font-bold">{gStats.guidesCount}</td>
                            <td className="p-2 border-r border-gray-300 text-right font-medium">
                              {gStats.totalGuidesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 border-r border-gray-300 text-right font-bold text-emerald-700">
                              {gStats.paidGuidesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-right font-black text-red-700 bg-red-50/50">
                              {gStats.openGuidesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-900 text-white font-black text-[10px] uppercase">
                        <td colSpan={2} className="p-2.5">TOTAL GERAL CONSOLIDADO</td>
                        <td className="p-2.5 text-center">{stats.totalGuidesCount}</td>
                        <td className="p-2.5 text-right">
                          R$ {stats.totalGuidesSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-right text-emerald-400">
                          R$ {stats.totalPaidGuidesSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-right text-red-400 bg-red-950/40">
                          R$ {stats.totalOpenGuidesSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Summary Statement */}
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center space-y-1">
                  <p className="text-[10px] font-black text-red-900 uppercase">MONTANTE TOTAL EM ABERTO (GUIAS LANÇADAS PENDENTES):</p>
                  <p className="text-2xl font-black text-red-700">
                    R$ {stats.totalOpenGuidesSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[9px] font-bold text-red-600 uppercase">
                    (Soma referente a {stats.openGuidesCount} guias de recebimento lançadas no sistema aguardando quitação financeira)
                  </p>
                </div>

                {/* Date & Signatures */}
                <div className="pt-8 space-y-12">
                  <p className="text-right text-xs font-bold uppercase text-gray-700">
                    Colíder - MT, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>

                  <div className="grid grid-cols-2 gap-8 text-center pt-6">
                    <div className="space-y-2">
                      <div className="w-48 border-b-2 border-gray-800 mx-auto"></div>
                      <p className="text-[10px] font-black uppercase text-gray-900">Gestor(a) da Merenda Escolar</p>
                      <p className="text-[8px] font-bold uppercase text-gray-500">E.E. André Maggi • SEDUC/MT</p>
                    </div>

                    <div className="space-y-2">
                      <div className="w-48 border-b-2 border-gray-800 mx-auto"></div>
                      <p className="text-[10px] font-black uppercase text-gray-900">Direção Escolar / Presidente CDCE</p>
                      <p className="text-[8px] font-bold uppercase text-gray-500">E.E. André Maggi • SEDUC/MT</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;


