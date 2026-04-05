import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  FileText,
  AlertTriangle,
  Users,
  Clock,
  Search,
  Filter,
  Plus,
  X,
  CheckCircle,
  TrendingDown,
  Stethoscope,
  LogOut,
  MoreHorizontal,
  Calendar,
  Building2,
  Phone,
  Hash,
  ChevronDown,
  Loader2,
  Save
} from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Movement {
  id: string;
  student_id: string;
  movement_type: 'TRANSFERENCIA' | 'ATESTADO' | 'ABANDONO' | 'OBITO' | 'OUTROS';
  description: string;
  movement_date: string;
  destination_school?: string;
  document_number?: string;
  days_absent?: number;
  cid_code?: string;
  doctor_name?: string;
  responsible_name?: string;
  return_date?: string;
  created_at?: string;
  // Joined
  students?: { name: string; registration_number: string };
  classrooms?: { name: string };
}

interface Student {
  id: string;
  name: string;
  registration_number: string;
  status: string;
  classroomName?: string;
}

const TYPE_CONFIG = {
  TRANSFERENCIA: {
    label: 'Transferência',
    color: 'amber',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    icon: LogOut,
    iconBg: 'bg-amber-100 text-amber-600'
  },
  ATESTADO: {
    label: 'Atestado Médico',
    color: 'blue',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    icon: Stethoscope,
    iconBg: 'bg-blue-100 text-blue-600'
  },
  ABANDONO: {
    label: 'Abandono',
    color: 'red',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    icon: TrendingDown,
    iconBg: 'bg-red-100 text-red-600'
  },
  OBITO: {
    label: 'Óbito',
    color: 'gray',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    badge: 'bg-gray-200 text-gray-800',
    icon: AlertTriangle,
    iconBg: 'bg-gray-200 text-gray-600'
  },
  OUTROS: {
    label: 'Outros',
    color: 'purple',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800',
    icon: MoreHorizontal,
    iconBg: 'bg-purple-100 text-purple-600'
  }
};

const formatDateSafe = (d?: string) => {
  if (!d || !d.includes('-')) return '---';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
};

interface NewMovementForm {
  student_id: string;
  movement_type: string;
  movement_date: string;
  description: string;
  // Transferência
  destination_school: string;
  // Atestado
  document_number: string;
  days_absent: string;
  cid_code: string;
  doctor_name: string;
  return_date: string;
  // Geral
  responsible_name: string;
}

const emptyForm: NewMovementForm = {
  student_id: '',
  movement_type: 'TRANSFERENCIA',
  movement_date: new Date().toLocaleDateString('sv-SE'),
  description: '',
  destination_school: '',
  document_number: '',
  days_absent: '',
  cid_code: '',
  doctor_name: '',
  return_date: '',
  responsible_name: ''
};

