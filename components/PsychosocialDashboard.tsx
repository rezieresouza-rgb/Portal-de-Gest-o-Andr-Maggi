
import React, { useMemo } from 'react';
import { 
  AlertTriangle, 
  Activity, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  Calendar,
  MessageSquare,
  Scale,
  Brain,
  ShieldAlert,
  Megaphone
} from 'lucide-react';
import { PsychosocialRole } from '../types';

interface PsychosocialDashboardProps {
  role: PsychosocialRole;
}

const PsychosocialDashboard: React.FC<PsychosocialDashboardProps> = ({ role }) => {
  // Simulação de integração com Busca Ativa e Ocorrências
  const integratedAlerts = [
    { id: 1, type: 'OCORRÊNCIA', student: 'ADRIANO SANTOS', reason: '3 Ocorrências Disciplinares na semana', severity: 'ALTA' },
    { id: 2, type: 'BUSCA ATIVA', student: 'BRUNO SILVA', reason: 'Evasão escolar - Família não atende', severity: 'CRÍTICA' },
    { id: 3, type: 'CONFLITO', student: 'ANA & CARLA', reason: 'Possível bullying digital relatado', severity: 'MÉDIA' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mediações Ativas</p>
           <p className="text-3xl font-black text-gray-900 mt-1">12</p>
        </div>
        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 shadow-sm">
           <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Escutas Pendentes</p>
           <p className="text-3xl font-black text-rose-700 mt-1">5</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm">
           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Campanhas Ativas</p>
           <p className="text-3xl font-black text-emerald-700 mt-1">1</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm">
           <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Ações em Rede</p>
           <p className="text-3xl font-black text-amber-700 mt-1">4</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ALERTAS INTEGRADOS */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                    <ShieldAlert className="text-rose-600" /> Sinais de Alerta Integrados
                 </h3>
                 <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-3 py-1 rounded-full uppercase tracking-widest">IA Inteligência Coletiva</span>
              </div>

              <div className="space-y-4">
                 {integratedAlerts.map(alert => (
                   <div key={alert.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-transparent hover:border-rose-200 transition-all group">
                      <div className="flex items-center gap-6">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[10px] ${
                           alert.severity === 'CRÍTICA' ? 'bg-red-600 text-white animate-pulse' : 
                           alert.severity === 'ALTA' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                         }`}>
                           {alert.type[0]}
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <p className="text-sm font-black text-gray-900 uppercase">{alert.student}</p>
                               <span className="text-[8px] font-black bg-gray-200 text-gray-500 px-2 py-0.5 rounded uppercase">{alert.type}</span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">{alert.reason}</p>
                         </div>
                      </div>
                      <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                         Avaliar <ArrowRight size={14} />
                      </button>
                   </div>
                 ))}
              </div>
           </div>

           {/* CAMPANHA EM DESTAQUE NO DASHBOARD */}
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute -top-4 -right-4 p-8 opacity-5"><Megaphone size={100}/></div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                 <Megaphone className="text-rose-600" /> Ação Vigente
              </h3>
              <div className="bg-rose-50 p-5 rounded-3xl border border-rose-100 space-y-4">
                 <p className="text-xs font-black text-rose-700 uppercase leading-tight">Janeiro Branco: Saúde Mental Importa</p>
                 <div className="flex items-center justify-between text-[8px] font-black text-rose-400 uppercase tracking-widest">
                    <span>Progresso do Mês</span>
                    <span>75%</span>
                 </div>
                 <div className="w-full h-1.5 bg-rose-200 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-600" style={{ width: '75%' }}></div>
                 </div>
                 <button className="w-full py-2 bg-white text-rose-600 rounded-xl text-[8px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition-all">Ver Materiais</button>
              </div>
           </div>
        </div>

        {/* INSIGHTS E NOTAS */}
        <div className="space-y-6">
           <div className="bg-rose-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Brain size={140} /></div>
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                       <Activity size={20} className="text-rose-400" />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-widest">Saúde Relacional</h3>
                 </div>
                 <p className="text-rose-100/80 text-sm leading-relaxed font-medium">
                    O índice de conflitos interpessoais reduziu 22% no 9º Ano após os Círculos de Paz realizados na última quinzena.
                 </p>
                 <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-rose-300">
                       <span>Taxa de Acordo em Mediações</span>
                       <span>85%</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500" style={{ width: '85%' }}></div>
                    </div>
                 </div>
              </div>
              <button className="relative z-10 mt-8 w-full py-4 bg-white text-rose-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 transition-all shadow-lg">
                 Novo Relatório Mensal
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PsychosocialDashboard;
