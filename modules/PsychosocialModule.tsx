
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
  FileText
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import PsychosocialDashboard from '../components/PsychosocialDashboard';
import MediationManager from '../components/MediationManager';
import PsychosocialAgenda from '../components/PsychosocialAgenda';
import PsychosocialReports from '../components/PsychosocialReports';
import CampaignManager from '../components/CampaignManager';
import PsychosocialReferralList from '../components/PsychosocialReferralList';
import UnifiedSchoolCalendar from '../components/UnifiedSchoolCalendar';
import RightsViolationForm from '../components/RightsViolationForm';
import PsychosocialMeetingAtaManager from '../components/PsychosocialMeetingAtaManager';
import { PsychosocialRole } from '../types';

interface PsychosocialModuleProps {
  onExit: () => void;
}

const PsychosocialModule: React.FC<PsychosocialModuleProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mediation' | 'campaigns' | 'agenda' | 'reports' | 'referrals' | 'calendar' | 'violation_notification' | 'atas'>('dashboard');
  const [userRole, setUserRole] = useState<PsychosocialRole>('PSICOSSOCIAL');
  /* 
   * MIGRAÇÃO SUPABASE: Notificações
   * Substituição do localStorage por tabela 'psychosocial_notifications'
   */
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
    // [Limpeza de Dados Mockados] Remove os dados de teste salvos inicialmente no localStorage do usuário
    const medSaved = localStorage.getItem('mediation_cases_v1');
    if (medSaved) {
      let cases = JSON.parse(medSaved);
      cases = cases.filter((c: any) => c.id !== 'med-1');
      localStorage.setItem('mediation_cases_v1', JSON.stringify(cases));
    }
    
    const agSaved = localStorage.getItem('psychosocial_appointments_v1');
    if (agSaved) {
      let apps = JSON.parse(agSaved);
      apps = apps.filter((a: any) => a.id !== 'ap-1');
      localStorage.setItem('psychosocial_appointments_v1', JSON.stringify(apps));
    }
    
    const campSaved = localStorage.getItem('school_campaigns_v2026');
    if (campSaved) {
      let camps = JSON.parse(campSaved);
      camps = camps.filter((c: any) => !c.id.startsWith('camp-2026-0') && !c.id.startsWith('camp-2026-1'));
      localStorage.setItem('school_campaigns_v2026', JSON.stringify(camps));
    }

    fetchNotifications();

    // Inscrever para atualizações em tempo real
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
      // Marca todas como lidas
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
    { id: 'dashboard', label: 'Monitor de Saúde', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendário 2026', icon: CalendarCheck },
    { id: 'referrals', label: 'Encaminhamentos', icon: FileSpreadsheet },
    { id: 'atas', label: 'Atas de Reunião', icon: FileText },
    { id: 'violation_notification', label: 'Notificação de Violência', icon: ShieldAlert },
    { id: 'mediation', label: 'Mediação de Conflitos', icon: Scale },
    { id: 'campaigns', label: 'Campanhas Escolares', icon: Megaphone },
    { id: 'agenda', label: 'Agenda Psicossocial', icon: Calendar },
    { id: 'reports', label: 'Indicadores e Relatórios', icon: History },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <aside className="w-64 bg-rose-950 text-white flex flex-col no-print transition-all duration-300">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-rose-500 p-1.5 rounded-lg shadow-lg">🤝</span>
            Equipe Multi
          </h1>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                if (item.id === 'referrals') clearNotifications();
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === item.id
                ? 'bg-rose-800 text-white shadow-lg'
                : 'text-rose-100/50 hover:bg-rose-800/30'
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                {item.label}
              </div>
              {item.id === 'referrals' && notifCount > 0 && (
                <span className="bg-white text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  {notifCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-rose-900 space-y-3">
          <div className="bg-rose-900/50 p-4 rounded-2xl border border-rose-800/50">
            <p className="text-[10px] text-rose-300 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <UserCheck size={10} /> Perfil Ativo
            </p>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as PsychosocialRole)}
              className="w-full bg-rose-800 text-white text-[10px] font-black uppercase tracking-tight p-2 rounded-lg outline-none cursor-pointer"
            >
              <option value="PSICOSSOCIAL">PSICOSSOCIAL / TÉCNICO</option>
              <option value="GESTAO">GESTÃO ESCOLAR</option>
              <option value="PROFESSOR">PROFESSOR (CONSULTA)</option>
            </select>
          </div>

          <button
            onClick={onExit}
            className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            <ArrowLeft size={16} /> Sair do Módulo
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 shrink-0 no-print">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <HeartHandshake size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase">Módulo: Mediação e Equipe Psicossocial</h2>
              <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">Proteção e Bem-estar Discente</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {notifCount > 0 ? (
              <button
                onClick={() => { setActiveTab('referrals'); clearNotifications(); }}
                className="flex items-center gap-3 px-4 py-2 bg-rose-50 text-rose-600 rounded-full border border-rose-100 hover:bg-rose-100 transition-colors"
              >
                <AlertCircle size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">{notifCount} Novos Encaminhamentos</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 text-gray-400 rounded-full border border-gray-100">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Tudo Sob Controle</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white font-black text-sm uppercase">
              {userRole[0]}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'dashboard' && <PsychosocialDashboard role={userRole} onNavigate={navigateWithContext} />}
          {activeTab === 'calendar' && <UnifiedSchoolCalendar />}
          {activeTab === 'referrals' && (
            <PsychosocialReferralList 
              role={userRole} 
              filterDestination="MEDIACAO" 
              onTabChange={(tab: any) => setActiveTab(tab)} 
              initialSearch={pendingSearch}
            />
          )}
          {activeTab === 'atas' && <PsychosocialMeetingAtaManager />}
          {activeTab === 'violation_notification' && <RightsViolationForm />}
          {activeTab === 'mediation' && (
            <MediationManager 
              role={userRole} 
              onTabChange={(tab: any) => setActiveTab(tab)} 
              initialSearch={pendingSearch}
            />
          )}
          {activeTab === 'agenda' && <PsychosocialAgenda role={userRole} />}
          {activeTab === 'reports' && <PsychosocialReports role={userRole} />}
          {activeTab === 'campaigns' && <CampaignManager role={userRole} />}
        </div>
      </main>
    </div>
  );
};

export default PsychosocialModule;
