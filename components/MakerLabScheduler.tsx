import React, { useState, useMemo, useEffect } from 'react';
import {
  Cpu,
  Clock,
  Plus,
  ShieldCheck,
  History,
  X,
  CheckCircle2,
  Trash2,
  CalendarDays,
  ArrowLeft,
  Layers,
  CircuitBoard,
  Save,
  Library,
  BookOpen,
  Lock,
  User as UserIcon
} from 'lucide-react';
import { MakerLabBooking, Shift, StaffMember, User } from '../types';
import { useStaff } from '../hooks/useStaff';
import { useClassrooms } from '../hooks/useClassrooms';
import { useSubjects } from '../hooks/useSubjects';
import { supabase } from '../supabaseClient';
import { canCancelBooking, isMyBooking } from '../utils/bookingAuth';

interface MakerLabSchedulerProps {
  user?: User;
}

const SHIFTS: Shift[] = ['MATUTINO', 'VESPERTINO'];
const AVAILABLE_CLASSES = ["1ª", "2ª", "3ª", "4ª", "5ª"];
const EQUIPMENTS = ["Impressora 3D", "Cortadora Laser", "Kits Robótica", "Bancada Eletrônica", "Ferramentas Manuais"];

const MakerLabScheduler: React.FC<MakerLabSchedulerProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'history'>('status');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv-SE'));
  const [bookings, setBookings] = useState<MakerLabBooking[]>([]);
  const [onlyMyBookings, setOnlyMyBookings] = useState(false);
  const { staff } = useStaff();
  const { classrooms } = useClassrooms();
  const { subjects } = useSubjects();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    shift: 'MATUTINO' as Shift,
    classes: [] as string[],
    teacherName: '',
    className: '',
    subject: '',
    projectName: '',
    equipmentUsed: [] as string[],
    observations: ''
  });

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('resource_type', 'MAKER_LAB')
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
          projectName: b.title || '',
          equipmentUsed: b.equipment_used || [],
          observations: b.description || '',
          timestamp: new Date(b.created_at).getTime()
        })));
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos da Biblioteca Antiga:", error);
    }
  };

  useEffect(() => {
    fetchBookings();

    const channel = supabase.channel('maker_lab_bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: "resource_type=eq.MAKER_LAB" }, fetchBookings)
      .subscribe();

    return () => {
      channel.unsubscribe();
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
      shift: 'MATUTINO' as Shift,
      classes: [],
      teacherName: defaultTeacher,
      className: '',
      subject: '',
      projectName: '',
      equipmentUsed: [],
      observations: ''
    });
    setIsModalOpen(true);
  };

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newBooking.classes.length === 0) {
      return alert("Por favor, selecione ao menos uma aula.");
    }

    if (!newBooking.teacherName || !newBooking.className) {
      return alert("Preencha todos os campos obrigatórios.");
    }

    const conflict = bookings.find(b =>
      b.date === selectedDate &&
      b.shift === newBooking.shift &&
      b.classes.some(cls => newBooking.classes.includes(cls))
    );

    if (conflict) {
      return alert(`ERRO: Conflito de horário! A Biblioteca Antiga já está reservada para as aulas (${conflict.classes.join(', ')}) no turno ${newBooking.shift} por ${conflict.teacherName}.`);
    }

    try {
      const { error } = await supabase.from('bookings').insert([{
        resource_type: 'MAKER_LAB',
        date: selectedDate,
        shift: newBooking.shift,
        classes: newBooking.classes,
        teacher_name: newBooking.teacherName,
        class_name: newBooking.className,
        title: `[${newBooking.subject}] ${newBooking.projectName}`,
        equipment_used: newBooking.equipmentUsed,
        description: newBooking.observations
      }]);

      if (error) throw error;

      setIsModalOpen(false);
      setNewBooking({ ...newBooking, classes: [], teacherName: '', className: '', subject: '', projectName: '', equipmentUsed: [], observations: '' });
      alert("Agendamento realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao agendar Biblioteca Antiga:", error);
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

  const toggleEquipment = (eq: string) => {
    setNewBooking(prev => ({
      ...prev,
      equipmentUsed: prev.equipmentUsed.includes(eq)
        ? prev.equipmentUsed.filter(e => e !== eq)
        : [...prev.equipmentUsed, eq]
    }));
  };

  const deleteBooking = async (
    id: string, 
    teacherName?: string, 
    date?: string, 
    shift?: string, 
    classes?: string[]
  ) => {
    const formattedDate = date ? date.split('-').reverse().join('/') : '';
    const details = [
      'Biblioteca Antiga',
      shift,
      classes && classes.length > 0 ? `aulas ${classes.join(', ')}` : '',
      formattedDate
    ].filter(Boolean).join(' • ');

    const confirmMsg = teacherName
      ? `Deseja realmente CANCELAR o agendamento de:\n\n👤 ${teacherName}\n📚 ${details}\n\nO espaço será liberado imediatamente no sistema.`
      : "Deseja cancelar esta reserva da Biblioteca Antiga?";

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
          <div className="p-4 bg-sky-50 text-sky-600 rounded-3xl">
            <Library size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Biblioteca Antiga</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Agenda de Leitura e Estudos</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
          />

          {user && (
            <button
              type="button"
              onClick={() => setOnlyMyBookings(!onlyMyBookings)}
              className={`px-5 py-4 rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2 border ${
                onlyMyBookings
                  ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-sm'
                  : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
              }`}
              title="Filtrar apenas as minhas reservas"
            >
              <UserIcon size={16} className={onlyMyBookings ? 'text-sky-600' : 'text-gray-400'} />
              <span className="hidden sm:inline">Minhas Reservas</span>
              {myBookingsCount > 0 && (
                <span className="bg-sky-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black">
                  {myBookingsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={handleOpenNewModal}
            className="px-8 py-4 bg-sky-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-sky-600/20 hover:bg-sky-700 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Agendar Oficina
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {SHIFTS.map(shift => {
          let shiftBookings = currentBookings.filter(b => b.shift === shift);
          if (onlyMyBookings) {
            shiftBookings = shiftBookings.filter(b => isMyBooking(b.teacherName, user));
          }

          return (
            <div key={shift} className="space-y-6">
              <div className="flex items-center justify-between px-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{shift}</h4>
                {shiftBookings.length > 0 && <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>}
              </div>

              <div className="space-y-4">
                {shiftBookings.length > 0 ? (
                  shiftBookings.map(sb => {
                    const isMine = isMyBooking(sb.teacherName, user);
                    const canCancel = canCancelBooking(sb.teacherName, user);

                    return (
                      <div key={sb.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-sky-200 transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                          <BookOpen size={80} className="text-sky-900" />
                        </div>
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black bg-sky-100 text-sky-700 px-2 py-1 rounded-lg uppercase">Aulas: {sb.classes.join(', ')}</span>
                              {isMine && (
                                <span className="text-[7px] font-black uppercase bg-sky-600 text-white px-1.5 py-0.5 rounded tracking-wider shadow-xs">
                                  Você
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={() => deleteBooking(sb.id, sb.teacherName, sb.date, sb.shift, sb.classes)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                                  title="Cancelar esta reserva"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                              <CheckCircle2 size={16} className="text-sky-500" />
                            </div>
                          </div>
                          <p className="text-xs font-black text-gray-900 uppercase leading-tight mb-1">{sb.teacherName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-4">{sb.className}</p>

                          <div className="space-y-3">
                            <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100/50">
                              <p className="text-[8px] font-black text-sky-600 uppercase tracking-widest mb-1.5">Projeto:</p>
                              <p className="text-[11px] font-bold text-sky-900 uppercase italic">"{sb.projectName}"</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {sb.equipmentUsed.map(e => (
                                <span key={e} className="text-[7px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md uppercase">{e}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-16 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300">
                    <Clock size={28} className="mb-3 opacity-20" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Espaço Livre</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setActiveTab('history')}
        className="w-full py-4 bg-gray-100 rounded-3xl border border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-[0.3em] hover:bg-gray-200 transition-all flex items-center justify-center gap-3"
      >
        <History size={16} /> Relatório de Atividades da Biblioteca Antiga
      </button>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <button
        onClick={() => setActiveTab('status')}
        className="flex items-center gap-2 text-sky-700 font-black uppercase text-xs tracking-widest hover:text-sky-800 transition-colors group mb-4"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Calendário
      </button>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Histórico de Uso (Biblioteca Antiga)</h3>
          <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Base de Dados Auditada</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Data / Turno</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Professor / Turma</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Projeto / Protótipo</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Equipamentos</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(b => {
                const isMine = isMyBooking(b.teacherName, user);
                const canCancel = canCancelBooking(b.teacherName, user);

                return (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-black text-gray-900">{b.date.split('-').reverse().join('/')}</p>
                    <p className="text-[9px] text-sky-600 font-bold uppercase tracking-widest">{b.shift} • {b.classes.join(', ')} aulas</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-gray-800 uppercase">{b.teacherName}</p>
                      {isMine && (
                        <span className="text-[7px] font-black uppercase bg-sky-600 text-white px-1.5 py-0.5 rounded tracking-wider">
                          Você
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{b.className}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-gray-600 uppercase italic line-clamp-1">{b.projectName}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1">
                      {b.equipmentUsed.map(e => (
                        <span key={e} className="text-[8px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded font-bold uppercase">{e}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {canCancel ? (
                      <button 
                        onClick={() => deleteBooking(b.id, b.teacherName, b.date, b.shift, b.classes)} 
                        className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Cancelar esta reserva"
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : (
                      <span className="p-3 text-gray-300 inline-block" title="Apenas o responsável ou a gestão pode cancelar">
                        <Lock size={16} />
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
              <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Sem registros no sistema</p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sky-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-sky-100 overflow-hidden flex flex-col max-h-[90vh]">
            <form onSubmit={handleAddBooking} className="flex flex-col h-full overflow-hidden">
              <div className="px-10 pt-10 pb-6 flex justify-between items-center shrink-0 border-b border-gray-50">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-sky-600 text-white rounded-3xl shadow-xl shadow-sky-600/20"><Plus size={28} strokeWidth={3} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Reservar Biblioteca Antiga</h3>
                    <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest mt-1">Data: {selectedDate.split('-').reverse().join('/')}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
              </div>

              <div className="px-10 py-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turno de Uso</label>
                  <select
                    required
                    value={newBooking.shift}
                    onChange={e => setNewBooking({ ...newBooking, shift: e.target.value as Shift })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 transition-all"
                  >
                    {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Layers size={14} className="text-sky-600" /> Aulas Reservadas
                  </label>
                  <div className="flex gap-2">
                    {AVAILABLE_CLASSES.map(cls => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => toggleClass(cls)}
                        className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border-2 ${newBooking.classes.includes(cls)
                          ? 'bg-sky-600 border-sky-700 text-white shadow-lg'
                          : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-sky-200'
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
                      <option value="">Selecione a turma...</option>
                      {classrooms.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Disciplina</label>
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
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Projeto</label>
                    <input
                      required
                      type="text"
                      placeholder="EX: PROJETO DE LEITURA EM GRUPO"
                      value={newBooking.projectName}
                      onChange={e => setNewBooking({ ...newBooking, projectName: e.target.value.toUpperCase() })}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Equipamentos Utilizados</label>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENTS.map(eq => (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleEquipment(eq)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${newBooking.equipmentUsed.includes(eq)
                          ? 'bg-sky-50 border-sky-600 text-sky-700'
                          : 'bg-gray-50 border-gray-100 text-gray-400'
                          }`}
                      >
                        {eq}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observações / Insumos Necessários</label>
                  <textarea
                    value={newBooking.observations}
                    onChange={e => setNewBooking({ ...newBooking, observations: e.target.value })}
                    placeholder="Ex: Livros do acervo, dicionários, materiais de apoio..."
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium text-sm outline-none focus:bg-white transition-all h-20 resize-none"
                  />
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 shrink-0 flex gap-4">
                <button type="submit" className="flex-1 py-5 bg-sky-600 text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-sky-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Save size={20} /> Salvar Agendamento
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

export default MakerLabScheduler;