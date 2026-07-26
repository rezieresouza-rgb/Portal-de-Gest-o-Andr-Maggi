import React, { useState, useEffect } from 'react';
import {
  Brush,
  ArrowLeft,
  LayoutDashboard,
  Users,
  CookingPot,
  Droplets,
  HardHat,
  BookOpen,
  ClipboardList,
  AlertTriangle,
  Search,
  Settings2,
  X,
  RefreshCw,
  Trash2,
  Calendar
} from 'lucide-react';
import { User, SchoolEnvironment, CleaningTask, CleaningFrequency, CleaningEmployee, SchoolEnvironmentCategory } from '../types';
import KitchenSanitation from '../components/KitchenSanitation';
import PPEControl from '../components/PPEControl';
import CleaningMaterialControl from '../components/CleaningMaterialControl';
import CleaningOfficialManual from '../components/CleaningOfficialManual';
import CleaningOccurrences from '../components/CleaningOccurrences';
import CleaningWorkPlan from '../components/CleaningWorkPlan';
import MaintenanceDashboard from '../components/MaintenanceDashboard';
import MaintenanceScheduler from '../components/MaintenanceScheduler';
import { supabase } from '../supabaseClient';

const INITIAL_ENVIRONMENTS: SchoolEnvironment[] = [
  { id: 'env-1', name: 'SALAS DE AULA', category: 'SALA_AULA', complianceRate: 100 },
  { id: 'env-2', name: 'AUDITÓRIO', category: 'AUDITORIO', complianceRate: 100 },
  { id: 'env-3', name: 'SALA DE RECURSOS', category: 'SALA_RECURSOS', complianceRate: 100 },
  { id: 'env-4', name: 'MONITORIA CÍVICO-MILITAR', category: 'LABORATORIO', complianceRate: 100 },
  { id: 'env-5', name: 'BIBLIOTECA', category: 'BIBLIOTECA', complianceRate: 100 },
  { id: 'env-6', name: 'ADMINISTRATIVOS (SEC, COORD, PROF...)', category: 'ADMINISTRATIVO', complianceRate: 100 },
  { id: 'env-7', name: 'SANITÁRIOS', category: 'SANITARIO', complianceRate: 100 },
  { id: 'env-8', name: 'CORREDORES, RAMPAS E HALL', category: 'CIRCULACAO', complianceRate: 100 },
  { id: 'env-9', name: 'CALÇADAS (INTERNAS)', category: 'CALCADA_INTERNA', complianceRate: 100 },
  { id: 'env-10', name: 'CALÇADA EXTERNA', category: 'CALCADA_EXTERNA', complianceRate: 100 },
  { id: 'env-11', name: 'PÁTIO E REFEITÓRIO', category: 'PATIO_REFEITORIO', complianceRate: 100 },
];

