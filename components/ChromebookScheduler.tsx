import React, { useState, useMemo, useEffect } from 'react';
import {
  Laptop,
  Calendar,
  Clock,
  Plus,
  ShieldCheck,
  History,
  X,
  CheckCircle2,
  Monitor,
  Search,
  Trash2,
  CalendarDays,
  ChevronRight,
  ArrowLeft,
  Layers,
  Save,
  Lock,
  User as UserIcon,
  Filter
} from 'lucide-react';
import { ChromebookBooking, Shift, StaffMember, User } from '../types';
import { useStaff } from '../hooks/useStaff';
import { useClassrooms } from '../hooks/useClassrooms';
import { useSubjects } from '../hooks/useSubjects';
import { supabase } from '../supabaseClient';
import { canCancelBooking, isMyBooking } from '../utils/bookingAuth';

interface ChromebookSchedulerProps {
  user?: User;
}

const STATIONS = [
  "Estação 01 (biblioteca)", 
  "Estação 02 (sala 22)", 
  "Estação 03 (sala 22)", 
  "Estação 04 (biblioteca)", 
  "Estação 05 biblioteca/armário"
];
const SHIFTS: Shift[] = ['MATUTINO', 'VESPERTINO'];
const AVAILABLE_CLASSES = ["1ª", "2ª", "3ª", "4ª", "5ª"];

