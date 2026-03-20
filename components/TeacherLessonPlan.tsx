
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
  X,
  Printer,
  BookOpen,
  Copy
} from 'lucide-react';
import { LessonPlan, LessonPlanRow, PedagogicalSkill, User as UserType, Book } from '../types';
import { fetchBNCCSkillsFromDB } from '../geminiService';
import { supabase } from '../supabaseClient';
import { SCHOOL_CLASSES } from '../constants/initialData';
import * as XLSX from 'xlsx';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configuração do worker do PDF.js para Vite
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

import { parseLessonPlanWithAI } from '../geminiService';


const CURRICULAR_COMPONENTS = [
  "LÍNGUA PORTUGUESA", "MATEMÁTICA", "HISTÓRIA", "GEOGRAFIA", "CIÊNCIAS",
  "ARTE", "EDUCAÇÃO FÍSICA", "LÍNGUA INGLESA"
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
    classNames: [],
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

  // === LIBRARY DRAWER STATE ===
  const [isLibraryPanelOpen, setIsLibraryPanelOpen] = useState(false);
  const [libraryBooks, setLibraryBooks] = useState<Book[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [isFetchingLibrary, setIsFetchingLibrary] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Fetch Library Books
  const fetchLibraryCatalog = async () => {
    setIsFetchingLibrary(true);
    try {
      const { data, error } = await supabase
        .from('library_books')
        .select('*')
        .order('title');
      
      if (!error && data) {
        setLibraryBooks(data.map(b => ({
          id: b.id,
          title: b.title,
          author: b.author,
          category: b.category,
          isbn: b.isbn,
          totalCopies: b.total_copies,
          availableCopies: b.available_copies,
          location: b.location,
          internalRegistration: b.internal_registration,
          registrationDate: b.registration_date,
          bookType: b.book_type,
          volumeNumber: b.volume_number,
          subtitle: b.subtitle,
          colorTag: b.color_tag,
          coverUrl: b.cover_url,
          synopsis: b.synopsis
        })));
      }
    } catch (err) {
      console.error("Erro ao buscar livros da biblioteca:", err);
    } finally {
      setIsFetchingLibrary(false);
    }
  };

  useEffect(() => {
    if (isLibraryPanelOpen && libraryBooks.length === 0) {
      fetchLibraryCatalog();
    }
  }, [isLibraryPanelOpen]);

  const filteredLibraryBooks = useMemo(() => {
    if (!librarySearch.trim()) return libraryBooks;
    const s = librarySearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return libraryBooks.filter(b => {
      const t = b.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const a = b.author?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
      return t.includes(s) || a.includes(s);
    });
  }, [librarySearch, libraryBooks]);

  const copyBookReference = (book: Book) => {
    const textToCopy = `Referência (Biblioteca Escolar): ${book.title} - ${book.author}`;
    navigator.clipboard.writeText(textToCopy);
    alert(`Livro copiado! Agora aperte Ctrl+V no campo de atividades do roteiro.`);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      let rawText = '';
      const fileExt = file.name.split('.').pop()?.toLowerCase();

      if (fileExt === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        rawText = fullText;
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rawText = XLSX.utils.sheet_to_csv(worksheet);
      } else if (fileExt === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        rawText = result.value;
      } else if (fileExt === 'txt') {
        rawText = await file.text();
      } else {
        alert("Formato de arquivo não suportado. Use PDF, DOCX ou XLSX.");
        setIsImporting(false);
        return;
      }

      if (!rawText.trim()) {
        throw new Error("Não foi possível extrair texto do arquivo.");
      }

      const structuredData = await parseLessonPlanWithAI(rawText);
      if (structuredData) {
        setForm(prev => ({
          ...prev,
          bimestre: structuredData.bimestre || prev.bimestre,
          subject: structuredData.subject || prev.subject,
          className: structuredData.className || prev.className,
          weeklyClasses: structuredData.weeklyClasses || prev.weeklyClasses,
          themes: structuredData.themes || prev.themes,
          observations: structuredData.observations || prev.observations,
          rows: structuredData.rows && structuredData.rows.length > 0 
            ? structuredData.rows.map((r: any) => ({
                weekOrDate: r.weekOrDate || '',
                theme: r.theme || '',
                materialPage: r.materialPage || '',
                skillsText: r.skillsText || '',
                content: r.content || '',
                activities: r.activities || '',
                methodology: r.methodology || '',
                duration: r.duration || '',
                evaluation: r.evaluation || ''
              }))
            : prev.rows
        }));
        alert("Documento importado e processado com sucesso!");
      }

    } catch (err: any) {
      console.error("Erro na importação:", err);
      alert(`Falha ao importar documento: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };


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
            className: content.className || p.classrooms?.name || '',
            classNames: content.classNames || (content.className ? [content.className] : []),
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
    const classToFetch = form.classNames.length > 0 ? form.classNames[0] : form.className;
    if (form.subject && classToFetch) {
      fetchBNCCSkillsFromDB(form.subject, classToFetch).then(skills => {
        setDbSkills(skills || []);
      });
    } else {
      setDbSkills([]);
    }
  }, [form.subject, form.className, form.classNames]);

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
      
      const skillExists = prevForm.skills.some(s => s.code === skill.code);
      const newSkills = skillExists ? prevForm.skills : [...prevForm.skills, skill];

      return { ...prevForm, rows: updatedRows, skills: newSkills };
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
      className: form.classNames.length > 0 ? form.classNames[0] : form.className,
      classNames: form.classNames,
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
        classNames: [],
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
      classNames: [],
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
          <div className="flex items-center gap-4">
            <button
              onClick={handleNewPlan}
              className="px-8 py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-600/20 hover:bg-amber-700 transition-all flex items-center gap-2"
            >
              <Plus size={18} /> Novo Roteiro
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isImporting ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
              {isImporting ? 'Importando...' : 'Importar Documento'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportFile} 
              className="hidden" 
              accept=".pdf,.docx,.xlsx,.xls,.txt"
            />
          </div>

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
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                      Turma: {p.classNames && p.classNames.length > 0 ? p.classNames.join(', ') : p.className} • {p.year}
                    </p>

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
            onClick={() => setIsLibraryPanelOpen(true)}
            className="p-4 bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 border border-emerald-100"
            title="Consultar Acervo da Biblioteca"
          >
            <BookOpen size={18} /> Acervo da Escola
          </button>
          <button
            onClick={() => window.print()}
            className="p-4 bg-gray-50 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 border border-gray-100"
            title="Imprimir Roteiro"
          >
            <Printer size={18} />
          </button>
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
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turmas (Selecione uma ou mais)</label>
            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border border-gray-100 rounded-2xl max-h-40 overflow-y-auto custom-scrollbar">
              {GRADE_LEVELS.map(g => (
                <label key={g} className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${form.classNames.includes(g) ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100 hover:border-amber-200'}`}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={form.classNames.includes(g)}
                    onChange={() => {
                      const newClasses = form.classNames.includes(g)
                        ? form.classNames.filter(c => c !== g)
                        : [...form.classNames, g];
                      setForm({ ...form, classNames: newClasses, className: newClasses[0] || '' });
                    }}
                  />
                  <span className="text-[10px] font-black uppercase tracking-tight">{g}</span>
                </label>
              ))}
            </div>
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
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1">
                      Semana {idx + 1}
                    </label>
                    {/* Two date pickers that auto-format the weekOrDate string */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase whitespace-nowrap">De</span>
                        <input
                          type="date"
                          className="flex-1 p-3 bg-white border border-gray-200 rounded-2xl font-bold text-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                          value={(() => {
                            const match = row.weekOrDate.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                            if (match) return `${match[3]}-${match[2]}-${match[1]}`;
                            return '';
                          })()}
                          onChange={e => {
                            const start = e.target.value;
                            if (!start) { updateRow(idx, 'weekOrDate', ''); return; }
                            const [y, m, d] = start.split('-');
                            const startStr = `${d}/${m}/${y}`;
                            const existingEnd = row.weekOrDate.match(/a (\d{2}\/\d{2}\/\d{4})/);
                            const endStr = existingEnd ? existingEnd[1] : `${d}/${m}/${y}`;
                            updateRow(idx, 'weekOrDate', `De ${startStr} a ${endStr}`);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase whitespace-nowrap">a</span>
                        <input
                          type="date"
                          className="flex-1 p-3 bg-white border border-gray-200 rounded-2xl font-bold text-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                          value={(() => {
                            const match = row.weekOrDate.match(/a (\d{2})\/(\d{2})\/(\d{4})/);
                            if (match) return `${match[3]}-${match[2]}-${match[1]}`;
                            return '';
                          })()}
                          onChange={e => {
                            const end = e.target.value;
                            if (!end) return;
                            const [y, m, d] = end.split('-');
                            const endStr = `${d}/${m}/${y}`;
                            const existingStart = row.weekOrDate.match(/De (\d{2}\/\d{2}\/\d{4})/);
                            const startStr = existingStart ? existingStart[1] : endStr;
                            updateRow(idx, 'weekOrDate', `De ${startStr} a ${endStr}`);
                          }}
                        />
                      </div>
                      {/* Formatted preview + manual override */}
                      {row.weekOrDate && (
                        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-black text-amber-700 whitespace-nowrap shrink-0">
                          {row.weekOrDate}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tema</label>
                    <input value={row.theme} onChange={e => updateRow(idx, 'theme', e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-xs font-semibold outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Página do material</label>
                    <input value={row.materialPage} onChange={e => updateRow(idx, 'materialPage', e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-xs font-semibold outline-none" />
                  </div>
                  <div className="space-y-2 md:col-span-2 relative mt-4">
                    <label className="text-xs font-black text-amber-700 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Sparkles size={14} /> Seleção de Habilidades (Busca)
                    </label>
                    <div className="relative mb-3">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                      <input
                        type="text"
                        placeholder={
                          (!form.subject || (!form.className && form.classNames.length === 0))
                            ? "Selecione disciplina e turma primeiro..."
                            : dbSkills.length === 0
                              ? "Nenhuma habilidade no banco para esta turma/disciplina."
                              : "Digite o código ou palavra (ou clique para ver todas)..."
                        }
                        value={rowSkillSearch[idx] || ''}
                        onChange={e => setRowSkillSearch(prev => ({ ...prev, [idx]: e.target.value }))}
                        onFocus={() => setFocusedRowIdx(idx)}
                        onBlur={() => setTimeout(() => setFocusedRowIdx(null), 200)}
                        disabled={!form.subject || (!form.className && form.classNames.length === 0) || dbSkills.length === 0}
                        className="w-full pl-11 pr-4 py-4 bg-amber-50/40 border-2 border-amber-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all text-gray-900 placeholder:text-gray-400 shadow-sm"
                      />
                      {focusedRowIdx === idx && dbSkills.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border-2 border-amber-100 shadow-2xl rounded-2xl max-h-80 overflow-y-auto custom-scrollbar">
                          {dbSkills
                            .filter(s => {
                              const search = (rowSkillSearch[idx] || '').toLowerCase();
                              const code = (s.code || '').toLowerCase();
                              const desc = (s.description || '').toLowerCase();
                              return code.includes(search) || desc.includes(search);
                            })
                            .map(s => {
                              const pureDesc = s.description;
                              const ko = s.knowledgeObject || null;

                              return (
                                <div
                                  key={s.code || `skill-${Math.random()}`}

                                  onClick={() => appendSkillToRow(idx, s)}
                                  className="p-5 hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors group"
                                >
                                  <div className="flex flex-col gap-2 mb-2">
                                    <div className="flex justify-between items-start gap-4">
                                      <p className="text-sm font-black text-amber-700 uppercase shrink-0 group-hover:text-amber-900">{s.code}</p>
                                      {ko && (
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 text-right leading-tight" title={ko}>
                                          {ko.length > 80 ? `${ko.substring(0, 80)}...` : ko}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-700 font-medium leading-relaxed group-hover:text-gray-900" title={pureDesc}>{pureDesc}</p>
                                </div>
                              );
                            })}
                          {dbSkills.filter(s => {
                            const search = (rowSkillSearch[idx] || '').toLowerCase();
                            const code = (s.code || '').toLowerCase();
                            const desc = (s.description || '').toLowerCase();
                            return code.includes(search) || desc.includes(search);
                          }).length === 0 && (
                            <div className="p-8 text-center bg-gray-50/50">
                              <p className="text-sm font-bold text-gray-500">Nenhuma habilidade encontrada.</p>
                              <p className="text-xs text-gray-400 mt-1">Tente usar outros termos de busca.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mt-2 block">Habilidades Inseridas neste Roteiro</label>
                    <textarea value={row.skillsText} onChange={e => updateRow(idx, 'skillsText', e.target.value)} className="w-full p-5 bg-white border border-gray-200 rounded-2xl text-[13px] font-semibold resize-none outline-none min-h-[120px] focus:border-amber-400 transition-all text-gray-800" placeholder="As habilidades selecionadas acima aparecerão aqui. Você também pode digitar livremente." />
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

      {/* =================== ÁREA DE IMPRESSÃO =================== */}
      <div className="print-area" style={{ display: 'none' }}>
        <div className="print-page">

          {/* CABEÇALHO COM LOGOS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid black', paddingBottom: '12px', marginBottom: '20px' }}>
            <img src="/logo-escola.png" alt="Logo Escola" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
            <img src="/dados escola.jpeg" alt="Dados da Escola" style={{ height: '80px', width: 'auto', objectFit: 'contain', maxWidth: '50%' }} />
            <img src="/SEDUC 2.jpg" alt="SEDUC MT" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* TÍTULO */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', border: '2px solid black', padding: '8px 16px', display: 'inline-block', borderRadius: '8px', background: '#f9fafb' }}>
              Roteiro Pedagógico — Plano de Ensino Semanal
            </h1>
            <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#6b7280', marginTop: '6px' }}>Padrão SEDUC-MT / Referencial Curricular de Mato Grosso</p>
          </div>

          {/* DADOS DO ROTEIRO */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '10px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px 10px', background: '#f3f4f6', fontWeight: 900, textTransform: 'uppercase', width: '20%' }}>Professor(a)</td>
                <td style={{ border: '1px solid black', padding: '6px 10px', fontWeight: 700 }}>{form.teacher}</td>
                <td style={{ border: '1px solid black', padding: '6px 10px', background: '#f3f4f6', fontWeight: 900, textTransform: 'uppercase', width: '15%' }}>Turma</td>
                <td style={{ border: '1px solid black', padding: '6px 10px', fontWeight: 700 }}>{form.className}</td>
                <td style={{ border: '1px solid black', padding: '6px 10px', background: '#f3f4f6', fontWeight: 900, textTransform: 'uppercase', width: '12%' }}>Ano</td>
                <td style={{ border: '1px solid black', padding: '6px 10px', fontWeight: 700 }}>{form.year}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px 10px', background: '#f3f4f6', fontWeight: 900, textTransform: 'uppercase' }}>Componente</td>
                <td style={{ border: '1px solid black', padding: '6px 10px', fontWeight: 700 }}>{form.subject}</td>
                <td style={{ border: '1px solid black', padding: '6px 10px', background: '#f3f4f6', fontWeight: 900, textTransform: 'uppercase' }}>Bimestre</td>
                <td style={{ border: '1px solid black', padding: '6px 10px', fontWeight: 700 }}>{form.bimestre}</td>
                <td style={{ border: '1px solid black', padding: '6px 10px', background: '#f3f4f6', fontWeight: 900, textTransform: 'uppercase' }}>Aulas/Sem</td>
                <td style={{ border: '1px solid black', padding: '6px 10px', fontWeight: 700 }}>{form.weeklyClasses}</td>
              </tr>
              {form.themes && (
                <tr>
                  <td style={{ border: '1px solid black', padding: '6px 10px', background: '#f3f4f6', fontWeight: 900, textTransform: 'uppercase' }}>Unidades Temáticas</td>
                  <td colSpan={5} style={{ border: '1px solid black', padding: '6px 10px' }}>{form.themes}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* HABILIDADES BNCC SELECIONADAS */}
          {form.skills && form.skills.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', background: 'black', color: 'white', padding: '4px 10px', marginBottom: '6px' }}>Habilidades BNCC / DRC-MT Selecionadas</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                <tbody>
                  {form.skills.map((s, i) => (
                    <tr key={i}>
                      <td style={{ border: '1px solid #d1d5db', padding: '4px 8px', fontWeight: 900, color: '#92400e', whiteSpace: 'nowrap', width: '12%' }}>{s.code}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '4px 8px' }}>{s.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ROTEIRO SEMANAL */}
          <h3 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', background: 'black', color: 'white', padding: '4px 10px', marginBottom: '6px' }}>Cronograma Semanal de Aulas</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ border: '1px solid black', padding: '5px 8px', textTransform: 'uppercase', width: '14%', textAlign: 'left' }}>Semana</th>
                <th style={{ border: '1px solid black', padding: '5px 8px', textTransform: 'uppercase', width: '16%', textAlign: 'left' }}>Tema</th>
                <th style={{ border: '1px solid black', padding: '5px 8px', textTransform: 'uppercase', textAlign: 'left' }}>Conteúdo</th>
                <th style={{ border: '1px solid black', padding: '5px 8px', textTransform: 'uppercase', textAlign: 'left' }}>Atividades</th>
                <th style={{ border: '1px solid black', padding: '5px 8px', textTransform: 'uppercase', textAlign: 'left' }}>Metodologia</th>
                <th style={{ border: '1px solid black', padding: '5px 8px', textTransform: 'uppercase', width: '10%', textAlign: 'left' }}>Avaliação</th>
              </tr>
            </thead>
            <tbody>
              {form.rows.map((row, i) => (
                <tr key={i}>
                  <td style={{ border: '1px solid #d1d5db', padding: '5px 8px', fontWeight: 700, color: '#92400e', verticalAlign: 'top' }}>{row.weekOrDate}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '5px 8px', verticalAlign: 'top' }}>{row.theme}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '5px 8px', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{row.content}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '5px 8px', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{row.activities}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '5px 8px', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{row.methodology}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '5px 8px', verticalAlign: 'top' }}>{row.evaluation}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* OBSERVAÇÕES */}
          {form.observations && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', background: 'black', color: 'white', padding: '4px 10px', marginBottom: '6px' }}>Observações</h3>
              <p style={{ fontSize: '10px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{form.observations}</p>
            </div>
          )}

          {/* ASSINATURAS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px', marginTop: '40px', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid black', paddingTop: '8px' }}>
              <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>{form.teacher}</p>
              <p style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>Professor(a) Regente</p>
            </div>
            <div style={{ borderTop: '1px solid black', paddingTop: '8px' }}>
              <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Coordenação Pedagógica</p>
              <p style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>Ciente em ___/___/______</p>
            </div>
            <div style={{ borderTop: '1px solid black', paddingTop: '8px' }}>
              <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Direção Escolar</p>
              <p style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>Ciente em ___/___/______</p>
            </div>
          </div>

          {/* RODAPÉ */}
          <div style={{ textAlign: 'center', borderTop: '1px solid #e5e7eb', marginTop: '24px', paddingTop: '8px', opacity: 0.4 }}>
            <p style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>Documento Oficializado via Portal de Gestão André Maggi • {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* =================== LIBRARY DRAWER =================== */}
      {isLibraryPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end no-print">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsLibraryPanelOpen(false)} />
          <div className="relative w-full max-w-sm md:max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-emerald-700">
              <div className="flex items-center gap-3 text-white">
                <BookOpen size={24} />
                <h3 className="text-xl font-black uppercase tracking-tight leading-none">Acervo da<br/>Biblioteca</h3>
              </div>
              <button onClick={() => setIsLibraryPanelOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por título ou autor..."
                  value={librarySearch}
                  onChange={e => setLibrarySearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-3 text-center">
                {filteredLibraryBooks.length} livro{filteredLibraryBooks.length !== 1 ? 's' : ''} encontrado{filteredLibraryBooks.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
              {isFetchingLibrary ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="animate-spin mb-4" size={32} />
                  <p className="text-xs font-black uppercase tracking-widest">Carregando acervo...</p>
                </div>
              ) : (
                filteredLibraryBooks.map(book => (
                  <div key={book.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3 group hover:border-emerald-200 hover:shadow-md transition-all">
                    <div className="flex gap-4">
                      {book.coverUrl ? (
                        <div className="w-16 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          <img src={book.coverUrl} alt="Capa" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-24 shrink-0 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-200 border border-emerald-100">
                          <BookOpen size={24} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-black text-gray-900 leading-tight group-hover:text-emerald-700 transition-colors line-clamp-2" title={book.title}>
                            {book.title}
                          </h4>
                          <p className="text-[10px] font-bold text-gray-500 uppercase mt-1 leading-none line-clamp-1">{book.author || 'Autor não informado'}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/70 mt-1">{book.category}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${book.availableCopies > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {book.availableCopies} {book.availableCopies === 1 ? 'CÓPIA DISPONÍVEL' : 'CÓPIAS DISPONÍVEIS'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => copyBookReference(book)}
                      className="w-full py-2.5 bg-gray-50 hover:bg-emerald-600 text-gray-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-gray-100 hover:border-emerald-700"
                    >
                      <Copy size={14} /> Usar no Planejamento
                    </button>
                  </div>
                ))
              )}
              {!isFetchingLibrary && filteredLibraryBooks.length === 0 && (
                <div className="text-center py-10">
                  <BookOpen size={32} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Nenhum livro encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }

        @media print {
          @page { size: A4 portrait; margin: 15mm 12mm; }
          body, html { margin: 0; padding: 0; background: white !important; }
          body > * { display: none !important; }
          .print-area { display: block !important; }
          .print-area * { display: revert; }
          .print-page { width: 100%; background: white; color: black; font-family: Arial, sans-serif; }
          .no-print, button, nav, aside, header:not(.print-header) { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default TeacherLessonPlan;
