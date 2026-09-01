
import React, { useState, useEffect } from 'react';
import {
  Box,
  LayoutDashboard,
  ClipboardList,
  ArrowLeft,
  ShieldCheck,
  Maximize2,
  Bell,
  Search,
  PackagePlus,
  History,
  TrendingUp,
  BrainCircuit,
  Lock,
  Shirt,
  LibraryBig,
  BookMarked,
  Library,
  BookOpen,
  Headphones,
  Menu
} from 'lucide-react';
import AlmoxarifeInventory from '../components/AlmoxarifeInventory';
import AlmoxarifeRequestManager from '../components/AlmoxarifeRequestManager';
import AlmoxarifeUniforms from '../components/AlmoxarifeUniforms';
import AlmoxarifeSchoolKits from '../components/AlmoxarifeSchoolKits';
import AlmoxarifeStructuredMaterial from '../components/AlmoxarifeStructuredMaterial';
import AlmoxarifeOtherBooks from '../components/AlmoxarifeOtherBooks';
import AlmoxarifeEquipmentManager from '../components/AlmoxarifeEquipmentManager';
// Removed duplicate import

interface AlmoxarifeModuleProps {
  onExit: () => void;
}

const AlmoxarifeModule: React.FC<AlmoxarifeModuleProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'history' | 'uniforms' | 'kits' | 'structured' | 'other_books' | 'equipment_loans'>('inventory');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    setIsLocked(localStorage.getItem('system_shield_lock') === 'true');
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Erro ao tentar ativar modo tela cheia: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const menuItems = [
    { id: 'requests', label: 'Gestão de Pedidos', icon: ClipboardList },
    { id: 'equipment_loans', label: 'Empréstimos T.I.', icon: Headphones },
    { id: 'inventory', label: 'Materiais Pedagógicos', icon: Box },
    { id: 'uniforms', label: 'Uniformes Escolares', icon: Shirt },
    { id: 'kits', label: 'Kits Escolares', icon: PackageCheck },
    { id: 'structured', label: 'Material Estruturado', icon: BookMarked },
    { id: 'other_books', label: 'Outros Livros', icon: Layers },
    { id: 'history', label: 'Histórico & Movimentações', icon: History },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'requests':
        return <AlmoxarifeRequestManager />;
      case 'equipment_loans':
        return <AlmoxarifeEquipmentManager />;
      case 'uniforms':
        return <AlmoxarifeUniforms />;
      case 'kits':
        return <AlmoxarifeSchoolKits />;
      case 'structured':
        return <AlmoxarifeStructuredMaterial />;
      case 'other_books':
        return <AlmoxarifeOtherBooks />;
      case 'history':
        return <AlmoxarifeHistory />;
      case 'inventory':
      default:
        return <AlmoxarifeInventory />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans relative overflow-hidden text-white w-full min-w-0">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-10 fixed"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-orange-950/40 to-black fixed"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/20 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite] fixed"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-600/20 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite] fixed"></div>
      </div>

      <div className="relative z-10 flex h-screen w-full min-w-0">
        {/* Backdrop Mobile */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 shrink-0 bg-slate-950 lg:bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col no-print transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-2xl lg:shadow-none`}>
          <div className="p-6 flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="bg-gradient-to-br from-orange-500 to-amber-600 p-2 rounded-xl shadow-lg shadow-orange-500/20">📦</span>
              Almoxarifado
            </h1>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/10"
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          <nav className="flex-1 mt-2 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === item.id
                  ? 'bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] border border-orange-500/30'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-white/10 space-y-3">
            <button
              onClick={onExit}
              className="w-full flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all text-white/60"
            >
              <ArrowLeft size={16} /> Voltar ao Hub
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header className="h-20 bg-transparent border-b border-white/10 flex items-center justify-between px-4 lg:px-10 shrink-0 backdrop-blur-sm gap-3">
            <div className="flex items-center gap-3 lg:gap-4 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all shrink-0"
                title="Menu Almoxarifado"
              >
                <Menu size={20} />
              </button>
              <div className="p-2 bg-white/5 text-orange-400 rounded-lg border border-white/10 hidden sm:block shrink-0">
                {activeTab === 'structured' ? <BookMarked size={20} /> : activeTab === 'equipment_loans' ? <Headphones size={20} /> : <Box size={20} />}
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-black text-white/80 uppercase tracking-tight leading-none truncate">
                  {activeTab === 'structured' ? 'Material Estruturado' : activeTab === 'equipment_loans' ? 'Empréstimos T.I.' : 'Almoxarifado Pedagógico'}
                </h2>
                {isLocked && <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest mt-1 truncate">Base Blindada Ativa</span>}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={toggleFullScreen}
                className="p-2.5 text-white/40 hover:bg-white/10 hover:text-white rounded-xl transition-all group flex items-center gap-2"
                title="Alternar Tela Cheia"
              >
                <Maximize2 size={18} className="group-hover:text-orange-400" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">Expandir</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-black text-white">Almoxarife André</p>
                  <p className="text-[9px] text-orange-400 font-black uppercase tracking-widest">Gestão de Materiais</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-orange-500/20 border border-white/10">GA</div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeTab === 'inventory' && <AlmoxarifeInventory />}
            {activeTab === 'requests' && <AlmoxarifeRequestManager />}
            {activeTab === 'uniforms' && <AlmoxarifeUniforms />}
            {activeTab === 'kits' && <AlmoxarifeSchoolKits />}
            {activeTab === 'structured' && <AlmoxarifeStructuredMaterial />}
            {activeTab === 'other_books' && <AlmoxarifeOtherBooks />}
            {activeTab === 'equipment_loans' && <AlmoxarifeEquipmentManager />}
            {activeTab === 'history' && (
              <div className="py-24 text-center border-2 border-dashed border-white/10 bg-white/5 rounded-[2.5rem]">
                <History size={48} className="mx-auto mb-4 text-orange-500/50" />
                <p className="text-white/40 font-black uppercase text-xs tracking-widest">Relatórios gerenciais consolidados em fase de homologação</p>
              </div>
            )}
          </div>
        </main>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
          .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); }
        `}</style>
      </div>
    </div>
  );
};

export default AlmoxarifeModule;
