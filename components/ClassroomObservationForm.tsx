import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Eye,
  Save,
  FileDown,
  Send,
  ShieldCheck,
  ChevronRight,
  User,
  BookOpen,
  Calendar,
  MessageSquare as MessageSquareIcon,
  Star,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowLeft,
  X,
  History,
  Info,
  ClipboardCheck,
  LayoutGrid,
  ThumbsUp,
  TrendingUp,
  Lightbulb,
  Target,
  CheckSquare,
  Square,
  Search,
  Download,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ClassroomObservation, StaffMember } from '../types';
import { SCHOOL_CLASSES, SCHOOL_SUBJECTS } from '../constants/initialData';

interface ObservationData extends ClassroomObservation {
  id: string;
}

const PRACTICAL_SUGGESTIONS = [
  "Maior uso de recursos visuais (DataShow/Canva)",
  "Estimular participação ativa dos alunos",
  "Gerar mais avaliações formativas durante a aula",
  "Melhorar a gestão do tempo em atividades em grupo",
  "Reforçar combinados de convivência no início",
  "Diversificar instrumentos avaliativos",
  "Uso mais frequente do material estruturado SEDUC"
];

const ORGANIZATIONAL_CRITERIA = [
  "inicioPontual",
  "ritmoAdequado",
  "usoEficienteTempo",
  "minimizacaoInterrupcoes",
  "clarezaTomVoz"
];

const PEDAGOGICAL_CRITERIA = [
  "clarezaObjetivos",
  "usoRecursos",
  "interacaoAlunos",
  "avaliacaoFormativa"
];

const INITIAL_STATE: Omit<ObservationData, 'id' | 'timestamp'> = {
  escola: 'Unidade Escolar',
  teacher: '',
  subject: 'MATEMÁTICA',
  className: '',
  date: new Date().toISOString().split('T')[0],
  organizational: {
    inicioPontual: 3,
    ritmoAdequado: 3,
    usoEficienteTempo: 3,
    minimizacaoInterrupcoes: 3,
    clarezaTomVoz: 3
  },
  pedagogico: {
    clarezaObjetivos: 3,
    usoRecursos: 3,
    interacaoAlunos: 3,
    avaliacaoFormativa: 3
  },
  evidencias: '',
  pontosFortes: '',
  pontosDesenvolver: '',
  status: 'RASCUNHO',
  feedback: {
    orientacaoGeral: '',
    sugestoesPraticas: [],
    proximosPassos: ''
  }
};

