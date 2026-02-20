
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FileEdit,
  Sparkles,
  Plus,
  Trash2,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Search,
  Loader2,
  FileText,
  Zap,
  CheckCircle2,
  Circle,
  LayoutList,
  CheckSquare,
  Square,
  Send,
  AlertCircle,
  MessageCircle,
  Clock,
  X // Added missing import
} from 'lucide-react';
import { LessonPlan, LessonPlanRow, PedagogicalSkill } from '../types';
import { fetchPedagogicalSkills } from '../geminiService';
import { supabase } from '../supabaseClient';

const CURRICULAR_COMPONENTS = [
  "LÍNGUA PORTUGUESA", "MATEMÁTICA", "HISTÓRIA", "GEOGRAFIA", "CIÊNCIAS",
  "ARTE", "EDUCAÇÃO FÍSICA", "LÍNGUA INGLESA", "ENSINO RELIGIOSO",
  "PROJETO DE VIDA", "PRÁTICAS EXPERIMENTAIS"
];

const GRADE_LEVELS = [
  "6º ANO A", "6º ANO B", "6º ANO D", "6º ANO E",
  "7º ANO A", "7º ANO B", "8º ANO A", "8º ANO B",
  "9º ANO A", "9º ANO B"
];

import { User as UserType } from '../types';

interface TeacherLessonPlanProps {
  user: UserType;
}

