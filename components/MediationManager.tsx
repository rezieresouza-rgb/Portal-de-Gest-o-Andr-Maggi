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
  UserPlus
} from 'lucide-react';
import { MediationCase, MediationStatus, CaseSeverity, PsychosocialRole, Student } from '../types';
import { INITIAL_STUDENTS } from '../constants/initialData';

interface MediationManagerProps {
  role: PsychosocialRole;
}

const CASE_TYPES = ['CONFLITO', 'BULLYING', 'DISCIPLINAR', 'OUTRO'];
const SEVERITIES: CaseSeverity[] = ['BAIXA', 'MÉDIA', 'ALTA', 'CRÍTICA'];

const MediationManager: React.FC<MediationManagerProps> = ({ role }) => {
  const [cases, setCases] = useState<MediationCase[]>(() => {
    const saved = localStorage.getItem('mediation_cases_v1');
    return saved ? JSON.parse(saved) : [
      {
        id: 'med-1',
        studentId: 'st-101',
        studentName: 'MARCOS VINICIUS',
        className: '9º ANO A',
        type: 'CONFLITO',
        severity: 'ALTA',
        status: 'EXECUÇÃO',
        openedAt: '2026-03-05',
        description: 'Briga no pátio envolvendo quatro alunos por motivo fútil.',
        involvedParties: ['Marcos Vinicius', 'Lucas Silva', 'Gustavo Lima'],
        steps: [
          { id: '1', label: 'Escuta Individual - Marcos', completed: true, date: '2026-03-06' },
          { id: '2', label: 'Escuta Individual - Lucas', completed: true, date: '2026-03-06' },
          { id: '3', label: 'Encontro de Mediação', completed: false },
        ]
      }
    ];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<MediationCase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  
  const [newCase, setNewCase] = useState<Partial<MediationCase>>({
    type: 'CONFLITO',
    severity: 'MÉDIA',
    description: '',
    involvedParties: [],
    studentName: '',
    className: ''
  });

  const masterStudents = useMemo(() => {
    const saved = localStorage.getItem('secretariat_detailed_students_v1');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  }, []);

  const filteredStudents = useMemo(() => {
    if (studentSearch.length < 3) return [];
    return masterStudents.filter((s: any) => 
      s.Nome.toLowerCase().includes(studentSearch.toLowerCase())
    ).slice(0, 5);
  }, [studentSearch, masterStudents]);

  useEffect(() => {
    localStorage.setItem('mediation_cases_v1', JSON.stringify(cases));
  }, [cases]);

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCase.studentName || !newCase.description) return alert("Preencha os campos obrigatórios.");

    const createdCase: MediationCase = {
      id: `med-${Date.now()}`,
      studentId: newCase.studentId || 'N/A',
      studentName: newCase.studentName!,
      className: newCase.className!,
      type: newCase.type as any,
      severity: newCase.severity as any,
      status: 'ABERTURA',
      openedAt: new Date().toISOString().split('T')[0],
      description: newCase.description!,
      involvedParties: newCase.involvedParties || [],
      steps: [
        { id: '1', label: 'Acolhimento Inicial', completed: true, date: new Date().toISOString().split('T')[0] },
        { id: '2', label: 'Escuta das Partes', completed: false },
        { id: '3', label: 'Círculo de Mediação / Paz', completed: false },
        { id: '4', label: 'Acordo / Finalização', completed: false }
      ]
    };

    setCases([createdCase, ...cases]);
    setIsModalOpen(false);
    setNewCase({ type: 'CONFLITO', severity: 'MÉDIA', description: '', involvedParties: [], studentName: '', className: '' });
    setStudentSearch('');
    alert("Novo caso de mediação aberto!");
  };

  const getStatusStyle = (status: MediationStatus) => {
    switch (status) {
      case 'ABERTURA': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'PLANEJAMENTO': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'EXECUÇÃO': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'CONCLUÍDO': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
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

  const filteredCases = cases.filter(c => 
    c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-6">
            <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl">
               <Scale size={32} />
            </div>
            <div>
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Mediação de Conflitos</h3>
               <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gestão de Casos e Resolução Dialógica</p>
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
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${getStatusStyle(c.status)}`}>
                   {c.status === 'CONCLUÍDO' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                 </div>
                 <div>
                    <div className="flex items-center gap-3">
                       <h4 className="text-lg font-black text-gray-900 uppercase leading-none">{c.studentName}</h4>
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getStatusStyle(c.status)}`}>
                         {c.status}
                       </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><User size={12}/> {c.className}</span>
                       <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Target size={12}/> {c.type}</span>
                       <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${getSeverityColor(c.severity)}`}>
                          <AlertTriangle size={12}/> Risco {c.severity}
                       </span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                 <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Progresso</p>
                    <div className="flex items-center gap-1 mt-1">
                       {c.steps.map((step, i) => (
                         <div key={i} className={`h-1.5 w-6 rounded-full ${step.completed ? 'bg-rose-500' : 'bg-gray-100'}`} />
                       ))}
                    </div>
                 </div>
                 <div className="p-3 bg-gray-50 text-gray-300 group-hover:bg-rose-600 group-hover:text-white rounded-xl transition-all">
                    <ChevronRight size={24}/>
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
           <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[95vh]">
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
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Buscar Aluno Principal</label>
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                          <input 
                             type="text" 
                             placeholder="Digite o nome (mín. 3 letras)..." 
                             value={studentSearch}
                             onChange={e => setStudentSearch(e.target.value)}
                             className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/5 transition-all uppercase"
                          />
                       </div>
                       {filteredStudents.length > 0 && (
                          <div className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden divide-y divide-gray-50 animate-in slide-in-from-top-2">
                             {filteredStudents.map((s: any) => (
                                <button 
                                  key={s.CodigoAluno}
                                  type="button"
                                  onClick={() => {
                                     setNewCase({ ...newCase, studentName: s.Nome, studentId: s.CodigoAluno, className: s.Turma });
                                     setStudentSearch(s.Nome);
                                  }}
                                  className="w-full text-left p-4 hover:bg-rose-50 transition-colors flex justify-between items-center"
                                >
                                   <p className="text-xs font-black uppercase text-gray-900">{s.Nome}</p>
                                   <span className="text-[9px] font-bold text-gray-400 uppercase">{s.Turma}</span>
                                </button>
                             ))}
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
                          placeholder="Descreva detalhadamente o ocorrido ou o motivo da abertura do caso..."
                          className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium h-32 resize-none outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/5 transition-all"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-rose-950/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white h-full w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-500">
              <div className="p-8 bg-rose-900 text-white shrink-0">
                 <div className="flex justify-between items-start mb-6">
                    <button onClick={() => setSelectedCase(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={28}/></button>
                    <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">Protocolo #{selectedCase.id}</span>
                 </div>
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl font-black">{selectedCase.studentName[0]}</div>
                    <div>
                       <h3 className="text-2xl font-black uppercase tracking-tight leading-none">{selectedCase.studentName}</h3>
                       <p className="text-rose-300 font-bold uppercase text-[10px] tracking-widest mt-2">{selectedCase.className} • Caso {selectedCase.type}</p>
                    </div>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-50 pb-2">
                       <FileText size={14} className="text-rose-600" /> Histórico do Relato
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium italic">"{selectedCase.description}"</p>
                 </div>

                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-50 pb-2">
                       <History size={14} className="text-rose-600" /> Etapas do Processo de Mediação
                    </h4>
                    <div className="space-y-4">
                       {selectedCase.steps.map((step, idx) => (
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
                               <button className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-[9px] font-black uppercase hover:bg-rose-600 transition-all">Registrar</button>
                            )}
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 space-y-4">
                    <div className="flex items-center gap-3 text-rose-600">
                       <MessageCircle size={20} />
                       <h4 className="text-[10px] font-black uppercase tracking-widest">Partes Envolvidas</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {selectedCase.involvedParties.map((p, i) => (
                         <span key={i} className="px-3 py-1 bg-white border border-rose-100 rounded-lg text-[10px] font-bold text-rose-800 uppercase">{p}</span>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-white border-t border-gray-50 flex gap-4">
                 <button className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all">Encerrar com Acordo</button>
                 <button className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all">Encaminhar Rede Externa</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MediationManager;