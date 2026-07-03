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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [team1, setTeam1] = useState<Employee[]>([]);
  const [team2, setTeam2] = useState<Employee[]>([]);
  const [unassigned, setUnassigned] = useState<Employee[]>([]);
  const [recessTeam, setRecessTeam] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [savedSchedules, setSavedSchedules] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  const [dailyActivities, setDailyActivities] = useState<Record<string, string>>({});
  
  // Calculate working days dynamically for the UI
  const currentWorkingDays = startDate && endDate ? getWorkingDays(startDate, endDate) : [];

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
  }, [startDate, endDate]);

  useEffect(() => {
    if (isOpen) {
      setUnassigned([...employees]);
      setTeam1([]);
      setTeam2([]);
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

  function getWorkingDays(start: string, end: string) {
    const days = [];
    const currentDate = new Date(start + 'T12:00:00');
    const endDate = new Date(end + 'T12:00:00');
    
    while (currentDate <= endDate) {
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      if (!isWeekend) {
        days.push(currentDate.toISOString().split('T')[0]);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }

  const handleSave = async () => {
    if (!startDate || !endDate) {
      alert("Por favor, selecione a data de início e a data final.");
      return;
    }
    
    if (team1.length === 0 && team2.length === 0) {
      alert("Distribua os servidores nas equipes antes de salvar.");
      return;
    }

    const workingDays = getWorkingDays(startDate, endDate);
    
    setLoading(true);
    try {
      const { data, error } = await supabase.from('maintenance_recess_schedules').insert([{
        start_date: startDate,
        end_date: endDate,
        team_1_members: team1,
        team_2_members: team2,
        recess_team: recessTeam,
        working_days: workingDays,
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

      const newDailyActivities = { ...dailyActivities };
      
      // Distribute tasks across available days
      currentWorkingDays.forEach((day, index) => {
        // Pega 2 tarefas de secretaria diferentes a cada dia
        const sec1 = atividadesSecretaria[(index * 2) % atividadesSecretaria.length];
        const sec2 = atividadesSecretaria[((index * 2) + 1) % atividadesSecretaria.length];
        
        // Pega 1 tarefa de cozinha diferente a cada dia
        const coz = atividadesCozinha[index % atividadesCozinha.length];

        let text = `SECRETARIA (Técnicos Adm.):\n- ${sec1}\n- ${sec2}\n\nCOZINHA / MERENDA:\n- ${coz}`;
        
        text += `\n\nZELADORIA / LIMPEZA:\n- Rotina diária/semanal`;
        
        // Add one or two heavy tasks if available
        if (pesadasZeladoria.length > 0) {
          const taskIndex = index % pesadasZeladoria.length;
          text += `\n- TAREFA DO DIA: ${pesadasZeladoria[taskIndex]}`;
        }

        newDailyActivities[day] = text;
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
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-end">
                <div className="w-full md:w-1/3 flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Data Inicial</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-500" 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Data Final</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-500" 
                    />
                  </div>
                </div>
                <div className="w-full md:w-2/3 flex flex-col">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Qual equipe estará de recesso?</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setRecessTeam(1)}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 border ${recessTeam === 1 ? 'bg-indigo-100 border-indigo-300 text-indigo-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      {recessTeam === 1 && <CheckCircle2 size={16} />} Equipe 1 em Recesso
                    </button>
                    <button 
                      onClick={() => setRecessTeam(2)}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 border ${recessTeam === 2 ? 'bg-indigo-100 border-indigo-300 text-indigo-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      {recessTeam === 2 && <CheckCircle2 size={16} />} Equipe 2 em Recesso
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 italic">* A outra equipe trabalhará nos dias úteis desse período.</p>
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
                <div className={`rounded-2xl border flex flex-col overflow-hidden ${recessTeam === 1 ? 'bg-red-50 border-red-200' : 'bg-white border-emerald-200'}`}>
                  <div className={`p-3 border-b flex justify-between items-center ${recessTeam === 1 ? 'bg-red-100 border-red-200 text-red-800' : 'bg-emerald-100 border-emerald-200 text-emerald-800'}`}>
                    <h4 className="text-xs font-black uppercase flex items-center gap-2">Equipe 1 ({team1.length})</h4>
                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-white/50">{recessTeam === 1 ? 'Em Recesso' : 'Trabalhando'}</span>
                  </div>
                  <div className="p-3 flex-1 min-h-[200px] overflow-y-auto space-y-2">
                    {team1.map(emp => (
                      <div key={emp.id} className="bg-white p-2 rounded-lg border border-gray-100 flex justify-between items-center shadow-sm">
                        <button onClick={() => moveEmployee(emp, 'team1', 'unassigned')} className="p-1 hover:text-red-500"><ChevronLeft size={12} /></button>
                        <span className="text-xs font-bold text-gray-700 uppercase truncate px-2">{emp.name}</span>
                        <button onClick={() => moveEmployee(emp, 'team1', 'team2')} className="p-1 hover:text-indigo-500"><ChevronRight size={12} /></button>
                      </div>
                    ))}
                    {team1.length === 0 && <p className="text-[10px] text-gray-400 text-center py-4 italic">Nenhum servidor.</p>}
                  </div>
                </div>

                {/* Equipe 2 */}
                <div className={`rounded-2xl border flex flex-col overflow-hidden ${recessTeam === 2 ? 'bg-red-50 border-red-200' : 'bg-white border-emerald-200'}`}>
                  <div className={`p-3 border-b flex justify-between items-center ${recessTeam === 2 ? 'bg-red-100 border-red-200 text-red-800' : 'bg-emerald-100 border-emerald-200 text-emerald-800'}`}>
                    <h4 className="text-xs font-black uppercase flex items-center gap-2">Equipe 2 ({team2.length})</h4>
                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-white/50">{recessTeam === 2 ? 'Em Recesso' : 'Trabalhando'}</span>
                  </div>
                  <div className="p-3 flex-1 min-h-[200px] overflow-y-auto space-y-2">
                    {team2.map(emp => (
                      <div key={emp.id} className="bg-white p-2 rounded-lg border border-gray-100 flex justify-between items-center shadow-sm">
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
                  const workingTeam = schedule.recess_team === 1 ? schedule.team_2_members : schedule.team_1_members;
                  const recessTeamMembers = schedule.recess_team === 1 ? schedule.team_1_members : schedule.team_2_members;
                  
                  return (
                    <div key={schedule.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-sm font-black uppercase text-gray-900">Período de {formatDateBr(schedule.start_date)} a {formatDateBr(schedule.end_date || schedule.start_date)}</h4>
                          <p className="text-xs text-gray-500 mt-1">Escala salva em {new Date(schedule.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <button 
                          onClick={() => handlePrint(schedule)}
                          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                        >
                          <Printer size={14} /> Imprimir
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                          <p className="text-[10px] font-black text-emerald-800 uppercase mb-2">Trabalhando (Equipe {schedule.recess_team === 1 ? '2' : '1'})</p>
                          <ul className="list-disc pl-4 text-xs font-bold text-gray-700 space-y-1 uppercase">
                            {workingTeam.map((m: any) => <li key={m.id}>{m.name}</li>)}
                          </ul>
                        </div>
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                          <p className="text-[10px] font-black text-red-800 uppercase mb-2">Em Recesso (Equipe {schedule.recess_team})</p>
                          <ul className="list-disc pl-4 text-xs font-bold text-gray-700 space-y-1 uppercase">
                            {recessTeamMembers.map((m: any) => <li key={m.id}>{m.name}</li>)}
                          </ul>
                        </div>
                      </div>

                      {/* Elemento Oculto para Impressão */}
                      <div className="hidden">
                        <div id={`print-recess-${schedule.id}`} className="p-8 bg-white text-gray-900 font-sans">
                          <div className="text-center mb-6">
                            <h1 className="text-2xl font-black uppercase border-b-2 border-gray-900 pb-2">Escala de Trabalho - Recesso Escolar</h1>
                            <p className="text-sm font-bold mt-2">Período: {formatDateBr(schedule.start_date)} a {formatDateBr(schedule.end_date || schedule.start_date)}</p>
                          </div>
                          
                          <div className="flex gap-8 mb-8">
                            <div className="flex-1">
                              <h2 className="text-sm font-black uppercase bg-gray-200 p-2 text-center mb-2">Equipe Trabalhando (Dias Úteis)</h2>
                              <ul className="text-xs uppercase border border-gray-300 p-2 min-h-[100px]">
                                {workingTeam.map((m: any) => <li key={m.id} className="py-1 border-b border-dashed border-gray-300 last:border-0">{m.name}</li>)}
                              </ul>
                            </div>
                            <div className="flex-1">
                              <h2 className="text-sm font-black uppercase bg-gray-200 p-2 text-center mb-2">Equipe em Recesso</h2>
                              <ul className="text-xs uppercase border border-gray-300 p-2 min-h-[100px]">
                                {recessTeamMembers.map((m: any) => <li key={m.id} className="py-1 border-b border-dashed border-gray-300 last:border-0">{m.name}</li>)}
                              </ul>
                            </div>
                          </div>

                          <h2 className="text-sm font-black uppercase mb-3">Dias de Trabalho (Folha de Ponto e Cronograma)</h2>
                          <table className="w-full border-collapse text-xs mb-8">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-400 p-2 w-20">Data</th>
                                <th className="border border-gray-400 p-2 w-16">Dia</th>
                                <th className="border border-gray-400 p-2 text-left w-1/2">Atividades Programadas</th>
                                <th className="border border-gray-400 p-2 text-left">Assinatura dos Servidores Trabalhando</th>
                              </tr>
                            </thead>
                            <tbody>
                              {schedule.working_days.map((day: string, idx: number) => {
                                const dayActivities = schedule.daily_activities ? schedule.daily_activities[day] : schedule.activities;
                                return (
                                  <tr key={idx}>
                                    <td className="border border-gray-400 p-2 text-center font-bold align-top">{formatDateBr(day)}</td>
                                    <td className="border border-gray-400 p-2 text-center align-top">{getDayOfWeek(day)}</td>
                                    <td className="border border-gray-400 p-2 align-top whitespace-pre-wrap text-[10px]">
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
