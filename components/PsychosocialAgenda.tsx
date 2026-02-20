
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Search, 
  ChevronRight, 
  Users, 
  ShieldCheck,
  UserPlus,
  ArrowLeft,
  X,
  UserCheck,
  Heart,
  Save,
  Lock,
  CalendarDays,
  User,
  MessageSquare,
  AlertCircle,
  // Added missing Trash2 icon import
  Trash2
} from 'lucide-react';
import { PsychosocialRole, PsychosocialAppointment } from '../types';
import { INITIAL_STUDENTS } from '../constants/initialData';

const APPOINTMENT_TYPES = [
  { id: 'ESCUTA_INDIVIDUAL', label: 'Escuta Individual' },
  { id: 'CIRCULO_PAZ', label: 'Círculo de Paz' },
  { id: 'REUNIAO_FAMILIAR', label: 'Reunião Familiar' },
  { id: 'VISITA_DOMICILIAR', label: 'Visita Domiciliar' }
];

const PsychosocialAgenda: React.FC<{ role: PsychosocialRole }> = ({ role }) => {
  const [appointments, setAppointments] = useState<PsychosocialAppointment[]>(() => {
    const saved = localStorage.getItem('psychosocial_appointments_v1');
    return saved ? JSON.parse(saved) : [
      {
        id: 'ap-1',
        studentId: 'st-1',
        studentName: 'MARIA EDUARDA',
        date: '2026-03-20',
        time: '09:00',
        professionalName: 'ANA PAULA (PSICÓLOGA)',
        type: 'ESCUTA_INDIVIDUAL',
        notes: 'Acompanhamento de luto familiar.',
        isConfidential: true
      }
    ];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  
  const [form, setForm] = useState<Partial<PsychosocialAppointment>>({
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    type: 'ESCUTA_INDIVIDUAL',
    professionalName: 'EQUIPE PSICOSSOCIAL',
    notes: '',
    isConfidential: false
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
    localStorage.setItem('psychosocial_appointments_v1', JSON.stringify(appointments));
  }, [appointments]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName || !form.date || !form.time) return alert("Preencha os campos obrigatórios.");

    const newAppointment: PsychosocialAppointment = {
      id: `ap-${Date.now()}`,
      studentId: form.studentId || 'N/A',
      studentName: form.studentName!,
      date: form.date!,
      time: form.time!,
      professionalName: form.professionalName!,
      type: form.type as any,
      notes: form.notes || '',
      isConfidential: form.isConfidential || false
    };

    setAppointments([newAppointment, ...appointments]);
    setIsModalOpen(false);
    resetForm();
    alert("Atendimento agendado com sucesso!");
  };

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      time: '08:00',
      type: 'ESCUTA_INDIVIDUAL',
      professionalName: 'EQUIPE PSICOSSOCIAL',
      notes: '',
      isConfidential: false
    });
    setStudentSearch('');
  };

  const deleteAppointment = (id: string) => {
    if (window.confirm("Deseja cancelar este agendamento?")) {
      setAppointments(prev => prev.filter(a => a.id !== id));
    }
  };

  const filteredAppointments = appointments.filter(a => 
    a.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER AGENDA */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-6">
            <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl">
               <CalendarIcon size={32} />
            </div>
            <div>
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Agenda de Atendimentos</h3>
               <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gestão de Horários da Equipe Multidisciplinar</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
               <input 
                  type="text" 
                  placeholder="Buscar aluno..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none w-64 focus:ring-2 focus:ring-rose-100" 
               />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-2">
               <UserPlus size={18} /> Novo Agendamento
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredAppointments.map(app => (
           <div key={app.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-rose-200 transition-all flex flex-col justify-between group relative overflow-hidden">
              {app.isConfidential && (
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Lock size={80} className="text-rose-900" />
                </div>
              )}
              
              <div className="space-y-6 relative z-10">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full uppercase border border-rose-100">
                       <Clock size={12} /> {app.time}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(app.date).toLocaleDateString('pt-BR')}</span>
                 </div>
                 
                 <div>
                    <h4 className="text-lg font-black text-gray-900 uppercase leading-tight group-hover:text-rose-600 transition-colors">{app.studentName}</h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-2 flex items-center gap-1.5">
                       <User size={12} className="text-rose-300" /> {app.professionalName}
                    </p>
                 </div>

                 <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center gap-2">
                       <Heart size={14} className="text-rose-400" />
                       <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">{app.type.replace('_',' ')}</span>
                    </div>
                    {app.isConfidential && (
                       <div className="flex items-center gap-1 text-[8px] font-black text-amber-600 uppercase">
                          <Lock size={10} /> Conteúdo Sigiloso (Protegido)
                       </div>
                    )}
                 </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between relative z-10">
                 <button className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                    Ver Detalhes <ChevronRight size={12}/>
                 </button>
                 <button onClick={() => deleteAppointment(app.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18}/>
                 </button>
              </div>
           </div>
         ))}

         {/* CARD ADICIONAR RÁPIDO */}
         <button 
           onClick={() => setIsModalOpen(true)}
           className="bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-gray-300 hover:bg-white hover:border-rose-300 hover:text-rose-400 transition-all min-h-[300px]"
         >
            <Plus size={48} strokeWidth={1} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-center">Clique para agendar um novo<br/>momento de escuta ou mediação</p>
         </button>
      </div>

      {/* MODAL DE NOVO AGENDAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-rose-950/40 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[95vh]">
              <div className="p-8 bg-rose-50 border-b border-rose-100 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-rose-600 text-white rounded-3xl shadow-lg">
                       <CalendarDays size={28} strokeWidth={3} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Agendar Atendimento</h3>
                       <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest mt-1">Organização da Equipe Multidisciplinar</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl shadow-sm transition-all">
                    <X size={24} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                 <form onSubmit={handleSave} className="space-y-8">
                    
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Localizar Aluno</label>
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
                                     setForm({ ...form, studentName: s.Nome, studentId: s.CodigoAluno });
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

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                          <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Horário</label>
                          <input type="time" required value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white text-center" />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Atendimento</label>
                       <select 
                          value={form.type} 
                          onChange={e => setForm({...form, type: e.target.value as any})}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-[11px] uppercase outline-none focus:bg-white"
                       >
                          {APPOINTMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                       </select>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Profissional Responsável</label>
                       <input type="text" value={form.professionalName} onChange={e => setForm({...form, professionalName: e.target.value.toUpperCase()})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notas de Agenda (Não confidencial)</label>
                       <textarea 
                          value={form.notes}
                          onChange={e => setForm({...form, notes: e.target.value})}
                          placeholder="Breve nota sobre o agendamento..."
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium h-20 resize-none outline-none focus:bg-white"
                       />
                    </div>

                    <div className="flex items-center gap-4 p-5 bg-rose-50 rounded-2xl border border-rose-100">
                       <input 
                         type="checkbox" 
                         id="sigilo"
                         checked={form.isConfidential}
                         onChange={e => setForm({...form, isConfidential: e.target.checked})}
                         className="w-5 h-5 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                       />
                       <label htmlFor="sigilo" className="text-xs font-black text-rose-800 uppercase tracking-widest cursor-pointer select-none flex items-center gap-2">
                          <Lock size={14} /> Atendimento Confidencial
                       </label>
                    </div>

                    <button type="submit" className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                       <Save size={20} /> Efetivar Agendamento
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PsychosocialAgenda;
