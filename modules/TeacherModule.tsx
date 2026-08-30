import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ArrowLeft,
  ShieldCheck,
  Maximize2,
  Lock,
  UserCheck,
  AlertCircle,
  ClipboardList,
  History,
  LayoutDashboard,
  FileEdit,
  GraduationCap as GradeIcon,
  Package,
  Bell,
  MessageSquare as MessageSquareIcon,
  CalendarCheck,
  FileSpreadsheet,
  Menu,
  X,
  CalendarDays,
  Sparkles,
  Home,
  CheckCircle2,
  Layers
} from 'lucide-react';
import TeacherAttendance from '../components/TeacherAttendance';
import TeacherAssessmentSchedule from '../components/TeacherAssessmentSchedule';
import TeacherOccurrences from '../components/TeacherOccurrences';
import TeacherPerformance from '../components/TeacherPerformance';
import TeacherLessonPlan from '../components/TeacherLessonPlan';
import TeacherGrades from '../components/TeacherGrades';
import TeacherPedagogicalRequests from '../components/TeacherPedagogicalRequests';
import UnifiedSchoolCalendar from '../components/UnifiedSchoolCalendar';
import TeacherDashboardHome from '../components/TeacherDashboardHome';
import { SecretariatNotification, User as UserType } from '../types';

interface TeacherModuleProps {
  user: UserType;
  onExit: () => void;
}

type SubTab = 'dashboard' | 'attendance' | 'grades' | 'evaluations' | 'occurrences' | 'lesson_plan' | 'performance' | 'calendar' | 'material_requests';

const TeacherModule: React.FC<TeacherModuleProps> = ({ user, onExit }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('dashboard');
  const [isLocked, setIsLocked] = useState(false);
  const [notifications, setNotifications] = useState<SecretariatNotification[]>([]);
  const [showNotifBar, setShowNotifBar] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkLock = () => {
      setIsLocked(localStorage.getItem('system_shield_lock') === 'true');
    };
    const checkNotifs = () => {
      try {
        const saved = localStorage.getItem('secretariat_notifications_v1');
        if (saved) {
          const parsed: SecretariatNotification[] = JSON.parse(saved);
          setNotifications(parsed.filter(n => !n.isRead));
          if (parsed.some(n => !n.isRead)) setShowNotifBar(true);
        }
      } catch (e) {
        console.error("Error parsing TeacherModule notifications:", e);
      }
    };
    checkLock();
    checkNotifs();
    window.addEventListener('storage', () => { checkLock(); checkNotifs(); });
  }, []);

  const markAsRead = (id: string) => {
    const saved = localStorage.getItem('secretariat_notifications_v1');
    if (saved) {
      const parsed: SecretariatNotification[] = JSON.parse(saved);
      const updated = parsed.map(n => n.id === id ? { ...n, isRead: true } : n);
      localStorage.setItem('secretariat_notifications_v1', JSON.stringify(updated));
      setNotifications(updated.filter(n => !n.isRead));
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Meu Dia Letivo', icon: Home, highlight: true },
    { id: 'attendance', label: 'Diário de Presença', icon: UserCheck },
    { id: 'grades', label: 'Lançar Notas', icon: GradeIcon },
    { id: 'evaluations', label: 'Cronograma de Avaliações', icon: CalendarDays },
    { id: 'occurrences', label: 'Ocorrências & Encaminhamentos', icon: AlertCircle },
    { id: 'lesson_plan', label: 'Roteiro Pedagógico (BNCC)', icon: FileEdit },
    { id: 'performance', label: 'Desempenho da Turma', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendário Letivo', icon: CalendarCheck },
    { id: 'material_requests', label: 'Solicitar Materiais', icon: Package },
  ];

  const renderContent = () => {
    switch (activeSubTab) {
      case 'dashboard':
        return <TeacherDashboardHome user={user} onNavigate={(tabId) => setActiveSubTab(tabId as SubTab)} />;
      case 'attendance':
        return <TeacherAttendance user={user} />;
      case 'grades':
        return <TeacherGrades user={user} />;
      case 'evaluations':
        return <TeacherAssessmentSchedule user={user} />;
      case 'occurrences':
        return <TeacherOccurrences user={user} />;
      case 'lesson_plan':
        return <TeacherLessonPlan user={user} />;
      case 'performance':
        return <TeacherPerformance user={user} />;
      case 'calendar':
        return <UnifiedSchoolCalendar user={user} />;
      case 'material_requests':
        return <TeacherPedagogicalRequests user={user} />;
      default:
        return <TeacherDashboardHome user={user} onNavigate={(tabId) => setActiveSubTab(tabId as SubTab)} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      
      {/* SIDEBAR MODERNA DO PROFESSOR (Slate Escuro / Indigo) */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col no-print transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} border-r border-white/10 shadow-2xl`}>
        
        {/* LOGO & CABEÇALHO DA SIDEBAR */}
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 font-black text-lg">
              🍎
            </div>
            <div>
              <h1 className="text-base font-black uppercase tracking-tight leading-none text-white">Portal Docente</h1>
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-300 mt-0.5">E.E. André Maggi</p>
            </div>
          </div>

          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* LISTA DE NAVEGAÇÃO */}
        <nav className="flex-1 mt-4 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSubTab(item.id as SubTab);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30 scale-[1.02]'
                    : 'text-slate-300/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* RODAPÉ DA SIDEBAR */}
        <div className="p-5 border-t border-white/10 space-y-3">
          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/10 shadow-sm active:scale-95"
          >
            <ArrowLeft size={16} /> Voltar ao Hub
          </button>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-[9px] font-black uppercase text-amber-300 tracking-widest leading-none">Diário Oficial</p>
              <p className="text-xs font-black uppercase text-white truncate mt-0.5">Ano Letivo 2026</p>
            </div>
          </div>
        </div>
      </aside>

      {/* BACKDROP PARA MOBILE */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ÁREA PRINCIPAL DE CONTEÚDO */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* BARRA DE NOTIFICAÇÃO DA SECRETARIA */}
        {showNotifBar && notifications.length > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 md:px-10 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500 no-print shadow-md">
            <div className="flex items-center gap-4">
              <div className="p-1.5 bg-white/20 rounded-xl animate-pulse"><Bell size={16} /></div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none text-blue-200">Aviso da Secretaria / Coordenação</p>
                <p className="text-xs md:text-sm font-bold mt-0.5">{notifications[0].title}: {notifications[0].message}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => markAsRead(notifications[0].id)} className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                Marcar Ciente
              </button>
              <button onClick={() => setShowNotifBar(false)} className="p-1 hover:bg-white/20 rounded-lg"><X size={18} /></button>
            </div>
          </div>
        )}

        {/* HEADER SUPERIOR */}
        <header className="h-20 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-10 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3 lg:gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl hidden sm:flex items-center justify-center">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-sm lg:text-base font-black text-slate-900 uppercase tracking-tight leading-none">
                {menuItems.find(i => i.id === activeSubTab)?.label}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                  E.E. André Antônio Maggi
                </span>
                {isLocked && (
                  <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <Lock size={8} strokeWidth={3} /> Blindagem Ativa
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={toggleFullScreen}
              className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors group flex items-center gap-2"
              title="Alternar Tela Cheia"
            >
              <Maximize2 size={18} className="group-hover:text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">Tela Cheia</span>
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{user?.name || 'Professor'}</p>
                <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest">{user?.role || 'DOCENTE'}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'PR'}
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER DO CONTEÚDO */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {renderContent()}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(37, 99, 235, 0.3); }
      `}</style>
    </div>
  );
};

export default TeacherModule;
