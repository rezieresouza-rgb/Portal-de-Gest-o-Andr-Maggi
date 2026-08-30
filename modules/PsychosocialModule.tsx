import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  LayoutDashboard,
  Users,
  Calendar,
  History,
  ArrowLeft,
  ShieldCheck,
  MessageCircle,
  Scale,
  AlertCircle,
  Bell,
  Lock,
  UserCheck,
  Megaphone,
  FileSpreadsheet,
  CalendarCheck,
  ShieldAlert,
  FileText,
  Building2,
  Brain,
  CalendarDays
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import PsychosocialDashboard from '../components/PsychosocialDashboard';
import PsychosocialCaseManager from '../components/PsychosocialCaseManager';
import MediationManager from '../components/MediationManager';
import PsychosocialAgenda from '../components/PsychosocialAgenda';
import PsychosocialReports from '../components/PsychosocialReports';
import CampaignManager from '../components/CampaignManager';
import PsychosocialReferralList from '../components/PsychosocialReferralList';
import UnifiedSchoolCalendar from '../components/UnifiedSchoolCalendar';
import RightsViolationForm from '../components/RightsViolationForm';
import PsychosocialMeetingAtaManager from '../components/PsychosocialMeetingAtaManager';
import PsychosocialExternalNetworkManager from '../components/PsychosocialExternalNetworkManager';
import PsychosocialCircumstantiatedReportManager from '../components/PsychosocialCircumstantiatedReportManager';
import MediationCalendarManager from '../components/MediationCalendarManager';
import SpecialEducationAEEHub from '../components/SpecialEducationAEEHub';
import { PsychosocialRole } from '../types';

interface PsychosocialModuleProps {
  user?: any;
  onExit: () => void;
}

