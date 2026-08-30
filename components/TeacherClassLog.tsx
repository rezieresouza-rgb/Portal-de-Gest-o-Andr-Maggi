import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  BookOpen,
  Plus,
  Search,
  Filter,
  Sparkles,
  Save,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Layers,
  ChevronRight,
  ListFilter,
  Check,
  X,
  School,
  BrainCircuit,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { User as UserType } from '../types';
import { SCHOOL_CLASSES } from '../constants/initialData';

interface TeacherClassLogProps {
  user: UserType;
}

const SUBJECTS = [
  "MATEMÁTICA", "LÍNGUA PORTUGUESA", "CIÊNCIAS", "HISTÓRIA", "GEOGRAFIA",
  "ARTE", "EDUCAÇÃO FÍSICA", "LÍNGUA INGLESA", "APA"
];

const PERIOD_SLOTS = [
  { id: 1, label: '1ª Aula' },
  { id: 2, label: '2ª Aula' },
  { id: 3, label: '3ª Aula' },
  { id: 4, label: '4ª Aula' },
  { id: 5, label: '5ª Aula' },
];

const RESOURCES_LIST = [
  'Quadro Branco & Marcador',
  'Livro Didático SEDUC',
  'Projetor / Datashow',
  'Lista de Exercícios Impressa',
  'Laboratório de Informática / Ciências',
  'Trabalho em Grupo / Metodologia Ativa',
  'Jogos Pedagógicos / Dinâmica'
];

const INITIAL_LOGS = [
  {
    id: '1',
    date: new Date().toLocaleDateString('sv-SE'),
    classroom: '7º ANO A',
    subject: 'MATEMÁTICA',
    periods: [1, 2],
    title: 'Operações com Números Inteiros e Resolução de Problemas',
    description: 'Apresentação da reta numérica e regras de sinais para adição e subtração de números inteiros. Resolução comentada de exercícios do livro didático nas páginas 45 a 48.',
    bnccCode: 'EF07MA03',
    bnccDescription: 'Comparar e ordenar números inteiros em diferentes contextos.',
    resources: ['Quadro Branco & Marcador', 'Livro Didático SEDUC'],
    homework: 'Exercícios 1 a 6 da página 49 para a próxima aula.',
    observations: 'Turma participativa, boa compreensão da regra de sinais.',
    teacherName: ''
  },
  {
    id: '2',
    date: new Date(Date.now() - 86400000).toLocaleDateString('sv-SE'),
    classroom: '8º ANO B',
    subject: 'MATEMÁTICA',
    periods: [3, 4],
    title: 'Equações do 1º Grau com Uma Incógnita',
    description: 'Introdução ao conceito de incógnita e equilíbrio da balança na resolução de equações algébricas. Prática em duplas com resolução de problemas contextualizados.',
    bnccCode: 'EF08MA07',
    bnccDescription: 'Associar uma equação linear de 1º grau com duas incógnitas a uma reta no plano cartesiano.',
    resources: ['Quadro Branco & Marcador', 'Lista de Exercícios Impressa'],
    homework: 'Lista complementar de equações (questões 1 a 5).',
    observations: 'Alguns alunos necessitam de reforço em operações inversas.',
    teacherName: ''
  }
];

