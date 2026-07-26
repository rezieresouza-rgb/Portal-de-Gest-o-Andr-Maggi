import React, { useState, useEffect } from 'react';
import {
  Hammer,
  ArrowLeft,
  LayoutDashboard,
  Calendar,
  ShieldCheck,
  FileText,
  Search
} from 'lucide-react';
import { User, CleaningEmployee } from '../types';
import PredialMaintenanceDashboard from '../components/PredialMaintenanceDashboard';
import MaintenanceScheduler from '../components/MaintenanceScheduler';
import PreventiveMaintenancePlan from '../components/PreventiveMaintenancePlan';
import MaintenanceReports from '../components/MaintenanceReports';
import { supabase } from '../supabaseClient';

const InfrastructureModule: React.FC<{ user?: User, onExit: () => void }> = ({ user, onExit }) => {
  const [activeTab, setActiveTab] = useState<'predial' | 'scheduler' | 'preventive_plan' | 'reports'>('predial');
  const [employees, setEmployees] = useState<CleaningEmployee[]>([]);
  const [allActiveEmployees, setAllActiveEmployees] = useState<CleaningEmployee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadStaffFromSecretariat = async () => {
      try {
        const { data: staffData, error } = await supabase
          .from('staff')
          .select('*');

        if (error) throw error;

        if (staffData) {
          const supportStaff = staffData
            .filter(s => {
              const isSupportType = s.server_type?.toUpperCase() === 'APOIO';
              const isMaintenanceRole = s.role === 'MANUTENCAO' || s.role === 'AAE_LIMPEZA';
              const isActive = s.status === 'EM_ATIVIDADE';
              return (isSupportType || isMaintenanceRole) && isActive;
            })
            .map(s => ({
              id: s.id,
              name: s.name,
              shift: s.shift === 'INTEGRAL' ? 'MATUTINO' : s.shift,
              scope: s.job_function,
              isFixed: true,
              registration: s.registration
            }));

          setEmployees(supportStaff as any);

          const allActive = staffData
            .filter(s => s.status === 'EM_ATIVIDADE')
            .map(s => ({
              id: s.id,
              name: s.name,
              shift: s.shift === 'INTEGRAL' ? 'MATUTINO' : s.shift,
              scope: s.job_function,
              isFixed: true,
              registration: s.registration
            }));

          setAllActiveEmployees(allActive as any);
        }
      } catch (err) {
        console.error("Erro ao carregar equipe para infraestrutura:", err);
      }
    };

    loadStaffFromSecretariat();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans w-full min-w-0">
      <aside className="w-64 shrink-0 bg-slate-900 text-white flex flex-col no-print min-w-0">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="bg-amber-500/20 text-amber-400 p-1.5 rounded-lg">🛠️</div>
            Infraestrutura
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manutenção Predial</p>
        </div>
        <nav className="flex-1 mt-2 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('predial')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'predial' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard size={18} className="shrink-0" />
            <span className="truncate">Painel Predial</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduler')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'scheduler' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calendar size={18} className="shrink-0" />
            <span className="truncate">Chamados & OS</span>
          </button>

          <button
            onClick={() => setActiveTab('preventive_plan')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'preventive_plan' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck size={18} className="shrink-0" />
            <span className="truncate">Manutenção Preventiva</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'reports' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText size={18} className="shrink-0" />
            <span className="truncate">Relatórios & SLA</span>
          </button>
        </nav>
        <div className="p-6">
          <button
            onClick={onExit}
            className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest leading-none"
          >
            <ArrowLeft size={16} className="shrink-0" />
            <span className="truncate">Voltar ao Hub</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0 min-w-0 gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <Hammer size={20} />
            </div>
            <h2 className="text-xs md:text-sm font-black text-gray-900 uppercase truncate">Gestão de Manutenção Predial & Infraestrutura</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0 min-w-0">
            <div className="relative no-print min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="text"
                placeholder="Pesquisar OS ou reparos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-amber-500/5 w-28 sm:w-48 md:w-64 min-w-0"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 custom-scrollbar min-w-0">
          {activeTab === 'predial' && <PredialMaintenanceDashboard onNavigateToPreventive={() => setActiveTab('preventive_plan')} />}
          {activeTab === 'scheduler' && <MaintenanceScheduler employees={employees} allStaff={allActiveEmployees} currentUser={user} />}
          {activeTab === 'preventive_plan' && <PreventiveMaintenancePlan employees={employees} />}
          {activeTab === 'reports' && <MaintenanceReports />}
        </div>
      </main>
    </div>
  );
};

export default InfrastructureModule;
