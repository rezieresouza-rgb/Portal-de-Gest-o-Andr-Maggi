import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Music,
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
  Check,
  X,
  Drum,
  Volume2,
  Radio,
  Award
} from 'lucide-react';
import { User as UserType } from '../types';

interface EducarteClassLogProps {
  user: UserType;
  repertoire?: any[];
}

const NAIPES_ENSAIO = [
  'BANDA COMPLETA (TUTTI)',
  'NAIPE DE METAIS',
  'NAIPE DE MADEIRAS',
  'NAIPE DE PERCUSSÃO / BATERIA',
  'LINHA DE FRENTE / BALIZAS'
];

const SHIFTS = [
  'VESPERTINO (CONTRATURNO)',
  'MATUTINO (CONTRATURNO)',
  'SÁBADO / ENSAIO ESPECIAL'
];

const METHODOLOGIES = [
  'Aquecimento & Exercícios de Respiração',
  'Prática com Metrônomo / Andamento',
  'Estudo de Escalas & Afinação',
  'Leitura à Primeira Vista / Teoria',
  'Ensaio por Naipes Separados',
  'Tutti (Banda Completa)',
  'Evolução de Marcha & Marcação de Passo',
  'Manutenção & Lubrificação de Instrumentos'
];

const INITIAL_EDUCARTE_LOGS = [
  {
    id: '1',
    date: new Date().toLocaleDateString('sv-SE'),
    naipeGroup: 'BANDA COMPLETA (TUTTI)',
    shift: 'VESPERTINO (CONTRATURNO)',
    time: '14:00 às 16:30',
    title: 'Ensaio Geral do Dobrado Batista de Melo e Hino de Mato Grosso',
    songsWorked: 'Dobrado Batista de Melo, Hino do Estado de Mato Grosso',
    technicalContent: 'Afinação em Si Bemol Maior. Ajuste de dinâmica (piano vs forte) na segunda parte do Dobrado. Marcação de tempo da percussão mantendo andamento constante em 116 BPM.',
    methodologies: ['Aquecimento & Exercícios de Respiração', 'Tutti (Banda Completa)', 'Prática com Metrônomo / Andamento'],
    homePractice: 'Estudar individualmente os compassos 45 ao 62 com foco na articulação staccato.',
    observations: 'Excelente sonoridade dos metais. Trombones devem atentar para a posição da vara no compasso 50.',
    instructorName: 'Regente / Maestro'
  },
  {
    id: '2',
    date: new Date(Date.now() - 86400000).toLocaleDateString('sv-SE'),
    naipeGroup: 'NAIPE DE PERCUSSÃO / BATERIA',
    shift: 'VESPERTINO (CONTRATURNO)',
    time: '14:00 às 15:30',
    title: 'Rudimentos, Manulação e Viradas Marciais',
    songsWorked: 'Marchas Cívicas de Desfile, Rufo Militar',
    technicalContent: 'Treinamento de paradiddles e rufos de 5 e 9 toques. Sincronismo entre o Bumbo e as Caixas Tenor para entrada das balizas.',
    methodologies: ['Prática com Metrônomo / Andamento', 'Ensaio por Naipes Separados'],
    homePractice: 'Treinar manulação no pad de estudo por 20 minutos diários.',
    observations: 'Alunos novos demonstraram ótima evolução na postura das baquetas.',
    instructorName: 'Regente / Maestro'
  }
];