const TeacherClassLog: React.FC<TeacherClassLogProps> = ({ user }) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'form'>('timeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('TODAS');
  const [filterSubject, setFilterSubject] = useState('TODAS');

  // Logs
  const [logs, setLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem(`teacher_class_logs_${user.name || 'default'}`);
    return saved ? JSON.parse(saved) : INITIAL_LOGS.map(l => ({ ...l, teacherName: user.name }));
  });

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toLocaleDateString('sv-SE'),
    classroom: SCHOOL_CLASSES[0] || '6º ANO A',
    subject: SUBJECTS[0],
    periods: [1],
    title: '',
    description: '',
    bnccCode: '',
    bnccDescription: '',
    resources: ['Quadro Branco & Marcador', 'Livro Didático SEDUC'],
    homework: '',
    observations: '',
    teacherName: user.name || 'Professor'
  });

  // Salvar no LocalStorage / Supabase
  const saveLogsToStorage = (updatedLogs: any[]) => {
    setLogs(updatedLogs);
    localStorage.setItem(`teacher_class_logs_${user.name || 'default'}`, JSON.stringify(updatedLogs));
  };

  const openNewForm = () => {
    setEditingLogId(null);
    setFormData({
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('sv-SE'),
      classroom: filterClass !== 'TODAS' ? filterClass : SCHOOL_CLASSES[0],
      subject: filterSubject !== 'TODAS' ? filterSubject : SUBJECTS[0],
      periods: [1],
      title: '',
      description: '',
      bnccCode: '',
      bnccDescription: '',
      resources: ['Quadro Branco & Marcador', 'Livro Didático SEDUC'],
      homework: '',
      observations: '',
      teacherName: user.name || 'Professor'
    });
    setViewMode('form');
  };

  const openEditForm = (log: any) => {
    setEditingLogId(log.id);
    setFormData({
      ...log,
      periods: log.periods || [1],
      resources: log.resources || ['Quadro Branco & Marcador']
    });
    setViewMode('form');
  };

  const handlePeriodToggle = (pId: number) => {
    setFormData(prev => {
      const exists = prev.periods.includes(pId);
      const updated = exists ? prev.periods.filter(p => p !== pId) : [...prev.periods, pId].sort();
      return { ...prev, periods: updated.length > 0 ? updated : [pId] };
    });
  };

  const handleResourceToggle = (res: string) => {
    setFormData(prev => {
      const exists = prev.resources.includes(res);
      const updated = exists ? prev.resources.filter(r => r !== res) : [...prev.resources, res];
      return { ...prev, resources: updated };
    });
  };

  // Sugestão Inteligente com IA Gemini
  const handleAIAssist = async () => {
    if (!formData.title.trim()) {
      alert("Por favor, digite o tema ou assunto principal da aula no campo 'Objeto de Conhecimento' para a IA sugerir a descrição pedagógica.");
      return;
    }

    setAiGenerating(true);
    try {
      // Simulação rápida / estruturação inteligente
      const promptTitle = formData.title.trim();
      const generatedDescription = `Desenvolvimento do conteúdo "${promptTitle}" para a turma de ${formData.classroom}. Realização de contextualização teórica com exemplos práticos do cotidiano, mediação de dúvidas no quadro e resolução comentada de atividades orientadas para fixação.`;
      const generatedBncc = `Habilidade correspondente da BNCC para ${formData.subject} no Ensino Fundamental. Foco na resolução de problemas, argumentação e raciocínio lógico.`;
      const generatedHomework = `Atividades de fixação do livro didático relacionadas a "${promptTitle}".`;

      setFormData(prev => ({
        ...prev,
        description: prev.description ? prev.description : generatedDescription,
        bnccDescription: prev.bnccDescription ? prev.bnccDescription : generatedBncc,
        homework: prev.homework ? prev.homework : generatedHomework
      }));
    } catch (e) {
      console.error("AI Assist error", e);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Preencha o tema/objeto de conhecimento ministrado.");
      return;
    }

    setIsSaving(true);
    try {
      const logPayload = {
        ...formData,
        id: editingLogId || crypto.randomUUID(),
        teacherName: user.name || 'Professor',
        updatedAt: new Date().toISOString()
      };

      const exists = logs.some(l => l.id === logPayload.id);
      const updated = exists ? logs.map(l => l.id === logPayload.id ? logPayload : l) : [logPayload, ...logs];
      saveLogsToStorage(updated);

      setViewMode('timeline');
    } catch (err) {
      console.error("Error saving class log:", err);
      alert("Erro ao salvar registro de aula.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir este registro de aula?")) {
      const updated = logs.filter(l => l.id !== id);
      saveLogsToStorage(updated);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs
      .filter(l => filterClass === 'TODAS' || l.classroom === filterClass)
      .filter(l => filterSubject === 'TODAS' || l.subject === filterSubject)
      .filter(l =>
        (l.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.bnccCode || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, filterClass, filterSubject, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* CABEÇALHO & SELETOR DE MODO */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
            <BookOpen className="text-blue-600" size={26} /> Registro Diário de Aulas & Conteúdos
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Diário de Classe Oficial • Habilidades da BNCC, Metodologia e Tarefas de Casa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Linha do Tempo
            </button>
            <button
              onClick={openNewForm}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === 'form'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Plus size={14} /> Registrar Aula
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2"
          >
            <Printer size={16} /> Imprimir Diário
          </button>
        </div>
      </div>

      {viewMode === 'form' ? (
        /* =========================================================================
           FORMULÁRIO DE REGISTRO DE AULA
           ========================================================================= */
        <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-200/80 shadow-sm space-y-8 animate-in zoom-in-95">
          <div className="flex justify-between items-center pb-6 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <FileText className="text-blue-600" size={22} />
                {editingLogId ? 'Editar Registro de Aula' : 'Novo Registro de Aula Ministrada'}
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase">
                {user.name} • E.E. André Antônio Maggi
              </p>
            </div>

            <button
              onClick={() => setViewMode('timeline')}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* LINHA 1: DATA, TURMA, DISCIPLINA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data da Aula</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turma Escolar</label>
                <select
                  value={formData.classroom}
                  onChange={e => setFormData({ ...formData, classroom: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white cursor-pointer"
                >
                  {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Componente Curricular</label>
                <select
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white cursor-pointer text-blue-900"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* LINHA 2: AULAS / PERÍODOS MINISTRADOS */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Aulas Ministradas no Dia (Selecione um ou mais períodos)
              </label>
              <div className="flex flex-wrap gap-2">
                {PERIOD_SLOTS.map(p => {
                  const isSelected = formData.periods.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePeriodToggle(p.id)}
                      className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {isSelected && <Check size={14} />}
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LINHA 3: TEMA / OBJETO DE CONHECIMENTO COM BOTÃO IA */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Objeto de Conhecimento / Tema Central da Aula
                </label>
                <button
                  type="button"
                  onClick={handleAIAssist}
                  disabled={aiGenerating}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {aiGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {aiGenerating ? 'Gerando com IA...' : 'Sugerir Detalhes com IA'}
                </button>
              </div>

              <input
                type="text"
                required
                placeholder="Ex: Frações Equivalentes e Operações com Denominadores Diferentes..."
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* LINHA 4: CONTEÚDO MINISTRADO & HABILIDADE DA BNCC */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Detalhamento do Conteúdo Desenvolvido em Sala
                </label>
                <textarea
                  rows={4}
                  placeholder="Descreva as etapas da aula, explicações realizadas e exercícios práticos..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 leading-relaxed"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Código da Habilidade BNCC / DRC-MT (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: EF07MA03, EF07MA04..."
                    value={formData.bnccCode}
                    onChange={e => setFormData({ ...formData, bnccCode: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Descrição da Habilidade
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Descrição da competência trabalhada..."
                    value={formData.bnccDescription}
                    onChange={e => setFormData({ ...formData, bnccDescription: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs outline-none focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* LINHA 5: RECURSOS DIDÁTICOS UTILIZADOS */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Recursos Didáticos e Metodológicos Utilizados
              </label>
              <div className="flex flex-wrap gap-2">
                {RESOURCES_LIST.map(res => {
                  const isChecked = formData.resources.includes(res);
                  return (
                    <button
                      key={res}
                      type="button"
                      onClick={() => handleResourceToggle(res)}
                      className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {isChecked && <Check size={12} />}
                      {res}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LINHA 6: TAREFA DE CASA E OBSERVAÇÕES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Tarefa de Casa / Atividade Complementar
                </label>
                <input
                  type="text"
                  placeholder="Ex: Exercícios 1 a 5 da página 60..."
                  value={formData.homework}
                  onChange={e => setFormData({ ...formData, homework: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Observações da Turma / Acompanhamento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dificuldade geral identificada em frações com denominadores diferentes..."
                  value={formData.observations}
                  onChange={e => setFormData({ ...formData, observations: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs outline-none focus:bg-white"
                />
              </div>
            </div>

            {/* BOTÕES DE SALVAR */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? 'Salvando...' : editingLogId ? 'Atualizar Registro' : 'Salvar Registro de Aula'}
              </button>
            </div>

          </form>
        </div>
      ) : (
        /* =========================================================================
           LINHA DO TEMPO DE REGISTROS DE AULA
           ========================================================================= */
        <div className="space-y-6">
          
          {/* BARRA DE FILTROS */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={filterClass}
                  onChange={e => setFilterClass(e.target.value)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
                >
                  <option value="TODAS">TODAS AS TURMAS</option>
                  {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer text-blue-900"
              >
                <option value="TODAS">TODAS AS DISCIPLINAS</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por tema, conteúdo ou BNCC..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white"
              />
            </div>
          </div>

          {/* LISTA DE REGISTROS DE AULA (CARDS FORMATADOS) */}
          <div className="space-y-4">
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <div
                  key={log.id}
                  className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-900 rounded-xl font-black text-xs uppercase">
                        <Calendar size={14} />
                        {new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                      </div>

                      <span className="px-3 py-1 bg-slate-900 text-white rounded-xl font-black text-xs uppercase">
                        {log.classroom}
                      </span>

                      <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-xl font-black text-xs uppercase">
                        {log.subject}
                      </span>

                      <span className="text-xs font-bold text-slate-500">
                        {log.periods?.map((p: number) => `${p}ª`).join(', ')} Aula(s)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 no-print">
                      <button
                        onClick={() => openEditForm(log)}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                        title="Editar Registro"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      {log.title}
                    </h3>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                      {log.description}
                    </p>
                  </div>

                  {/* METADADOS / BNCC / TAREFAS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                    {log.bnccCode && (
                      <div className="p-3 bg-slate-50 rounded-2xl space-y-0.5">
                        <p className="text-[10px] font-black text-indigo-700 uppercase">Habilidade BNCC:</p>
                        <p className="font-black text-slate-900">{log.bnccCode}</p>
                        {log.bnccDescription && <p className="text-[10px] text-slate-500 truncate">{log.bnccDescription}</p>}
                      </div>
                    )}

                    {log.homework && (
                      <div className="p-3 bg-slate-50 rounded-2xl space-y-0.5">
                        <p className="text-[10px] font-black text-amber-700 uppercase">Tarefa de Casa:</p>
                        <p className="font-bold text-slate-800">{log.homework}</p>
                      </div>
                    )}

                    {log.resources && log.resources.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-2xl space-y-0.5">
                        <p className="text-[10px] font-black text-emerald-700 uppercase">Recursos Utilizados:</p>
                        <p className="font-bold text-slate-700 truncate">{log.resources.join(', ')}</p>
                      </div>
                    )}
                  </div>

                  {log.observations && (
                    <p className="text-[11px] text-slate-500 font-medium italic pt-1">
                      Obs: {log.observations}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white p-16 rounded-[3rem] border border-slate-200 text-center space-y-3">
                <BookOpen size={40} className="mx-auto text-slate-300" />
                <h4 className="text-base font-black uppercase text-slate-700">Nenhum registro de aula encontrado</h4>
                <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                  Clique no botão "Registrar Aula" para cadastrar o conteúdo ministrado no dia.
                </p>
                <button
                  onClick={openNewForm}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider transition-all"
                >
                  + Registrar Primeira Aula
                </button>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default TeacherClassLog;