const TeacherLessonPlan: React.FC<TeacherLessonPlanProps> = ({ user }) => {
  const [viewMode, setViewMode] = useState<'form' | 'list'>('list');
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<LessonPlan, 'id' | 'timestamp'>>({
    bimestre: '1º BIMESTRE',
    subject: '',
    teacher: user.name,
    year: new Date().getFullYear().toString(),
    className: '',
    weeklyClasses: '6',
    skills: [],
    recompositionSkills: [],
    themes: '',
    rows: [
      { weekOrDate: '1ª semana', content: '', activities: '', methodology: '', evaluation: '' }
    ],
    status: 'RASCUNHO',
    coordinationFeedback: ''
  });

  // Sugestões da IA para seleção
  const [aiSuggestions, setAiSuggestions] = useState<{
    skills: PedagogicalSkill[],
    recomposition: PedagogicalSkill[]
  } | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const pdfRef = useRef<HTMLDivElement>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lesson_plans')
        .select('*')
        .or(`teacher_id.eq.${user.id},content_json->>teacher.eq.${user.name}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching plans:", error);
      } else {
        const mapped: LessonPlan[] = (data || []).map(p => {
          const content = p.content_json || {};
          return {
            id: p.id,
            bimestre: p.bimestre,
            subject: p.subject,
            teacher: content.teacher || user.name,
            year: content.year || new Date().getFullYear().toString(),
            className: content.className || '',
            weeklyClasses: content.weeklyClasses || '0',
            skills: content.skills || [],
            recompositionSkills: content.recompositionSkills || [],
            themes: p.themes || '',
            rows: content.rows || [],
            status: p.status,
            coordinationFeedback: p.teacher_id === user.id ? p.coordination_feedback : '',
            timestamp: p.created_at ? new Date(p.created_at).getTime() : Date.now()
          };
        });
        setPlans(mapped);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();

    const subscription = supabase
      .channel('lesson_plans_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_plans' }, () => {
        fetchPlans();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const addRow = () => {
    setForm(prev => {
      const nextWeekNum = prev.rows.length + 1;
      return {
        ...prev,
        rows: [...prev.rows, {
          weekOrDate: `${nextWeekNum}ª semana`,
          content: '',
          activities: '',
          methodology: '',
          evaluation: ''
        }]
      };
    });
  };

  const removeRow = (index: number) => {
    setForm(prev => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index)
    }));
  };

  const updateRow = (index: number, field: keyof LessonPlanRow, value: string) => {
    setForm(prev => {
      const newRows = [...prev.rows];
      newRows[index] = { ...newRows[index], [field]: value };
      return { ...prev, rows: newRows };
    });
  };

  const handleAISkills = async () => {
    if (!form.subject || !form.className) {
      return alert("Selecione o Componente e a Turma primeiro.");
    }
    setAiLoading(true);
    setAiSuggestions(null);
    setSkillSearch('');
    try {
      const data = await fetchPedagogicalSkills(form.subject, form.className);
      if (data) {
        setAiSuggestions({
          skills: data.skills || [],
          recomposition: data.recomposition || []
        });
        setForm(prev => ({ ...prev, themes: data.themes || prev.themes }));
      }
    } catch (e: any) {
      console.error("Erro na IA:", e);
      alert(`Erro ao consultar a IA pedagógica: ${e.message || e}`);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleSkill = (skill: PedagogicalSkill, type: 'skills' | 'recompositionSkills') => {
    setForm(prev => {
      const current = prev[type] as PedagogicalSkill[];
      const exists = current.find(s => s.code === skill.code);
      if (exists) {
        return { ...prev, [type]: current.filter(s => s.code !== skill.code) };
      }
      return { ...prev, [type]: [...current, skill] };
    });
  };

  const bulkSelect = (type: 'skills' | 'recompositionSkills', select: boolean) => {
    if (!aiSuggestions) return;
    const targetList = type === 'skills' ? aiSuggestions.skills : aiSuggestions.recomposition;
    setForm(prev => ({
      ...prev,
      [type]: select ? targetList : []
    }));
  };

  const filteredAISkills = useMemo(() => {
    if (!aiSuggestions) return [];
    return aiSuggestions.skills.filter(s =>
      s.code.toLowerCase().includes(skillSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(skillSearch.toLowerCase())
    );
  }, [aiSuggestions, skillSearch]);

  const handleSave = async (statusOverride?: LessonPlan['status']) => {
    if (!form.subject) return alert("Selecione a disciplina");

    setIsSaving(true);
    const status = statusOverride || form.status;

    const contentJson = {
      teacher: form.teacher,
      year: form.year,
      className: form.className,
      weeklyClasses: form.weeklyClasses,
      skills: form.skills,
      recompositionSkills: form.recompositionSkills,
      rows: form.rows
    };

    try {
      if (activeId) {
        // Update
        const { error } = await supabase
          .from('lesson_plans')
          .update({
            subject: form.subject,
            bimestre: form.bimestre,
            themes: form.themes,
            content_json: contentJson,
            status: status,
            teacher_id: user.id
          })
          .eq('id', activeId);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('lesson_plans')
          .insert([{
            subject: form.subject,
            bimestre: form.bimestre,
            themes: form.themes,
            content_json: contentJson,
            status: status,
            teacher_id: user.id
          }]);

        if (error) throw error;
      }

      alert(status === 'EM_ANALISE' ? "Roteiro enviado para a Coordenação!" : "Roteiro salvo!");
      setViewMode('list');
      setForm({
        bimestre: '1º BIMESTRE',
        subject: '',
        teacher: user.name,
        year: new Date().getFullYear().toString(),
        className: '',
        weeklyClasses: '6',
        skills: [],
        recompositionSkills: [],
        themes: '',
        rows: [{ weekOrDate: '1ª semana', content: '', activities: '', methodology: '', evaluation: '' }],
        status: 'RASCUNHO',
        coordinationFeedback: ''
      });
      setActiveId(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar roteiro.");
    } finally {
      setIsSaving(false);
    }
  };

  const deletePlan = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este roteiro?")) {
      const { error } = await supabase.from('lesson_plans').delete().eq('id', id);
      if (error) alert("Erro ao excluir.");
    }
  };

  const handleNewPlan = () => {
    setActiveId(null);
    setForm({
      bimestre: '1º BIMESTRE',
      subject: '',
      teacher: user.name,
      year: new Date().getFullYear().toString(),
      className: '',
      weeklyClasses: '6',
      skills: [],
      recompositionSkills: [],
      themes: '',
      rows: [{ weekOrDate: '1ª semana', content: '', activities: '', methodology: '', evaluation: '' }],
      status: 'RASCUNHO'
    });
    setAiSuggestions(null);
    setViewMode('form');
  };

  const getStatusInfo = (status: LessonPlan['status']) => {
    switch (status) {
      case 'RASCUNHO': return { label: 'Rascunho', color: 'bg-gray-100 text-gray-500', icon: FileEdit };
      case 'EM_ANALISE': return { label: 'Aguardando Validação', color: 'bg-amber-100 text-amber-700', icon: Clock };
      case 'VALIDADO': return { label: 'Validado pela Coordenação', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
      case 'CORRECAO_SOLICITADA': return { label: 'Correção Solicitada', color: 'bg-red-100 text-red-700', icon: AlertCircle };
      default: return { label: status, color: 'bg-gray-100', icon: FileText };
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Meus Roteiros</h2>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Acompanhamento Pedagógico (6º ao 9º Ano)</p>
          </div>
          <button
            onClick={handleNewPlan}
            className="px-8 py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-600/20 hover:bg-amber-700 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Novo Roteiro
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-300" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(p => {
              const { label, color, icon: StatusIcon } = getStatusInfo(p.status);
              return (
                <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-amber-200 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><FileText size={24} /></div>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${color} flex items-center gap-1.5`}>
                        <StatusIcon size={10} /> {label}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-gray-900 uppercase leading-tight line-clamp-1">{p.subject}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Turma: {p.className} • {p.year}</p>

                    {p.status === 'CORRECAO_SOLICITADA' && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-[9px] font-black text-red-600 uppercase flex items-center gap-1.5 mb-1"><MessageCircle size={10} /> Feedback da Coordenação:</p>
                        <p className="text-[10px] text-red-800 font-medium italic">"{p.coordinationFeedback}"</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                    <button
                      onClick={() => { setForm(p); setActiveId(p.id); setViewMode('form'); }}
                      className="text-amber-600 font-black uppercase text-[10px] tracking-widest flex items-center gap-1"
                    >
                      Editar <ChevronRight size={12} />
                    </button>
                    <button onClick={() => deletePlan(p.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
            {plans.length === 0 && (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                <FileEdit size={48} className="mx-auto mb-4 text-gray-200" />
                <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhum roteiro cadastrado</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

      {/* CABEÇALHO EDITOR */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => setViewMode('list')} className="p-3 bg-gray-50 text-gray-400 hover:text-amber-600 rounded-2xl transition-all"><ArrowLeft size={24} /></button>
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Editor de Roteiro Curricular</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1 flex items-center gap-1.5">
              <ShieldCheck size={12} /> Padrão SEDUC-MT / Referencial de Mato Grosso
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave('RASCUNHO')}
            disabled={isSaving}
            className="px-6 py-4 bg-gray-100 text-gray-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
          >
            {isSaving && <Loader2 className="animate-spin" size={14} />} Salvar Rascunho
          </button>
          <button
            onClick={() => handleSave('EM_ANALISE')}
            disabled={isSaving}
            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Enviar para Coordenação
          </button>
        </div>
      </div>

      {/* ALERT STATUS FEEDBACK */}
      {form.status === 'CORRECAO_SOLICITADA' && (
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-500 flex items-start gap-5">
          <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg">
            <AlertCircle size={28} />
          </div>
          <div>
            <h4 className="text-lg font-black text-red-900 uppercase tracking-tight">Ajustes Solicitados</h4>
            <p className="text-red-700 font-medium text-sm mt-1">Sua coordenação pedagógica solicitou alterações neste roteiro:</p>
            <div className="mt-4 p-4 bg-white/60 rounded-2xl border border-red-100">
              <p className="text-red-900 font-bold italic">"{form.coordinationFeedback}"</p>
            </div>
          </div>
        </div>
      )}

      {/* FORMULÁRIO DE EDIÇÃO */}
      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10 no-print">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bimestre</label>
            <select value={form.bimestre} onChange={e => setForm({ ...form, bimestre: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs outline-none">
              {['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Componente Curricular</label>
            <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs outline-none">
              <option value="">Selecione a disciplina...</option>
              {CURRICULAR_COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ano/Turma</label>
            <select value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs outline-none">
              <option value="">Selecione a turma...</option>
              {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aulas/Sem</label>
            <input value={form.weeklyClasses} onChange={e => setForm({ ...form, weeklyClasses: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs outline-none text-center" />
          </div>
        </div>

        {/* BOTÃO IA EM DESTAQUE */}
        {(form.subject && form.className) && (
          <div className="p-1 bg-gradient-to-r from-amber-500 to-indigo-600 rounded-[2.5rem] animate-in zoom-in-95 duration-500">
            <button
              onClick={handleAISkills}
              disabled={aiLoading}
              className="w-full py-6 bg-white hover:bg-gray-50 transition-all rounded-[2.3rem] flex items-center justify-center gap-4 group"
            >
              {aiLoading ? (
                <Loader2 size={24} className="animate-spin text-indigo-600" />
              ) : (
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Sparkles size={24} />
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Puxar Matriz Curricular MT (IA)</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">A IA buscará a matriz completa da BNCC e DRC-MT</p>
              </div>
              {!aiLoading && <Zap size={18} className="text-amber-500 fill-amber-500" />}
            </button>
          </div>
        )}

        {/* SELETOR DE HABILIDADES IA */}
        {aiSuggestions && (
          <div className="space-y-12 animate-in slide-in-from-top-4 duration-500">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <LayoutList size={18} className="text-amber-600" /> Matriz de Habilidades Encontradas
                </h4>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                    <input
                      type="text"
                      placeholder="Filtrar por código ou texto..."
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => bulkSelect('skills', true)} className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 border border-emerald-100 hover:bg-emerald-100 transition-all"><CheckSquare size={12} /> Tudo</button>
                    <button onClick={() => bulkSelect('skills', false)} className="px-3 py-2 bg-gray-50 text-gray-400 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 border border-gray-100 hover:bg-gray-100 transition-all"><Square size={12} /> Limpar</button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
                {filteredAISkills.map(s => {
                  const isSelected = form.skills.find(sk => sk.code === s.code);
                  return (
                    <div
                      key={s.code}
                      onClick={() => toggleSkill(s, 'skills')}
                      className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-start gap-4 ${isSelected ? 'bg-amber-50 border-amber-500 shadow-md scale-[0.98]' : 'bg-gray-50 border-gray-100 hover:border-amber-200'
                        }`}
                    >
                      <div className="mt-1 shrink-0">
                        {isSelected ? <CheckCircle2 className="text-amber-600" size={24} /> : <Circle className="text-gray-300" size={24} />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-amber-700 uppercase mb-1">{s.code}</p>
                        <p className="text-[11px] font-medium text-gray-600 leading-relaxed">{s.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600" /> Sugestões para Recomposição
                </h4>
                <div className="flex gap-2">
                  <button onClick={() => bulkSelect('recompositionSkills', true)} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 border border-indigo-100 hover:bg-indigo-100 transition-all"><CheckSquare size={12} /> Tudo</button>
                  <button onClick={() => bulkSelect('recompositionSkills', false)} className="px-3 py-2 bg-gray-50 text-gray-400 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 border border-gray-100 hover:bg-gray-100 transition-all"><Square size={12} /> Limpar</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-1">
                {aiSuggestions.recomposition.map(s => {
                  const isSelected = form.recompositionSkills.find(sk => sk.code === s.code);
                  return (
                    <div
                      key={s.code}
                      onClick={() => toggleSkill(s, 'recompositionSkills')}
                      className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-start gap-4 ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-md scale-[0.98]' : 'bg-gray-50 border-gray-100 hover:border-indigo-200'
                        }`}
                    >
                      <div className="mt-1 shrink-0">
                        {isSelected ? <CheckCircle2 className="text-indigo-600" size={24} /> : <Circle className="text-gray-300" size={24} />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-indigo-700 uppercase mb-1">{s.code}</p>
                        <p className="text-[11px] font-medium text-gray-600 leading-relaxed">{s.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VISUALIZAÇÃO SELECIONADA */}
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unidades Temáticas Sugeridas</label>
            <textarea value={form.themes} onChange={e => setForm({ ...form, themes: e.target.value })} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium h-28 resize-none outline-none focus:bg-white transition-all" placeholder="Liste as unidades que serão abordadas..." />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição das Aulas (Diário de Bordo)</h4>
            <button type="button" onClick={addRow} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all"><Plus size={18} /></button>
          </div>
          <div className="border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-inner overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4 w-40">Data/Duração</th>
                  <th className="px-6 py-4">Conteúdo</th>
                  <th className="px-6 py-4">Atividades</th>
                  <th className="px-6 py-4">Metodologia</th>
                  <th className="px-6 py-4">Avaliação</th>
                  <th className="px-4 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {form.rows.map((row, idx) => (
                  <tr key={idx} className="group hover:bg-gray-50/50">
                    <td className="px-4 py-3"><input value={row.weekOrDate} onChange={e => updateRow(idx, 'weekOrDate', e.target.value)} className="w-full p-2 bg-transparent font-bold text-xs outline-none" /></td>
                    <td className="px-4 py-3"><textarea value={row.content} onChange={e => updateRow(idx, 'content', e.target.value)} className="w-full p-2 bg-transparent text-xs resize-none outline-none h-16" /></td>
                    <td className="px-4 py-3"><textarea value={row.activities} onChange={e => updateRow(idx, 'activities', e.target.value)} className="w-full p-2 bg-transparent text-xs resize-none outline-none h-16" /></td>
                    <td className="px-4 py-3"><textarea value={row.methodology} onChange={e => updateRow(idx, 'methodology', e.target.value)} className="w-full p-2 bg-transparent text-xs resize-none outline-none h-16" /></td>
                    <td className="px-4 py-3"><textarea value={row.evaluation} onChange={e => updateRow(idx, 'evaluation', e.target.value)} className="w-full p-2 bg-transparent text-xs resize-none outline-none h-16" /></td>
                    <td className="px-2 py-3"><button type="button" onClick={() => removeRow(idx)} className="p-2 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default TeacherLessonPlan;