const ClassroomObservationForm: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [observations, setObservations] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const dynamicInitialState = useMemo(() => ({
    ...INITIAL_STATE,
    date: new Date().toISOString().split('T')[0]
  }), []);

  const [form, setForm] = useState<any>(dynamicInitialState);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchObservations();
    fetchStaff();
  }, []);

  const fetchObservations = async () => {
    const { data, error } = await supabase
      .from('classroom_observations')
      .select('*')
      .order('date', { ascending: false });

    if (data) setObservations(data);
  };

  const fetchStaff = async () => {
    const { data } = await supabase
      .from('staff')
      .select('*')
      .order('name');
    if (data) setStaffList(data);
  };

  const handleSave = async (publish: boolean = false) => {
    try {
      const payload = {
        teacher: form.teacher,
        subject: form.subject,
        class_name: form.className || form.class_name,
        date: form.date,
        organizational_scores: form.organizational,
        pedagogical_scores: form.pedagogico,
        evidences: form.evidencias,
        strengths: form.pontosFortes,
        improvements: form.pontosDesenvolver,
        feedback: form.feedback,
        status: publish ? 'FINALIZADO' : 'RASCUNHO',
        timestamp: new Date().getTime()
      };

      if (form.id) {
        await supabase
          .from('classroom_observations')
          .update(payload)
          .eq('id', form.id);
      } else {
        await supabase
          .from('classroom_observations')
          .insert([payload]);
      }

      await fetchObservations();
      setViewMode('list');
      setForm(dynamicInitialState);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar observação');
    }
  };

  const downloadPDF = async (obs: any) => {
    const element = printRef.current;
    if (!element) return;

    // @ts-ignore
    await window.html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `Observacao_Aula_${form.teacher}_${form.date}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(element).save();
  };

  const deleteObservation = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm("Deseja remover este registro permanentemente?")) {
      const { error } = await supabase.from('classroom_observations').delete().eq('id', id);
      if (error) {
        alert("Erro ao excluir observação.");
      } else {
        setObservations(prev => prev.filter(o => o.id !== id));
      }
    }
  };

  const LikertSelector: React.FC<{ value: number, onChange: (v: number) => void, label: string }> = ({ value, onChange, label }) => (
    <div className="flex flex-col gap-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{label}</span>
      <div className="flex justify-between gap-1">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${
              value === v
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {viewMode === 'list' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Eye className="text-violet-600" size={24} /> Observações de Aula
              </h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">
                Acompanhamento e Mentoria Docente Conforme SEDUC-MT
              </p>
            </div>
            <button
              onClick={() => { setForm(dynamicInitialState); setViewMode('form'); }}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-violet-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Nova Observação
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {observations.map(obs => (
              <div
                key={obs.id}
                onClick={() => { setForm(obs); setViewMode('form'); }}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-violet-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-3 bg-violet-100 text-violet-700 rounded-2xl">
                      <Eye size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase px-2.5 py-1 rounded-lg bg-slate-100">
                      {obs.date}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 uppercase leading-tight">{obs.teacher}</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase mt-1">{obs.class_name} • {obs.subject}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button onClick={(e) => deleteObservation(obs.id, e)} className="text-slate-400 hover:text-rose-600 transition-colors p-2">
                    <Trash2 size={16} />
                  </button>
                  <button className="px-3 py-1.5 bg-slate-100 hover:bg-violet-600 hover:text-white text-slate-700 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all flex items-center gap-1">
                    Ver Detalhes <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
            {observations.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-200">
                <Eye size={40} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma observação de aula registrada</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setViewMode('list')} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-xl font-black uppercase text-slate-900">Registro de Observação de Aula</h1>
                  <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mt-0.5">Orientações e Acompanhamento SEDUC-MT</p>
                </div>
              </div>
              <div className="p-3 bg-violet-100 text-violet-700 rounded-2xl">
                <Eye size={22} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professor</label>
                <select
                  value={form.teacher}
                  onChange={e => {
                    const teacher = staffList.find(s => s.name === e.target.value);
                    setForm({ ...form, teacher: e.target.value });
                    setSelectedTeacherId(teacher?.id || null);
                  }}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:bg-white uppercase text-slate-900"
                >
                  <option value="">Selecione o professor...</option>
                  {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Componente Curricular</label>
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white text-slate-900">
                  {SCHOOL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turma</label>
                <select value={form.className || form.class_name} onChange={e => setForm({ ...form, className: e.target.value, class_name: e.target.value })} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white text-slate-900">
                  <option value="">Selecione a turma...</option>
                  {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data da Observação</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none text-slate-900 focus:bg-white" />
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs">1</span>
                  Aspectos Organizacionais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(form.organizational || {}).map(([key, value]) => (
                    <LikertSelector
                      key={key}
                      label={key}
                      value={value as number}
                      onChange={v => setForm({
                        ...form,
                        organizational: { ...form.organizational, [key]: v }
                      })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs">2</span>
                  Critérios Pedagógicos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(form.pedagogico || {}).map(([key, value]) => (
                    <LikertSelector
                      key={key}
                      label={key}
                      value={value as number}
                      onChange={v => setForm({
                        ...form,
                        pedagogico: { ...form.pedagogico, [key]: v }
                      })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 uppercase tracking-widest ml-1">Evidências / Pontos Observados</label>
                <textarea
                  value={form.evidencias || form.evidences || ''}
                  onChange={e => setForm({ ...form, evidencias: e.target.value, evidences: e.target.value })}
                  placeholder="Relate o que foi observado durante a aula..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs text-slate-900 outline-none focus:bg-white transition-all h-32 resize-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => handleSave(false)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-wider transition-all">
                Salvar Rascunho
              </button>
              <button type="button" onClick={() => handleSave(true)} className="flex-1 py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-violet-600/20 transition-all">
                Finalizar e Enviar Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomObservationForm;
