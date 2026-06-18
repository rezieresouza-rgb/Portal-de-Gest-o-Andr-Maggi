import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  List, 
  CalendarDays, 
  Search, 
  Award, 
  Sparkles, 
  BookOpen, 
  X,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { SCHOOL_CLASSES } from '../constants/initialData';
import { supabase } from '../supabaseClient';
import { User as UserType } from '../types';
import { useToast } from './Toast';

const BIMESTRES = ['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'];
const CLASSES = SCHOOL_CLASSES;
const SUBJECTS = [
  "MATEMÁTICA", "LÍNGUA PORTUGUESA", "CIÊNCIAS", "HISTÓRIA", "GEOGRAFIA",
  "ARTE", "EDUCAÇÃO FÍSICA", "LÍNGUA INGLESA", "ENSINO RELIGIOSO"
];
const ASSESSMENT_TYPES = [
  { id: 'AVALIACAO_BIMESTRAL', label: 'Avaliação Bimestral' },
  { id: 'TRABALHO', label: 'Trabalho / Projeto' },
  { id: 'CAED', label: 'Avaliação CAED' },
  { id: 'SIMULADO', label: 'Simulado' },
  { id: 'RECUPERACAO', label: 'Avaliação de Recuperação' },
  { id: 'OUTRO', label: 'Outro instrumento' }
];

interface Assessment {
  id: string;
  classroom_id: string;
  classroom_name?: string;
  teacher_id: string;
  subject: string;
  date: string;
  type: string;
  max_score: number;
  bimestre: string;
  status: 'PLANEJADA' | 'APLICADA' | 'CANCELADA';
  description: string;
  created_at?: string;
}

interface TeacherAssessmentScheduleProps {
  user: UserType;
}