const ChromebookScheduler: React.FC<ChromebookSchedulerProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'history'>('status');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv-SE'));
  const [bookings, setBookings] = useState<ChromebookBooking[]>([]);
  const [onlyMyBookings, setOnlyMyBookings] = useState(false);
  const { staff } = useStaff();
  const { classrooms } = useClassrooms();
  const { subjects } = useSubjects();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    stationId: STATIONS[0],
    shift: 'MATUTINO' as Shift,
    classes: [] as string[],
    teacherName: '',
    className: '',
    subject: '',
    observations: ''
  });

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('resource_type', 'CHROMEBOOKS')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setBookings(data.map(b => ({
          id: b.id,
          date: b.date,
          shift: b.shift as Shift,
          classes: b.classes || [],
          teacherName: b.teacher_name,
          className: b.class_name,
          stationId: b.resource_id,
          subject: b.title || '',
          observations: b.description || '',
          timestamp: new Date(b.created_at).getTime()
        })));
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos de Chromebooks:", error);
    }
  };

  useEffect(() => {
    fetchBookings();

    const channel = supabase.channel('chromebook_bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: "resource_type=eq.CHROMEBOOKS" }, fetchBookings)
      .subscribe();

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, []);

  const currentBookings = useMemo(() => {
    return bookings.filter(b => b.date === selectedDate);
  }, [bookings, selectedDate]);

  const myBookingsCount = useMemo(() => {
    return currentBookings.filter(b => isMyBooking(b.teacherName, user)).length;
  }, [currentBookings, user]);

  const handleOpenNewModal = () => {
    let defaultTeacher = '';
    if (user?.name) {
      const matchingStaff = staff.find(s => isMyBooking(s.name, user));
      defaultTeacher = matchingStaff ? matchingStaff.name : user.name;
    }
    setNewBooking({
      stationId: STATIONS[0],
      shift: 'MATUTINO' as Shift,
      classes: [],
      teacherName: defaultTeacher,
      className: '',
      subject: '',
      observations: ''
    });
    setIsModalOpen(true);
  };

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newBooking.classes.length === 0) {
      return alert("Por favor, selecione ao menos uma aula (1ª a 5ª).");
    }

    if (!newBooking.teacherName || !newBooking.className || !newBooking.subject) {
      return alert("Preencha todos os campos obrigatórios.");
    }

    const conflict = bookings.find(b =>
      b.date === selectedDate &&
      b.stationId === newBooking.stationId &&
      b.shift === newBooking.shift &&
      b.classes.some(cls => newBooking.classes.includes(cls))
    );

    if (conflict) {
      return alert(`ERRO: Conflito de horário! A ${newBooking.stationId} já possui reserva para as aulas (${conflict.classes.join(', ')}) no turno ${newBooking.shift} por ${conflict.teacherName}.`);
    }

    try {
      const { error } = await supabase.from('bookings').insert([{
        resource_type: 'CHROMEBOOKS',
        date: selectedDate,
        shift: newBooking.shift,
        classes: newBooking.classes,
        teacher_name: newBooking.teacherName,
        class_name: newBooking.className,
        resource_id: newBooking.stationId,
        title: newBooking.subject,
        description: newBooking.observations
      }]);

      if (error) throw error;

      setIsModalOpen(false);
      setNewBooking({ ...newBooking, classes: [], teacherName: '', className: '', subject: '', observations: '' });
      alert("Agendamento realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao agendar Chromebooks:", error);
      alert("Erro ao realizar agendamento.");
    }
  };

  const toggleClass = (cls: string) => {
    setNewBooking(prev => ({
      ...prev,
      classes: prev.classes.includes(cls)
        ? prev.classes.filter(c => c !== cls)
        : [...prev.classes, cls].sort()
    }));
  };

  const deleteBooking = async (
    id: string, 
    teacherName?: string, 
    stationId?: string, 
    date?: string, 
    shift?: string, 
    classes?: string[]
  ) => {
    const formattedDate = date ? date.split('-').reverse().join('/') : '';
    const details = [
      stationId,
      shift,
      classes && classes.length > 0 ? `aulas ${classes.join(', ')}` : '',
      formattedDate
    ].filter(Boolean).join(' • ');

    const confirmMsg = teacherName
      ? `Deseja realmente CANCELAR o agendamento de:\n\n👤 ${teacherName}\n📍 ${details}\n\nO horário será liberado imediatamente no sistema.`
      : "Deseja realmente cancelar este agendamento permanentemente?";

    if (window.confirm(confirmMsg)) {
      try {
        const { error } = await supabase.from('bookings').delete().eq('id', id);
        if (error) throw error;
        setBookings(prev => prev.filter(b => b.id !== id));
        alert("Agendamento cancelado com sucesso!");
      } catch (error) {
        console.error("Erro ao cancelar agendamento:", error);
        alert("Erro ao cancelar agendamento.");
      }
    }
  };

  const renderStatus = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-fuchsia-50 text-fuchsia-600 rounded-3xl">
            <CalendarDays size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Ocupação das Estações</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Status para o dia selecionado</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-fuchsia-500/10 transition-all"
          />

          {user && (
            <button
              type="button"
              onClick={() => setOnlyMyBookings(!onlyMyBookings)}
              className={`px-5 py-4 rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2 border ${
                onlyMyBookings
                  ? 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-700 shadow-sm'
                  : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
              }`}
              title="Filtrar apenas as minhas reservas"
            >
              <UserIcon size={16} className={onlyMyBookings ? 'text-fuchsia-600' : 'text-gray-400'} />
              <span className="hidden sm:inline">Minhas Reservas</span>
              {myBookingsCount > 0 && (
                <span className="bg-fuchsia-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black">
                  {myBookingsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={handleOpenNewModal}
            className="px-8 py-4 bg-fuchsia-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-fuchsia-600/20 hover:bg-fuchsia-700 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Novo Agendamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATIONS.map(station => (
          <div key={station} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center">
                <Monitor size={24} />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{station}</span>
            </div>

            <div className="space-y-3">
              {SHIFTS.map(shift => {
                let shiftBookings = currentBookings.filter(b => b.stationId === station && b.shift === shift);
                if (onlyMyBookings) {
                  shiftBookings = shiftBookings.filter(b => isMyBooking(b.teacherName, user));
                }

                return (
                  <div key={shift} className={`p-4 rounded-2xl border ${shiftBookings.length > 0 ? 'bg-fuchsia-50 border-fuchsia-100' : 'bg-gray-50 border-transparent'} transition-all`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${shiftBookings.length > 0 ? 'text-fuchsia-600' : 'text-gray-400'}`}>{shift}</span>
                      {shiftBookings.length > 0 ? <CheckCircle2 size={12} className="text-fuchsia-500" /> : <Clock size={12} className="text-gray-300" />}
                    </div>
                    {shiftBookings.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {shiftBookings.map(sb => {
                          const isMine = isMyBooking(sb.teacherName, user);
                          const canCancel = canCancelBooking(sb.teacherName, user);

                          return (
                            <div key={sb.id} className="border-t border-fuchsia-200/50 pt-2 first:border-t-0 first:pt-0 flex items-start justify-between gap-2 group">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-[11px] font-black text-gray-900 uppercase truncate">{sb.teacherName}</p>
                                  {isMine && (
                                    <span className="text-[7px] font-black uppercase bg-fuchsia-600 text-white px-1.5 py-0.5 rounded tracking-wider shrink-0 shadow-xs">
                                      Você
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9px] text-fuchsia-600 font-bold uppercase mt-0.5">
                                  {sb.className} • {sb.classes.join(', ')} aula
                                </p>
                                {sb.subject && (
                                  <p className="text-[8px] text-gray-400 font-semibold uppercase truncate">
                                    {sb.subject}
                                  </p>
                                )}
                              </div>

                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteBooking(sb.id, sb.teacherName, sb.stationId, sb.date, sb.shift, sb.classes);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0 active:scale-95"
                                  title="Cancelar meu agendamento"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] font-bold text-gray-300 uppercase italic mt-1">Disponível</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setActiveTab('history')}
        className="w-full py-4 bg-gray-100 rounded-3xl border border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-[0.3em] hover:bg-gray-200 transition-all flex items-center justify-center gap-3"
      >
        <History size={16} /> Ver Log de Uso Permanente
      </button>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <button
        onClick={() => setActiveTab('status')}
        className="flex items-center gap-2 text-fuchsia-700 font-black uppercase text-xs tracking-widest hover:text-fuchsia-800 transition-colors group mb-4"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel
      </button>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Log de Agendamentos (Chromebooks)</h3>
          <div className="flex items-center gap-2 px-4 py-2 bg-fuchsia-50 text-fuchsia-600 rounded-xl border border-fuchsia-100">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Base de Dados Auditada</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Data / Turno</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Estação / Aulas</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Professor / Turma</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Atividade</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(b => {
                const [year, month, day] = b.date.split('-');
                const formattedDate = `${day}/${month}/${year}`;
                const isMine = isMyBooking(b.teacherName, user);
                const canCancel = canCancelBooking(b.teacherName, user);

                return (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-black text-gray-900">{formattedDate}</p>
                    <p className="text-[9px] text-fuchsia-600 font-bold uppercase tracking-widest">{b.shift}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="bg-gray-900 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase w-fit">{b.stationId}</span>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Aulas: {b.classes.join(', ')}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-gray-800 uppercase">{b.teacherName}</p>
                      {isMine && (
                        <span className="text-[7px] font-black uppercase bg-fuchsia-600 text-white px-1.5 py-0.5 rounded tracking-wider">
                          Você
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{b.className}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-gray-600 uppercase italic line-clamp-1">{b.subject}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {canCancel ? (
                      <button 
                        onClick={() => deleteBooking(b.id, b.teacherName, b.stationId, b.date, b.shift, b.classes)} 
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Cancelar este agendamento"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span className="p-2.5 text-gray-300 inline-block" title="Apenas o responsável ou a gestão pode cancelar">
                        <Lock size={15} />
                      </span>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <div className="py-24 text-center">
              <History size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Sem registros no banco de dados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {activeTab === 'status' ? renderStatus() : renderHistory()}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-fuchsia-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-fuchsia-100 overflow-hidden flex flex-col max-h-[90vh]">
            <form onSubmit={handleAddBooking} className="flex flex-col h-full overflow-hidden">
              {/* MODAL HEADER - FIXO */}
              <div className="px-10 pt-10 pb-6 flex justify-between items-center border-b border-gray-50 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-fuchsia-600 text-white rounded-3xl shadow-xl shadow-fuchsia-600/20"><Plus size={28} strokeWidth={3} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Reservar Estação</h3>
                    <p className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest mt-1">
                      Data: {selectedDate.split('-').reverse().join('/')}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
              </div>

              {/* MODAL CONTENT - SCROLLABLE */}
              <div className="px-10 py-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estação de Trabalho</label>
                    <select
                      required
                      value={newBooking.stationId}
                      onChange={e => setNewBooking({ ...newBooking, stationId: e.target.value })}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase outline-none focus:bg-white focus:ring-4 focus:ring-fuchsia-500/5 transition-all"
                    >
                      {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turno de Uso</label>
                    <select
                      required
                      value={newBooking.shift}
                      onChange={e => setNewBooking({ ...newBooking, shift: e.target.value as Shift })}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase outline-none focus:bg-white focus:ring-4 focus:ring-fuchsia-500/5 transition-all"
                    >
                      {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Layers size={14} className="text-fuchsia-600" /> Aulas que irá utilizar
                  </label>
                  <div className="flex gap-2">
                    {AVAILABLE_CLASSES.map(cls => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => toggleClass(cls)}
                        className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border-2 ${newBooking.classes.includes(cls)
                          ? 'bg-fuchsia-600 border-fuchsia-700 text-white shadow-lg'
                          : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-fuchsia-200'
                          }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professor(a) Responsável</label>
                  <select
                    required
                    value={newBooking.teacherName}
                    onChange={e => setNewBooking({ ...newBooking, teacherName: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase"
                  >
                    <option value="">Selecione o professor...</option>
                    {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma</label>
                    <select
                      required
                      value={newBooking.className}
                      onChange={e => setNewBooking({ ...newBooking, className: e.target.value })}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase"
                    >
                      <option value="">Selecione...</option>
                      {classrooms.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Disciplina / Atividade</label>
                    <select
                      required
                      value={newBooking.subject}
                      onChange={e => setNewBooking({ ...newBooking, subject: e.target.value })}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase"
                    >
                      <option value="">Selecione...</option>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observações Técnicas</label>
                  <textarea
                    value={newBooking.observations}
                    onChange={e => setNewBooking({ ...newBooking, observations: e.target.value })}
                    placeholder="Relate se algum Chromebook está com problema..."
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium text-sm outline-none focus:bg-white transition-all h-20 resize-none"
                  />
                </div>
              </div>

              {/* MODAL FOOTER - FIXO */}
              <div className="p-8 bg-gray-50 border-t border-gray-100 shrink-0 flex gap-4">
                <button type="submit" className="flex-1 py-5 bg-fuchsia-600 text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-fuchsia-600/20 hover:bg-fuchsia-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                  <Save size={20} /> Confirmar Agendamento
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 bg-white border border-gray-200 text-gray-500 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChromebookScheduler;