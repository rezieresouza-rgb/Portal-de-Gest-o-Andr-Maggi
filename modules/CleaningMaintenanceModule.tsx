
import React, { useState, useEffect, useMemo } from 'react';
import {
  Brush,
  ArrowLeft,
  LayoutDashboard,
  Calendar,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Plus,
  Trash2,
  Settings2,
  Droplets,
  HardHat,
  CookingPot,
  History,
  Printer,
  Loader2,
  Users,
  MapPin,
  UserCheck,
  Hammer,
  Maximize2,
  X,
  Save,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { SchoolEnvironment, CleaningTask, CleaningFrequency, CleaningEmployee, StaffMember, SchoolEnvironmentCategory } from '../types';
import KitchenSanitation from '../components/KitchenSanitation';
import PPEControl from '../components/PPEControl';
import CleaningMaterialControl from '../components/CleaningMaterialControl';
import PredialMaintenanceDashboard from '../components/PredialMaintenanceDashboard';
import CleaningOfficialManual from '../components/CleaningOfficialManual';
import MaintenanceScheduler from '../components/MaintenanceScheduler';
import PreventiveMaintenancePlan from '../components/PreventiveMaintenancePlan';

const INITIAL_ENVIRONMENTS: SchoolEnvironment[] = [
  { id: 'env-1', name: 'SALAS DE AULA', category: 'SALA_AULA', complianceRate: 100 },
  { id: 'env-2', name: 'AUDITÓRIO', category: 'AUDITORIO', complianceRate: 100 },
  { id: 'env-3', name: 'SALA DE RECURSOS', category: 'SALA_RECURSOS', complianceRate: 100 },
  { id: 'env-4', name: 'LABORATÓRIOS (MAKER, CIÊNCIAS, EF, APA)', category: 'LABORATORIO', complianceRate: 100 },
  { id: 'env-5', name: 'BIBLIOTECA', category: 'BIBLIOTECA', complianceRate: 100 },
  { id: 'env-6', name: 'ADMINISTRATIVOS (SEC, COORD, PROF...)', category: 'ADMINISTRATIVO', complianceRate: 100 },
  { id: 'env-7', name: 'SANITÁRIOS', category: 'SANITARIO', complianceRate: 100 },
  { id: 'env-8', name: 'CORREDORES, RAMPAS E HALL', category: 'CIRCULACAO', complianceRate: 100 },
  { id: 'env-9', name: 'CALÇADAS (INTERNAS)', category: 'CALCADA_INTERNA', complianceRate: 100 },
  { id: 'env-10', name: 'CALÇADA EXTERNA', category: 'CALCADA_EXTERNA', complianceRate: 100 },
];

const DETAILED_PROTOCOLS: Record<string, Record<CleaningFrequency, string[]>> = {
  SALA_AULA: {
    'DIÁRIA': ["Remover pó em mesas, cadeiras, quadro de vidro e TV", "Varrer o piso", "Manter cestos limpos", "Inspeções: vidros, lâmpadas, fechaduras, mobiliário"],
    'SEMANAL': ["Eliminar marcas de lápis, caneta, adesivos e gomas", "Remover mesas/cadeiras para limpeza completa do piso", "Aplicar produto para conservação de pisos", "Higienizar cestos"],
    'MENSAL': ["Remover manchas do piso", "Limpar paredes e rodapés", "Limpar janelas", "Limpar filtros do ar condicionado"],
    'TRIMESTRAL': ["Eliminar objetos aderidos à laje/forro", "Lavar cortinas"]
  },
  AUDITORIO: {
    'DIÁRIA': ["Remover pó em mesas, cadeiras e equipamentos de áudio/vídeo", "Varrer o piso", "Manter cestos limpos", "Inspeções: vidros, lâmpadas, fechaduras, mobiliário"],
    'SEMANAL': ["Eliminar marcas em mobiliário e paredes", "Remover cadeiras para limpeza completa do piso", "Higienizar cestos"],
    'MENSAL': ["Limpar paredes e rodapés", "Limpar janelas", "Limpar filtros do ar condicionado"],
    'TRIMESTRAL': ["Eliminar objetos aderidos à laje/forro", "Lavar cortinas"]
  },
  SALA_RECURSOS: {
    'DIÁRIA': ["Remover pó em mesas, armários, estantes, equipamentos pedagógicos e bancadas", "Varrer o piso", "Manter cestos limpos", "Inspeções diárias"],
    'SEMANAL': ["Eliminar marcas em mobiliário", "Remover mobiliário para limpeza completa do piso", "Higienizar cestos"],
    'MENSAL': ["Limpar paredes e rodapés", "Limpar janelas", "Limpar filtros do ar condicionado"],
    'TRIMESTRAL': ["Eliminar objetos aderidos à laje/forro", "Lavar cortinas"]
  },
  LABORATORIO: {
    'DIÁRIA': ["Remover pó em bancadas, banquetas, mesas, racks, armários, microscópios, computadores, TVs e demais equipamentos", "Varrer o piso", "Manter cestos limpos", "Inspeções: vidros, lâmpadas, fechaduras, mobiliário, partes metálicas pontiagudas"],
    'SEMANAL': ["Eliminar marcas em mobiliário", "Remover mobiliário para limpeza completa do piso", "Higienizar cestos"],
    'MENSAL': ["Remover manchas do piso", "Limpar paredes e rodapés", "Limpar janelas", "Limpar filtros do ar condicionado", "Limpar equipamentos eletroeletrônicos com produto específico"],
    'TRIMESTRAL': ["Eliminar objetos aderidos à laje/forro", "Lavar cortinas"]
  },
  BIBLIOTECA: {
    'DIÁRIA': ["Remover pó em mesas, cadeiras, estantes de livros, balcões, computadores e TVs", "Varrer o piso", "Manter cestos limpos", "Inspeções diárias"],
    'SEMANAL': ["Eliminar marcas em mobiliário", "Remover mobiliário para limpeza completa do piso", "Higienizar cestos"],
    'MENSAL': ["Remover manchas do piso", "Limpar paredes e rodapés", "Limpar janelas", "Limpar filtros do ar condicionado"],
    'TRIMESTRAL': ["Eliminar objetos aderidos à laje/forro", "Lavar cortinas"]
  },
  ADMINISTRATIVO: {
    'DIÁRIA': ["Remover pó em mesas, cadeiras, armários, estantes, balcões, computadores, impressoras, telefones e TVs", "Varrer o piso", "Manter cestos limpos", "Inspeções diárias"],
    'SEMANAL': ["Eliminar marcas em mobiliário", "Remover mobiliário para limpeza completa do piso", "Higienizar cestos"],
    'MENSAL': ["Remover manchas do piso", "Limpar paredes e rodapés", "Limpar janelas", "Limpar filtros do ar condicionado"],
    'TRIMESTRAL': ["Eliminar objetos aderidos à laje/forro", "Lavar cortinas"]
  },
  SANITARIO: {
    'DIÁRIA': ["Lavar e desinfetar vasos sanitários, mictórios e pias", "Higienizar torneiras, maçanetas e dispensadores", "Repor papel higiênico, papel toalha e sabonete líquido", "Varrer o piso com desinfetante", "Manter lixeiras limpas", "Inspeções: verificar vazamentos, entupimentos e funcionamento das descargas"],
    'SEMANAL': ["Limpeza profunda de azulejos e rejuntes", "Higienizar portas e divisórias", "Lavar lixeiras"],
    'MENSAL': ["Desincrustar pisos e paredes", "Limpar ralos e sifões", "Revisar ventilação/exaustores"],
    'TRIMESTRAL': ["Revisão geral de encanamentos e acessórios", "Limpeza completa de teto e luminárias externas"]
  },
  CIRCULACAO: {
    'DIÁRIA': ["Varrer o piso", "Remover pó de corrimãos, guarda-corpos e balcões de recepção", "Manter cestos limpos", "Inspeções: iluminação, corrimãos, portas de acesso e sinalização"],
    'SEMANAL': ["Limpeza detalhada de corrimãos, guarda-corpos e balcões", "Higienizar cestos", "Remover marcas nas paredes"],
    'MENSAL': ["Remover manchas do piso", "Limpar paredes e rodapés", "Limpar janelas e portas de acesso"],
    'TRIMESTRAL': ["Revisão geral de corrimãos, guarda-corpos e balcões", "Limpeza completa de teto e sinalização"]
  },
  CALCADA_INTERNA: {
    'DIÁRIA': ["Varrer o piso interno", "Remover folhas, resíduos e objetos soltos", "Lavar com água e detergente neutro", "Inspeções: rachaduras, buracos e acúmulo de lixo"],
    'SEMANAL': ["Limpeza detalhada das áreas internas", "Remover manchas superficiais", "Higienizar lixeiras"],
    'MENSAL': ["Lavagem completa com jato de água ou lavadora", "Remover manchas persistentes", "Revisar drenagem"],
    'TRIMESTRAL': ["Revisão geral de pisos internos", "Reparos em rachaduras e nivelamento", "Limpeza completa de áreas de difícil acesso"]
  },
  CALCADA_EXTERNA: {
    'DIÁRIA': ["Varrer toda a extensão externa", "Remover folhas, galhos e resíduos", "Lavar com água e detergente neutro", "Inspeções: rachaduras, buracos, acúmulo de lixo e sinalização externa", "Retirar matos das juntas e bordas"],
    'SEMANAL': ["Limpeza detalhada das áreas externas", "Remover manchas superficiais", "Higienizar lixeiras externas", "Controle de matos"],
    'MENSAL': ["Lavagem completa com jato de água ou lavadora de alta pressão", "Remover manchas persistentes", "Revisar drenagem externa", "Remoção de matos resistentes"],
    'TRIMESTRAL': ["Revisão geral de pisos externos", "Reparos em rachaduras e nivelamento", "Limpeza completa de áreas de difícil acesso", "Tratamento preventivo contra matos"]
  }
};

// Supabase Import
import { supabase } from '../supabaseClient';

const CleaningMaintenanceModule: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'team' | 'predial' | 'kitchen' | 'ppe' | 'materials' | 'protocol_official' | 'scheduler' | 'preventive_plan'>('scheduler');

  const [environments, setEnvironments] = useState<SchoolEnvironment[]>([]);
  const [employees, setEmployees] = useState<CleaningEmployee[]>([]);
  const [tasks, setTasks] = useState<CleaningTask[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [newEnv, setNewEnv] = useState<{ name: string, category: SchoolEnvironmentCategory }>({ name: '', category: 'SALA_AULA' });

  const fetchData = async () => {
    try {
      // Fetch Environments
      const { data: envData, error: envError } = await supabase
        .from('cleaning_environments')
        .select('*')
        .order('name');

      if (envError) throw envError;

      if (envData) {
        // Auto-seed if empty
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

      // Fetch Tasks
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

  // INTEGRAÇÃO REFORÇADA: Carrega funcionários de Apoio (AAE) da Secretaria
  useEffect(() => {
    fetchData();

    // Subscribe to changes
    const channels = supabase.channel('cleaning_changes')
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
        console.error("Error loading staff from Supabase:", err);
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
      alert("Ambiente cadastrado conforme Protocolo!");
    } catch (error) {
      console.error("Erro ao adicionar ambiente:", error);
    }
  };

  const deleteEnvironment = async (id: string) => {
    if (window.confirm("Remover este ambiente e todas as suas tarefas?")) {
      try {
        await supabase.from('cleaning_environments').delete().eq('id', id);
        // Cascade delete should handle tasks, but we can verify in logic if needed.
        // Alert handled by subscription update usually, but explicit fetch good.
      } catch (error) {
        console.error("Erro ao remover ambiente:", error);
      }
    }
  };

  const resetToInitialData = async () => {
    if (window.confirm("Restaurar ambientes e limpar cronograma?")) {
      // Caution: This logic might be better as a server-side function or handled carefully
      // For now, simple client-side logic
      try {
        await supabase.from('cleaning_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        await supabase.from('cleaning_environments').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        // Re-seed happens on next fetch if empty
        await fetchData();
        alert("Configurações resetadas. Recarregando...");
      } catch (error) {
        console.error("Erro ao resetar dados:", error);
      }
    }
  };



  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const isDone = task.status === 'CONCLUÍDO';
    const newStatus = isDone ? 'PENDENTE' : 'CONCLUÍDO';
    const lastPerformed = isDone ? null : new Date().toISOString();

    try {
      await supabase.from('cleaning_tasks').update({
        status: newStatus,
        last_performed: lastPerformed
      }).eq('id', id);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };



  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans w-full min-w-0">
      <aside className="w-64 shrink-0 bg-orange-950 text-white flex flex-col no-print min-w-0">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg">🧹</div>
            Zeladoria MT
          </h1>
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <button onClick={() => setActiveTab('protocol_official')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'protocol_official' ? 'bg-orange-800 text-white shadow-lg' : 'text-orange-100 hover:bg-orange-800/50'}`}><BookOpen size={18} className="shrink-0" /> <span className="truncate">Protocolo Manual</span></button>
          <button onClick={() => setActiveTab('preventive_plan')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'preventive_plan' ? 'bg-orange-800 text-white shadow-lg' : 'text-orange-100 hover:bg-orange-800/50'}`}><ShieldCheck size={18} className="shrink-0" /> <span className="truncate">Plano SEDUC</span></button>

          <button onClick={() => setActiveTab('scheduler')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'scheduler' ? 'bg-orange-800 text-white shadow-lg' : 'text-orange-100 hover:bg-orange-800/50'}`}><Calendar size={18} className="shrink-0" /> <span className="truncate">Cronograma (Blocos)</span></button>
          <button onClick={() => setActiveTab('team')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'team' ? 'bg-orange-800 text-white shadow-lg' : 'text-orange-100 hover:bg-orange-800/50'}`}><Users size={18} className="shrink-0" /> <span className="truncate">Equipe de Apoio</span></button>
          <button onClick={() => setActiveTab('predial')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'predial' ? 'bg-orange-800 text-white shadow-lg' : 'text-orange-100 hover:bg-orange-800/50'}`}><Hammer size={18} className="shrink-0" /> <span className="truncate">Manutenção Predial</span></button>
          <button onClick={() => setActiveTab('kitchen')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'kitchen' ? 'bg-orange-800 text-white shadow-lg' : 'text-orange-100 hover:bg-orange-800/50'}`}><CookingPot size={18} className="shrink-0" /> <span className="truncate">Higiene Cozinha</span></button>
          <button onClick={() => setActiveTab('materials')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'materials' ? 'bg-orange-800 text-white shadow-lg' : 'text-orange-100 hover:bg-orange-800/50'}`}><Droplets size={18} className="shrink-0" /> <span className="truncate">Insumos Limpeza</span></button>
          <button onClick={() => setActiveTab('ppe')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'ppe' ? 'bg-orange-800 text-white shadow-lg' : 'text-orange-100 hover:bg-orange-800/50'}`}><HardHat size={18} className="shrink-0" /> <span className="truncate">Controle EPIs</span></button>

          <button onClick={() => setIsConfigModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-orange-200 hover:bg-orange-800/50 mt-10 border-t border-orange-800 pt-10"><Settings2 size={18} className="shrink-0" /> <span className="truncate">Configurar Ambientes</span></button>
        </nav>
        <div className="p-6"><button onClick={onExit} className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest leading-none"><ArrowLeft size={16} className="shrink-0" /> <span className="truncate">Voltar ao Hub</span></button></div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0 min-w-0 w-full gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0"><Brush size={20} /></div>
            <h2 className="text-xs md:text-sm font-black text-gray-900 uppercase truncate">Zeladoria & Conservação Escolar</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0 min-w-0">
            <div className="relative no-print min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-orange-500/5 w-28 sm:w-48 md:w-64 min-w-0"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 custom-scrollbar min-w-0 w-full">
          {activeTab === 'protocol_official' && <CleaningOfficialManual />}
          {activeTab === 'preventive_plan' && <PreventiveMaintenancePlan employees={employees} />}

          {activeTab === 'scheduler' && <MaintenanceScheduler employees={employees} />}



          {activeTab === 'team' && (
            <div className="space-y-8 animate-in fade-in duration-500 w-full min-w-0">
              <div className="bg-blue-900 p-6 sm:p-8 rounded-[2.5rem] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-xl relative overflow-hidden gap-4 min-w-0 w-full">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 pointer-events-none"><Users size={140} /></div>
                <div className="relative z-10 min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter truncate">Equipe Operacional Integrada</h3>
                  <p className="text-blue-200 text-xs sm:text-sm mt-1 truncate">Servidores de Apoio sincronizados com a base de dados da Secretaria.</p>
                </div>
                <div className="bg-white/10 px-6 py-4 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
                  <p className="text-[10px] font-black text-blue-300 uppercase">Servidores em Atividade</p>
                  <p className="text-2xl font-black">{employees.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full min-w-0">
                {employees.map(emp => (
                  <div key={emp.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:border-orange-200 transition-all flex flex-col group min-w-0 w-full">
                    <div className="flex items-center gap-4 mb-4 min-w-0">
                      <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-black text-lg group-hover:bg-orange-600 group-hover:text-white transition-all shadow-inner shrink-0">
                        {emp.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 uppercase truncate">{emp.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate">{emp.shift} | {emp.scope}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2 min-w-0">
                      <p className="text-[8px] font-black text-gray-400 uppercase leading-none truncate">Matrícula: {(emp as any).registration || '---'}</p>
                      <p className="text-[10px] font-bold text-gray-700 uppercase truncate">
                        {tasks.filter(t => t.assignedEmployeeId === emp.id).length} tarefas vinculadas
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'predial' && <PredialMaintenanceDashboard onNavigateToPreventive={() => setActiveTab('preventive_plan')} />}
          {activeTab === 'kitchen' && <KitchenSanitation />}
          {activeTab === 'materials' && <CleaningMaterialControl />}
          {activeTab === 'ppe' && <PPEControl />}
        </div>
      </main>



      {/* Modal Configuração */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-orange-50 border-b border-orange-100 flex justify-between items-center shrink-0">
              <h3 className="text-2xl font-black text-gray-900 uppercase">Configurar Ambientes</h3>
              <div className="flex gap-2">
                <button onClick={resetToInitialData} className="p-3 bg-white text-orange-600 border border-orange-100 hover:bg-orange-50 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase">
                  <RefreshCw size={18} /> Restaurar Padrão
                </button>
                <button onClick={() => setIsConfigModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-10">
              <form onSubmit={addEnvironment} className="space-y-6">
                <h4 className="text-sm font-black text-orange-600 uppercase border-b border-orange-100 pb-2">Novo Ambiente</h4>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Setor</label>
                  <input required value={newEnv.name} onChange={e => setNewEnv({ ...newEnv, name: e.target.value.toUpperCase() })} placeholder="EX: SALA 01" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria para Protocolo</label>
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
                  </select>
                </div>
                <button type="submit" className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all">Salvar Ambiente</button>
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
                      <button onClick={() => deleteEnvironment(e.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
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

export default CleaningMaintenanceModule;
