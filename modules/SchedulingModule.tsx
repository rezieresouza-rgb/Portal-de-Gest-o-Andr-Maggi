
import React, { useState } from 'react';
import { 
  CalendarDays, 
  Laptop, 
  ArrowLeft, 
  ShieldCheck, 
  Maximize2,
  Lock,
  Building2,
  Beaker,
  UtensilsCrossed,
  BookOpen,
  Cpu,
  Library
} from 'lucide-react';
import { User } from '../types';
import ChromebookScheduler from '../components/ChromebookScheduler';
import ScienceLabScheduler from '../components/ScienceLabScheduler';
import PedagogicalKitchenScheduler from '../components/PedagogicalKitchenScheduler';
import LibraryRoomScheduler from '../components/LibraryRoomScheduler';
import MakerLabScheduler from '../components/MakerLabScheduler';
import AuditoriumScheduler from '../components/AuditoriumScheduler';

interface SchedulingModuleProps {
  user?: User;
  onExit: () => void;
}

type SubTab = 'chromebooks' | 'science_lab' | 'maker_lab' | 'pedagogical_kitchen' | 'library_room' | 'auditorium';

const SchedulingModule: React.FC<SchedulingModuleProps> = ({ user, onExit }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('chromebooks');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const menuItems = [
    { id: 'chromebooks', label: 'Estações Chromebook', icon: Laptop, color: 'fuchsia' },
    { id: 'science_lab', label: 'Lab. de Ciências', icon: Beaker, color: 'emerald' },
    { id: 'maker_lab', label: 'Biblioteca Antiga', icon: Library, color: 'sky' },
    { id: 'pedagogical_kitchen', label: 'Cozinha Pedagógica', icon: UtensilsCrossed, color: 'orange' },
    { id: 'library_room', label: 'Espaço Biblioteca', icon: BookOpen, color: 'indigo' },
    { id: 'auditorium', label: 'Auditório / Teatro', icon: Building2, color: 'emerald' },
  ];

  const renderContent = () => {
    switch (activeSubTab) {
      case 'chromebooks':
        return <ChromebookScheduler user={user} />;
      case 'science_lab':
        return <ScienceLabScheduler user={user} />;
      case 'maker_lab':
        return <MakerLabScheduler user={user} />;
      case 'pedagogical_kitchen':
        return <PedagogicalKitchenScheduler user={user} />;
      case 'library_room':
        return <LibraryRoomScheduler user={user} />;
      case 'auditorium':
        return <AuditoriumScheduler user={user} />;
      default:
        return (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center text-gray-400">
             <h3 className="text-xl font-black uppercase tracking-widest">Módulo em Implementação</h3>
             <p className="text-sm font-medium mt-2">Esta agenda será liberada na próxima atualização da SEDUC.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans relative w-full min-w-0">
      {/* Backdrop Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar de Agendamentos */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 bg-fuchsia-950 text-white flex flex-col no-print transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-2xl lg:shadow-none`}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-fuchsia-600 p-1.5 rounded-lg shadow-lg">📅</span>
            Agendas
          </h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-fuchsia-300 hover:text-white rounded-xl hover:bg-fuchsia-900/50"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
        
        <nav className="flex-1 mt-2 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSubTab(item.id as SubTab);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                activeSubTab === item.id 
                  ? 'bg-fuchsia-900 text-white shadow-lg' 
                  : 'text-fuchsia-100/50 hover:bg-fuchsia-900/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                {item.label}
              </div>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-fuchsia-900 space-y-3">
          <button 
            onClick={onExit}
            className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            <ArrowLeft size={16} /> Voltar ao Hub
          </button>
          
          <div className="bg-fuchsia-900/50 p-4 rounded-2xl border border-fuchsia-800/50">
            <p className="text-[10px] text-fuchsia-300 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={10} /> Central de Reservas
            </p>
            <div className="text-xs font-black uppercase tracking-tight text-fuchsia-400">Blindado & Sincronizado</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-10 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
             <button
               onClick={() => setIsSidebarOpen(true)}
               className="lg:hidden p-2.5 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 rounded-xl transition-all shrink-0"
               title="Menu de Agendas"
             >
               <CalendarDays size={20} />
             </button>
             <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded-lg hidden sm:block shrink-0">
               <CalendarDays size={20} />
             </div>
             <h2 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-tight truncate">
               Agendamentos: {menuItems.find(i => i.id === activeSubTab)?.label}
             </h2>
          </div>

          <div className="flex items-center gap-3 md:gap-6 shrink-0">
            <button 
              onClick={toggleFullScreen}
              className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors group hidden sm:flex items-center gap-2"
              title="Alternar Tela Cheia"
            >
              <Maximize2 size={18} className="group-hover:text-fuchsia-600" />
            </button>

            {user && (
              <div className="flex items-center gap-3 pl-3 md:pl-4 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-gray-900 uppercase truncate max-w-[150px]">{user.name}</p>
                  <p className="text-[9px] font-bold text-fuchsia-600 uppercase tracking-widest">{user.role || 'Docente'}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-purple-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-fuchsia-500/20 uppercase shrink-0">
                  {user.name.substring(0, 2)}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar min-w-0">
           {renderContent()}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(192, 38, 211, 0.2); }
      `}</style>
    </div>
  );
};

export default SchedulingModule;
