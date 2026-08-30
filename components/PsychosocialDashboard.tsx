import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  Activity, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  Calendar,
  MessageSquare as MessageSquareIcon,
  Scale,
  Brain,
  ShieldAlert,
  Megaphone,
  Building2,
  HeartHandshake,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { PsychosocialRole } from '../types';

interface PsychosocialDashboardProps {
  role: PsychosocialRole;
  onNavigate?: (tab: string, search?: string) => void;
}

const PsychosocialDashboard: React.FC<PsychosocialDashboardProps> = ({ role, onNavigate }) => {
  const [stats, setStats] = useState({
    pendingTriages: 0,
    inProgress: 0,
    externalReferrals: 0,
    violations: 0
  });
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveDashboardData = async () => {
    try {
      // 1. Casos de Mediação que foram Triados para o Psicossocial
      const { data: medCases } = await supabase
        .from('mediation_cases')
        .select('*');

      const triagedCases = (medCases || []).filter((c: any) => 
        (typeof c.description === 'string' && c.description.includes('PSICOSSOCIAL')) ||
        (c.feedback && c.feedback.includes('PSICOSSOCIAL'))
      );

      // 2. Encaminhamentos Internos
      const { data: referrals } = await supabase
        .from('psychosocial_referrals')
        .select('*');

      // 3. Encaminhamentos Externos (Conselho Tutelar, CAPSi, etc.)
      const { data: extRefs } = await supabase
        .from('psychosocial_external_referrals')
        .select('*');

      // 4. Notificações de Violação de Direitos (ECA)
      const savedViolations = localStorage.getItem('rights_violation_notifications_v1');
      const violationsList = savedViolations ? JSON.parse(savedViolations) : [];

      const pending = triagedCases.length + (referrals || []).filter((r: any) => r.status === 'PENDENTE' || r.status === 'AGUARDANDO').length;
      const inProg = (referrals || []).filter((r: any) => r.status === 'EM_ACOMPANHAMENTO').length;
      const extCount = (extRefs || []).length;
      const violCount = violationsList.length;

      setStats({
        pendingTriages: pending,
        inProgress: inProg,
        externalReferrals: extCount,
        violations: violCount
      });

      // Construir Alertas em Tempo Real
      const alerts: any[] = [];

      triagedCases.slice(0, 4).forEach((c: any) => {
        alerts.push({
          id: `med-${c.id}`,
          student: c.student_name || 'Estudante em Mediação',
          type: 'Triagem Mediação',
          severity: c.severity === 'CRÍTICA' ? 'CRÍTICA' : 'ALTA',
          reason: c.description?.replace(/\[TRIAGEM.*?\]/g, '').substring(0, 90) + '...',
          targetTab: 'mediation',
          date: c.opened_at || c.created_at
        });
      });

      (extRefs || []).filter((r: any) => r.urgency === 'URGENTÍSSIMA' || r.urgency === 'URGENTE').slice(0, 3).forEach((r: any) => {
        alerts.push({
          id: `ext-${r.id}`,
          student: r.student_name,
          type: `Rede: ${r.destination?.replace('_', ' ') || 'Órgão'}`,
          severity: r.urgency === 'URGENTÍSSIMA' ? 'CRÍTICA' : 'ALTA',
          reason: r.reason?.substring(0, 90) + '...',
          targetTab: 'external_network',
          date: r.referral_date || r.created_at
        });
      });

      setLiveAlerts(alerts);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard psicossocial:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      
      {/* BANNER PRINCIPAL COM GRADIENTE MODERNO */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl border border-indigo-900/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
              <Brain size={12} /> Equipe Multidisciplinar Psicossocial & Proteção Discente
            </span>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              Painel de Monitoramento & Escuta Especializada
            </h2>
            <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
              Acompanhamento integrado de casos graves triados pela Mediação Escolar, prontuários de atendimento e articulação técnica com a Rede Externa de Proteção.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => onNavigate?.('mediation')}
              className="px-5 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
            >
              <HeartHandshake size={16} /> Fila de Triagens ({stats.pendingTriages})
            </button>
            <button
              onClick={() => onNavigate?.('external_network')}
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Building2 size={16} /> Rede de Proteção
            </button>
          </div>
        </div>

        {/* KPI CARDS INTEGRADOS AO BANNER */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div 
            onClick={() => onNavigate?.('mediation')}
            className="bg-white/5 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md p-4 rounded-2xl border border-white/10"
          >
            <span className="text-[9px] font-black text-rose-300 uppercase tracking-widest block mb-1">Triagens da Mediação</span>
            <span className="text-2xl font-black text-white">{stats.pendingTriages}</span>
          </div>

          <div 
            onClick={() => onNavigate?.('cases')}
            className="bg-indigo-500/10 hover:bg-indigo-500/20 transition-all cursor-pointer backdrop-blur-md p-4 rounded-2xl border border-indigo-500/20"
          >
            <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block mb-1">Prontuários & Casos</span>
            <span className="text-2xl font-black text-indigo-400">{stats.inProgress}</span>
          </div>

          <div 
            onClick={() => onNavigate?.('external_network')}
            className="bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer backdrop-blur-md p-4 rounded-2xl border border-amber-500/20"
          >
            <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest block mb-1">Ofícios à Rede Externa</span>
            <span className="text-2xl font-black text-amber-400">{stats.externalReferrals}</span>
          </div>

          <div 
            onClick={() => onNavigate?.('violation_notification')}
            className="bg-red-500/10 hover:bg-red-500/20 transition-all cursor-pointer backdrop-blur-md p-4 rounded-2xl border border-red-500/20"
          >
            <span className="text-[9px] font-black text-red-300 uppercase tracking-widest block mb-1">Notificações ECA</span>
            <span className="text-2xl font-black text-red-400">{stats.violations}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SINAIS DE ALERTA INTEGRADOS (FEED EM TEMPO REAL) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Sinais de Alerta & Casos Prioritários</h3>
                  <p className="text-xs text-slate-500 font-medium">Protocolos graves encaminhados para a equipe técnica</p>
                </div>
              </div>
              <span className="text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full uppercase tracking-widest">
                Monitoramento Ativo
              </span>
            </div>

            <div className="space-y-3">
              {liveAlerts.map(alert => (
                <div 
                  key={alert.id} 
                  className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      alert.severity === 'CRÍTICA' ? 'bg-red-600 text-white animate-pulse' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {alert.severity === 'CRÍTICA' ? '🚨' : '⚠️'}
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-black text-slate-900 uppercase">{alert.student}</p>
                        <span className="text-[8px] font-black bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase">
                          {alert.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium line-clamp-1">{alert.reason}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onNavigate?.('cases', alert.student)}
                    className="ml-3 flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 shadow-sm"
                  >
                    Acolher <ArrowRight size={12} />
                  </button>
                </div>
              ))}
              
              {liveAlerts.length === 0 && (
                <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-slate-500 uppercase">Nenhum protocolo com risco crítico pendente no momento.</p>
                </div>
              )}
            </div>
          </div>

          {/* FLUXO INSTITUCIONAL EM 3 PILARES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => onNavigate?.('mediation')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer space-y-2"
            >
              <div className="w-9 h-9 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center font-black text-xs">
                1
              </div>
              <h4 className="text-xs font-black uppercase text-slate-900">Triagem da Mediação</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Recebimento imediato dos casos encaminhados pelo Professor Mediador com histórico prévio.
              </p>
            </div>

            <div 
              onClick={() => onNavigate?.('cases')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer space-y-2"
            >
              <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-black text-xs">
                2
              </div>
              <h4 className="text-xs font-black uppercase text-slate-900">Prontuário & Atendimento</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Escuta qualificada com o estudante, família e elaboração de parecer técnico.
              </p>
            </div>

            <div 
              onClick={() => onNavigate?.('external_network')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer space-y-2"
            >
              <div className="w-9 h-9 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-black text-xs">
                3
              </div>
              <h4 className="text-xs font-black uppercase text-slate-900">Rede de Proteção</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Emissão formal de ofícios e notificações para Conselho Tutelar, CAPSi/SUS, CRAS e CREAS.
              </p>
            </div>
          </div>
        </div>

        {/* COLUNA LATERAL DE ATALHOS E AÇÃO INSTITUCIONAL */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-7 rounded-[2.5rem] text-white shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Activity size={20} className="text-rose-400" />
                </div>
                <h3 className="text-base font-black uppercase tracking-wider">Articulação em Rede</h3>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed font-medium">
                O fluxo técnico entre Mediação Escolar e Equipe Psicossocial garante atendimento humanizado e resposta célere às situações de risco e vulnerabilidade discente.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button 
                onClick={() => onNavigate?.('external_network')}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Building2 size={14} /> Emitir Ofício à Rede Externa
              </button>
              <button 
                onClick={() => onNavigate?.('violation_notification')}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <ShieldAlert size={14} /> Notificação de Violação ECA
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PsychosocialDashboard;

