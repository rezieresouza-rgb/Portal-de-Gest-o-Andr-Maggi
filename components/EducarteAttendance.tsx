import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Music,
  Users,
  Search,
  Save,
  Loader2,
  Filter,
  AlertTriangle,
  History,
  Edit2,
  Trash2,
  Printer,
  Sparkles,
  Award,
  Drum,
  Volume2
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { User as UserType } from '../types';

interface EducarteAttendanceProps {
  user: UserType;
  members: any[];
  onRefresh?: () => void;
}

const ENSAIO_TYPES = [
  'ENSAIO GERAL',
  'NAIPE DE METAIS',
  'NAIPE DE MADEIRAS',
  'NAIPE DE PERCUSSÃO',
  'LINHA DE FRENTE / BALIZAS',
  'ENSAIO EXTRAORDINÁRIO'
];

const SHIFTS = ['VESPERTINO (CONTRATURNO)', 'MATUTINO (CONTRATURNO)', 'SÁBADO / ESPECIAL'];

const EducarteAttendance: React.FC<EducarteAttendanceProps> = ({ user, members, onRefresh }) => {
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form');
  
  // Parâmetros da Chamada
  const [date, setDate] = useState(new Date().toLocaleDateString('sv-SE'));
  const [ensaioType, setEnsaioType] = useState(ENSAIO_TYPES[0]);
  const [shift, setShift] = useState(SHIFTS[0]);
  const [topic, setTopic] = useState('');

  // Presenças: Record<memberId, boolean>
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNaipe, setFilterNaipe] = useState('TODOS');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Histórico
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Inicializar presenças para todos os membros ativos
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    members.forEach(m => {
      if (attendance[m.id] === undefined) {
        initial[m.id] = true; // Padrão: presente
      }
    });
    setAttendance(prev => ({ ...initial, ...prev }));
  }, [members]);

  // Carregar histórico do Supabase / LocalStorage
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('educarte_attendance_records')
        .select(`
          *,
          presences:educarte_attendance_students(*)
        `)
        .order('date', { ascending: false });

      if (error) {
        // Fallback para LocalStorage se tabela ainda não existir
        const saved = localStorage.getItem('educarte_attendance_records_v1');
        if (saved) setHistoryRecords(JSON.parse(saved));
      } else {
        setHistoryRecords(data || []);
      }
    } catch (e) {
      console.warn("Using local storage fallback for Educarte attendance", e);
      const saved = localStorage.getItem('educarte_attendance_records_v1');
      if (saved) setHistoryRecords(JSON.parse(saved));
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'history') {
      fetchHistory();
    }
  }, [viewMode]);

  // Filtro de membros na lista de chamada
  const filteredMembers = useMemo(() => {
    return members
      .filter(m => m.status === 'ATIVO')
      .filter(m => filterNaipe === 'TODOS' || m.naipe === filterNaipe)
      .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || (m.instrument || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [members, filterNaipe, searchTerm]);

  // Ações em lote
  const markAll = (status: boolean) => {
    const updated: Record<string, boolean> = {};
    members.forEach(m => {
      updated[m.id] = status;
    });
    setAttendance(updated);
  };

  const togglePresence = (id: string) => {
    setAttendance(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Salvar Diário de Presença
  const handleSaveAttendance = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const recordPayload = {
        id: editingRecordId || crypto.randomUUID(),
        date,
        ensaio_type: ensaioType,
        shift,
        topic,
        instructor_name: user.name || 'Regente / Maestro',
        created_at: new Date().toISOString(),
        presences: members.map(m => ({
          member_id: m.id,
          member_name: m.name,
          instrument: m.instrument,
          naipe: m.naipe,
          is_present: attendance[m.id] !== false,
          justification: justifications[m.id] || ''
        }))
      };

      // Salva no LocalStorage para redundância instantânea
      const saved = localStorage.getItem('educarte_attendance_records_v1');
      let list = saved ? JSON.parse(saved) : [];
      if (editingRecordId) {
        list = list.map((r: any) => r.id === editingRecordId ? recordPayload : r);
      } else {
        list = [recordPayload, ...list];
      }
      localStorage.setItem('educarte_attendance_records_v1', JSON.stringify(list));

      // Tenta gravar no Supabase
      try {
        await supabase.from('educarte_attendance_records').upsert({
          id: recordPayload.id,
          date: recordPayload.date,
          ensaio_type: recordPayload.ensaio_type,
          shift: recordPayload.shift,
          topic: recordPayload.topic,
          instructor_name: recordPayload.instructor_name,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Supabase upsert educarte_attendance_records ignored", err);
      }

      setSaveSuccess(true);
      setEditingRecordId(null);
      if (onRefresh) onRefresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error("Error saving Educarte attendance:", e);
      alert("Erro ao salvar diário de presença.");
    } finally {
      setIsSaving(false);
    }
  };

  // Carregar para edição
  const handleEditRecord = (record: any) => {
    setEditingRecordId(record.id);
    setDate(record.date);
    setEnsaioType(record.ensaio_type || record.ensaioType || ENSAIO_TYPES[0]);
    setShift(record.shift || SHIFTS[0]);
    setTopic(record.topic || '');

    const loadedAtt: Record<string, boolean> = {};
    const loadedJust: Record<string, string> = {};
    (record.presences || []).forEach((p: any) => {
      const mid = p.member_id || p.memberId;
      loadedAtt[mid] = p.is_present ?? p.isPresent ?? true;
      if (p.justification) loadedJust[mid] = p.justification;
    });
    setAttendance(loadedAtt);
    setJustifications(loadedJust);
    setViewMode('form');
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const totalCount = members.filter(m => m.status === 'ATIVO').length;
  const presencePercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* CABEÇALHO & TOGGLE DE MODO */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
            <Music className="text-amber-500" size={26} /> Diário de Presença dos Ensaios
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Controle de assiduidade da Banda André Maggi • Projeto Educarte
          </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setViewMode('form')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
              viewMode === 'form'
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Fazer Chamada
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              viewMode === 'history'
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History size={14} /> Histórico de Ensaios
          </button>
        </div>
      </div>

      {viewMode === 'form' ? (
        <div className="space-y-6">

          {/* PARÂMETROS DO ENSAIO */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data do Ensaio</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Ensaio</label>
                <select
                  value={ensaioType}
                  onChange={e => setEnsaioType(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all appearance-none cursor-pointer text-amber-900"
                >
                  {ENSAIO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turno / Horário</label>
                <select
                  value={shift}
                  onChange={e => setShift(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all appearance-none cursor-pointer"
                >
                  {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Repertório / Conteúdo Trabalhado</label>
                <input
                  type="text"
                  placeholder="Ex: Dobrado 7 de Setembro, Hino Nacional..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                />
              </div>

            </div>

            {/* BARRA DE AÇÕES EM LOTE E ESTATÍSTICAS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 mr-2">Marcar em lote:</span>
                <button
                  type="button"
                  onClick={() => markAll(true)}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black uppercase transition-all"
                >
                  ✓ Todos Presentes
                </button>
                <button
                  type="button"
                  onClick={() => markAll(false)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-black uppercase transition-all"
                >
                  ✗ Todos Ausentes
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs font-black text-slate-900">
                    {presentCount} de {totalCount} presentes ({presencePercent}%)
                  </span>
                </div>

                <button
                  onClick={handleSaveAttendance}
                  disabled={isSaving}
                  className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Salvando...' : editingRecordId ? 'Atualizar Ensaio' : 'Salvar Diário'}
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-4 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider text-center animate-in zoom-in-95">
                ✅ Diário de Presença do Ensaio salvo com sucesso!
              </div>
            )}
          </div>

          {/* FILTROS DA LISTA DE MÚSICOS */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {['TODOS', 'METAIS', 'MADEIRAS', 'PERCUSSÃO', 'LINHA DE FRENTE'].map(n => (
                <button
                  key={n}
                  onClick={() => setFilterNaipe(n)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                    filterNaipe === n
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/80'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por músico ou instrumento..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* LISTA DE CHAMADA DOS MÚSICOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMembers.length > 0 ? (
              filteredMembers.map(m => {
                const isPresent = attendance[m.id] !== false;

                return (
                  <div
                    key={m.id}
                    onClick={() => togglePresence(m.id)}
                    className={`p-5 rounded-[2rem] border transition-all cursor-pointer select-none flex items-center justify-between gap-4 ${
                      isPresent
                        ? 'bg-white border-emerald-300 shadow-sm hover:border-emerald-500'
                        : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm uppercase ${
                        isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-200 text-rose-900'
                      }`}>
                        {m.name.substring(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 text-sm uppercase truncate max-w-[200px]">{m.name}</h4>
                          {m.isPaed && <span className="text-[10px]">♿</span>}
                        </div>
                        <p className="text-xs text-slate-500 font-bold uppercase">
                          {m.instrument || 'Geral'} • <span className="text-amber-700 font-black">{m.naipe}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">{m.classroomName || 'Turma Regular'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                        isPresent ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      }`}>
                        {isPresent ? 'Presente' : 'Falta'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 py-16 text-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-white rounded-[2.5rem] border border-slate-200">
                Nenhum integrante ativo encontrado neste naipe/busca
              </div>
            )}
          </div>

        </div>
      ) : (
        /* HISTÓRICO DE ENSAIOS */
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Histórico de Ensaios Realizados</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Auditoria e registro de chamadas do Educarte</p>
            </div>
            <button
              onClick={() => setViewMode('form')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black uppercase"
            >
              + Novo Ensaio
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-16 text-center text-slate-400 text-xs font-black uppercase flex items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin text-amber-500" /> Carregando histórico de ensaios...
            </div>
          ) : historyRecords.length > 0 ? (
            <div className="space-y-4">
              {historyRecords.map((rec) => {
                const total = rec.presences?.length || 0;
                const pres = rec.presences?.filter((p: any) => p.is_present ?? p.isPresent).length || 0;
                const pct = total > 0 ? Math.round((pres / total) * 100) : 0;

                return (
                  <div key={rec.id} className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-100/60 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-slate-900 text-sm">
                          {new Date(rec.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-lg text-[10px] font-black uppercase">
                          {rec.ensaio_type || rec.ensaioType || 'ENSAIO GERAL'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">({rec.shift})</span>
                      </div>
                      <p className="text-xs text-slate-600 font-bold">
                        Conteúdo: {rec.topic || 'Repertório Cívico e Marchas'} • Regente: {rec.instructor_name || 'Maestro'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <span className={`text-xs font-black px-3 py-1 rounded-full ${
                          pct >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {pres} / {total} Músicos ({pct}%)
                        </span>
                      </div>

                      <button
                        onClick={() => handleEditRecord(rec)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <Edit2 size={12} /> Editar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
              Nenhum diário de ensaio gravado ainda.
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default EducarteAttendance;