const StudentMovementsManager: React.FC = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<NewMovementForm>(emptyForm);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar movimentações com dados dos alunos
      const { data: movData, error: movErr } = await supabase
        .from('student_movements')
        .select(`
          *,
          students (name, registration_number, enrollments (classrooms (name)))
        `)
        .order('movement_date', { ascending: false })
        .limit(200);

      if (movErr) throw movErr;

      // Normalizar estrutura
      const normalized = (movData || []).map((m: any) => ({
        ...m,
        classrooms: m.students?.enrollments?.[0]?.classrooms
      }));
      setMovements(normalized);

      // Buscar alunos para o formulário
      const { data: stuData } = await supabase
        .from('students')
        .select('id, name, registration_number, status, enrollments(classrooms(name))')
        .order('name');

      if (stuData) {
        setStudents(stuData.map((s: any) => ({
          id: s.id,
          name: s.name,
          registration_number: s.registration_number,
          status: s.status || 'ATIVO',
          classroomName: s.enrollments?.[0]?.classrooms?.name || 'SEM TURMA'
        })));
      }
    } catch (err: any) {
      console.error('Erro ao carregar movimentações:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Stats
  const stats = useMemo(() => ({
    total: movements.length,
    transferencias: movements.filter(m => m.movement_type === 'TRANSFERENCIA').length,
    atestados: movements.filter(m => m.movement_type === 'ATESTADO').length,
    abandonos: movements.filter(m => m.movement_type === 'ABANDONO').length,
  }), [movements]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = movements;
    if (filterType !== 'TODOS') list = list.filter(m => m.movement_type === filterType);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(m =>
        m.students?.name?.toLowerCase().includes(s) ||
        m.students?.registration_number?.includes(s) ||
        m.description?.toLowerCase().includes(s)
      );
    }
    return list;
  }, [movements, filterType, searchTerm]);

  // Student search for form
  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students.slice(0, 20);
    const s = studentSearch.toLowerCase();
    return students.filter(st =>
      st.name.toLowerCase().includes(s) || st.registration_number.includes(s)
    ).slice(0, 20);
  }, [students, studentSearch]);

  const selectedStudent = students.find(s => s.id === form.student_id);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id) return alert('Selecione um aluno.');
    if (!form.movement_date) return alert('Informe a data.');

    setIsSaving(true);
    try {
      const payload: any = {
        student_id: form.student_id,
        movement_type: form.movement_type,
        movement_date: form.movement_date,
        description: form.description.toUpperCase() || form.movement_type,
        responsible_name: form.responsible_name.toUpperCase() || null,
      };

      if (form.movement_type === 'TRANSFERENCIA') {
        payload.destination_school = form.destination_school.toUpperCase() || null;
      }
      if (form.movement_type === 'ATESTADO') {
        payload.document_number = form.document_number || null;
        payload.days_absent = form.days_absent ? parseInt(form.days_absent) : null;
        payload.cid_code = form.cid_code.toUpperCase() || null;
        payload.doctor_name = form.doctor_name.toUpperCase() || null;
        payload.return_date = form.return_date || null;
      }

      const { error } = await supabase.from('student_movements').insert([payload]);
      if (error) throw error;

      // Atualizar status do aluno no banco se for transferência ou abandono
      if (form.movement_type === 'TRANSFERENCIA') {
        await supabase.from('students').update({ status: 'TRANSFERIDO' }).eq('id', form.student_id);
      } else if (form.movement_type === 'ABANDONO') {
        await supabase.from('students').update({ status: 'EVADIDO' }).eq('id', form.student_id);
      }

      // Notificação automática
      try {
        const cfg = TYPE_CONFIG[form.movement_type as keyof typeof TYPE_CONFIG];
        const notif = {
          id: `notif-${Date.now()}`,
          title: `${cfg.label}: ${selectedStudent?.name}`,
          message: `Turma ${selectedStudent?.classroomName || ''}. ${form.description}`,
          date: new Date().toISOString(),
          priority: ['TRANSFERENCIA', 'ABANDONO'].includes(form.movement_type) ? 'ALTA' : 'NORMAL',
          isRead: false
        };
        const saved = localStorage.getItem('secretariat_notifications_v1');
        const current = saved ? JSON.parse(saved) : [];
        localStorage.setItem('secretariat_notifications_v1', JSON.stringify([notif, ...current]));
        window.dispatchEvent(new Event('storage'));
      } catch (_) { /* silencioso */ }

      setIsModalOpen(false);
      setForm(emptyForm);
      setStudentSearch('');
      fetchData();
    } catch (err: any) {
      console.error('Erro ao salvar:', err.message);
      alert('Erro ao registrar movimentação: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl">
            <ArrowLeftRight size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Movimentações de Alunos</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Transferências · Atestados · Abandonos</p>
          </div>
        </div>
        <button
          onClick={() => { setIsModalOpen(true); setForm(emptyForm); setStudentSearch(''); }}
          className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} /> Nova Movimentação
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Registros', value: stats.total, icon: FileText, bg: 'bg-indigo-50', text: 'text-indigo-600' },
          { label: 'Transferências', value: stats.transferencias, icon: LogOut, bg: 'bg-amber-50', text: 'text-amber-600' },
          { label: 'Atestados', value: stats.atestados, icon: Stethoscope, bg: 'bg-blue-50', text: 'text-blue-600' },
          { label: 'Abandonos', value: stats.abandonos, icon: TrendingDown, bg: 'bg-red-50', text: 'text-red-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.text}`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
          <input
            type="text"
            placeholder="Buscar aluno, matrícula..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl font-bold text-sm outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['TODOS', 'TRANSFERENCIA', 'ATESTADO', 'ABANDONO', 'OBITO', 'OUTROS'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filterType === t
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
            >
              {t === 'TODOS' ? 'Todos' : TYPE_CONFIG[t as keyof typeof TYPE_CONFIG]?.label || t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Aluno</th>
                <th className="px-6 py-4">Turma</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Loader2 className="animate-spin mx-auto mb-2 text-gray-300" size={28} />
                    <p className="text-xs font-black text-gray-400 uppercase">Carregando...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <ArrowLeftRight className="mx-auto mb-2 text-gray-200" size={36} />
                    <p className="text-xs font-black text-gray-300 uppercase">Nenhuma movimentação encontrada</p>
                  </td>
                </tr>
              ) : filtered.map(m => {
                const cfg = TYPE_CONFIG[m.movement_type] || TYPE_CONFIG.OUTROS;
                const Icon = cfg.icon;
                return (
                  <tr key={m.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-gray-900 uppercase">{m.students?.name || '---'}</p>
                      <p className="text-[10px] font-bold text-gray-400">{m.students?.registration_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-600 uppercase">{m.classrooms?.name || '---'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${cfg.badge}`}>
                        <Icon size={11} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                        <Calendar size={13} className="text-gray-300" />
                        {formatDateSafe(m.movement_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-xs font-bold text-gray-700 uppercase truncate">{m.description || '---'}</p>
                      {m.movement_type === 'TRANSFERENCIA' && m.destination_school && (
                        <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-0.5">
                          <Building2 size={10} /> {m.destination_school}
                        </p>
                      )}
                      {m.movement_type === 'ATESTADO' && m.days_absent && (
                        <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1 mt-0.5">
                          <Clock size={10} /> {m.days_absent} dia(s) · Retorno: {formatDateSafe(m.return_date)}
                        </p>
                      )}
                      {m.movement_type === 'ATESTADO' && m.cid_code && (
                        <p className="text-[10px] text-blue-400 font-bold flex items-center gap-1">
                          <Hash size={10} /> CID: {m.cid_code}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <p className="text-[10px] font-black text-gray-400 uppercase">{filtered.length} registro(s) encontrado(s)</p>
          </div>
        )}
      </div>

      {/* Modal Nova Movimentação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-7 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-[2.5rem] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <ArrowLeftRight size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase">Nova Movimentação</h3>
                  <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Secretaria Escolar</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-7 space-y-5 overflow-y-auto custom-scrollbar">
              {/* Tipo de Movimentação */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                  const Icon = cfg.icon;
                  const isSelected = form.movement_type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, movement_type: type }))}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all text-center ${isSelected
                        ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                        : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                    >
                      <div className={`p-2 rounded-xl ${isSelected ? cfg.iconBg : 'bg-white'}`}>
                        <Icon size={16} />
                      </div>
                      <span className="text-[9px] font-black uppercase leading-tight">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Seleção de Aluno */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Aluno *</label>
                <div
                  className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm cursor-pointer border border-gray-100 flex justify-between items-center"
                  onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                >
                  <span className={selectedStudent ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedStudent ? `${selectedStudent.name} — ${selectedStudent.classroomName}` : 'Clique para selecionar...'}
                  </span>
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
                {showStudentDropdown && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl mt-1 overflow-hidden">
                    <div className="p-3 border-b border-gray-100">
                      <input
                        type="text"
                        placeholder="Buscar aluno..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="w-full p-2 bg-gray-50 rounded-xl text-sm font-bold outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredStudents.map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setForm(prev => ({ ...prev, student_id: st.id }));
                            setStudentSearch('');
                            setShowStudentDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors"
                        >
                          <p className="text-sm font-black text-gray-900 uppercase">{st.name}</p>
                          <p className="text-[10px] font-bold text-gray-400">{st.registration_number} · {st.classroomName}</p>
                        </button>
                      ))}
                      {filteredStudents.length === 0 && (
                        <p className="p-4 text-center text-xs text-gray-400">Nenhum aluno encontrado</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Data */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Data do Evento *</label>
                  <input
                    type="date"
                    required
                    value={form.movement_date}
                    onChange={e => setForm(prev => ({ ...prev, movement_date: e.target.value }))}
                    className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border border-gray-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Responsável pelo Registro</label>
                  <input
                    type="text"
                    value={form.responsible_name}
                    onChange={e => setForm(prev => ({ ...prev, responsible_name: e.target.value }))}
                    placeholder="Nome do secretário(a)..."
                    className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border border-gray-100"
                  />
                </div>
              </div>

              {/* ---- Campos específicos por tipo ---- */}

              {/* TRANSFERÊNCIA */}
              {form.movement_type === 'TRANSFERENCIA' && (
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                  <p className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-2">
                    <LogOut size={13} /> Dados da Transferência
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Escola de Destino</label>
                    <input
                      type="text"
                      value={form.destination_school}
                      onChange={e => setForm(prev => ({ ...prev, destination_school: e.target.value }))}
                      placeholder="Nome da escola para onde o aluno foi transferido..."
                      className="w-full p-3 bg-white rounded-xl font-bold text-sm outline-none border border-amber-100"
                    />
                  </div>
                </div>
              )}

              {/* ATESTADO */}
              {form.movement_type === 'ATESTADO' && (
                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 space-y-4">
                  <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2">
                    <Stethoscope size={13} /> Dados do Atestado Médico
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nº do Atestado</label>
                      <input
                        type="text"
                        value={form.document_number}
                        onChange={e => setForm(prev => ({ ...prev, document_number: e.target.value }))}
                        placeholder="Ex: AT-2026-001"
                        className="w-full p-3 bg-white rounded-xl font-bold text-sm outline-none border border-blue-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Dias de Afastamento</label>
                      <input
                        type="number"
                        min={1}
                        value={form.days_absent}
                        onChange={e => setForm(prev => ({ ...prev, days_absent: e.target.value }))}
                        placeholder="Ex: 3"
                        className="w-full p-3 bg-white rounded-xl font-bold text-sm outline-none border border-blue-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nome do Médico</label>
                      <input
                        type="text"
                        value={form.doctor_name}
                        onChange={e => setForm(prev => ({ ...prev, doctor_name: e.target.value }))}
                        placeholder="Dr(a). Nome..."
                        className="w-full p-3 bg-white rounded-xl font-bold text-sm outline-none border border-blue-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Código CID</label>
                      <input
                        type="text"
                        value={form.cid_code}
                        onChange={e => setForm(prev => ({ ...prev, cid_code: e.target.value }))}
                        placeholder="Ex: J11.1"
                        className="w-full p-3 bg-white rounded-xl font-bold text-sm outline-none border border-blue-100"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Data de Retorno Prevista</label>
                      <input
                        type="date"
                        value={form.return_date}
                        onChange={e => setForm(prev => ({ ...prev, return_date: e.target.value }))}
                        className="w-full p-3 bg-white rounded-xl font-bold text-sm outline-none border border-blue-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABANDONO */}
              {form.movement_type === 'ABANDONO' && (
                <div className="p-5 bg-red-50 rounded-2xl border border-red-100 space-y-4">
                  <p className="text-[10px] font-black text-red-600 uppercase flex items-center gap-2">
                    <TrendingDown size={13} /> Dados do Abandono Escolar
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nº Protocolo / Notificação</label>
                    <input
                      type="text"
                      value={form.document_number}
                      onChange={e => setForm(prev => ({ ...prev, document_number: e.target.value }))}
                      placeholder="Número do protocolo de notificação familiar..."
                      className="w-full p-3 bg-white rounded-xl font-bold text-sm outline-none border border-red-100"
                    />
                  </div>
                </div>
              )}

              {/* Descrição / Observações */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Observações</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detalhes adicionais sobre a movimentação..."
                  rows={3}
                  className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border border-gray-100 resize-none"
                />
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-xs hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !form.student_id}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Registrar Movimentação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMovementsManager;
