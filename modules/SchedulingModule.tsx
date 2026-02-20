
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
  Cpu
} from 'lucide-react';
import ChromebookScheduler from '../components/ChromebookScheduler';
import ScienceLabScheduler from '../components/ScienceLabScheduler';
import PedagogicalKitchenScheduler from '../components/PedagogicalKitchenScheduler';
import LibraryRoomScheduler from '../components/LibraryRoomScheduler';
import MakerLabScheduler from '../components/MakerLabScheduler';
import AuditoriumScheduler from '../components/AuditoriumScheduler';

interface SchedulingModuleProps {
  onExit: () => void;
}

type SubTab = 'chromebooks' | 'science_lab' | 'maker_lab' | 'pedagogical_kitchen' | 'library_room' | 'auditorium';

const SchedulingModule: React.FC<SchedulingModuleProps> = ({ onExit }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('chromebooks');

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
    { id: 'maker_lab', label: 'Laboratório Maker', icon: Cpu, color: 'sky' },
    { id: 'pedagogical_kitchen', label: 'Cozinha Pedagógica', icon: UtensilsCrossed, color: 'orange' },
    { id: 'library_room', label: 'Espaço Biblioteca', icon: BookOpen, color: 'indigo' },
    { id: 'auditorium', label: 'Auditório / Teatro', icon: Building2, color: 'emerald' },
  ];

  const renderContent = () => {
    switch (activeSubTab) {
      case 'chromebooks':
        return <ChromebookScheduler />;
      case 'science_lab':
        return <ScienceLabScheduler />;
      case 'maker_lab':
        return <MakerLabScheduler />;
      case 'pedagogical_kitchen':
        return <PedagogicalKitchenScheduler />;
      case 'library_room':
        return <LibraryRoomScheduler />;
      case 'auditorium':
        return <AuditoriumScheduler />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
             <Lock size={64} className="mb-6 opacity-20" />
             <h3 className="text-xl font-black uppercase tracking-widest">Módulo em Implementação</h3>
             <p className="text-sm font-medium mt-2">Esta agenda será liberada na próxima atualização da SEDUC.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar de Agendamentos */}
      <aside className="w-64 bg-fuchsia-950 text-white flex flex-col no-print">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-fuchsia-600 p-1.5 rounded-lg shadow-lg">📅</span>
            Agendas
          </h1>
        </div>
        
        <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as SubTab)}
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
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded-lg">
               <CalendarDays size={20} />
             </div>
             <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Módulo de Agendamentos: {menuItems.find(i => i.id === activeSubTab)?.label}</h2>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={toggleFullScreen}
              className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors group flex items-center gap-2"
              title="Alternar Tela Cheia"
            >
              <Maximize2 size={18} className="group-hover:text-fuchsia-600" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">Expandir</span>
            </button>
            <div className="hidden lg:flex items-center gap-2 bg-fuchsia-50 px-3 py-1.5 rounded-full border border-fuchsia-100">
               <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-ping"></div>
               <span className="text-[10px] font-black text-fuchsia-700 uppercase tracking-widest">Base de Dados SEDUC</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
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