const TeacherAssessmentSchedule: React.FC<TeacherAssessmentScheduleProps> = ({ user }) => {
  const { addToast } = useToast();
  
  // State for views and filters
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterBimestre, setFilterBimestre] = useState('');
  
  // Data State
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    classroomName: '',
    subject: SUBJECTS[0],
    bimestre: BIMESTRES[0],
    date: new Date().toISOString().split('T')[0],
    type: 'AVALIACAO_BIMESTRAL',
    maxScore: 10,
    description: '',
    status: 'PLANEJADA' as 'PLANEJADA' | 'APLICADA' | 'CANCELADA'
  });

  // Calendar specific state
  const [currentDate, setCurrentDate] = useState(new Date());

  // Load classrooms and assessments
  useEffect(() => {
    fetchClassroomsAndAssessments();
  }, [user]);

  const fetchClassroomsAndAssessments = async () => {
    setLoading(true);
    try {
      // 1. Fetch classrooms
      const { data: roomsData, error: roomsErr } = await supabase
        .from('classrooms')
        .select('*');
      
      if (roomsErr) throw roomsErr;
      setClassrooms(roomsData || []);

      // 2. Fetch assessments for this teacher
      const { data: assData, error: assErr } = await supabase
        .from('assessments')
        .select('*')
        .eq('teacher_id', user.id)
        .order('date', { ascending: true });

      if (assErr) throw assErr;

      // Map assessments with fallbacks and classroom names
      const mapped = (assData || []).map((ass: any) => {
        const room = (roomsData || []).find(r => r.id === ass.classroom_id);
        
        // Recover fallback status/description from localStorage if needed
        let status = ass.status || 'PLANEJADA';
        let description = ass.description || '';
        
        const fallback = localStorage.getItem(`assessment_fallback_${ass.id}`);
        if (fallback) {
          try {
            const parsedFallback = JSON.parse(fallback);
            if (!ass.status && parsedFallback.status) status = parsedFallback.status;
            if (!ass.description && parsedFallback.description) description = parsedFallback.description;
          } catch (e) {
            console.error("Error parsing localstorage fallback for assessment:", ass.id, e);
          }
        }

        return {
          id: ass.id,
          classroom_id: ass.classroom_id,
          classroom_name: room ? room.name : 'Classe Indefinida',
          teacher_id: ass.teacher_id,
          subject: ass.subject,
          date: ass.date.split('T')[0], // Format date string
          type: ass.type,
          max_score: Number(ass.max_score || 10),
          bimestre: ass.bimestre,
          status: status,
          description: description
        };
      });

      setAssessments(mapped);
    } catch (e: any) {
      console.error("Error loading assessment schedule:", e);
      addToast("Erro ao carregar cronograma de avaliações: " + (e.message || e), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingAssessment(null);
    setFormData({
      classroomName: CLASSES[0] || '',
      subject: SUBJECTS[0],
      bimestre: BIMESTRES[0],
      date: new Date().toISOString().split('T')[0],
      type: 'AVALIACAO_BIMESTRAL',
      maxScore: 10,
      description: '',
      status: 'PLANEJADA'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (ass: Assessment) => {
    setEditingAssessment(ass);
    setFormData({
      classroomName: ass.classroom_name || '',
      subject: ass.subject,
      bimestre: ass.bimestre,
      date: ass.date,
      type: ass.type,
      maxScore: ass.max_score,
      description: ass.description,
      status: ass.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta avaliação? Todos os registros vinculados podem ser afetados.")) return;
    
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Cleanup localStorage
      localStorage.removeItem(`assessment_fallback_${id}`);

      addToast("Avaliação excluída com sucesso!", "success");
      setAssessments(prev => prev.filter(a => a.id !== id));
    } catch (e: any) {
      console.error(e);
      addToast("Erro ao excluir avaliação: " + (e.message || e), "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classroomName) {
      addToast("Selecione uma turma.", "warning");
      return;
    }

    setSaving(true);
    try {
      // 1. Get or create classroom ID
      let classroomId = '';
      const existingRoom = classrooms.find(r => r.name.toUpperCase() === formData.classroomName.toUpperCase());
      
      if (existingRoom) {
        classroomId = existingRoom.id;
      } else {
        // Create classroom
        const { data: newRoom, error: roomErr } = await supabase
          .from('classrooms')
          .insert([{
            name: formData.classroomName.toUpperCase(),
            year: new Date().getFullYear().toString(),
            shift: 'MATUTINO'
          }])
          .select('id')
          .single();

        if (roomErr) throw roomErr;
        classroomId = newRoom.id;
        // Update classrooms state
        setClassrooms(prev => [...prev, { id: classroomId, name: formData.classroomName.toUpperCase() }]);
      }

      // 2. Prepare payload
      const payload: any = {
        classroom_id: classroomId,
        teacher_id: user.id,
        subject: formData.subject,
        bimestre: formData.bimestre,
        date: formData.date,
        type: formData.type,
        max_score: formData.maxScore
      };

      let saveError: any = null;
      let savedId = '';

      if (editingAssessment) {
        // Try updating including status and description
        const updatePayload = { ...payload, status: formData.status, description: formData.description };
        const { data: updData, error: updErr } = await supabase
          .from('assessments')
          .update(updatePayload)
          .eq('id', editingAssessment.id)
          .select();

        if (updErr) {
          // If error due to missing columns, retry without status/description and save to localStorage
          if (updErr.code === '42703' || updErr.message.includes('column')) {
            const { error: retryErr } = await supabase
              .from('assessments')
              .update(payload)
              .eq('id', editingAssessment.id);
            
            if (retryErr) {
              saveError = retryErr;
            } else {
              localStorage.setItem(`assessment_fallback_${editingAssessment.id}`, JSON.stringify({
                status: formData.status,
                description: formData.description
              }));
              savedId = editingAssessment.id;
            }
          } else {
            saveError = updErr;
          }
        } else {
          savedId = editingAssessment.id;
        }
      } else {
        // Create new
        const insertPayload = { ...payload, status: formData.status, description: formData.description };
        const { data: insData, error: insErr } = await supabase
          .from('assessments')
          .insert([insertPayload])
          .select();

        if (insErr) {
          if (insErr.code === '42703' || insErr.message.includes('column')) {
            const { data: retryData, error: retryErr } = await supabase
              .from('assessments')
              .insert([payload])
              .select();

            if (retryErr) {
              saveError = retryErr;
            } else if (retryData && retryData[0]) {
              savedId = retryData[0].id;
              localStorage.setItem(`assessment_fallback_${savedId}`, JSON.stringify({
                status: formData.status,
                description: formData.description
              }));
            }
          } else {
            saveError = insErr;
          }
        } else if (insData && insData[0]) {
          savedId = insData[0].id;
        }
      }

      if (saveError) throw saveError;

      addToast(editingAssessment ? "Avaliação atualizada com sucesso!" : "Avaliação agendada com sucesso!", "success");
      setShowModal(false);
      fetchClassroomsAndAssessments(); // Reload
    } catch (e: any) {
      console.error(e);
      addToast("Erro ao salvar avaliação: " + (e.message || e), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (ass: Assessment, newStatus: 'PLANEJADA' | 'APLICADA' | 'CANCELADA') => {
    try {
      const { error } = await supabase
        .from('assessments')
        .update({ status: newStatus })
        .eq('id', ass.id);

      if (error) {
        if (error.code === '42703' || error.message.includes('column')) {
          // Fallback update to localStorage
          const localFallback = localStorage.getItem(`assessment_fallback_${ass.id}`);
          let parsed = { status: newStatus, description: ass.description };
          if (localFallback) {
            try {
              const prevData = JSON.parse(localFallback);
              parsed = { ...prevData, status: newStatus };
            } catch {}
          }
          localStorage.setItem(`assessment_fallback_${ass.id}`, JSON.stringify(parsed));
        } else {
          throw error;
        }
      }

      // Update state locally for instant UI update
      setAssessments(prev => prev.map(item => item.id === ass.id ? { ...item, status: newStatus } : item));
      addToast(`Status alterado para ${newStatus === 'APLICADA' ? 'APLICADA' : newStatus === 'CANCELADA' ? 'CANCELADA' : 'PLANEJADA'}`, "success");
    } catch (e: any) {
      console.error(e);
      addToast("Erro ao alterar status: " + (e.message || e), "error");
    }
  };

  // Filtered Assessments
  const filteredAssessments = assessments.filter(ass => {
    const classMatch = filterClass === '' || ass.classroom_name?.toUpperCase() === filterClass.toUpperCase();
    const subjectMatch = filterSubject === '' || ass.subject.toUpperCase() === filterSubject.toUpperCase();
    const bimestreMatch = filterBimestre === '' || ass.bimestre.toUpperCase() === filterBimestre.toUpperCase();
    return classMatch && subjectMatch && bimestreMatch;
  });

  // Calculate Statistics
  const totalCount = filteredAssessments.length;
  const appliedCount = filteredAssessments.filter(a => a.status === 'APLICADA').length;
  const plannedCount = filteredAssessments.filter(a => a.status === 'PLANEJADA').length;
  const rate = totalCount > 0 ? Math.round((appliedCount / totalCount) * 100) : 0;

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDay, totalDays };
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const { firstDay, totalDays } = getDaysInMonth(currentDate);
  const calendarWeeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = Array(7).fill(null);
  
  // Fill first week blank days
  for (let i = 0; i < firstDay; i++) {
    currentWeek[i] = null;
  }

  let currentDay = 1;
  let weekDayIndex = firstDay;

  while (currentDay <= totalDays) {
    currentWeek[weekDayIndex] = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDay);
    currentDay++;
    weekDayIndex++;

    if (weekDayIndex === 7 || currentDay > totalDays) {
      calendarWeeks.push(currentWeek);
      currentWeek = Array(7).fill(null);
      weekDayIndex = 0;
    }
  }

  // Get evaluations for a specific calendar date
  const getAssessmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return assessments.filter(ass => ass.date === dateStr);
  };

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(new Date());
  const selectedDateAssessments = selectedCalendarDate ? getAssessmentsForDate(selectedCalendarDate) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APLICADA': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'CANCELADA': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getTypeText = (type: string) => {
    return ASSESSMENT_TYPES.find(t => t.id === type)?.label || type;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Top Action Bar with Filters */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-6 no-print">
        
        {/* View Mode & Add Button */}
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto shrink-0 justify-between sm:justify-start">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setViewMode('list')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List size={14} /> Lista de Cards
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <CalendarDays size={14} /> Calendário
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-6 py-3.5 bg-amber-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-600/10 hover:bg-amber-700 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Agendar Avaliação
          </button>
        </div>

        {/* Filters */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 w-full">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma</label>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-amber-500/5 transition-all cursor-pointer"
            >
              <option value="">Todas as Turmas</option>
              {CLASSES.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Disciplina</label>
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-amber-500/5 transition-all cursor-pointer"
            >
              <option value="">Todas as Disciplinas</option>
              {SUBJECTS.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Bimestre</label>
            <select
              value={filterBimestre}
              onChange={e => setFilterBimestre(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-amber-500/5 transition-all cursor-pointer"
            >
              <option value="">Todos os Bimestres</option>
              {BIMESTRES.map(bim => (
                <option key={bim} value={bim}>{bim}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <CalendarIcon size={24} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">Total Agendado</p>
            <p className="text-2xl font-black text-gray-900 mt-2">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">Aplicadas</p>
            <p className="text-2xl font-black text-gray-900 mt-2">{appliedCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">Planejadas</p>
            <p className="text-2xl font-black text-gray-900 mt-2">{plannedCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">Taxa de Sucesso</p>
            <p className="text-2xl font-black text-gray-900 mt-2">{rate}%</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest mt-4">Carregando cronograma...</p>
        </div>
      ) : (
        <>
          {/* LIST MODE */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssessments.length === 0 ? (
                <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-gray-400">
                  <CalendarDays size={64} className="mb-4 opacity-20 text-amber-600" />
                  <p className="text-sm font-black uppercase tracking-widest">Nenhuma avaliação encontrada</p>
                  <p className="text-xs mt-1">Crie um agendamento ou altere os filtros acima.</p>
                </div>
              ) : (
                filteredAssessments.map(ass => (
                  <div key={ass.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all flex flex-col justify-between group">
                    <div className="space-y-4">
                      {/* Card Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          <span className="bg-gray-900 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest w-fit">
                            {ass.classroom_name}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border w-fit ${getStatusColor(ass.status)}`}>
                            {ass.status}
                          </span>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditModal(ass)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Editar Avaliação"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            disabled={deletingId === ass.id}
                            onClick={() => handleDelete(ass.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir Avaliação"
                          >
                            {deletingId === ass.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="space-y-1.5">
                        <h4 className="font-black text-gray-900 uppercase text-xs leading-none tracking-tight">
                          {ass.subject}
                        </h4>
                        <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                          {getTypeText(ass.type)}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                          <CalendarIcon size={12} className="text-gray-300" />
                          <span>{new Date(ass.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'numeric' })}</span>
                        </div>
                        {ass.description && (
                          <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 text-[10px] font-medium text-gray-500 italic mt-2">
                            {ass.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase">
                        <Award size={12} className="text-amber-500" />
                        <span>Valor: {ass.max_score} pts</span>
                      </div>

                      {/* Dropdown status update or fast toggle */}
                      <div className="flex items-center gap-1.5">
                        {ass.status !== 'APLICADA' ? (
                          <button
                            onClick={() => handleToggleStatus(ass, 'APLICADA')}
                            className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                          >
                            <CheckCircle size={10} /> Aplicar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(ass, 'PLANEJADA')}
                            className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                          >
                            <Clock size={10} /> Reabrir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* CALENDAR MODE */}
          {viewMode === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Calendar Grid */}
              <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                
                {/* Month Navigation */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">
                    {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => changeMonth(1)}
                      className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-[10px] font-black text-gray-400 uppercase tracking-widest py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarWeeks.map((week, wIdx) => 
                    week.map((day, dIdx) => {
                      if (!day) {
                        return <div key={`empty-${wIdx}-${dIdx}`} className="aspect-square bg-gray-50/20 rounded-2xl"></div>;
                      }

                      const dayAssessments = getAssessmentsForDate(day);
                      const isSelected = selectedCalendarDate && day.toDateString() === selectedCalendarDate.toDateString();
                      const isToday = day.toDateString() === new Date().toDateString();

                      return (
                        <button
                          key={day.toDateString()}
                          onClick={() => setSelectedCalendarDate(day)}
                          className={`aspect-square p-2 rounded-2xl flex flex-col justify-between items-center relative transition-all group border ${
                            isSelected 
                              ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/20 scale-105' 
                              : isToday 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-gray-50/50 hover:bg-white hover:border-gray-200 border-transparent text-gray-700'
                          }`}
                        >
                          <span className={`text-xs font-black leading-none ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                            {day.getDate()}
                          </span>

                          {/* Assessment Indicators inside day */}
                          {dayAssessments.length > 0 && (
                            <div className="flex gap-1 justify-center w-full mt-1.5">
                              {dayAssessments.slice(0, 3).map((ass, idx) => {
                                let dotColor = 'bg-blue-500';
                                if (ass.status === 'APLICADA') dotColor = 'bg-emerald-500';
                                if (ass.status === 'CANCELADA') dotColor = 'bg-rose-500';
                                
                                return (
                                  <span 
                                    key={ass.id} 
                                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : dotColor}`}
                                    title={`${ass.classroom_name}: ${ass.subject}`}
                                  ></span>
                                );
                              })}
                              {dayAssessments.length > 3 && (
                                <span className={`text-[6px] font-black ${isSelected ? 'text-white' : 'text-amber-600'}`}>
                                  +{dayAssessments.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Day Details Side Panel */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="border-b border-gray-100 pb-4 mb-6">
                    <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest">
                      Detalhes do Dia
                    </h4>
                    <p className="text-base font-black text-gray-900 mt-1 uppercase">
                      {selectedCalendarDate ? selectedCalendarDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Selecione um dia'}
                    </p>
                  </div>

                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedDateAssessments.length === 0 ? (
                      <div className="py-12 text-center text-gray-300">
                        <BookOpen size={36} className="mx-auto mb-2 opacity-20" />
                        <p className="text-[10px] font-black uppercase">Sem avaliações agendadas</p>
                      </div>
                    ) : (
                      selectedDateAssessments.map(ass => (
                        <div key={ass.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative group">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <span className="bg-gray-950 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">
                                {ass.classroom_name}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border ${getStatusColor(ass.status)}`}>
                                {ass.status}
                              </span>
                            </div>
                            <h5 className="font-black text-gray-900 text-xs uppercase mt-2">{ass.subject}</h5>
                            <p className="text-[9px] text-amber-600 font-bold uppercase mt-0.5">{getTypeText(ass.type)}</p>
                          </div>

                          {ass.description && (
                            <p className="text-[9px] text-gray-400 italic bg-white p-2 rounded-lg border border-gray-100">
                              {ass.description}
                            </p>
                          )}

                          <div className="flex justify-between items-center text-[9px] font-black text-gray-400 uppercase pt-1 border-t border-gray-200/50">
                            <span>Valor: {ass.max_score} pts</span>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleOpenEditModal(ass)} className="text-amber-600 font-black uppercase hover:underline">Editar</button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {selectedCalendarDate && (
                  <button
                    onClick={() => {
                      setEditingAssessment(null);
                      setFormData({
                        classroomName: CLASSES[0] || '',
                        subject: SUBJECTS[0],
                        bimestre: BIMESTRES[0],
                        date: selectedCalendarDate.toISOString().split('T')[0],
                        type: 'AVALIACAO_BIMESTRAL',
                        maxScore: 10,
                        description: '',
                        status: 'PLANEJADA'
                      });
                      setShowModal(true);
                    }}
                    className="w-full mt-6 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus size={14} /> Agendar neste dia
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* FORM MODAL (ADD / EDIT) */}
      {showModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-amber-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl border border-amber-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-8 bg-amber-50 border-b border-amber-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-amber-500 text-white rounded-3xl shadow-lg">
                  <CalendarDays size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                    {editingAssessment ? 'Editar Agendamento' : 'Agendar Avaliação'}
                  </h3>
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-1">
                    Planejamento e Organização
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-red-500 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma</label>
                  <select
                    required
                    value={formData.classroomName}
                    onChange={e => setFormData({ ...formData, classroomName: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all cursor-pointer"
                  >
                    <option value="">Selecione a turma...</option>
                    {CLASSES.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Disciplina</label>
                  <select
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all cursor-pointer"
                  >
                    {SUBJECTS.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bimestre</label>
                  <select
                    value={formData.bimestre}
                    onChange={e => setFormData({ ...formData, bimestre: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all cursor-pointer"
                  >
                    {BIMESTRES.map(bim => (
                      <option key={bim} value={bim}>{bim}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data da Aplicação</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor (Pontuação)</label>
                  <input
                    required
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={formData.maxScore}
                    onChange={e => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Avaliação</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all cursor-pointer"
                  >
                    {ASSESSMENT_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado / Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all cursor-pointer"
                  >
                    <option value="PLANEJADA">PLANEJADA (Agendada)</option>
                    <option value="APLICADA">APLICADA (Realizada)</option>
                    <option value="CANCELADA">CANCELADA</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Conteúdos Avaliados (Tópicos)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Escreva os conteúdos, capítulos ou habilidades avaliadas (ex: Equações de 2º Grau, Leitura de Crônicas...)"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none h-24 resize-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-5 bg-amber-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-amber-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Cronograma</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssessmentSchedule;
