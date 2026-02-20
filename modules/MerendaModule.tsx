
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BrainCircuit,
  Bell,
  ShoppingCart,
  ShieldCheck,
  ClipboardList,
  Database,
  ArrowLeft,
  CookingPot,
  Maximize2,
  Lock,
  ListTodo,
  Scale,
  MessageCircle
} from 'lucide-react';
import { User } from '../types';
import Dashboard from '../components/Dashboard';
import Contracts from '../components/Contracts';
import Suppliers from '../components/Suppliers';
import Inventory from '../components/Inventory';
import AIConsultant from '../components/AIConsultant';
import Orders from '../components/Orders';
import MenuChecklist from '../components/MenuChecklist';
import Settings from '../components/Settings';
import KitchenRequests from '../components/KitchenRequests';
import ShoppingList from '../components/ShoppingList';
import MenuContractAudit from '../components/MenuContractAudit';
import SupplierNotifications from '../components/SupplierNotifications';

interface MerendaModuleProps {
  onExit: () => void;
  user: User;
}

const MerendaModule: React.FC<MerendaModuleProps> = ({ onExit, user }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contracts' | 'suppliers' | 'inventory' | 'ai' | 'orders' | 'menuChecklist' | 'kitchenRequests' | 'shoppingList' | 'menuAudit' | 'supplierNotifications' | 'settings'>('dashboard');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const checkLock = () => {
      setIsLocked(localStorage.getItem('system_shield_lock') === 'true');
    };
    checkLock();
    window.addEventListener('storage', checkLock);
    return () => window.removeEventListener('storage', checkLock);
  }, [activeTab]);

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
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'menuAudit', label: 'Auditoria Cardápio', icon: Scale },
    { id: 'supplierNotifications', label: 'Qualidade & Alertas', icon: MessageCircle },
    { id: 'shoppingList', label: 'Lista de Compras', icon: ListTodo },
    { id: 'menuChecklist', label: 'Registro Diário', icon: ClipboardList },
    { id: 'kitchenRequests', label: 'Materiais Cozinha', icon: CookingPot },
    { id: 'contracts', label: 'Contratos', icon: FileText },
    { id: 'orders', label: 'Pedidos & Compras', icon: ShoppingCart },
    { id: 'suppliers', label: 'Fornecedores', icon: Users },
    { id: 'inventory', label: 'Controle de Estoque', icon: Package },
    { id: 'ai', label: 'Consultoria IA', icon: BrainCircuit },
    { id: 'settings', label: 'Segurança & Dados', icon: Database },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'contracts': return <Contracts />;
      case 'suppliers': return <Suppliers />;
      case 'inventory': return <Inventory />;
      case 'ai': return <AIConsultant />;
      case 'orders': return <Orders />;
      case 'menuChecklist': return <MenuChecklist />;
      case 'kitchenRequests': return <KitchenRequests />;
      case 'shoppingList': return <ShoppingList />;
      case 'menuAudit': return <MenuContractAudit />;
      case 'supplierNotifications': return <SupplierNotifications />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-emerald-900 text-white flex flex-col transition-all duration-300 no-print">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-emerald-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">🍎</span>
            Portal Merenda
          </h1>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === item.id
                ? 'bg-emerald-800 text-white shadow-lg'
                : 'text-emerald-100 hover:bg-emerald-800/50'
                }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-emerald-800 space-y-3">
          <button
            onClick={onExit}
            className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            <ArrowLeft size={16} /> Voltar ao Hub
          </button>

          <div className="bg-emerald-800/50 p-4 rounded-2xl border border-emerald-700/50">
            <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={10} /> Status Módulo
            </p>
            <div className="text-xs font-black uppercase tracking-tight text-emerald-400">Ativo & Auditado</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 shrink-0 no-print">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <LayoutDashboard size={20} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-none">Módulo: Alimentação Escolar</h2>
              {isLocked && (
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1">
                  <Lock size={8} strokeWidth={3} /> Blindagem de Dados Ativa
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
              <Maximize2 size={18} className="group-hover:text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">Expandir</span>
            </button>
            <div className="hidden lg:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Base de Dados Merenda</span>
            </div>
            <button className="relative p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-black text-gray-900">{user.name}</p>
                <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">{user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-sm">
                {user.name.substring(0, 2)}
              </div>
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
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); }
      `}</style>
    </div>
  );
};

export default MerendaModule;