const CleaningModule: React.FC<{ user?: User, onExit: () => void }> = ({ user, onExit }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scheduler' | 'protocol_official' | 'work_plan' | 'occurrences' | 'kitchen' | 'materials' | 'ppe'>('dashboard');

  const [environments, setEnvironments] = useState<SchoolEnvironment[]>([]);
  const [employees, setEmployees] = useState<CleaningEmployee[]>([]);
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [newEnv, setNewEnv] = useState<{ name: string, category: SchoolEnvironmentCategory }>({ name: '', category: 'SALA_AULA' });

  const fetchData = async () => {
    try {
      const { data: envData, error: envError } = await supabase
        .from('cleaning_environments')
        .select('*')
        .order('name');

      if (envError) throw envError;

      if (envData) {
        if (envData.length === 0) {
          const { data: inserted, error: insertError } = await supabase
            .from('cleaning_environments')
            .insert(INITIAL_ENVIRONMENTS.map(e => ({
              name: e.name,
              category: e.category,
              compliance_rate: e.complianceRate
            })))
            .select();

          if (!insertError && inserted) {
            setEnvironments(inserted.map(e => ({
              id: e.id,
              name: e.name,
              category: e.category,
              complianceRate: e.compliance_rate
            })));
          }
        } else {
          setEnvironments(envData.map(e => ({
            id: e.id,
            name: e.name,
            category: e.category,
            complianceRate: e.compliance_rate
          })));
        }
      }

      const { data: taskData, error: taskError } = await supabase
        .from('cleaning_tasks')
        .select('*');

      if (taskError) throw taskError;

      if (taskData) {
        setTasks(taskData.map(t => ({
          id: t.id,
          environmentId: t.environment_id,
          assignedEmployeeId: t.assigned_employee_id,
          title: t.title,
          frequency: t.frequency as CleaningFrequency,
          status: t.status as 'PENDENTE' | 'CONCLUÍDO',
          lastPerformed: t.last_performed
        })));
      }
    } catch (error) {
      console.error("Erro ao buscar dados de limpeza:", error);
    }
  };

  useEffect(() => {
    fetchData();

    const channels = supabase.channel('cleaning_module_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cleaning_environments' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cleaning_tasks' }, fetchData)
      .subscribe();

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
              const isCleaningRole = s.role === 'AAE_LIMPEZA' || s.role === 'AEE_NUTRICAO' || s.role === 'MANUTENCAO';
              const isActive = s.status === 'EM_ATIVIDADE';
              return (isSupportType || isCleaningRole) && isActive;
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
        }
      } catch (err) {
        console.error("Error loading staff for cleaning:", err);
      }
    };

    loadStaffFromSecretariat();
    
    return () => {
      channels.unsubscribe();
    };
  }, []);

  const addEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('cleaning_environments').insert([{
        name: newEnv.name.toUpperCase(),
        category: newEnv.category,
        compliance_rate: 100
      }]);
      setNewEnv({ name: '', category: 'SALA_AULA' });
      alert("Ambiente cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar ambiente:", error);
    }
  };

  const deleteEnvironment = async (id: string) => {
    if (window.confirm("Remover este ambiente e suas tarefas vinculadas?")) {
      try {
        await supabase.from('cleaning_environments').delete().eq('id', id);
      } catch (error) {
        console.error("Erro ao remover ambiente:", error);
      }
    }
  };

  const resetToInitialData = async () => {
    if (window.confirm("Restaurar ambientes padrões de limpeza?")) {
      try {
        await supabase.from('cleaning_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('cleaning_environments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await fetchData();
        alert("Ambientes restaurados com sucesso.");
      } catch (error) {
        console.error("Erro ao resetar dados:", error);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans w-full min-w-0">
      <aside className="w-64 shrink-0 bg-emerald-950 text-white flex flex-col no-print min-w-0">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg">🧹</div>
            Limpeza & Zelo
          </h1>
          <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest mt-1">Higienização Escolar</p>
        </div>
        <nav className="flex-1 mt-2 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'dashboard' ? 'bg-emerald-800 text-white shadow-lg' : 'text-emerald-100 hover:bg-emerald-900/60'
            }`}
          >
            <LayoutDashboard size={18} className="shrink-0" />
            <span className="truncate">Painel Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduler')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'scheduler' ? 'bg-emerald-800 text-white shadow-lg' : 'text-emerald-100 hover:bg-emerald-900/60'
            }`}
          >
            <Calendar size={18} className="shrink-0" />
            <span className="truncate">Chamados & Ordens (OS)</span>
          </button>

          <button
            onClick={() => setActiveTab('work_plan')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'work_plan' ? 'bg-emerald-800 text-white shadow-lg' : 'text-emerald-100 hover:bg-emerald-900/60'
            }`}
          >
            <ClipboardList size={18} className="shrink-0" />
            <span className="truncate">Plano de Trabalho</span>
          </button>

          <button
            onClick={() => setActiveTab('occurrences')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'occurrences' ? 'bg-emerald-800 text-white shadow-lg' : 'text-emerald-100 hover:bg-emerald-900/60'
            }`}
          >
            <AlertTriangle size={18} className="shrink-0" />
            <span className="truncate">Ocorrências</span>
          </button>

          <button
            onClick={() => setActiveTab('kitchen')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'kitchen' ? 'bg-emerald-800 text-white shadow-lg' : 'text-emerald-100 hover:bg-emerald-900/60'
            }`}
          >
            <CookingPot size={18} className="shrink-0" />
            <span className="truncate">Sanitização Cozinha</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'materials' ? 'bg-emerald-800 text-white shadow-lg' : 'text-emerald-100 hover:bg-emerald-900/60'
            }`}
          >
            <Droplets size={18} className="shrink-0" />
            <span className="truncate">Materiais de Limpeza</span>
          </button>

          <button
            onClick={() => setActiveTab('ppe')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'ppe' ? 'bg-emerald-800 text-white shadow-lg' : 'text-emerald-100 hover:bg-emerald-900/60'
            }`}
          >
            <HardHat size={18} className="shrink-0" />
            <span className="truncate">Controle de EPIs</span>
          </button>

          <button
            onClick={() => setActiveTab('protocol_official')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'protocol_official' ? 'bg-emerald-800 text-white shadow-lg' : 'text-emerald-100 hover:bg-emerald-900/60'
            }`}
          >
            <BookOpen size={18} className="shrink-0" />
            <span className="truncate">Manual Oficial</span>
          </button>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-emerald-200 hover:bg-emerald-900/60 mt-8 border-t border-emerald-800/80 pt-6"
          >
            <Settings2 size={18} className="shrink-0" />
            <span className="truncate">Setores / Ambientes</span>
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
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <Brush size={20} />
            </div>
            <h2 className="text-xs md:text-sm font-black text-gray-900 uppercase truncate">Gestão de Limpeza, Zelo & Higienização</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0 min-w-0">
            <div className="relative no-print min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-emerald-500/5 w-28 sm:w-48 md:w-64 min-w-0"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 custom-scrollbar min-w-0">
          {activeTab === 'dashboard' && <MaintenanceDashboard employees={employees} onNavigateToPlan={() => setActiveTab('work_plan')} />}
          {activeTab === 'scheduler' && <MaintenanceScheduler employees={employees} allStaff={employees} currentUser={user} />}
          {activeTab === 'protocol_official' && <CleaningOfficialManual />}
          {activeTab === 'work_plan' && <CleaningWorkPlan employees={employees} />}
          {activeTab === 'occurrences' && <CleaningOccurrences employees={employees} environments={environments} />}

          {activeTab === 'kitchen' && <KitchenSanitation employees={employees} />}
          {activeTab === 'materials' && <CleaningMaterialControl />}
          {activeTab === 'ppe' && <PPEControl employees={employees} />}
        </div>
      </main>

      {/* Modal Configuração de Ambientes */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center shrink-0">
              <h3 className="text-2xl font-black text-gray-900 uppercase">Configurar Setores de Limpeza</h3>
              <div className="flex gap-2">
                <button onClick={resetToInitialData} className="p-3 bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase">
                  <RefreshCw size={18} /> Restaurar Padrão
                </button>
                <button onClick={() => setIsConfigModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-10">
              <form onSubmit={addEnvironment} className="space-y-6">
                <h4 className="text-sm font-black text-emerald-600 uppercase border-b border-emerald-100 pb-2">Novo Setor/Ambiente</h4>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Setor</label>
                  <input required value={newEnv.name} onChange={e => setNewEnv({ ...newEnv, name: e.target.value.toUpperCase() })} placeholder="EX: SALA 01" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria do Setor</label>
                  <select value={newEnv.category} onChange={e => setNewEnv({ ...newEnv, category: e.target.value as any })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none">
                    <option value="SALA_AULA">Sala de Aula</option>
                    <option value="AUDITORIO">Auditório</option>
                    <option value="SALA_RECURSOS">Sala de Recursos</option>
                    <option value="LABORATORIO">Laboratório</option>
                    <option value="BIBLIOTECA">Biblioteca</option>
                    <option value="ADMINISTRATIVO">Administrativo</option>
                    <option value="SANITARIO">Sanitário</option>
                    <option value="CIRCULACAO">Circulação</option>
                    <option value="CALCADA_INTERNA">Calçada Interna</option>
                    <option value="CALCADA_EXTERNA">Calçada Externa</option>
                    <option value="PATIO_REFEITORIO">Pátio e Refeitório</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-900 transition-all">Salvar Setor</button>
              </form>

              <div className="space-y-6">
                <h4 className="text-sm font-black text-gray-900 uppercase border-b border-gray-100 pb-2">Setores Cadastrados</h4>
                <div className="space-y-3">
                  {environments.map(e => (
                    <div key={e.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div>
                        <p className="text-sm font-black text-gray-900 uppercase leading-none">{e.name}</p>
                        <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-1">{e.category.replace('_', ' ')}</p>
                      </div>
                      <button onClick={() => deleteEnvironment(e.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningModule;
