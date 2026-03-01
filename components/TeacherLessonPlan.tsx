
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
  X
} from 'lucide-react';
import { LessonPlan, LessonPlanRow, PedagogicalSkill, User as UserType } from '../types';
import { fetchBNCCSkillsFromDB } from '../geminiService';
import { supabase } from '../supabaseClient';
import { SCHOOL_CLASSES } from '../constants/initialData';

const CURRICULAR_COMPONENTS = [
  "LÍNGUA PORTUGUESA", "MATEMÁTICA", "HISTÓRIA", "GEOGRAFIA", "CIÊNCIAS",
  "ARTE", "EDUCAÇÃO FÍSICA", "LÍNGUA INGLESA", "ENSINO RELIGIOSO",
  "PROJETO DE VIDA", "PRÁTICAS EXPERIMENTAIS"
];

const GRADE_LEVELS = SCHOOL_CLASSES;

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
    observations: '',
    rows: [
      { weekOrDate: 'De __ a __ de __ de __', theme: '', materialPage: '', skillsText: '', content: '', activities: '', methodology: '', duration: '', evaluation: '' }
    ],
    status: 'RASCUNHO',
    coordinationFeedback: ''
  });

  const [dbSkills, setDbSkills] = useState<PedagogicalSkill[]>([]);
  const [rowSkillSearch, setRowSkillSearch] = useState<{ [key: number]: string }>({});
  const [focusedRowIdx, setFocusedRowIdx] = useState<number | null>(null);

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
            observations: content.observations || '',
            rows: (content.rows || []).map((r: any) => ({
              weekOrDate: r.weekOrDate || '',
              theme: r.theme || '',
              materialPage: r.materialPage || '',
              skillsText: r.skillsText || '',
              content: r.content || '',
              activities: r.activities || '',
              methodology: r.methodology || '',
              duration: r.duration || '',
              evaluation: r.evaluation || ''
            })),
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

  useEffect(() => {
    if (form.subject && form.className) {
      fetchBNCCSkillsFromDB(form.subject, form.className).then(skills => {
        setDbSkills(skills || []);
      });
    } else {
      setDbSkills([]);
    }
  }, [form.subject, form.className]);

  const addRow = () => {
    setForm(prev => {
      const nextWeekNum = prev.rows.length + 1;
      return {
        ...prev,
        rows: [...prev.rows, {
          weekOrDate: `De __ a __ de __ de __`,
          theme: '',
          materialPage: '',
          skillsText: '',
          content: '',
          activities: '',
          methodology: '',
          duration: '',
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

  const appendSkillToRow = (idx: number, skill: PedagogicalSkill) => {
    setForm(prevForm => {
      const row = prevForm.rows[idx];

      const knowledgeObject = skill.knowledgeObject;
      const pureDescription = skill.description;

      let newSkillsText = row.skillsText;
      let newContent = row.content || "";

      if (knowledgeObject) {
        // Append the clean skill (Code - Description) to skillsText
        if (newSkillsText) {
          newSkillsText += `\n(${skill.code}) ${pureDescription}`;
        } else {
          newSkillsText = `(${skill.code}) ${pureDescription}`;
        }

        // Append the Knowledge Object to the Content (Objetos de Conhecimento) field avoiding duplicates
        if (!newContent.includes(knowledgeObject)) {
          if (newContent) {
            newContent += `\n${knowledgeObject}`;
          } else {
            newContent = knowledgeObject;
          }
        }
      } else {
        // Regular skill without mapped knowledge object
        if (newSkillsText) {
          newSkillsText += `\n(${skill.code}) ${skill.description}`;
        } else {
          newSkillsText = `(${skill.code}) ${skill.description}`;
        }
      }

      const updatedRows = [...prevForm.rows];
      updatedRows[idx] = {
        ...row,
        skillsText: newSkillsText,
        content: newContent
      };
      return { ...prevForm, rows: updatedRows };
    });

    // Clear the search input for this row and hide the dropdown
    setRowSkillSearch(prev => ({ ...prev, [idx]: '' }));
    setFocusedRowIdx(null);
  };

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
      observations: form.observations,
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
        observations: '',
        rows: [{ weekOrDate: 'De __ a __ de __ de __', theme: '', materialPage: '', skillsText: '', content: '', activities: '', methodology: '', duration: '', evaluation: '' }],
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
      observations: '',
      rows: [{ weekOrDate: 'De __ a __ de __ de __', theme: '', materialPage: '', skillsText: '', content: '', activities: '', methodology: '', duration: '', evaluation: '' }],
      status: 'RASCUNHO'
    });
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
              <ShieldCheck size={12} /> Padrão SEDUC-MT / Referencial de Mato Grosso <span className="text-emerald-500 font-black ml-2">[v2-DB-INTEGRATED]</span>
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



        {/* VISUALIZAÇÃO SELECIONADA */}
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unidades Temáticas Sugeridas</label>
            <textarea value={form.themes} onChange={e => setForm({ ...form, themes: e.target.value })} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium h-28 resize-none outline-none focus:bg-white transition-all" placeholder="Liste as unidades que serão abordadas..." />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Semanas (Roteiro de Aprendizagem)</h4>
            <button type="button" onClick={addRow} className="px-4 py-2 bg-amber-50 text-amber-600 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-amber-600 hover:text-white transition-all flex items-center gap-2"><Plus size={14} /> Adicionar Semana</button>
          </div>
          <div className="space-y-6">
            {form.rows.map((row, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-100 p-6 rounded-[2rem] relative group">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                  <button type="button" onClick={() => removeRow(idx)} className="p-2 text-gray-300 hover:text-red-500 bg-white rounded-full shadow-sm"><X size={14} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1">Semana {idx + 1} (Ex: De 01/03 a 05/03 de 2026)</label>
                    <input value={row.weekOrDate} onChange={e => updateRow(idx, 'weekOrDate', e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-black text-xs outline-none" placeholder="De __ a __ de __ de __" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tema</label>
                    <input value={row.theme} onChange={e => updateRow(idx, 'theme', e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-xs font-semibold outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Página do material</label>
                    <input value={row.materialPage} onChange={e => updateRow(idx, 'materialPage', e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-xs font-semibold outline-none" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2 relative">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Habilidades a serem trabalhadas</label>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                      <input
                        type="text"
                        placeholder={dbSkills.length > 0 ? "Buscar habilidade para inserir..." : "Selecione disciplina/turma primeiro..."}
                        value={rowSkillSearch[idx] || ''}
                        onChange={e => setRowSkillSearch(prev => ({ ...prev, [idx]: e.target.value }))}
                        onFocus={() => setFocusedRowIdx(idx)}
                        onBlur={() => setTimeout(() => setFocusedRowIdx(null), 200)}
                        disabled={dbSkills.length === 0}
                        className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-bold outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                      />
                      {focusedRowIdx === idx && (rowSkillSearch[idx] || '').trim().length > 0 && (
                        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-xl max-h-60 overflow-y-auto custom-scrollbar">
                          {dbSkills
                            .filter(s => s.code.toLowerCase().includes(rowSkillSearch[idx].toLowerCase()) || s.description.toLowerCase().includes(rowSkillSearch[idx].toLowerCase()))
                            .map(s => {
                              const pureDesc = s.description;
                              const ko = s.knowledgeObject || null;

                              return (
                                <div
                                  key={s.code}
                                  onClick={() => appendSkillToRow(idx, s)}
                                  className="p-3 hover:bg-amber-50 cursor-pointer border-b border-gray-50 last:border-0"
                                >
                                  <div className="flex flex-col gap-1 mb-1">
                                    <div className="flex justify-between items-start gap-2">
                                      <p className="text-xs font-black text-amber-600 uppercase shrink-0">{s.code}</p>
                                      {ko && (
                                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 line-clamp-1 text-right" title={ko}>
                                          {ko.length > 50 ? `${ko.substring(0, 50)}...` : ko}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-gray-600 line-clamp-3 leading-relaxed mt-1" title={pureDesc}>{pureDesc}</p>
                                </div>
                              );
                            })}
                          {dbSkills.filter(s => s.code.toLowerCase().includes(rowSkillSearch[idx].toLowerCase()) || s.description.toLowerCase().includes(rowSkillSearch[idx].toLowerCase())).length === 0 && (
                            <div className="p-4 text-center text-xs text-gray-400">Nenhuma habilidade encontrada.</div>
                          )}
                        </div>
                      )}
                    </div>
                    <textarea value={row.skillsText} onChange={e => updateRow(idx, 'skillsText', e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-xs font-semibold resize-none outline-none h-24" placeholder="Habilidades selecionadas aparecerão aqui. Você pode digitar livremente também." />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 mt-4">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Passo a passo: Rotina para organizar a semana</h5>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Conteúdos / Objetos de Conhecimento</label>
                      <textarea value={row.content} onChange={e => updateRow(idx, 'content', e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-xs resize-none outline-none min-h-[60px]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Atividades propostas</label>
                      <textarea value={row.activities} onChange={e => updateRow(idx, 'activities', e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-xs resize-none outline-none min-h-[60px]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Como fazer e onde pesquisar</label>
                      <textarea value={row.methodology} onChange={e => updateRow(idx, 'methodology', e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-xs resize-none outline-none min-h-[60px]" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Duração</label>
                        <input value={row.duration} onChange={e => updateRow(idx, 'duration', e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-xs outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Avaliação</label>
                        <input value={row.evaluation} onChange={e => updateRow(idx, 'evaluation', e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-xs outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observações e links sugeridos</label>
            <textarea value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium h-24 resize-none outline-none focus:bg-white transition-all" placeholder="Adicione observações adicionais relativas a este roteiro..." />
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
