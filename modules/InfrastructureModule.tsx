import React, { useState, useEffect } from 'react';
import {
  Hammer,
  ArrowLeft,
  LayoutDashboard,
  Calendar,
  ShieldCheck,
  FileText,
  Search,
  Building2,
  Printer
} from 'lucide-react';
import { User, CleaningEmployee } from '../types';
import PredialMaintenanceDashboard from '../components/PredialMaintenanceDashboard';
import PreventiveMaintenancePlan from '../components/PreventiveMaintenancePlan';
import MaintenanceReports from '../components/MaintenanceReports';
import SeducReportsManager, { SeducDocType } from '../components/SeducReportsManager';
import { supabase } from '../supabaseClient';

const InfrastructureModule: React.FC<{ user?: User, onExit: () => void }> = ({ user, onExit }) => {
  const [activeTab, setActiveTab] = useState<'predial' | 'preventive_plan' | 'reports' | 'seduc_docs'>('predial');
  const [activeSeducDoc, setActiveSeducDoc] = useState<SeducDocType>('doc1');
  const [employees, setEmployees] = useState<CleaningEmployee[]>([]);
  const [allActiveEmployees, setAllActiveEmployees] = useState<CleaningEmployee[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  const openSeducDoc = (doc: SeducDocType) => {
    setActiveSeducDoc(doc);
    setActiveTab('seduc_docs');
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans w-full min-w-0 relative">
      {/* Backdrop Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 shrink-0 bg-slate-900 text-white flex flex-col no-print min-w-0 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-2xl lg:shadow-none`}>
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <div className="bg-amber-500/20 text-amber-400 p-1.5 rounded-lg">🛠️</div>
              Infraestrutura
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manutenção Predial</p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
        <nav className="flex-1 mt-2 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => { setActiveTab('predial'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'predial' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard size={18} className="shrink-0" />
            <span className="truncate">Painel Predial</span>
          </button>

          <button
            onClick={() => { setActiveTab('preventive_plan'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'preventive_plan' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck size={18} className="shrink-0" />
            <span className="truncate">Plano Preventivo</span>
          </button>

          {/* SECTION: RELATÓRIOS OFICIAIS SEDUC MT */}
          <div className="pt-4 border-t border-slate-800/80">
            <p className="px-4 text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Building2 size={12} /> Relatórios SEDUC-MT
            </p>

            <button
              onClick={() => { setActiveTab('seduc_docs'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'seduc_docs' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Printer size={16} className="shrink-0 text-amber-300" />
              <span className="truncate">Central de Impressão</span>
            </button>

            <div className="mt-1 space-y-1 pl-2 border-l-2 border-slate-800 ml-3">
              {[
                { id: 'doc1', title: '1 - Cronograma' },
                { id: 'doc2', title: '2 - Ficha Inspeções' },
                { id: 'doc3', title: '3 - Demanda' },
                { id: 'doc4', title: '4 - Intervenções' },
                { id: 'doc5', title: '5 - Verificação' },
                { id: 'doc6', title: '6 - Pendências' },
                { id: 'doc7', title: '7 - Boas Práticas' }
              ].map(doc => (
                <button
                  key={doc.id}
                  onClick={() => openSeducDoc(doc.id as SeducDocType)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all truncate block ${
                    activeTab === 'seduc_docs' && activeSeducDoc === doc.id
                      ? 'text-amber-400 font-bold bg-slate-800'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {doc.title}
                </button>
              ))}
            </div>
          </div>
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
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-all shrink-0"
              title="Menu Infraestrutura"
            >
              <Hammer size={20} />
            </button>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0 hidden sm:block">
              <Hammer size={20} />
            </div>
            <h2 className="text-xs md:text-sm font-black text-gray-900 uppercase truncate">Gestão de Manutenção Predial & Infraestrutura</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0 min-w-0">
            <div className="relative no-print min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-amber-500/5 w-28 sm:w-48 md:w-64 min-w-0"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 custom-scrollbar min-w-0">
          {activeTab === 'predial' && <PredialMaintenanceDashboard user={user} employees={employees as any} />}
          {activeTab === 'preventive_plan' && <PreventiveMaintenancePlan employees={allActiveEmployees as any} />}
          {activeTab === 'reports' && <MaintenanceReports />}
          {activeTab === 'seduc_docs' && <SeducReportsManager initialDoc={activeSeducDoc} user={user} />}
        </div>
      </main>
    </div>
  );
};

export default InfrastructureModule;
