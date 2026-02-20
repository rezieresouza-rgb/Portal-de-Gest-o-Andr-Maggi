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
  MessageSquare,
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
  escola: 'E.E. André Antônio Maggi',
  teacher: '',
  subject: 'MATEMÁTICA',
  className: '',
  date: new Date().toISOString().split('T')[0],
  observador: 'COORDENADOR ANDRÉ',
  cargo: 'Coordenador Pedagógico',
  organizacional: {
    inicioPontual: 1,
    ritmoAdequado: 1,
    usoEficienteTempo: 1,
    minimizacaoInterrupcoes: 1,
    clarezaTomVoz: 1,
  },
  pedagogico: {
    clarezaObjetivos: 1,
    usoRecursos: 1,
    interacaoAlunos: 1,
    avaliacaoFormativa: 1,
  },
  evidencias: '',
  avaliacaoGeral: 'Adequado',
  feedback: {
    pontosFortes: '',
    pontosMelhorar: '',
    sugestoesPraticas: [],
    planoAcao: '',
    escalaFeedback: 'Bom'
  }
};

const ClassroomObservationForm: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'teacher_history'>('list'); // Renamed view to viewMode for consistency
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [observations, setObservations] = useState<ObservationData[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Alias viewMode to view for backwards compatibility if needed, but going forward use viewMode
  const view = viewMode;
  const setView = setViewMode;

  const fetchObservations = async () => {
    const { data } = await supabase.from('classroom_observations').select('*');
    if (data) {
      setObservations(data.map(o => ({
        ...o,
        teacher: o.teacher_name,
        criteria_scores: JSON.stringify({ ...o.organizational_criteria, ...o.pedagogical_criteria }), // Mock for list view
        organizational: o.organizational_criteria,
        pedagogico: o.pedagogical_criteria,
        avaliacaoGeral: o.general_rating,
        timestamp: new Date(o.created_at).getTime(),
        // Add flat structure for list mapping if needed
        teacher_name: o.teacher_name,
        class_name: o.classroom_name,
        subject: o.subject,
        date: o.date
      })));
    }
  };

  const fetchStaff = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'PROFESSOR');

    if (data) {
      setStaffList(data.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        code: '', registration: '', cpf: '', birthDate: '', entryProfile: '', serverType: 'Professor',
        jobFunction: '', shift: 'MATUTINO', qualification: '', email: u.email || '', status: 'EM_ATIVIDADE',
        leaveHistory: [], movementHistory: [], notifyAlerts: false, photos: []
      })));
    }
  };

  useEffect(() => {
    fetchObservations();
    fetchStaff();
  }, []);

  const [form, setForm] = useState<Omit<ObservationData, 'id' | 'timestamp'> & { criteria_scores?: any }>(INITIAL_STATE);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleSave = async (e: React.FormEvent | boolean) => {
    const enviar = typeof e === 'boolean' ? e : false;
    if (typeof e !== 'boolean') e.preventDefault();

    setIsSaving(true);
    try {
      if ((form as any).id) {
        // Update
        const { error } = await supabase
          .from('classroom_observations')
          .update({
            teacher_name: form.teacher,
            subject: form.subject,
            classroom_name: form.className,
            date: form.date,
            observer_name: form.observador,
            role: form.cargo,
            organizational_criteria: form.organizational,
            pedagogical_criteria: form.pedagogico,
            evidences: form.evidencias,
            general_rating: form.avaliacaoGeral,
            feedback: {
              ...form.feedback,
              enviadoEm: enviar ? Date.now() : form.feedback?.enviadoEm
            }
          })
          .eq('id', (form as any).id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('classroom_observations')
          .insert([{
            teacher_name: form.teacher,
            subject: form.subject,
            classroom_name: form.className,
            date: form.date,
            observer_name: form.observador,
            role: form.cargo,
            organizational_criteria: form.organizational,
            pedagogical_criteria: form.pedagogico,
            evidences: form.evidencias,
            general_rating: form.avaliacaoGeral,
            feedback: {
              ...form.feedback,
              enviadoEm: enviar ? Date.now() : undefined
            }
          }]);

        if (error) throw error;
      }

      await fetchObservations();
      alert(enviar ? "Feedback enviado ao professor com sucesso!" : "Registro salvo no banco de dados!");
      setView('list');
    } catch (error) {
      console.error("Erro ao salvar observação:", error);
      alert("Erro ao salvar observação.");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPDF = async (obs: any) => {
    // Placeholder for PDF download logic
    alert(`Baixando PDF da observação de ${obs.teacher_name}...`);
  };

  const handleExportPDF = async () => {
    const element = pdfRef.current;
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
  // Alias for compatibility
  const deleteObs = deleteObservation;

  const toggleSuggestion = (sug: string) => {
    const current = form.feedback?.sugestoesPraticas || [];
    const updated = current.includes(sug)
      ? current.filter(s => s !== sug)
      : [...current, sug];
    setForm({ ...form, feedback: { ...form.feedback!, sugestoesPraticas: updated } });
  };

  const handleScoreChange = (criterion: string, score: number) => {
    // Helper to update score in nested objects
    if (form.organizational && criterion in form.organizational) {
      setForm({ ...form, organizational: { ...form.organizational, [criterion]: score } });
    } else if (form.pedagogico && criterion in form.pedagogico) {
      setForm({ ...form, pedagogico: { ...form.pedagogico, [criterion]: score } });
    } else {
      // Fallback for flat structure if used
      setForm({ ...form, criteria_scores: { ...form.criteria_scores, [criterion]: score } });
    }
  };

  const LikertSelector = ({ value, onChange, label }: { value: number, onChange: (v: number) => void, label: string }) => (
    <div className="flex flex-col gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 group hover:border-violet-500/30 transition-all">
      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">{label}</span>
      <div className="flex justify-between gap-1">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${value === v ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-black/20 text-white/30 border border-transparent hover:bg-white/10'
              }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {viewMode === 'list' ? (
        <div className="space-y-6">
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Observações de Aula</h3>
              <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">Acompanhamento e Mentoria Docente</p>
            </div>
            <button onClick={() => { setForm(INITIAL_STATE); setViewMode('form'); }} className="px-8 py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-violet-600/20 hover:bg-violet-700 transition-all flex items-center gap-2 border border-violet-500/20">
              <Plus size={18} /> Nova Observação
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {observations.map(obs => (
              <div key={obs.id} onClick={() => { setForm(obs); setViewMode('form'); }} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-sm hover:border-violet-500/30 hover:bg-white/10 transition-all cursor-pointer flex flex-col justify-between group backdrop-blur-md">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-violet-500/10 text-violet-400 rounded-2xl border border-violet-500/20"><Eye size={24} /></div>
                    <span className="text-[10px] font-black text-white/40 uppercase px-2 py-1 rounded-lg border border-white/10 bg-white/5">{obs.date}</span>
                  </div>
                  <h4 className="text-lg font-black text-white uppercase leading-tight">{obs.teacher}</h4>
                  <p className="text-[10px] text-white/40 font-bold uppercase mt-1">{obs.class_name} • {obs.subject}</p>

                  <div className="mt-6 space-y-2">
                    {obs.criteria_scores && (() => {
                      try {
                        const scores = JSON.parse(obs.criteria_scores as string);
                        return Object.entries(scores).slice(0, 3).map(([key, value]: any) => (
                          <div key={key} className="flex justify-between items-center text-[10px] font-bold uppercase">
                            <span className="text-white/40 truncate w-2/3">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <div key={star} className={`w-1.5 h-1.5 rounded-full ${star <= value ? 'bg-violet-500' : 'bg-white/10'}`} />
                              ))}
                            </div>
                          </div>
                        ));
                      } catch (e) { return null; }
                    })()}
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => deleteObservation(obs.id, e)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); downloadPDF(obs); }} className="text-white/20 hover:text-violet-400 transition-colors"><Download size={16} /></button>
                  </div>
                  <button className="px-3 py-2 bg-white/5 text-white/60 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-violet-500/20 hover:text-violet-300 transition-all flex items-center gap-2 border border-white/10">
                    Ver Detalhes <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
            {observations.length === 0 && (
              <div className="col-span-full py-24 text-center bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10 backdrop-blur-md">
                <Eye size={48} className="mx-auto mb-4 text-white/10" />
                <p className="text-white/30 font-black uppercase text-xs tracking-widest">Nenhuma observação registrada</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 shadow-xl space-y-10 backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-white/10 pb-8">
              <div className="flex items-center gap-6">
                <button onClick={() => setViewMode('list')} className="p-3 bg-white/5 text-white/40 hover:text-violet-400 rounded-2xl transition-all border border-white/10">
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Ficha de Observação - Rotinas Pedagógicas</h3>
                  <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">Conforme orientações da SEDUC/MT</p>
                </div>
              </div>
              <div className="p-3 bg-violet-500/10 text-violet-400 rounded-2xl shadow-sm border border-violet-500/20">
                <Eye size={24} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Professor</label>
                <select value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm outline-none focus:bg-white/10 uppercase text-white [&>option]:bg-gray-900">
                  <option value="">Selecione o professor...</option>
                  {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Componente Curricular</label>
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white/10 text-white [&>option]:bg-gray-900">
                  {SCHOOL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Turma</label>
                <select value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white/10 text-white [&>option]:bg-gray-900">
                  <option value="">Selecione a turma...</option>
                  {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Data da Observação</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm outline-none text-white focus:bg-white/10" />
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-6">
                <h4 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white text-sm">1</span>
                  Aspectos Organizacionais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ORGANIZATIONAL_CRITERIA.map(criterion => (
                    <LikertSelector
                      key={criterion}
                      label={criterion.replace(/([A-Z])/g, ' $1').trim()}
                      value={(form.organizational as any)[criterion] || 0}
                      onChange={v => handleScoreChange(criterion, v)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white text-sm">2</span>
                  Aspectos Pedagógicos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PEDAGOGICAL_CRITERIA.map(criterion => (
                    <LikertSelector
                      key={criterion}
                      label={criterion.replace(/([A-Z])/g, ' $1').trim()}
                      value={(form.pedagogico as any)[criterion] || 0}
                      onChange={v => handleScoreChange(criterion, v)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-white uppercase tracking-widest ml-1">Evidências / Pontos Observados</label>
                <textarea
                  value={form.evidencias}
                  onChange={e => setForm({ ...form, evidencias: e.target.value })}
                  placeholder="Relate o que foi observado durante a aula..."
                  className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl font-medium text-sm text-white outline-none focus:bg-white/10 transition-all h-40 resize-none placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => handleSave(false)} className="flex-1 py-5 bg-white/5 text-white/60 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-white/10 transition-all border border-white/5">Salvar Rascunho</button>
              <button type="button" onClick={() => handleSave(true)} className="flex-1 py-5 bg-violet-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-violet-600/20 hover:bg-violet-700 transition-all border border-violet-500/20">Finalizar e Enviar Feedback</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomObservationForm;
