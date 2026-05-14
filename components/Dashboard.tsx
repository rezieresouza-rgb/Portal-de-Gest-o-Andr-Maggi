
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { TrendingUp, AlertCircle, Wallet, ShieldCheck, Package, AlertTriangle, ArrowRight, CheckCircle2, GraduationCap } from 'lucide-react';
import { Contract } from '../types';
import { INITIAL_CONTRACTS } from '../constants/initialData';
import { useStudents } from '../hooks/useStudents';

const Dashboard: React.FC = () => {
  const { students } = useStudents();
  const studentCount = students.length;

  // Carrega contratos para visão financeira
  const contracts: Contract[] = useMemo(() => {
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
    return guaranteedContracts;
  }, []);

  // Carrega o controle de estoque para alertas físicos
  const inventoryAlerts = useMemo(() => {
    const saved = localStorage.getItem('seduc_inventory_v3');
    if (!saved) return [];
    const items = JSON.parse(saved);
    return items.filter((item: any) => (item.previousBalance + item.entries - item.outputs) < item.min);
  }, []);

  const stats = useMemo(() => {
    let globalValue = 0;
    let totalSpent = 0;
    let criticalContractItems: { label: string, consumed: number, remaining: string }[] = [];

    contracts.forEach(c => {
      c.items.forEach(item => {
        const val = item.contractedQuantity * item.unitPrice;
        const spent = item.acquiredQuantity * item.unitPrice;
        globalValue += val;
        totalSpent += spent;
        const consumedPercent = (item.acquiredQuantity / item.contractedQuantity) * 100;
        if (consumedPercent > 70) {
          criticalContractItems.push({
            label: item.description,
            consumed: consumedPercent,
            remaining: `${(item.contractedQuantity - item.acquiredQuantity).toFixed(1)} ${item.unit}`
          });
        }
      });
    });

    return {
      globalValue,
      totalSpent,
      remaining: globalValue - totalSpent,
      criticalContractItems: criticalContractItems.sort((a, b) => b.consumed - a.consumed).slice(0, 5)
    };
  }, [contracts]);

  const chartData = [
    { name: 'Gasto Realizado', valor: stats.totalSpent },
    { name: 'Saldo Disponível', valor: stats.remaining },
  ];

  const COLORS = ['#10b981', '#3b82f6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 w-full min-w-0">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1 w-full">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 uppercase tracking-tight truncate">Painel de Controle Estratégico</h2>
            <div className="flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-600 px-2 py-1 rounded-lg uppercase shrink-0">
               <ShieldCheck size={12} className="shrink-0" /> Monitoramento Ativo
            </div>
          </div>
          <p className="text-gray-500 font-medium text-xs sm:text-sm truncate mt-1">Sincronizado com {studentCount} alunos beneficiários da Secretaria</p>
        </div>
        <div className="text-left md:text-right shrink-0">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Última Atualização</p>
          <p className="text-xs font-bold text-gray-900">{new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* CENTRAL DE ALERTAS DE ESTOQUE FÍSICO */}
      {inventoryAlerts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-top-4 duration-500 w-full min-w-0">
          <div className="bg-red-50 border border-red-100 p-4 sm:p-6 rounded-[2rem] shadow-sm min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 bg-red-600 text-white rounded-2xl animate-pulse shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-lg font-black text-red-900 uppercase tracking-tight truncate">Alertas de Reposição Imediata</h3>
                  <p className="text-red-700 text-[10px] sm:text-xs font-medium uppercase tracking-tighter truncate">Estoque físico abaixo do mínimo de segurança</p>
                </div>
              </div>
              <span className="bg-red-200 text-red-800 text-[10px] font-black px-3 py-1 rounded-full uppercase shrink-0 self-start sm:self-center">
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
                      <div className="p-2 bg-red-50 text-red-500 rounded-lg shrink-0">
                        <Package size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-gray-900 uppercase leading-tight truncate">{item.name}</p>
                        <p className="text-[9px] text-red-500 font-bold uppercase mt-0.5 truncate">Faltam: {deficit.toLocaleString('pt-BR')} {item.unit}</p>
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

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full min-w-0">
        <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                <Wallet size={24} />
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase shrink-0">Global</span>
            </div>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest truncate">Orçamento Rede</h3>
          </div>
          <p className="text-xl md:text-2xl font-black mt-1 text-gray-900 truncate">R$ {stats.globalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                <GraduationCap size={24} />
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase shrink-0">Sincronizado</span>
            </div>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest truncate">Beneficiários</h3>
          </div>
          <p className="text-xl md:text-2xl font-black mt-1 text-blue-700 truncate">{studentCount} Alunos</p>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                <AlertCircle size={24} />
              </div>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase shrink-0">Alerta</span>
            </div>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest truncate">Contratos Próx. Fim</h3>
          </div>
          <p className="text-xl md:text-2xl font-black mt-1 text-gray-900 truncate">3 Unidades</p>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-full uppercase shrink-0">Saúde FÍSICA</span>
            </div>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest truncate">Abastecimento</h3>
          </div>
          <p className={`text-xl md:text-2xl font-black mt-1 truncate ${inventoryAlerts.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {inventoryAlerts.length > 0 ? 'Atenção' : 'Excelente'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 w-full min-w-0">
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-gray-100 shadow-sm min-w-0 w-full">
          <div className="flex items-center justify-between mb-6 gap-2 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 uppercase tracking-tight truncate">Execução Financeira Global</h3>
            <div className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0 hidden xs:block">Pregão + Agr. Familiar</div>
          </div>
          <div className="h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="valor" radius={[12, 12, 0, 0]} barSize={80}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-gray-100 shadow-sm min-w-0 w-full">
          <div className="flex items-center justify-between mb-6 gap-2 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 uppercase tracking-tight truncate">Riscos de Desabastecimento</h3>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0"><AlertCircle size={20} /></span>
          </div>
          <div className="space-y-6 w-full min-w-0">
            {stats.criticalContractItems.length > 0 ? stats.criticalContractItems.map((item, i) => (
              <div key={i} className="min-w-0 w-full">
                <div className="flex justify-between items-end mb-2 gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-gray-900 uppercase leading-tight truncate">{item.label}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 truncate">Saldo Contrato: {item.remaining}</p>
                  </div>
                  <span className={`text-[10px] font-black shrink-0 ${item.consumed >= 90 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {item.consumed.toFixed(0)}% Utilizado
                  </span>
                </div>
                <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                  <div 
                    className={`h-full transition-all duration-700 rounded-full ${
                      item.consumed >= 90 ? 'bg-red-500' : item.consumed >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} 
                    style={{ width: `${item.consumed}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="text-center py-12 min-w-0 w-full">
                <div className="inline-flex p-4 bg-emerald-50 text-emerald-600 rounded-full mb-4 shrink-0">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-gray-900 font-black uppercase text-xs tracking-widest truncate">Execução sob controle</p>
                <p className="text-gray-400 text-[10px] font-bold mt-1 truncate">Nenhum contrato atingiu o limite crítico de 70%.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
