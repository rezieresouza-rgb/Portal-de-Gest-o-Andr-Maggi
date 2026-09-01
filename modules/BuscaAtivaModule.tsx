
import React, { useState, useEffect } from 'react';
import {
  Users,
  ArrowLeft,
  LayoutDashboard,
  FileText,
  UserCheck,
  PhoneCall,
  AlertTriangle,
  Clock,
  History,
  Search,
  Settings2,
  FileBarChart,
  ShieldAlert,
  ShieldCheck,
  BarChart3,
  HeartHandshake,
  MessageCircle,
  School,
  Building2,
  Sparkles
} from 'lucide-react';
import BuscaAtivaDashboard from '../components/BuscaAtivaDashboard';
import BuscaAtivaStudentList from '../components/BuscaAtivaStudentManager';
import BuscaAtivaParentCommitmentManager from '../components/BuscaAtivaParentCommitmentManager';
import BuscaAtivaFICAI from '../components/BuscaAtivaFICAI';
import BuscaAtivaAttendanceHistory from '../components/BuscaAtivaAttendanceHistory';
import BuscaAtivaContactChannels from '../components/BuscaAtivaContactChannels';
import BuscaAtivaReports from '../components/BuscaAtivaReports';
import BuscaAtivaDataStudioPanel from '../components/BuscaAtivaDataStudioPanel';

interface BuscaAtivaModuleProps {
  onExit: () => void;
}

const BuscaAtivaModule: React.FC<BuscaAtivaModuleProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'commitments' | 'ficai' | 'attendance' | 'reports' | 'datastudio' | 'channels'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Painel & Diagnóstico', icon: LayoutDashboard },
    { id: 'students', label: 'Alunos em Alerta (Infrequência)', icon: AlertTriangle },
    { id: 'commitments', label: 'Termos de Compromisso', icon: FileCheck },
    { id: 'ficai', label: 'Fichas FICAI / Notificações', icon: Send },
    { id: 'attendance', label: 'Histórico de Faltas Diárias', icon: CalendarDays },
    { id: 'reports', label: 'Relatórios Estatísticos', icon: FileText },
    { id: 'datastudio', label: 'Painel Geral dos Dados', icon: BarChart3 },
    { id: 'channels', label: 'Canais WhatsApp', icon: Settings2 },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800 relative w-full min-w-0">
      
      {/* Backdrop Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* SIDEBAR NAVEGAÇÃO MODERNA */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col shrink-0 no-print border-r border-slate-800 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-2xl lg:shadow-none`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl text-white shadow-lg shadow-emerald-600/20">
              <PhoneCall size={26} />
            </div>
            <div>
              <h1 className="text-base font-black uppercase tracking-tight text-white leading-tight">
                Busca Ativa Escolar
              </h1>
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">
                6º ao 9º Ano • E.E. André Maggi
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-6 border-t border-slate-800 space-y-3 bg-slate-950/40">
          <div className="bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-800/40 flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-[9px] text-emerald-300 font-black uppercase tracking-widest">Proteção Integral</p>
              <p className="text-[10px] text-white font-bold">Garantia do Direito à Educação</p>
            </div>
          </div>

          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10"
          >
            <ArrowLeft size={16} /> Hub Principal
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Header Superior */}
        <header className="h-20 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-8 shrink-0 no-print shadow-sm gap-3">
          <div className="flex items-center gap-3 lg:gap-4 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all shrink-0"
              title="Menu Busca Ativa"
            >
              <PhoneCall size={20} />
            </button>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hidden sm:block shrink-0">
              <Users size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                Núcleo de Busca Ativa & Permanência Discente
              </h2>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest truncate">
                Ensino Fundamental Anos Finais (6º ao 9º Ano) • SEDUC/MT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 shadow-sm">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-widest">Busca Ativa Ativa</span>
            </div>

            <div className="flex items-center gap-2">
              <img src="/brasao_mt.png" alt="MT" className="h-8 w-auto object-contain hidden lg:block" onError={(e) => e.currentTarget.style.display = 'none'} />
              <img src="/logo-escola-oficial.png" alt="Escola Logo" className="h-8 w-auto object-contain hidden lg:block" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
          </div>
        </header>

        {/* Conteúdo Dinâmico */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar min-w-0">
          {activeTab === 'dashboard' && <BuscaAtivaDashboard onNavigate={(tab) => setActiveTab(tab)} />}
          {activeTab === 'students' && <BuscaAtivaStudentList />}
          {activeTab === 'commitments' && <BuscaAtivaParentCommitmentManager />}
          {activeTab === 'ficai' && <BuscaAtivaFICAI />}
          {activeTab === 'attendance' && <BuscaAtivaAttendanceHistory />}
          {activeTab === 'reports' && <BuscaAtivaReports />}
          {activeTab === 'datastudio' && <BuscaAtivaDataStudioPanel />}
          {activeTab === 'channels' && <BuscaAtivaContactChannels />}
        </div>
      </main>
    </div>
  );
};

export default BuscaAtivaModule;