const PsychosocialModule: React.FC<PsychosocialModuleProps> = ({ user, onExit }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cases' | 'mediation' | 'mediation_calendar' | 'circumstantiated_report' | 'external_network' | 'campaigns' | 'agenda' | 'reports' | 'referrals' | 'calendar' | 'violation_notification' | 'atas' | 'aee_special_education'>('dashboard');
  
  const isDanubia = user?.name?.toUpperCase().includes('DANUBIA') || user?.login?.includes('35636524811');
  const [userRole, setUserRole] = useState<PsychosocialRole>(
    isDanubia ? 'MEDIAÇÃO' : (user?.role === 'MEDIAÇÃO' || user?.role === 'MEDIACAO' ? 'MEDIAÇÃO' : 'PSICOSSOCIAL')
  );

  useEffect(() => {
    if (isDanubia) {
      setUserRole('MEDIAÇÃO');
    }
  }, [isDanubia]);

  const [notifCount, setNotifCount] = useState(0);
  const [pendingSearch, setPendingSearch] = useState<string | undefined>(undefined);

  const navigateWithContext = (tab: any, search?: string) => {
    setPendingSearch(search);
    setActiveTab(tab);
  };

  const fetchNotifications = async () => {
    try {
      const { count, error } = await supabase
        .from('psychosocial_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (!error && count !== null) {
        setNotifCount(count);
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const subscription = supabase
      .channel('psychosocial_notifications_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'psychosocial_notifications'
      }, fetchNotifications)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const clearNotifications = async () => {
    try {
      const { error } = await supabase
        .from('psychosocial_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (!error) {
        setNotifCount(0);
      }
    } catch (error) {
      console.error("Erro ao limpar notificações:", error);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Monitor de Saúde & Alertas', icon: LayoutDashboard },
    { id: 'cases', label: 'Prontuários & Atendimentos', icon: Brain },
    { id: 'mediation', label: 'Triagens da Mediação (Fila)', icon: HeartHandshake },
    { id: 'mediation_calendar', label: 'Calendário de Mediação & Paz', icon: CalendarDays },
    { id: 'circumstantiated_report', label: 'Relatório Circunstanciado (Fatos)', icon: FileText },
    { id: 'aee_special_education', label: 'Educação Especial & AEE', icon: Brain },
    { id: 'external_network', label: 'Rede de Proteção & Ofícios', icon: Building2 },
    { id: 'violation_notification', label: 'Notificação Violação ECA', icon: ShieldAlert },
    { id: 'agenda', label: 'Agenda de Atendimentos', icon: Calendar },
    { id: 'atas', label: 'Atas de Reunião Técnica', icon: FileText },
    { id: 'reports', label: 'Indicadores & Relatórios', icon: History },
    { id: 'campaigns', label: 'Campanhas & Ações', icon: Megaphone },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* Sidebar Navegação Moderna */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shrink-0 no-print border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-rose-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-rose-600/20">
              <Brain size={26} />
            </div>
            <div>
              <h1 className="text-base font-black uppercase tracking-tight text-white leading-tight">
                Equipe Psicossocial
              </h1>
              <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mt-0.5">
                Proteção Integral Discente • SEDUC/MT
              </p>
            </div>
          </div>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                if (item.id === 'mediation') clearNotifications();
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg shadow-rose-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.id === 'mediation' && notifCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  {notifCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Rodapé da Sidebar (Perfil e Sair) */}
        <div className="p-6 border-t border-slate-800 space-y-3 bg-slate-950/40">
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <UserCheck size={12} className="text-rose-400" /> Perfil Ativo
            </p>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as PsychosocialRole)}
              className="w-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-tight p-2 rounded-xl outline-none border border-slate-700 cursor-pointer"
            >
              <option value="PSICOSSOCIAL">PSICÓLOGO(A) / ASSISTENTE SOCIAL</option>
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
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <HeartHandshake size={22} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Módulo da Equipe Psicossocial & Proteção Discente
              </h2>
              <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">
                Escuta Especializada • Triagem da Mediação • Rede de Proteção
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {notifCount > 0 ? (
              <button
                onClick={() => { setActiveTab('mediation'); clearNotifications(); }}
                className="flex items-center gap-2.5 px-4 py-2 bg-rose-50 text-rose-700 rounded-full border border-rose-200 hover:bg-rose-100 transition-colors shadow-sm"
              >
                <AlertCircle size={14} className="animate-pulse text-rose-600" />
                <span className="text-[10px] font-black uppercase tracking-widest">{notifCount} Novos Casos Triados</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 shadow-sm">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest">Proteção Ativa</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <img src="/brasao_mt.png" alt="MT" className="h-8 w-auto object-contain hidden lg:block" onError={(e) => e.currentTarget.style.display = 'none'} />
              <img src="/logo-escola-oficial.png" alt="Escola Logo" className="h-8 w-auto object-contain hidden lg:block" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
          </div>
        </header>

        {/* Conteúdo Dinâmico */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'dashboard' && <PsychosocialDashboard role={userRole} onNavigate={navigateWithContext} />}
          {activeTab === 'cases' && (
            <PsychosocialCaseManager
              user={user}
              role={userRole}
              initialSearch={pendingSearch}
            />
          )}
          {activeTab === 'mediation' && (
            <PsychosocialReferralList 
              user={user}
              role={userRole}
              initialSearch={pendingSearch}
            />
          )}
          {activeTab === 'mediation_calendar' && (
            <MediationCalendarManager
              user={user}
              role={userRole}
              onOpenNewCase={() => setActiveTab('cases')}
            />
          )}
          {activeTab === 'circumstantiated_report' && (
            <PsychosocialCircumstantiatedReportManager
              user={user}
              role={userRole}
            />
          )}
          {activeTab === 'aee_special_education' && (
            <SpecialEducationAEEHub
              sourceModule="PSICOSSOCIAL"
              user={user}
            />
          )}
          {activeTab === 'external_network' && (
            <PsychosocialExternalNetworkManager
              user={user}
              role={userRole}
            />
          )}
          {activeTab === 'violation_notification' && <RightsViolationForm />}
          {activeTab === 'agenda' && <PsychosocialAgenda role={userRole} />}
          {activeTab === 'atas' && <PsychosocialMeetingAtaManager />}
          {activeTab === 'reports' && <PsychosocialReports role={userRole} />}
          {activeTab === 'campaigns' && <CampaignManager role={userRole} />}
        </div>
      </main>
    </div>
  );
};

export default PsychosocialModule;
