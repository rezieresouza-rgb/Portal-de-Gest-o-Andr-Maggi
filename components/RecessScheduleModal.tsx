import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Calendar as CalendarIcon, Users, Printer, Save, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
}

interface RecessScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
}

const RecessScheduleModal: React.FC<RecessScheduleModalProps> = ({ isOpen, onClose, employees }) => {
  const [t1Start, setT1Start] = useState('');
  const [t1End, setT1End] = useState('');
  const [t2Start, setT2Start] = useState('');
  const [t2End, setT2End] = useState('');
  const [department, setDepartment] = useState<'Todos' | 'Zeladoria/Limpeza' | 'Cozinha/Merenda' | 'Secretaria' | 'Civico-Militar'>('Todos');
  const [team1, setTeam1] = useState<Employee[]>([]);
  const [team2, setTeam2] = useState<Employee[]>([]);
  const [unassigned, setUnassigned] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedSchedules, setSavedSchedules] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  const [dailyActivities, setDailyActivities] = useState<Record<string, string>>({});
  
  function getWorkingDays(start: string, end: string) {
    if (!start || !end) return [];
    const days = [];
    const currentDate = new Date(start + 'T12:00:00');
    const endDateObj = new Date(end + 'T12:00:00');
    
    while (currentDate <= endDateObj) {
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      if (!isWeekend) {
        days.push(currentDate.toISOString().split('T')[0]);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }

  // Calculate working days dynamically for the UI
  const currentWorkingDays = React.useMemo(() => {
    const days = new Set<string>();
    getWorkingDays(t1Start, t1End).forEach(d => days.add(d));
    getWorkingDays(t2Start, t2End).forEach(d => days.add(d));
    return Array.from(days).sort();
  }, [t1Start, t1End, t2Start, t2End]);

  // Initialize empty text for new days
  useEffect(() => {
    setDailyActivities(prev => {
      const newActivities = { ...prev };
      currentWorkingDays.forEach(day => {
        if (!newActivities[day]) {
          newActivities[day] = '';
        }
      });
      return newActivities;
    });
  }, [currentWorkingDays]);

  useEffect(() => {
    if (isOpen) {
      setUnassigned([...employees]);
      setTeam1([]);
      setTeam2([]);
      setDepartment('Todos');
      fetchSavedSchedules();
    }
  }, [isOpen, employees]);

  const fetchSavedSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_recess_schedules')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setSavedSchedules(data);
      }
    } catch (err) {
      console.error("Erro ao buscar escalas salvas:", err);
    }
  };

  const moveEmployee = (emp: Employee, from: 'unassigned' | 'team1' | 'team2', to: 'unassigned' | 'team1' | 'team2') => {
    // Remove from source
    if (from === 'unassigned') setUnassigned(prev => prev.filter(e => e.id !== emp.id));
    if (from === 'team1') setTeam1(prev => prev.filter(e => e.id !== emp.id));
    if (from === 'team2') setTeam2(prev => prev.filter(e => e.id !== emp.id));
    
    // Add to target
    if (to === 'unassigned') setUnassigned(prev => [...prev, emp]);
    if (to === 'team1') setTeam1(prev => [...prev, emp]);
    if (to === 'team2') setTeam2(prev => [...prev, emp]);
  };

  const handleSave = async () => {
    if ((!t1Start || !t1End) && (!t2Start || !t2End)) {
      alert("Por favor, selecione as datas para pelo menos uma das equipes.");
      return;
    }
    
    if (team1.length === 0 && team2.length === 0) {
      alert("Distribua os servidores nas equipes antes de salvar.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.from('maintenance_recess_schedules').insert([{
        start_date: t1Start || t2Start,
        end_date: t2End || t1End,
        t1_work_start: t1Start || null,
        t1_work_end: t1End || null,
        t2_work_start: t2Start || null,
        t2_work_end: t2End || null,
        department: department,
        team_1_members: team1,
        team_2_members: team2,
        working_days: currentWorkingDays,
        daily_activities: dailyActivities
      }]).select();
      
      if (error) throw error;
      
      alert("Escala de recesso salva com sucesso!");
      fetchSavedSchedules();
      setActiveTab('saved');
    } catch (err) {
      console.error("Erro ao salvar escala:", err);
      alert("Erro ao salvar. Verifique se a coluna 'activities' foi criada na tabela do banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestActivities = async () => {
    if (currentWorkingDays.length === 0) {
      alert("Por favor, preencha as datas de início e fim primeiro.");
      return;
    }

    try {
      const { data, error } = await supabase.from('maintenance_tasks').select('task_description, frequency');
      if (error) throw error;
      
      const extractUnique = (freq: string) => {
        if (!data) return [];
        const tasks = data.filter(t => t.frequency === freq).map(t => t.task_description);
        return Array.from(new Set(tasks));
      };

      const mensais = extractUnique('MENSAL');
      const trimestrais = extractUnique('TRIMESTRAL');
      const pesadasZeladoria = [...mensais, ...trimestrais];

      const atividadesSecretaria = [
        "Atendimento ao público (pais, alunos, comunidade)",
        "Organização e atualização de arquivos e prontuários",
        "Emissão de declarações, históricos e boletins",
        "Atualização do sistema de gestão escolar",
        "Recebimento e expedição de documentos",
        "Atendimento telefônico e organização da recepção",
        "Auxílio na matrícula e rematrícula",
        "Verificação de diários de classe e documentação de turmas",
        "Organização do almoxarifado da secretaria"
      ];

      const atividadesCozinha = [
        "Limpeza pesada da cozinha e despensa",
        "Organização do estoque de alimentos",
        "Descongelamento e higienização de freezers/geladeiras",
        "Higienização profunda de prateleiras e armários",
        "Limpeza detalhada de fogões e fornos industriais",
        "Higienização de panelões e bancadas",
        "Levantamento de inventário e validade dos alimentos"
      ];

      const atividadesCivico = [
        "Monitoramento e ronda ostensiva das instalações",
        "Controle de acesso de pessoas e prestadores de serviço",
        "Verificação de segurança de portas, portões e cadeados",
        "Organização do material disciplinar/militar (fardamentos, registros)",
        "Apoio à gestão escolar na recepção e orientação",
        "Ronda no perímetro escolar e quadras"
      ];

      const newDailyActivities = { ...dailyActivities };
      
      // Distribute tasks across available days
      currentWorkingDays.forEach((day, index) => {
        let text = '';
        
        const includeSecretaria = department === 'Todos' || department === 'Secretaria';
        const includeCozinha = department === 'Todos' || department === 'Cozinha/Merenda';
        const includeZeladoria = department === 'Todos' || department === 'Zeladoria/Limpeza';
        const includeCivico = department === 'Todos' || department === 'Civico-Militar';

        if (includeSecretaria) {
          const sec1 = atividadesSecretaria[(index * 2) % atividadesSecretaria.length];
          const sec2 = atividadesSecretaria[((index * 2) + 1) % atividadesSecretaria.length];
          text += `SECRETARIA (Técnicos Adm.):\n- ${sec1}\n- ${sec2}\n\n`;
        }
        
        if (includeCozinha) {
          const coz = atividadesCozinha[index % atividadesCozinha.length];
          text += `COZINHA / MERENDA:\n- ${coz}\n\n`;
        }

        if (includeCivico) {
          const civ1 = atividadesCivico[(index * 2) % atividadesCivico.length];
          const civ2 = atividadesCivico[((index * 2) + 1) % atividadesCivico.length];
          text += `EQUIPE CÍVICO-MILITAR:\n- ${civ1}\n- ${civ2}\n\n`;
        }
        
        if (includeZeladoria) {
          text += `ZELADORIA / LIMPEZA:\n- Rotina diária/semanal`;
          // Add one or two heavy tasks if available
          if (pesadasZeladoria.length > 0) {
            const taskIndex = index % pesadasZeladoria.length;
            text += `\n- TAREFA DO DIA: ${pesadasZeladoria[taskIndex]}`;
          }
          text += '\n\n';
        }

        newDailyActivities[day] = text.trim();
      });

      setDailyActivities(newDailyActivities);
    } catch (err) {
      console.error("Erro ao buscar atividades sugeridas:", err);
    }
  };

  const formatDateBr = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('/');
  };

  const getDayOfWeek = (dateStr: string) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const d = new Date(dateStr + 'T12:00:00');
    return days[d.getDay()];
  };

  const handlePrint = async (schedule: any) => {
    const element = document.getElementById(`print-recess-${schedule.id}`);
    if (!element) return;

    const opt = {
      margin: 5,
      filename: `Escala_Recesso_${formatDateBr(schedule.start_date).replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // @ts-ignore
    await window.html2pdf().set(opt).from(element).save();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-black text-gray-900 uppercase flex items-center gap-2">
            <CalendarIcon size={24} className="text-indigo-600" />
            Escala de Trabalho - Recesso
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all"><X size={24} /></button>
        </div>
        
        <div className="flex border-b border-gray-100 shrink-0">
          <button 
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors ${activeTab === 'create' ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >
            Criar Nova Escala
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors ${activeTab === 'saved' ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >
            Escalas Salvas ({savedSchedules.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
          {activeTab === 'create' ? (
            <div className="space-y-6">
              {/* Configurações Iniciais */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-6">
                
                {/* Seleção do Setor */}
                <div className="border border-purple-200 bg-purple-50 rounded-xl p-4">
                  <label className="block text-xs font-black text-purple-800 uppercase mb-2">Setor da Escala</label>
                  <select 
                    value={department}
                    onChange={(e: any) => setDepartment(e.target.value)}
                    className="w-full p-3 bg-white border border-purple-200 rounded-xl font-bold text-sm text-gray-700 outline-none focus:border-purple-500"
                  >
                    <option value="Todos">Todos os Setores Juntos</option>
                    <option value="Zeladoria/Limpeza">Apenas Zeladoria / Limpeza</option>
                    <option value="Cozinha/Merenda">Apenas Cozinha / Merenda</option>
                    <option value="Secretaria">Apenas Secretaria</option>
                    <option value="Civico-Militar">Apenas Equipe Cívico-Militar</option>
                  </select>
                  <p className="text-[10px] text-purple-600 mt-2 italic">
                    * O botão "Importar do Cronograma" trará apenas as atividades do setor escolhido.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Período Equipe 1 */}
                  <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4">
                    <h4 className="text-xs font-black uppercase text-emerald-800 mb-4">Dias Trabalhados pela Equipe 1</h4>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-emerald-700 uppercase mb-2">Data Inicial</label>
                        <input 
                          type="date" 
                          value={t1Start}
                          onChange={(e) => setT1Start(e.target.value)}
                          className="w-full p-3 bg-white border border-emerald-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-500" 
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-emerald-700 uppercase mb-2">Data Final</label>
                        <input 
                          type="date" 
                          value={t1End}
                          onChange={(e) => setT1End(e.target.value)}
                          min={t1Start}
                          className="w-full p-3 bg-white border border-emerald-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-500" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Período Equipe 2 */}
                  <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                    <h4 className="text-xs font-black uppercase text-blue-800 mb-4">Dias Trabalhados pela Equipe 2</h4>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-blue-700 uppercase mb-2">Data Inicial</label>
                        <input 
                          type="date" 
                          value={t2Start}
                          onChange={(e) => setT2Start(e.target.value)}
                          className="w-full p-3 bg-white border border-blue-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500" 
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-blue-700 uppercase mb-2">Data Final</label>
                        <input 
                          type="date" 
                          value={t2End}
                          onChange={(e) => setT2End(e.target.value)}
                          min={t2Start}
                          className="w-full p-3 bg-white border border-blue-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divisão de Equipes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Não Atribuídos */}
                <div className="bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
                  <div className="bg-gray-100 p-3 border-b border-gray-200">
                    <h4 className="text-xs font-black text-gray-700 uppercase flex items-center gap-2">
                      <Users size={14} /> Disponíveis ({unassigned.length})
                    </h4>
                  </div>
                  <div className="p-3 flex-1 min-h-[200px] overflow-y-auto space-y-2">
                    {unassigned.map(emp => (
                      <div key={emp.id} className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-700 uppercase truncate pr-2">{emp.name}</span>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => moveEmployee(emp, 'unassigned', 'team1')} className="px-2 py-1 bg-white border border-gray-200 rounded text-[9px] font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600" title="Mover para Equipe 1">E1 <ChevronRight size={10} className="inline"/></button>
                          <button onClick={() => moveEmployee(emp, 'unassigned', 'team2')} className="px-2 py-1 bg-white border border-gray-200 rounded text-[9px] font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600" title="Mover para Equipe 2">E2 <ChevronRight size={10} className="inline"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equipe 1 */}
                <div className={`rounded-2xl border flex flex-col overflow-hidden bg-white border-emerald-200`}>
                  <div className={`p-3 border-b flex justify-between items-center bg-emerald-100 border-emerald-200 text-emerald-800`}>
                    <h4 className="text-xs font-black uppercase flex items-center gap-2">Equipe 1 ({team1.length})</h4>
                  </div>
                  <div className="p-3 flex-1 min-h-[200px] overflow-y-auto space-y-2">
                    {team1.map(emp => (
                      <div key={emp.id} className="bg-white p-2 rounded-lg border border-emerald-100 flex justify-between items-center shadow-sm">
                        <button onClick={() => moveEmployee(emp, 'team1', 'unassigned')} className="p-1 hover:text-red-500"><ChevronLeft size={12} /></button>
                        <span className="text-xs font-bold text-gray-700 uppercase truncate px-2">{emp.name}</span>
                        <button onClick={() => moveEmployee(emp, 'team1', 'team2')} className="p-1 hover:text-indigo-500"><ChevronRight size={12} /></button>
                      </div>
                    ))}
                    {team1.length === 0 && <p className="text-[10px] text-gray-400 text-center py-4 italic">Nenhum servidor.</p>}
                  </div>
                </div>

                {/* Equipe 2 */}
                <div className={`rounded-2xl border flex flex-col overflow-hidden bg-white border-blue-200`}>
                  <div className={`p-3 border-b flex justify-between items-center bg-blue-100 border-blue-200 text-blue-800`}>
                    <h4 className="text-xs font-black uppercase flex items-center gap-2">Equipe 2 ({team2.length})</h4>
                  </div>
                  <div className="p-3 flex-1 min-h-[200px] overflow-y-auto space-y-2">
                    {team2.map(emp => (
                      <div key={emp.id} className="bg-white p-2 rounded-lg border border-blue-100 flex justify-between items-center shadow-sm">
                        <button onClick={() => moveEmployee(emp, 'team2', 'team1')} className="p-1 hover:text-indigo-500"><ChevronLeft size={12} /></button>
                        <span className="text-xs font-bold text-gray-700 uppercase truncate px-2">{emp.name}</span>
                        <button onClick={() => moveEmployee(emp, 'team2', 'unassigned')} className="p-1 hover:text-red-500"><ChevronRight size={12} /></button>
                      </div>
                    ))}
                    {team2.length === 0 && <p className="text-[10px] text-gray-400 text-center py-4 italic">Nenhum servidor.</p>}
                  </div>
                </div>
              </div>

              {/* Atividades */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase">Atividades por Dia (Opcional)</label>
                  <button 
                    onClick={handleSuggestActivities}
                    className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-2 rounded font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors shadow-sm"
                  >
                    + Importar do Cronograma
                  </button>
                </div>
                
                {currentWorkingDays.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-4 border border-dashed rounded-xl">
                    Selecione a data inicial e final para preencher as atividades.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {currentWorkingDays.map((day) => (
                      <div key={day} className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-gray-600 bg-gray-100 px-2 py-1 rounded w-fit">
                          {formatDateBr(day)} - {getDayOfWeek(day)}
                        </span>
                        <textarea
                          value={dailyActivities[day] || ''}
                          onChange={(e) => setDailyActivities(prev => ({ ...prev, [day]: e.target.value }))}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-700 outline-none focus:border-indigo-500 min-h-[80px] resize-y"
                          placeholder={`Atividades programadas para ${getDayOfWeek(day)}...`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={handleSave}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : <><Save size={18} /> Salvar Escala</>}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {savedSchedules.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-gray-200">
                  <p className="text-gray-500 font-bold">Nenhuma escala salva encontrada.</p>
                </div>
              ) : (
                savedSchedules.map(schedule => {
                  return (
                    <div key={schedule.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                            Escala Consolidada: {formatDateBr(schedule.start_date)} a {formatDateBr(schedule.end_date || schedule.start_date)}
                            {schedule.department && schedule.department !== 'Todos' && (
                              <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-1 rounded">{schedule.department}</span>
                            )}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">Criada em {new Date(schedule.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <button 
                          onClick={() => handlePrint(schedule)}
                          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                        >
                          <Printer size={14} /> Imprimir PDF Único
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                          <p className="text-[10px] font-black text-emerald-800 uppercase mb-2">
                            Equipe 1
                            {schedule.t1_work_start && schedule.t1_work_end && 
                              <span className="ml-1 text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">Trabalha de {formatDateBr(schedule.t1_work_start)} a {formatDateBr(schedule.t1_work_end)}</span>
                            }
                          </p>
                          <ul className="list-disc pl-4 text-xs font-bold text-gray-700 space-y-1 uppercase">
                            {schedule.team_1_members.map((m: any) => <li key={m.id}>{m.name}</li>)}
                          </ul>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                          <p className="text-[10px] font-black text-blue-800 uppercase mb-2">
                            Equipe 2
                            {schedule.t2_work_start && schedule.t2_work_end && 
                              <span className="ml-1 text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Trabalha de {formatDateBr(schedule.t2_work_start)} a {formatDateBr(schedule.t2_work_end)}</span>
                            }
                          </p>
                          <ul className="list-disc pl-4 text-xs font-bold text-gray-700 space-y-1 uppercase">
                            {schedule.team_2_members.map((m: any) => <li key={m.id}>{m.name}</li>)}
                          </ul>
                        </div>
                      </div>

                      {/* Elemento Oculto para Impressão */}
                      <div className="hidden">
                        <div id={`print-recess-${schedule.id}`} className="p-8 bg-white text-gray-900 font-sans">
                          <div className="text-center mb-6">
                            <h1 className="text-2xl font-black uppercase border-b-2 border-gray-900 pb-2">
                              Escala de Trabalho - Recesso Escolar
                              {schedule.department && schedule.department !== 'Todos' && ` (${schedule.department})`}
                            </h1>
                            <p className="text-sm font-bold mt-2">Período: {formatDateBr(schedule.start_date)} a {formatDateBr(schedule.end_date || schedule.start_date)}</p>
                          </div>
                          
                          <div className="flex gap-8 mb-8">
                            <div className="flex-1">
                              <h2 className="text-[11px] font-black uppercase bg-gray-200 p-2 text-center mb-2">
                                Equipe 1 
                                {schedule.t1_work_start && schedule.t1_work_end && ` (Trabalha de ${formatDateBr(schedule.t1_work_start)} a ${formatDateBr(schedule.t1_work_end)})`}
                              </h2>
                              <ul className="text-[10px] uppercase border border-gray-300 p-2 min-h-[60px]">
                                {schedule.team_1_members.map((m: any) => <li key={m.id} className="py-1 border-b border-dashed border-gray-300 last:border-0">{m.name}</li>)}
                              </ul>
                            </div>
                            <div className="flex-1">
                              <h2 className="text-[11px] font-black uppercase bg-gray-200 p-2 text-center mb-2">
                                Equipe 2
                                {schedule.t2_work_start && schedule.t2_work_end && ` (Trabalha de ${formatDateBr(schedule.t2_work_start)} a ${formatDateBr(schedule.t2_work_end)})`}
                              </h2>
                              <ul className="text-[10px] uppercase border border-gray-300 p-2 min-h-[60px]">
                                {schedule.team_2_members.map((m: any) => <li key={m.id} className="py-1 border-b border-dashed border-gray-300 last:border-0">{m.name}</li>)}
                              </ul>
                            </div>
                          </div>

                          <h2 className="text-sm font-black uppercase mb-3">Dias de Trabalho (Folha de Ponto e Cronograma)</h2>
                          <table className="w-full border-collapse text-xs mb-8">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-400 p-2 w-16">Data</th>
                                <th className="border border-gray-400 p-2 w-12">Dia</th>
                                <th className="border border-gray-400 p-2 w-20">Turno</th>
                                <th className="border border-gray-400 p-2 text-left w-[40%]">Atividades Programadas</th>
                                <th className="border border-gray-400 p-2 text-left">Assinatura dos Servidores Trabalhando</th>
                              </tr>
                            </thead>
                            <tbody>
                              {schedule.working_days.map((day: string, idx: number) => {
                                const dayActivities = schedule.daily_activities ? schedule.daily_activities[day] : schedule.activities;
                                let activeTeam = '';
                                if (schedule.t1_work_start && schedule.t1_work_end && day >= schedule.t1_work_start && day <= schedule.t1_work_end) activeTeam = 'Equipe 1';
                                if (schedule.t2_work_start && schedule.t2_work_end && day >= schedule.t2_work_start && day <= schedule.t2_work_end) activeTeam = activeTeam ? 'Ambas' : 'Equipe 2';

                                return (
                                  <tr key={idx}>
                                    <td className="border border-gray-400 p-2 text-center font-bold align-top">{formatDateBr(day)}</td>
                                    <td className="border border-gray-400 p-2 text-center align-top">{getDayOfWeek(day)}</td>
                                    <td className="border border-gray-400 p-2 text-center font-black text-[9px] uppercase align-top">{activeTeam}</td>
                                    <td className="border border-gray-400 p-2 align-top whitespace-pre-wrap text-[9px]">
                                      {dayActivities || ''}
                                    </td>
                                    <td className="border border-gray-400 p-2 align-top"></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          <div className="flex justify-around mt-16 pt-8">
                            <div className="text-center w-64">
                              <div className="border-t border-gray-900 mb-2"></div>
                              <p className="text-xs font-bold uppercase">Gestor Escolar</p>
                            </div>
                            <div className="text-center w-64">
                              <div className="border-t border-gray-900 mb-2"></div>
                              <p className="text-xs font-bold uppercase">Responsável (Coordenador / Secretário / Zelador)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecessScheduleModal;
