import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  HeartHandshake, 
  FileText, 
  CalendarDays, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft, 
  UserCheck, 
  Plus, 
  Users, 
  CheckCircle2, 
  Search, 
  MessageSquare, 
  Share2, 
  Clock, 
  Award,
  BookOpen
} from 'lucide-react';
import { User, PsychosocialRole } from '../types';
import MediationManager from '../components/MediationManager';
import PsychosocialMeetingAtaManager from '../components/PsychosocialMeetingAtaManager';
import PsychosocialAgenda from '../components/PsychosocialAgenda';
import PsychosocialReports from '../components/PsychosocialReports';
import { supabase } from '../supabaseClient';

interface MediationModuleProps {
  user?: any;
  onExit: () => void;
}

const MediationModule: React.FC<MediationModuleProps> = ({ user, onExit }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cases' | 'atas' | 'agenda' | 'reports'>('dashboard');
  const [userRole, setUserRole] = useState<PsychosocialRole>('PSICOSSOCIAL');
  const [casesCount, setCasesCount] = useState({ total: 0, active: 0, agreements: 0, triaged: 0 });

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('mediation_cases')
        .select('*');
      if (data && Array.isArray(data)) {
        const total = data.length;
        const active = data.filter((c: any) => c && c.status !== 'CONCLUÍDO' && c.status !== 'CONCLUIDO').length;
        const agreements = data.filter((c: any) => c && (c.status === 'CONCLUÍDO' || c.status === 'CONCLUIDO')).length;
        const triaged = data.filter((c: any) => c && (c.feedback || (typeof c.description === 'string' && c.description.includes('PSICOSSOCIAL')))).length;
        setCasesCount({ total, active, agreements, triaged });
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas da mediação:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Painel & Clima Escolar', icon: <Scale size={18} /> },
    { id: 'cases', label: 'Atendimentos & Círculos', icon: <HeartHandshake size={18} /> },
    { id: 'atas', label: 'Central de Atas (SEDUC)', icon: <FileText size={18} /> },
    { id: 'agenda', label: 'Agenda de Conciliação', icon: <CalendarDays size={18} /> },
    { id: 'reports', label: 'Indicadores & Triagens', icon: <TrendingUp size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* Sidebar Navegação do Módulo de Mediação Escolar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shrink-0 no-print border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-amber-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
              <Scale size={26} />
            </div>
            <div>
              <h1 className="text-base font-black uppercase tracking-tight text-white leading-tight">
                Mediação Escolar
              </h1>
              <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mt-0.5">
                Justiça Restaurativa • SEDUC/MT
              </p>
            </div>
          </div>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-indigo-600 to-amber-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Rodapé da Sidebar (Perfil e Sair) */}
        <div className="p-6 border-t border-slate-800 space-y-3 bg-slate-950/40">
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <UserCheck size={12} className="text-amber-400" /> Perfil Ativo
            </p>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as PsychosocialRole)}
              className="w-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-tight p-2 rounded-xl outline-none border border-slate-700 cursor-pointer"
            >
              <option value="PSICOSSOCIAL">PROFESSOR MEDIADOR</option>
              <option value="GESTAO">GESTÃO ESCOLAR</option>
              <option value="PROFESSOR">DOCENTE (CONSULTA)</option>
            </select>
          </div>

          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10"
          >
            <ArrowLeft size={16} /> Hub Principal
          </button>
        </div>
      </aside>

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Superior */}
        <header className="h-20 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 shrink-0 no-print shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <Scale size={22} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Módulo de Mediação Escolar & Justiça Restaurativa
              </h2>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">
                Círculos de Paz • Escuta Ativa • Solução Conflitiva
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 shadow-sm">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-widest">Cultura de Paz Ativa</span>
            </div>

            <div className="flex items-center gap-2">
              <img src="/brasao_mt.png" alt="MT" className="h-8 w-auto object-contain hidden lg:block" onError={(e) => e.currentTarget.style.display = 'none'} />
              <img src="/logo-escola-oficial.png" alt="Escola Logo" className="h-8 w-auto object-contain hidden lg:block" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
          </div>
        </header>

        {/* Conteúdo Dinâmico */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* TAB 1: PAINEL & CLIMA ESCOLAR */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Banner Topo */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl border border-indigo-900/50 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                      <Award size={12} /> Programa Estadual de Justiça Restaurativa Nas Escolas
                    </span>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                      Mediação de Conflitos & Triagem Intersetorial
                    </h2>
                    <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
                      Portal oficial para a condução de pré-círculos, escuta de partes, lavratura de atas oficiais e triagem direta para a Equipe Psicossocial com devolutivas em tempo real.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('cases')}
                    className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
                  >
                    <Plus size={18} /> Novo Protocolo de Mediação
                  </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
                  <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total de Protocolos</span>
                    <span className="text-2xl font-black text-white">{casesCount.total || 0}</span>
                  </div>
                  <div className="bg-amber-500/10 backdrop-blur-md p-4 rounded-2xl border border-amber-500/20">
                    <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest block mb-1">Em Acompanhamento</span>
                    <span className="text-2xl font-black text-amber-400">{casesCount.active || 0}</span>
                  </div>
                  <div className="bg-emerald-500/10 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/20">
                    <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest block mb-1">Acordos / Concluídos</span>
                    <span className="text-2xl font-black text-emerald-400">{casesCount.agreements || 0}</span>
                  </div>
                  <div className="bg-indigo-500/10 backdrop-blur-md p-4 rounded-2xl border border-indigo-500/20">
                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block mb-1">Triados p/ Psicossocial</span>
                    <span className="text-2xl font-black text-indigo-400">{casesCount.triaged || 0}</span>
                  </div>
                </div>
              </div>

              {/* Seção Informativa dos 3 Pilares da Mediação */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                    1
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Acolhimento & Pré-Círculo</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Escuta individual e qualificada da Parte 1 e Parte 2 para identificar as reais necessidades e causa raiz do conflito.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black">
                    2
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Triagem Intersetorial</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Se for constatado trauma ou necessidade clínica/social, o Mediador envia o caso diretamente para a Equipe Psicossocial.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                    3
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Ata Oficial & Acordo Mútuo</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Formalização do compromisso da sessão em Ata Oficial do Professor Mediador no modelo oficial homologado pela SEDUC/MT.
                  </p>
                </div>
              </div>

              {/* Gerenciador de Atendimentos */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200/80 p-8 shadow-sm">
                <MediationManager user={user} role={userRole} />
              </div>
            </div>
          )}

          {/* TAB 2: ATENDIMENTOS & CÍRCULOS */}
          {activeTab === 'cases' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200/80 p-8 shadow-sm animate-in fade-in duration-300">
              <MediationManager user={user} role={userRole} />
            </div>
          )}

          {/* TAB 3: CENTRAL DE ATAS DO MEDIADOR */}
          {activeTab === 'atas' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200/80 p-8 shadow-sm animate-in fade-in duration-300">
              <PsychosocialMeetingAtaManager />
            </div>
          )}

          {/* TAB 4: AGENDA DE CONCILIAÇÃO */}
          {activeTab === 'agenda' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200/80 p-8 shadow-sm animate-in fade-in duration-300">
              <PsychosocialAgenda role={userRole} />
            </div>
          )}

          {/* TAB 5: RELATÓRIOS & TRIAGENS */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200/80 p-8 shadow-sm animate-in fade-in duration-300">
              <PsychosocialReports role={userRole} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MediationModule;
