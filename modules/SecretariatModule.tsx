
import React, { useState } from 'react';
import {
  Landmark,
  Users,
  GraduationCap,
  Briefcase,
  FileText,
  LayoutDashboard,
  ArrowLeft,
  ShieldCheck,
  Bell,
  Search,
  Plus,
  ChevronRight,
  Maximize2,
  CalendarDays,
  ClipboardList
} from 'lucide-react';
import SecretariatDashboard from '../components/SecretariatDashboard';
import SecretariatStudentRegistry from '../components/SecretariatStudentRegistry';
import SecretariatClassroomManager from '../components/SecretariatClassroomManager';
import SecretariatStaffManager from '../components/SecretariatStaffManager';
import SecretariatBulletinPrinter from '../components/SecretariatBulletinPrinter';
import SecretariatNotificationCenter from '../components/SecretariatNotificationCenter';
import UnifiedSchoolCalendar from '../components/UnifiedSchoolCalendar';
import SecretariatAttendanceHistory from '../components/SecretariatAttendanceHistory';

interface SecretariatModuleProps {
  user?: any;
  onExit: () => void;
}

const SecretariatModule: React.FC<SecretariatModuleProps> = ({ user, onExit }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'students' | 'classes' | 'staff' | 'bulletins' | 'attendance_history'>('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendário Escolar', icon: CalendarDays },
    { id: 'attendance_history', label: 'Histórico de Chamadas', icon: ClipboardList },
    { id: 'students', label: 'Cadastro de Alunos', icon: GraduationCap },
    { id: 'classes', label: 'Gestão de Turmas', icon: Users },
    { id: 'staff', label: 'Servidores / RH', icon: Briefcase },
    { id: 'bulletins', label: 'Emissão de Boletins', icon: FileText },
  ];

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-950 text-white flex flex-col no-print transition-all duration-300">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-indigo-500 p-1.5 rounded-lg shadow-lg">🏢</span>
            Secretaria
          </h1>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === item.id
                ? 'bg-indigo-800 text-white shadow-lg'
                : 'text-indigo-100 hover:bg-indigo-800/50'
                }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-indigo-900 space-y-3">
          <button
            onClick={onExit}
            className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            <ArrowLeft size={16} /> Hub Principal
          </button>
          <div className="bg-indigo-900/50 p-4 rounded-2xl border border-indigo-800/50">
            <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={10} /> Sistema Seguro
            </p>
            <div className="text-xs font-black uppercase tracking-tight text-indigo-400">Escrituração Digital</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 shrink-0 no-print">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Landmark size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase">Módulo Administrativo Escolar</h2>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest leading-none mt-1">André Antônio Maggi</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={toggleFullScreen} className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors">
              <Maximize2 size={18} />
            </button>
            <div className="hidden lg:flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Base Ativa</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-black text-gray-900">{user?.name || 'Secretário André'}</p>
                <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest">{user?.role || 'Administrador'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-sm uppercase">
                {user?.name ? user.name.substring(0, 2) : 'SA'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'dashboard' && <SecretariatDashboard />}
          {activeTab === 'calendar' && <UnifiedSchoolCalendar />}
          {activeTab === 'attendance_history' && <SecretariatAttendanceHistory />}
          {activeTab === 'students' && <SecretariatStudentRegistry />}
          {activeTab === 'classes' && <SecretariatClassroomManager />}
          {activeTab === 'staff' && <SecretariatStaffManager />}
          {activeTab === 'bulletins' && <SecretariatBulletinPrinter />}
        </div>

        {/* Centro de Notificações Integrado (Flutuante) */}
        <SecretariatNotificationCenter />
      </main>
    </div>
  );
};

export default SecretariatModule;
