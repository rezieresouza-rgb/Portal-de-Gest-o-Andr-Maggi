
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ArrowLeft, 
  LayoutDashboard, 
  FileText, 
  UserPlus, 
  PhoneCall, 
  AlertTriangle, 
  ShieldCheck, 
  Maximize2,
  Clock,
  History,
  MessageSquare,
  Search,
  CalendarDays,
  FileSpreadsheet
} from 'lucide-react';
import BuscaAtivaDashboard from '../components/BuscaAtivaDashboard';
import BuscaAtivaStudentList from '../components/BuscaAtivaStudentList';
import BuscaAtivaFICAI from '../components/BuscaAtivaFICAI';
import UnifiedSchoolCalendar from '../components/UnifiedSchoolCalendar';
import PsychosocialReferralList from '../components/PsychosocialReferralList';

interface BuscaAtivaModuleProps {
  onExit: () => void;
}

const BuscaAtivaModule: React.FC<BuscaAtivaModuleProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'ficai' | 'calendar' | 'referrals'>('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'calendar', label: 'Estratégia 2026', icon: CalendarDays },
    { id: 'students', label: 'Monitoramento Alunos', icon: Users },
    { id: 'referrals', label: 'Encaminhamentos', icon: FileSpreadsheet },
    { id: 'ficai', label: 'Gerador FICAi', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <aside className="w-64 bg-emerald-950 text-white flex flex-col no-print">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-emerald-500 p-1.5 rounded-lg shadow-lg">🕵️</span>
            Busca Ativa
          </h1>
        </div>
        
        <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-emerald-800 text-white shadow-lg' 
                  : 'text-emerald-100/50 hover:bg-emerald-800/30'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-emerald-900 space-y-3">
          <button 
            onClick={onExit}
            className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            <ArrowLeft size={16} /> Voltar ao Hub
          </button>
          
          <div className="bg-emerald-900/50 p-4 rounded-2xl border border-emerald-800/50">
            <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={10} /> UNICEF / MT
            </p>
            <div className="text-xs font-black uppercase tracking-tight text-emerald-400">Escola Protegida</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
               <PhoneCall size={20} />
             </div>
             <div>
                <h2 className="text-sm font-black text-gray-900 uppercase">Módulo: Busca Ativa Escolar</h2>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Prevenção ao Abandono e Evasão</p>
             </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 px-4 py-2 bg-red-50 text-red-600 rounded-full border border-red-100">
                <AlertTriangle size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">8 Alertas Críticos</span>
             </div>
             <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-sm">BA</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'dashboard' && <BuscaAtivaDashboard />}
          {activeTab === 'calendar' && <UnifiedSchoolCalendar />}
          {activeTab === 'students' && <BuscaAtivaStudentList />}
          {activeTab === 'referrals' && <PsychosocialReferralList role="PSICOSSOCIAL" />}
          {activeTab === 'ficai' && <BuscaAtivaFICAI />}
        </div>
      </main>
    </div>
  );
};

export default BuscaAtivaModule;
