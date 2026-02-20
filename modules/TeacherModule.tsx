
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
  MessageSquare,
  CalendarCheck,
  FileSpreadsheet,
  Menu,
  X
} from 'lucide-react';
import TeacherAttendance from '../components/TeacherAttendance';
import TeacherOccurrences from '../components/TeacherOccurrences';
import TeacherPerformance from '../components/TeacherPerformance';
import TeacherLessonPlan from '../components/TeacherLessonPlan';
import TeacherGrades from '../components/TeacherGrades';
import TeacherPedagogicalRequests from '../components/TeacherPedagogicalRequests';
import UnifiedSchoolCalendar from '../components/UnifiedSchoolCalendar';
import PsychosocialReferralList from '../components/PsychosocialReferralList';
import { SecretariatNotification } from '../types';

interface TeacherModuleProps {
  user: any;
  onExit: () => void;
}

type SubTab = 'attendance' | 'occurrences' | 'dashboard' | 'history' | 'lesson_plan' | 'grades' | 'material_requests' | 'calendar' | 'referrals';

const TeacherModule: React.FC<TeacherModuleProps> = ({ user, onExit }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('attendance');
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
    { id: 'attendance', label: 'Diário de Presença', icon: UserCheck },
    { id: 'grades', label: 'Lançar Notas', icon: GradeIcon },
    { id: 'referrals', label: 'Encaminhamentos', icon: FileSpreadsheet },
    { id: 'calendar', label: 'Calendário Letivo', icon: CalendarCheck },
    { id: 'material_requests', label: 'Solicitar Materiais', icon: Package },
    { id: 'occurrences', label: 'Lançar Ocorrência', icon: AlertCircle },
    { id: 'lesson_plan', label: 'Roteiro Pedagógico', icon: FileEdit },
    { id: 'dashboard', label: 'Desempenho Turma', icon: LayoutDashboard },
    { id: 'history', label: 'Histórico de Aula', icon: History },
  ];

  const renderContent = () => {
    switch (activeSubTab) {
      case 'attendance':
        return <TeacherAttendance user={user} />;
      case 'calendar':
        return <UnifiedSchoolCalendar user={user} />;
      case 'grades':
        return <TeacherGrades user={user} />;
      case 'referrals':
        return <PsychosocialReferralList role="PROFESSOR" user={user} />;
      case 'material_requests':
        return <TeacherPedagogicalRequests user={user} />;
      case 'occurrences':
        return <TeacherOccurrences user={user} />;
      case 'lesson_plan':
        return <TeacherLessonPlan user={user} />;
      case 'dashboard':
        return <TeacherPerformance user={user} />;
      case 'history':
        return (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <ClipboardList size={64} className="mb-6 opacity-20" />
            <h3 className="text-xl font-black uppercase tracking-widest">Registros de Aula</h3>
            <p className="text-sm font-medium mt-2">Os diários salvos serão listados aqui em breve.</p>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <Lock size={64} className="mb-6 opacity-20" />
            <h3 className="text-xl font-black uppercase tracking-widest">Módulo Pedagógico</h3>
            <p className="text-sm font-medium mt-2">Esta funcionalidade está sendo homologada pela Direção.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans relative">
      {/* Sidebar do Professor - Responsiva */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-amber-950 text-white flex flex-col no-print transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-amber-500 p-1.5 rounded-lg shadow-lg">🍎</span>
            Área Docente
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSubTab(item.id as SubTab);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeSubTab === item.id
                ? 'bg-amber-900 text-white shadow-lg'
                : 'text-amber-100/50 hover:bg-amber-900/30'
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                {item.label}
              </div>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-amber-900 space-y-3">
          <button
            onClick={onExit}
            className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            <ArrowLeft size={16} /> Voltar ao Hub
          </button>

          <div className="bg-amber-900/50 p-4 rounded-2xl border border-amber-800/50">
            <p className="text-[10px] text-amber-300 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={10} /> Diário Digital
            </p>
            <div className="text-xs font-black uppercase tracking-tight text-amber-400">Escola André Maggi</div>
          </div>
        </div>
      </aside>

      {/* Backdrop para mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Barra de Notificação da Secretaria */}
        {showNotifBar && notifications.length > 0 && (
          <div className="bg-indigo-600 text-white px-10 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500 no-print">
            <div className="flex items-center gap-4">
              <div className="p-1.5 bg-white/20 rounded-lg animate-pulse"><Bell size={16} /></div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Aviso da Secretaria</p>
                <p className="text-sm font-bold">{notifications[0].title}: {notifications[0].message}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => markAsRead(notifications[0].id)} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Marcar Ciente</button>
              <button onClick={() => setShowNotifBar(false)}><X size={18} /></button>
            </div>
          </div>
        )}

        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-10 shrink-0">
          <div className="flex items-center gap-3 lg:gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 bg-amber-50 text-amber-600 rounded-xl"
            >
              <Menu size={20} />
            </button>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg hidden sm:block">
              <GraduationCap size={20} />
            </div>
            <div>
              <h2 className="text-xs lg:text-sm font-black text-gray-900 uppercase tracking-tight leading-none">
                {menuItems.find(i => i.id === activeSubTab)?.label}
              </h2>
              {isLocked && (
                <span className="text-[8px] font-black text-amber-600 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1">
                  <Lock size={8} strokeWidth={3} /> Blindagem Ativa
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={toggleFullScreen}
              className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors group flex items-center gap-2"
              title="Alternar Tela Cheia"
            >
              <Maximize2 size={18} className="group-hover:text-amber-600" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">Expandir</span>
            </button>
            <div className="hidden lg:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-black text-gray-900">{user?.name || 'Professor'}</p>
                <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest">Matutino / Vespertino</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-sm">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'CP'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {renderContent()}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(217, 119, 6, 0.2); }
      `}</style>
    </div>
  );
};

export default TeacherModule;