const EducarteClassLog: React.FC<EducarteClassLogProps> = ({ user, repertoire = [] }) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'form'>('timeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNaipe, setFilterNaipe] = useState('TODOS');

  // Logs do Educarte
  const [logs, setLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('educarte_class_logs_v1');
    return saved ? JSON.parse(saved) : INITIAL_EDUCARTE_LOGS;
  });

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toLocaleDateString('sv-SE'),
    naipeGroup: NAIPES_ENSAIO[0],
    shift: SHIFTS[0],
    time: '14:00 às 16:30',
    title: '',
    songsWorked: '',
    technicalContent: '',
    methodologies: ['Aquecimento & Exercícios de Respiração', 'Tutti (Banda Completa)'],
    homePractice: '',
    observations: '',
    instructorName: user.name || 'Regente / Maestro'
  });

  const saveLogsToStorage = (updatedLogs: any[]) => {
    setLogs(updatedLogs);
    localStorage.setItem('educarte_class_logs_v1', JSON.stringify(updatedLogs));
  };

  const openNewForm = () => {
    setEditingLogId(null);
    setFormData({
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('sv-SE'),
      naipeGroup: filterNaipe !== 'TODOS' ? filterNaipe : NAIPES_ENSAIO[0],
      shift: SHIFTS[0],
      time: '14:00 às 16:30',
      title: '',
      songsWorked: '',
      technicalContent: '',
      methodologies: ['Aquecimento & Exercícios de Respiração', 'Tutti (Banda Completa)'],
      homePractice: '',
      observations: '',
      instructorName: user.name || 'Regente / Maestro'
    });
    setViewMode('form');
  };

  const openEditForm = (log: any) => {
    setEditingLogId(log.id);
    setFormData({
      ...log,
      methodologies: log.methodologies || ['Aquecimento & Exercícios de Respiração']
    });
    setViewMode('form');
  };

  const handleMethodologyToggle = (met: string) => {
    setFormData(prev => {
      const exists = prev.methodologies.includes(met);
      const updated = exists ? prev.methodologies.filter(m => m !== met) : [...prev.methodologies, met];
      return { ...prev, methodologies: updated };
    });
  };

  // Sugestão com IA para o ensaio da banda
  const handleAIAssist = () => {
    if (!formData.title.trim()) {
      alert("Digite o tema ou repertório principal no campo 'Tema do Ensaio' para a IA sugerir os exercícios técnicos e metodologias.");
      return;
    }

    setAiGenerating(true);
    setTimeout(() => {
      const promptTitle = formData.title.trim();
      const suggestedTechnical = `Trabalho técnico focado em "${promptTitle}". Aquecimento coletivo com notas longas para estabilidade de embocadura e afinação. Exercícios de flexibilidade e articulação rítmica com metrônomo. Correção de entradas e passagens técnicas entre os naipes.`;
      const suggestedHome = `Estudar individualmente em casa 20 minutos por dia a passagem central de "${promptTitle}".`;

      setFormData(prev => ({
        ...prev,
        technicalContent: prev.technicalContent ? prev.technicalContent : suggestedTechnical,
        homePractice: prev.homePractice ? prev.homePractice : suggestedHome
      }));
      setAiGenerating(false);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Preencha o tema/conteúdo trabalhado no ensaio.");
      return;
    }

    setIsSaving(true);
    try {
      const logPayload = {
        ...formData,
        id: editingLogId || crypto.randomUUID(),
        instructorName: user.name || 'Regente / Maestro',
        updatedAt: new Date().toISOString()
      };

      const exists = logs.some(l => l.id === logPayload.id);
      const updated = exists ? logs.map(l => l.id === logPayload.id ? logPayload : l) : [logPayload, ...logs];
      saveLogsToStorage(updated);

      setViewMode('timeline');
    } catch (err) {
      console.error("Error saving Educarte class log:", err);
      alert("Erro ao salvar diário de ensaio.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir este registro de ensaio?")) {
      const updated = logs.filter(l => l.id !== id);
      saveLogsToStorage(updated);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs
      .filter(l => filterNaipe === 'TODOS' || l.naipeGroup === filterNaipe)
      .filter(l =>
        (l.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.technicalContent || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.songsWorked || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, filterNaipe, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* CABEÇALHO COM CONTROLES */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
            <Music className="text-amber-500" size={26} /> Diário de Ensaios & Conteúdos Musicais
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Registro diário de técnica musical, repertório trabalhado e tarefas • Projeto Educarte
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
              Agenda de Ensaios
            </button>
            <button
              onClick={openNewForm}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === 'form'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Plus size={14} /> Registrar Ensaio
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
           FORMULÁRIO DE REGISTRO DE ENSAIO DO EDUCARTE
           ========================================================================= */
        <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-200/80 shadow-sm space-y-8 animate-in zoom-in-95">
          <div className="flex justify-between items-center pb-6 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Drum className="text-amber-500" size={22} />
                {editingLogId ? 'Editar Diário de Ensaio' : 'Novo Registro de Ensaio / Aula de Música'}
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase">
                Banda Musical André Maggi • Projeto Educarte SEDUC-MT
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
            
            {/* LINHA 1: DATA, GRUPO/NAIPE, TURNO, HORÁRIO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data do Ensaio</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Naipe / Grupo Trabalhado</label>
                <select
                  value={formData.naipeGroup}
                  onChange={e => setFormData({ ...formData, naipeGroup: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white cursor-pointer text-amber-950"
                >
                  {NAIPES_ENSAIO.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turno</label>
                <select
                  value={formData.shift}
                  onChange={e => setFormData({ ...formData, shift: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white cursor-pointer"
                >
                  {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horário do Ensaio</label>
                <input
                  type="text"
                  placeholder="Ex: 14:00 às 16:30"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white"
                />
              </div>
            </div>

            {/* LINHA 2: TEMA DO ENSAIO COM BOTÃO IA */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Tema Central / Foco Técnico do Ensaio
                </label>
                <button
                  type="button"
                  onClick={handleAIAssist}
                  disabled={aiGenerating}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {aiGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {aiGenerating ? 'Gerando com IA...' : 'Sugerir Detalhes com IA'}
                </button>
              </div>

              <input
                type="text"
                required
                placeholder="Ex: Dobrado Batista de Melo, Afinação dos Metais e Sincronismo da Percussão..."
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10"
              />
            </div>

            {/* LINHA 3: REPERTÓRIO TRABALHADO */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Peças / Músicas do Repertório Ensaiadas no Dia
              </label>
              <input
                type="text"
                placeholder="Ex: Hino Nacional, Dobrado Dois Corações, Marchas de 7 de Setembro..."
                value={formData.songsWorked}
                onChange={e => setFormData({ ...formData, songsWorked: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white"
              />
            </div>

            {/* LINHA 4: CONTEÚDO TÉCNICO E METODOLOGIAS */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Detalhamento dos Conteúdos Técnicos & Prática Musical
              </label>
              <textarea
                rows={4}
                placeholder="Descreva os exercícios de respiração, escalas, leitura de partituras e ajustes de dinâmica..."
                value={formData.technicalContent}
                onChange={e => setFormData({ ...formData, technicalContent: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 leading-relaxed"
              />
            </div>

            {/* LINHA 5: METODOLOGIAS UTILIZADAS NO ENSAIO */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Metodologias e Recursos Praticados
              </label>
              <div className="flex flex-wrap gap-2">
                {METHODOLOGIES.map(met => {
                  const isChecked = formData.methodologies.includes(met);
                  return (
                    <button
                      key={met}
                      type="button"
                      onClick={() => handleMethodologyToggle(met)}
                      className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-amber-100 text-amber-950 border border-amber-300'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {isChecked && <Check size={12} />}
                      {met}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LINHA 6: TAREFA DE CASA / ESTUDO INDIVIDUAL E OBSERVAÇÕES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Estudo Individual Recomendado para os Músicos
                </label>
                <input
                  type="text"
                  placeholder="Ex: Treinar passagem de semicolcheias dos compassos 20 a 35..."
                  value={formData.homePractice}
                  onChange={e => setFormData({ ...formData, homePractice: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Observações Técnicas / Afinação / Disciplina
                </label>
                <input
                  type="text"
                  placeholder="Ex: Naipes de madeiras precisam reforçar o apoio de diafragma..."
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
                className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? 'Salvando...' : editingLogId ? 'Atualizar Ensaio' : 'Salvar Diário de Ensaio'}
              </button>
            </div>

          </form>
        </div>
      ) : (
        /* =========================================================================
           AGENDA / LINHA DO TEMPO DE ENSAIOS
           ========================================================================= */
        <div className="space-y-6">
          
          {/* BARRA DE FILTROS */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={filterNaipe}
                  onChange={e => setFilterNaipe(e.target.value)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer text-amber-900"
                >
                  <option value="TODOS">TODOS OS GRUPOS / NAIPES</option>
                  {NAIPES_ENSAIO.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por tema, repertório..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white"
              />
            </div>
          </div>

          {/* LISTA DE REGISTROS DE ENSAIO */}
          <div className="space-y-4">
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <div
                  key={log.id}
                  className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-950 rounded-xl font-black text-xs uppercase border border-amber-200/60">
                        <Calendar size={14} className="text-amber-600" />
                        {new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                      </div>

                      <span className="px-3 py-1 bg-slate-900 text-white rounded-xl font-black text-xs uppercase">
                        {log.naipeGroup}
                      </span>

                      <span className="text-xs font-bold text-slate-500">
                        {log.time || '14:00 às 16:30'} • {log.shift}
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
                    
                    {log.songsWorked && (
                      <p className="text-xs font-black text-amber-700 uppercase flex items-center gap-1.5">
                        <Music size={14} /> Músicas: {log.songsWorked}
                      </p>
                    )}

                    <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                      {log.technicalContent}
                    </p>
                  </div>

                  {/* METODOLOGIAS & ESTUDO INDIVIDUAL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                    {log.homePractice && (
                      <div className="p-3 bg-slate-50 rounded-2xl space-y-0.5">
                        <p className="text-[10px] font-black text-amber-800 uppercase">Estudo Individual / Casa:</p>
                        <p className="font-bold text-slate-800">{log.homePractice}</p>
                      </div>
                    )}

                    {log.methodologies && log.methodologies.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-2xl space-y-0.5">
                        <p className="text-[10px] font-black text-emerald-800 uppercase">Metodologias Praticadas:</p>
                        <p className="font-bold text-slate-700 truncate">{log.methodologies.join(', ')}</p>
                      </div>
                    )}
                  </div>

                  {log.observations && (
                    <p className="text-[11px] text-slate-500 font-medium italic pt-1">
                      Obs do Regente: {log.observations}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white p-16 rounded-[3rem] border border-slate-200 text-center space-y-3">
                <Music size={40} className="mx-auto text-slate-300" />
                <h4 className="text-base font-black uppercase text-slate-700">Nenhum registro de ensaio encontrado</h4>
                <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                  Clique no botão "Registrar Ensaio" para cadastrar os conteúdos e peças musicais trabalhadas com a banda.
                </p>
                <button
                  onClick={openNewForm}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-wider transition-all"
                >
                  + Registrar Primeiro Ensaio
                </button>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default EducarteClassLog;
