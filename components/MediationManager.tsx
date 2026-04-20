import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scale, 
  Plus, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  MessageCircle,
  User, 
  X,
  AlertTriangle,
  History,
  FileText,
  Target,
  Users,
  ShieldAlert,
  Save,
  UserPlus,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { MediationCase, MediationStatus, CaseSeverity, PsychosocialRole, Student } from '../types';
import { INITIAL_STUDENTS } from '../constants/initialData';
import { supabase } from '../supabaseClient';

interface MediationManagerProps {
  role: PsychosocialRole;
  onTabChange?: (tab: string) => void;
  initialSearch?: string;
}

const CASE_TYPES = ['CONFLITO', 'BULLYING', 'DISCIPLINAR', 'OUTRO'];
const SEVERITIES: CaseSeverity[] = ['BAIXA', 'MÉDIA', 'ALTA', 'CRÍTICA'];

const MediationManager: React.FC<MediationManagerProps> = ({ role, onTabChange, initialSearch }) => {
  const [cases, setCases] = useState<MediationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<MediationCase | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  const [studentSearch, setStudentSearch] = useState('');
  
  const [newCase, setNewCase] = useState<Partial<MediationCase>>({
    type: 'CONFLITO',
    severity: 'MÉDIA',
    description: '',
    involvedParties: [],
    studentName: '',
    className: ''
  });
  const [activeTab, setActiveTab] = useState<'ativos' | 'historico'>('ativos');

  // [NOVO] Estados para o Diário de Atendimento
  const [newLog, setNewLog] = useState({
    professional: role === 'PSICOSSOCIAL' ? 'EQUIPE PSICOSSOCIAL' : 'MEDIAÇÃO',
    content: '',
    date: new Date().toLocaleDateString('sv-SE')
  });
  const [isLogLoading, setIsLogLoading] = useState(false);

  const masterStudents = useMemo(() => {
    const saved = localStorage.getItem('secretariat_detailed_students_v1');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  }, []);

  const filteredStudents = useMemo(() => {
    if (studentSearch.length < 3) return [];
    return masterStudents.filter((s: any) => 
      (s.Nome || s.name || '').toLowerCase().includes(studentSearch.toLowerCase())
    ).slice(0, 5);
  }, [studentSearch, masterStudents]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      // Começamos buscando sem ordenação fixa para evitar quebra se a coluna created_at não existir
      const { data, error } = await supabase
        .from('mediation_cases')
        .select('*');

      if (error) throw error;
      
      // Ordenação em memória para maior robustez
      const sortedData = [...(data || [])].sort((a, b) => {
        const dateA = a.created_at || a.opened_at || a.id || '';
        const dateB = b.created_at || b.opened_at || b.id || '';
        return dateB.localeCompare(dateA);
      });

      const formatted: MediationCase[] = sortedData.map(c => ({
        id: c.id,
        studentId: c.student_id,
        studentName: c.student_name || 'Estudante não identificado',
        className: c.class_name || 'N/A',
        type: c.type || 'OUTRO',
        severity: c.severity || 'MÉDIA',
        status: (c.status as MediationStatus) || 'ABERTURA',
        openedAt: c.opened_at,
        closedAt: c.closed_at,
        description: c.description || '',
        involvedParties: c.involved_parties || [],
        steps: c.steps || [
          { id: '1', label: 'Acolhimento Inicial', completed: true, date: c.opened_at },
          { id: '2', label: 'Escuta das Partes', completed: false },
          { id: '3', label: 'Círculo de Mediação / Paz', completed: false },
          { id: '4', label: 'Acordo / Finalização', completed: false }
        ],
        originReferralId: c.origin_referral_id,
        feedback: c?.feedback,
        logs: c.logs || []
      }));
      setCases(formatted);
    } catch (error: any) {
      console.error("Erro ao buscar casos de mediação:", error);
      alert("Aviso: Não foi possível carregar o histórico. " + (error.message || "Erro de conexão"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const migrateLegacyData = async () => {
      const legacy = localStorage.getItem('mediation_cases');
      if (legacy) {
        try {
           const parsed = JSON.parse(legacy);
           if (Array.isArray(parsed) && parsed.length > 0) {
              console.log('Migrando dados legais do localStorage para o Supabase...');
              for (const c of parsed) {
                 await supabase.from('mediation_cases').insert([{
                    student_id: c.studentId || null,
                    student_name: c.studentName,
                    class_name: c.className,
                    type: c.type,
                    severity: c.severity,
                    status: c.status,
                    opened_at: c.openedAt,
                    description: c.description,
                    involved_parties: c.involved_parties || [],
                    steps: c.steps,
                 }]);
              }
              localStorage.removeItem('mediation_cases');
              console.log('Migração concluída.');
              await fetchCases();
           }
        } catch (e) {
           console.error('Erro na migração:', e);
        }
      }
    };

    fetchCases();
    migrateLegacyData();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCase.studentName || !newCase.description) {
       return alert("Por favor, selecione um aluno e descreva o relato do fato.");
    }

    const steps = [
      { id: '1', label: 'Acolhimento Inicial', completed: true, date: new Date().toLocaleDateString('sv-SE') },
      { id: '2', label: 'Escuta das Partes', completed: false },
      { id: '3', label: 'Círculo de Mediação / Paz', completed: false },
      { id: '4', label: 'Acordo / Finalização', completed: false }
    ];

    try {
      console.log('Iniciando salvamento do caso...', newCase);
      const payload = {
        student_id: newCase.studentId && newCase.studentId !== 'N/A' ? newCase.studentId : null,
        student_name: newCase.studentName,
        class_name: newCase.className,
        type: newCase.type,
        severity: newCase.severity,
        status: 'ABERTURA',
        opened_at: new Date().toLocaleDateString('sv-SE'),
        description: newCase.description,
        involved_parties: newCase.involved_parties || [],
        steps: steps,
      };

      const { data, error } = await supabase
        .from('mediation_cases')
        .insert([payload])
        .select();

      if (error) {
        console.error("Erro retornado pelo Supabase (Insert):", error);
        throw error;
      }

      console.log('Caso salvo com sucesso:', data);
      await fetchCases();
      setIsModalOpen(false);
      setNewCase({ type: 'CONFLITO', severity: 'MÉDIA', description: '', involvedParties: [], studentName: '', className: '' });
      setStudentSearch('');
      alert("Novo caso de mediação aberto e registrado no histórico!");
    } catch (error: any) {
      console.error("Erro fatal ao salvar caso:", error);
      alert("❌ Erro ao salvar o caso: " + (error.message || error.details || "Verifique sua conexão ou se as colunas da tabela estão corretas."));
    }
  };

  const handleDeleteCase = async (e: React.MouseEvent, id: string) => {
    if (e) e.stopPropagation();
    if (!window.confirm("⚠️ Você tem certeza que deseja excluir este caso permanentemente? Esta ação não pode ser desfeita.")) return;
    
    try {
      const { error } = await supabase
        .from('mediation_cases')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      alert("✅ Caso excluído com sucesso!");
      await fetchCases();
      if (selectedCase?.id === id) setSelectedCase(null);
    } catch (err: any) {
      console.error("Erro ao excluir caso:", err);
      alert("❌ Erro ao excluir o caso: " + (err.message || "Erro de conexão"));
    }
  };

  const handleSaveLog = async () => {
    if (!selectedCase || !newLog.content) return alert("Descreva o atendimento antes de salvar.");
    
    setIsLogLoading(true);
    try {
      const logEntry: MediationLog = {
        id: `log-${Date.now()}`,
        date: newLog.date,
        professional: newLog.professional,
        content: newLog.content
      };

      const updatedLogs = [logEntry, ...(selectedCase.logs || [])];

      const { error } = await supabase
        .from('mediation_cases')
        .update({ logs: updatedLogs })
        .eq('id', selectedCase.id);

      if (error) throw error;

      setSelectedCase({ ...selectedCase, logs: updatedLogs });
      setNewLog({ ...newLog, content: '' });
      await fetchCases();
      alert("Atendimento registrado no diário!");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar log: " + err.message);
    } finally {
      setIsLogLoading(false);
    }
  };

  const getStatusStyle = (status: MediationStatus) => {
    switch (status) {
      case 'ABERTURA': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'PLANEJAMENTO': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'EXECUÇÃO': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'CONCLUÍDO': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getSeverityColor = (sev: CaseSeverity) => {
    switch (sev) {
      case 'CRÍTICA': return 'text-red-600';
      case 'ALTA': return 'text-rose-500';
      case 'MÉDIA': return 'text-amber-500';
      default: return 'text-blue-500';
    }
  };

  const handleSaveFeedback = async () => {
    const feedbackValue = selectedCase?.feedback?.trim();
    if (!feedbackValue) {
       alert('Por favor, escreva a devolutiva antes de salvar.');
       return false;
    }
    try {
       console.log('Salvando devolutiva para caso ID:', selectedCase.id, '| Texto:', feedbackValue);
       // 1. Salva no caso de mediação
       const { data: updatedData, error: medError } = await supabase
          .from('mediation_cases')
          .update({ feedback: feedbackValue })
          .eq('id', selectedCase.id)
          .select();
       
       if (medError) throw medError;
       console.log('Devolutiva salva com sucesso:', updatedData);

       // 2. Se houver vínculo, salva no encaminhamento original
       if (selectedCase.originReferralId) {
          const { error: refError } = await supabase
             .from('psychosocial_referrals')
             .update({ feedback: feedbackValue })
             .eq('id', selectedCase.originReferralId);
          
          if (refError) console.error("Erro ao sincronizar com encaminhamento:", refError);
       }

       // 3. Também salva em todos os psychosocial_referrals vinculados ao mesmo aluno, se existirem
       const { error: psyErr } = await supabase
          .from('psychosocial_referrals')
          .update({ feedback: feedbackValue })
          .ilike('student_name', selectedCase.studentName || '');
       
       if (psyErr) console.warn('Aviso ao atualizar psychosocial_referrals:', psyErr.message);

       alert("Devolutiva salva com sucesso!");
       setSelectedCase({ ...selectedCase, feedback: feedbackValue });
       await fetchCases();
       return true;
    } catch (err: any) {
       console.error('Erro ao salvar devolutiva:', err);
       alert("Erro ao salvar devolutiva: " + (err.message || JSON.stringify(err)));
       return false;
    }
  };

  const today = new Date().toLocaleDateString('sv-SE');

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      (c.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.className || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'ativos') {
      // Casos não concluídos OU concluídos hoje (para não "sumirem" na hora)
      return matchesSearch && (c.status !== 'CONCLUÍDO' || c.closedAt === today);
    }
    return matchesSearch && c.status === 'CONCLUÍDO';
  });

  const activeCount = cases.filter(c => c.status !== 'CONCLUÍDO').length;
  const historyCount = cases.filter(c => c.status === 'CONCLUÍDO').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-6">
            <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl">
               <Scale size={32} />
            </div>
            <div>
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Mediação de Conflitos</h3>
               <div className="flex items-center gap-2 mt-1">
                   <button 
                     onClick={() => setActiveTab('ativos')}
                     className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${activeTab === 'ativos' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                   >
                     Ativos ({activeCount})
                   </button>
                   <button 
                     onClick={() => setActiveTab('historico')}
                     className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${activeTab === 'historico' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                   >
                     Histórico ({historyCount})
                   </button>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
               <input 
                 type="text" 
                 placeholder="Pesquisar caso..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none w-64 focus:ring-2 focus:ring-rose-100" 
               />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-2">
               <Plus size={16} /> Novo Caso
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
         {filteredCases.map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedCase(c)}
              className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-rose-200 hover:shadow-xl transition-all cursor-pointer group flex flex-col md:flex-row items-center justify-between gap-8"
            >
               <div className="flex items-center gap-6 flex-1">
                  <div className={"w-14 h-14 rounded-2xl flex items-center justify-center border-2 " + getStatusStyle(c.status)}>
                    {c.status === 'CONCLUÍDO' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-black text-gray-900 uppercase leading-none">{c.studentName}</h4>
                        <span className={"px-2 py-0.5 rounded text-[8px] font-black uppercase border " + getStatusStyle(c.status)}>
                          {c.status}
                        </span>
                        {c.description?.includes('[ENCAMINHAMENTO BUSCA ATIVA]') && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[7px] font-black uppercase tracking-widest shadow-sm">
                            Fonte: Busca Ativa
                          </span>
                        )}
                        {c.status === 'CONCLUÍDO' && c.closedAt === today && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-700 text-[7px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 animate-pulse">
                            Concluído Hoje
                          </span>
                        )}
                     </div>
                     <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><User size={12}/> {c.className}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Target size={12}/> {c.type}</span>
                        <span className={"text-[10px] font-black uppercase flex items-center gap-1 " + getSeverityColor(c.severity)}>
                           <AlertTriangle size={12}/> Risco {c.severity}
                        </span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                     <p className="text-[10px] font-black text-gray-400 uppercase">Progresso</p>
                     <div className="flex items-center gap-1 mt-1">
                        {c.steps?.map((step, i) => (
                          <div key={i} className={"h-1.5 w-6 rounded-full " + (step.completed ? 'bg-rose-500' : 'bg-gray-100')} />
                        ))}
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                     <div className="p-3 bg-gray-50 text-gray-300 group-hover:bg-rose-600 group-hover:text-white rounded-xl transition-all">
                        <ChevronRight size={24}/>
                     </div>
                     <button 
                       onClick={(e) => handleDeleteCase(e, c.id)}
                       className="p-3 bg-gray-50 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                       title="Excluir Caso"
                     >
                        <Trash2 size={16}/>
                     </button>
                  </div>
               </div>
            </div>
         ))}
         {filteredCases.length === 0 && (
           <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
              <Scale size={48} className="mx-auto mb-4 text-gray-100" />
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhum caso de mediação registrado</p>
           </div>
         )}
      </div>

      {/* MODAL DE CRIAÇÃO DE NOVO CASO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-rose-950/40 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[95vh]">
              <div className="p-8 bg-rose-50 border-b border-rose-100 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-rose-600 text-white rounded-3xl shadow-lg">
                       <Plus size={28} strokeWidth={3} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Novo Caso de Mediação</h3>
                       <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest mt-1">Abertura de Protocolo Interno</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl shadow-sm transition-all">
                    <X size={24} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                 <form onSubmit={handleCreateCase} className="space-y-8">
                    
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aluno Principal</label>
                        
                        {newCase.studentName ? (
                           <div className="flex items-center justify-between p-5 bg-rose-50 rounded-2xl border-2 border-rose-100 animate-in fade-in zoom-in-95">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg rotate-3">
                                    {newCase.studentName.charAt(0)}
                                 </div>
                                 <div>
                                    <p className="font-black text-gray-900 uppercase tracking-tight">{newCase.studentName}</p>
                                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">{newCase.className}</p>
                                 </div>
                              </div>
                              <button 
                                 type="button"
                                 onClick={() => {
                                    setNewCase({ ...newCase, studentName: '', studentId: '', className: '' });
                                    setStudentSearch('');
                                 }}
                                 className="p-3 hover:bg-rose-100 rounded-xl text-rose-600 transition-all active:scale-95"
                              >
                                 <X size={20} />
                              </button>
                           </div>
                        ) : (
                           <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                              <input 
                                 type="text" 
                                 placeholder="Digite o nome para buscar aluno..." 
                                 value={studentSearch}
                                 onChange={e => setStudentSearch(e.target.value)}
                                 className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/5 transition-all uppercase"
                              />
                              
                              {studentSearch.length >= 3 && filteredStudents.length > 0 && (
                                 <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden divide-y divide-gray-50 z-[100] animate-in slide-in-from-top-2">
                                    {filteredStudents.map((s: any) => (
                                       <button 
                                          key={s.CodigoAluno || s.id}
                                          type="button"
                                          onClick={() => {
                                             setNewCase({ 
                                               ...newCase, 
                                               studentName: (s.Nome || s.name), 
                                               studentId: (s.CodigoAluno || s.id), 
                                               className: (s.Turma || s.className || 'N/A') 
                                             });
                                             setStudentSearch('');
                                          }}
                                          className="w-full text-left p-4 hover:bg-rose-50 transition-colors flex justify-between items-center group"
                                       >
                                          <div>
                                             <p className="text-xs font-black uppercase text-gray-900 group-hover:text-rose-600">{s.Nome || s.name}</p>
                                             <p className="text-[9px] font-bold text-gray-400 uppercase">{s.Turma || s.className}</p>
                                          </div>
                                          <PlusCircle size={16} className="text-gray-200 group-hover:text-rose-400 transition-colors" />
                                       </button>
                                    ))}
                                 </div>
                              )}
                           </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo do Conflito</label>
                          <select 
                             value={newCase.type} 
                             onChange={e => setNewCase({...newCase, type: e.target.value as any})}
                             className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white"
                          >
                             {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Severidade Inicial</label>
                          <select 
                             value={newCase.severity} 
                             onChange={e => setNewCase({...newCase, severity: e.target.value as any})}
                             className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white"
                          >
                             {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Relato do Fato</label>
                        <textarea 
                           required
                           value={newCase.description}
                           onChange={e => setNewCase({...newCase, description: e.target.value})}
                           placeholder="Descreva detalhadamente o ocorrido..."
                           className="w-full p-8 bg-gray-50 border border-gray-100 rounded-[2.5rem] text-base font-medium min-h-[300px] resize-none outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/5 transition-all"
                        />
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Outras Partes Envolvidas</label>
                       <input 
                          type="text" 
                          placeholder="Nomes separados por vírgula..."
                          onChange={e => setNewCase({...newCase, involvedParties: e.target.value.split(',').map(s => s.trim().toUpperCase())})}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase"
                       />
                    </div>

                    <div className="p-6 bg-rose-50 rounded-[2.5rem] border-2 border-rose-100 border-dashed space-y-3">
                       <div className="flex items-center gap-2 text-rose-600">
                          <ShieldAlert size={16} />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Protocolo de Sigilo</h4>
                       </div>
                       <p className="text-[10px] font-medium text-rose-700 leading-relaxed italic">
                          "Os dados registrados aqui são protegidos pela LGPD e restritos à equipe técnica e gestão para fins de proteção integral da criança e do adolescente."
                       </p>
                    </div>

                    <button type="submit" className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3">
                       <Save size={20} /> Efetivar Abertura de Caso
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DETALHES DO CASO EXISTENTE */}
      {selectedCase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-rose-950/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-5xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
              <div className="p-4 bg-rose-900 text-white shrink-0 shadow-lg">
                 <div className="flex justify-between items-center mb-3">
                    <button onClick={() => setSelectedCase(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24}/></button>
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">Protocolo #{selectedCase.id?.substring(0,8) || 'N/A'}</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl font-black">
                       {(selectedCase.studentName || '?')[0]}
                    </div>
                    <div>
                       <h3 className="text-xl font-black uppercase tracking-tight leading-none">{selectedCase.studentName}</h3>
                       <p className="text-rose-300 font-bold uppercase text-[9px] tracking-widest mt-1.5">{selectedCase.className} • Caso {selectedCase.type}</p>
                    </div>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
                 <div className="space-y-3 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
                     <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-50 pb-1.5">
                        <FileText size={12} className="text-rose-600" /> Relato Original
                     </h4>
                     <p className="text-sm text-gray-600 leading-relaxed font-medium capitalize">
                        {selectedCase.description}
                     </p>
                  </div>

                  {/* [NOVO] Seção de Devolutiva ao Professor */}
                  <div className="space-y-3 bg-white p-5 rounded-[2.5rem] border border-emerald-100 relative overflow-hidden group shadow-sm">
                      <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-900 pointer-events-none">
                         <MessageSquare size={120} strokeWidth={1} />
                      </div>
                      
                      <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 mb-1">
                         <CheckCircle2 size={12} /> Campo de Registro / Devolutiva Principal
                      </h4>
                      
                      <textarea 
                         value={selectedCase?.feedback || ''}
                         onChange={(e) => setSelectedCase({ ...selectedCase, feedback: e.target.value })}
                         placeholder="Escreva aqui a resposta/devolutiva detalhada..."
                         className="w-full p-6 bg-white border-2 border-emerald-100 rounded-[1.5rem] text-sm font-bold min-h-[480px] resize-none outline-none focus:ring-8 focus:ring-emerald-500/5 transition-all shadow-inner focus:border-emerald-500"
                      />
                   </div>

                  <div className="space-y-3 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
                     <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-50 pb-1.5">
                        <History size={12} className="text-rose-600" /> Etapas do Processo
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {selectedCase.steps?.map((step, idx) => (
                         <div key={idx} className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between ${step.completed ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-dashed border-gray-200'}`}>
                            <div className="flex items-center gap-4">
                               <div className={`p-2 rounded-lg ${step.completed ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                                  {step.completed ? <CheckCircle2 size={16}/> : <Clock size={16}/>}
                               </div>
                               <div>
                                  <p className={`text-xs font-black uppercase ${step.completed ? 'text-emerald-700' : 'text-gray-400'}`}>{step.label}</p>
                                  {step.date && <p className="text-[9px] font-bold text-emerald-600 mt-0.5">{new Date(step.date).toLocaleDateString('pt-BR')}</p>}
                               </div>
                            </div>
                            {!step.completed && (
                               <button 
                                 onClick={async (e) => {
                                   e.stopPropagation();
                                   const updatedSteps = selectedCase.steps.map((s, i) => 
                                     i === idx ? { ...s, completed: true, date: new Date().toLocaleDateString('sv-SE') } : s
                                   );
                                   try {
                                     const { error } = await supabase
                                       .from('mediation_cases')
                                       .update({ steps: updatedSteps })
                                       .eq('id', selectedCase.id);
                                     if (error) throw error;
                                     await fetchCases();
                                     setSelectedCase({ ...selectedCase, steps: updatedSteps });
                                   } catch (err) {
                                     alert("Erro ao atualizar etapa.");
                                   }
                                 }}
                                 className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-[9px] font-black uppercase hover:bg-rose-600 transition-all"
                               >
                                 Registrar
                               </button>
                            )}
                         </div>
                       ))}
                     </div>
                  </div>

                  <div className="p-4 bg-rose-50 rounded-[2rem] border border-rose-100 space-y-3">
                     <div className="flex items-center gap-3 text-rose-600">
                        <MessageCircle size={16} />
                        <h4 className="text-[9px] font-black uppercase tracking-widest">Partes Envolvidas</h4>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {selectedCase.involvedParties?.map((p, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white border border-rose-100 rounded text-[9px] font-bold text-rose-800 uppercase">{p}</span>
                        ))}
                        {selectedCase.involvedParties?.length === 0 && <span className="text-gray-400 text-[9px] italic">Nenhuma registrada</span>}
                     </div>
                  </div>
              </div>

              <div className="p-8 bg-white border-t border-gray-50 flex flex-wrap gap-4">
                  <button 
                    onClick={handleSaveFeedback}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all min-w-[200px] flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Salvar Devolutiva
                  </button>
                  <button 
                    onClick={async () => {
                      if (!window.confirm("Deseja encerrar este caso com acordo?")) return;
                      try {
                         // Primeiro salva a devolutiva se houver algo escrito
                         if (selectedCase?.feedback?.trim()) {
                            const { error: medError } = await supabase
                               .from('mediation_cases')
                               .update({ feedback: selectedCase.feedback.trim() })
                               .eq('id', selectedCase.id);
                            if (medError) console.error("Erro ao salvar devolutiva no encerramento:", medError);
                         }

                         const { error } = await supabase
                           .from('mediation_cases')
                           .update({ 
                             status: 'CONCLUÍDO', 
                             closed_at: new Date().toLocaleDateString('sv-SE') 
                           })
                           .eq('id', selectedCase.id);
                         if (error) throw error;
                         await fetchCases();
                         // setSelectedCase(null); 
                         alert("Caso encerrado com sucesso! Ele continuará visível na aba Ativos hoje.");
                      } catch (err) {
                         alert("Erro ao encerrar caso.");
                      }
                    }}
                    className="flex-1 py-4 bg-gray-100 text-gray-700 border border-gray-200 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all min-w-[200px]"
                  >
                    Encerrar com Acordo
                  </button>
                  <button 
                    onClick={() => {
                      if (onTabChange) onTabChange('referrals');
                    }}
                    className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-violet-700 transition-all min-w-[200px]"
                  >
                    Ver Encaminhamento
                  </button>
                  <button 
                    onClick={(e) => selectedCase.id && handleDeleteCase(e as any, selectedCase.id)}
                    className="flex-1 py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-100 transition-all min-w-[200px]"
                  >
                    Excluir Caso
                  </button>
                  <button onClick={() => setSelectedCase(null)} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all min-w-[200px]">Fechar Aba</button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MediationManager;
