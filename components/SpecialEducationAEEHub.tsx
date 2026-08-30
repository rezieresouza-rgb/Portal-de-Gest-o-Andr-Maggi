import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Users,
  Search,
  Plus,
  FileText,
  Printer,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  BookOpen,
  Filter,
  Save,
  Loader2,
  X,
  ShieldCheck,
  Building2,
  Award,
  ChevronRight,
  TrendingUp,
  Brain,
  Layers
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { SCHOOL_CLASSES } from '../constants/initialData';

interface SpecialEducationAEEHubProps {
  sourceModule: 'COORDENACAO' | 'PSICOSSOCIAL' | 'SECRETARIA';
  user: any;
}

interface PaedeStudentDetail {
  id: string;
  name: string;
  registration: string;
  className: string;
  birthDate: string;
  pathology: string;
  cid?: string;
  hasCaregiver: boolean;
  attendsAee: boolean;
  guidelines?: string;
  guardianName?: string;
  guardianPhone?: string;
  peiStatus?: 'ELABORADO' | 'EM_ANDAMENTO' | 'PENDENTE';
}

const PATHOLOGY_OPTIONS = [
  "AUTISMO (TEA - Transtorno do Espectro Autista)",
  "TDAH (Déficit de Atenção e Hiperatividade)",
  "DEFICIÊNCIA INTELECTUAL (DI)",
  "DEFICIÊNCIA AUDITIVA / SURDEZ (LIBRAS)",
  "DEFICIÊNCIA VISUAL (BAIXA VISÃO / CEGUEIRA)",
  "PARALISIA CEREBRAL (PC)",
  "SÍNDROME DE DOWN (T21)",
  "ALTAS HABILIDADES / SUPERDOTAÇÃO",
  "MÚLTIPLAS DEFICIÊNCIAS",
  "OUTRO DIAGNÓSTICO / EM INVESTIGAÇÃO"
];

const SpecialEducationAEEHub: React.FC<SpecialEducationAEEHubProps> = ({ sourceModule, user }) => {
  const [students, setStudents] = useState<PaedeStudentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPathology, setFilterPathology] = useState('TODOS');
  const [filterClass, setFilterClass] = useState('TODOS');
  const [selectedStudent, setSelectedStudent] = useState<PaedeStudentDetail | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State for edit / update
  const [form, setForm] = useState<{
    pathology: string;
    cid: string;
    hasCaregiver: boolean;
    attendsAee: boolean;
    guidelines: string;
    peiStatus: 'ELABORADO' | 'EM_ANDAMENTO' | 'PENDENTE';
  }>({
    pathology: '',
    cid: '',
    hasCaregiver: false,
    attendsAee: false,
    guidelines: '',
    peiStatus: 'EM_ANDAMENTO'
  });

  const fetchPaedeStudents = async () => {
    setLoading(true);
    try {
      // 1. Fetch all students with paed = true
      const { data: studentsData, error: stuErr } = await supabase
        .from('students')
        .select(`
          id,
          name,
          registration_number,
          birth_date,
          guardian_name,
          contact_phone,
          paed,
          enrollments (
            status,
            classrooms (
              name
            )
          )
        `)
        .eq('paed', true);

      if (stuErr) throw stuErr;

      // 2. Fetch all movements of type PAEDE_LAUDO
      const { data: movementsData } = await supabase
        .from('student_movements')
        .select('*')
        .eq('movement_type', 'PAEDE_LAUDO');

      const movMap: Record<string, any> = {};
      movementsData?.forEach(m => {
        movMap[m.student_id] = m;
      });

      const list: PaedeStudentDetail[] = (studentsData || []).map((s: any) => {
        const activeEnrollment = s.enrollments?.find((e: any) => e.status === 'ATIVO') || s.enrollments?.[0];
        const className = activeEnrollment?.classrooms?.name || 'SEM TURMA';
        const mov = movMap[s.id];

        return {
          id: s.id,
          name: s.name,
          registration: s.registration_number,
          className,
          birthDate: s.birth_date,
          guardianName: s.guardian_name,
          guardianPhone: s.contact_phone,
          pathology: mov?.description || 'PAEDE / EDUCAÇÃO ESPECIAL',
          cid: mov?.cid_code || '',
          hasCaregiver: mov?.doctor_name === 'COM CUIDADOR',
          attendsAee: mov?.responsible_name === 'FREQUENTA AEE',
          guidelines: mov?.destination_school || '',
          peiStatus: mov?.transfer_subtype === 'INTERNA' ? 'ELABORADO' : 'EM_ANDAMENTO'
        };
      }).sort((a, b) => a.name.localeCompare(b.name));

      setStudents(list);
    } catch (e) {
      console.error("Erro ao buscar alunos PAEDE:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaedeStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.registration.includes(searchTerm) ||
                          s.className.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPathology = filterPathology === 'TODOS' || s.pathology.toUpperCase().includes(filterPathology.toUpperCase());
      const matchClass = filterClass === 'TODOS' || s.className === filterClass;
      return matchSearch && matchPathology && matchClass;
    });
  }, [students, searchTerm, filterPathology, filterClass]);

  const stats = useMemo(() => {
    const total = students.length;
    const withCaregiver = students.filter(s => s.hasCaregiver).length;
    const inAee = students.filter(s => s.attendsAee).length;
    const teaCount = students.filter(s => s.pathology.toUpperCase().includes('AUTISMO') || s.pathology.toUpperCase().includes('TEA')).length;
    const tdahCount = students.filter(s => s.pathology.toUpperCase().includes('TDAH')).length;

    return { total, withCaregiver, inAee, teaCount, tdahCount };
  }, [students]);

  const openEditModal = (student: PaedeStudentDetail) => {
    setSelectedStudent(student);
    setForm({
      pathology: student.pathology,
      cid: student.cid || '',
      hasCaregiver: student.hasCaregiver,
      attendsAee: student.attendsAee,
      guidelines: student.guidelines || '',
      peiStatus: student.peiStatus || 'EM_ANDAMENTO'
    });
    setIsEditingModalOpen(true);
  };

  const handleSavePaede = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSaving(true);

    try {
      const { data: existingPaede } = await supabase
        .from('student_movements')
        .select('id')
        .eq('student_id', selectedStudent.id)
        .eq('movement_type', 'PAEDE_LAUDO')
        .maybeSingle();

      const paedePayload = {
        student_id: selectedStudent.id,
        movement_type: 'PAEDE_LAUDO',
        description: (form.pathology || 'PAEDE / EDUCAÇÃO ESPECIAL').toUpperCase(),
        cid_code: (form.cid || '').toUpperCase(),
        doctor_name: form.hasCaregiver ? 'COM CUIDADOR' : 'SEM CUIDADOR',
        responsible_name: form.attendsAee ? 'FREQUENTA AEE' : 'NÃO FREQUENTA AEE',
        destination_school: form.guidelines || '',
        transfer_subtype: form.peiStatus === 'ELABORADO' ? 'INTERNA' : 'EXTERNA',
        movement_date: new Date().toISOString().split('T')[0]
      };

      if (existingPaede) {
        await supabase.from('student_movements').update(paedePayload).eq('id', existingPaede.id);
      } else {
        await supabase.from('student_movements').insert([paedePayload]);
      }

      alert("Ficha de Educação Especial (PAEDE/AEE) atualizada e compartilhada com toda a escola!");
      setIsEditingModalOpen(false);
      fetchPaedeStudents();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar dados da Educação Especial.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 no-print">

      {/* BANNER PRINCIPAL DA EDUCAÇÃO ESPECIAL & SALA DE RECURSOS */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-indigo-950 p-8 md:p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          <Brain size={220} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <span>♿</span> Sala de Recursos Multifuncionais (AEE) & PAEDE
              </span>
              <span className="text-white/40 text-xs">•</span>
              <span className="text-amber-200 text-xs font-bold uppercase">
                {sourceModule === 'COORDENACAO' ? 'Coordenação Pedagógica' : sourceModule === 'PSICOSSOCIAL' ? 'Equipe Psicossocial' : 'Secretaria Escolar'}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
              Educação Especial & Inclusão
            </h1>

            <p className="text-amber-100/70 text-xs md:text-sm max-w-3xl font-medium leading-relaxed">
              Gestão integrada dos estudantes com laudo, Plano de Ensino Individualizado (PEI), acompanhamento do AEE no contraturno e suporte aos professores da sala regular.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePrintReport}
              className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-xs tracking-widest backdrop-blur-md transition-all flex items-center gap-2 border border-white/10"
            >
              <Printer size={16} /> Imprimir Relatório
            </button>
          </div>
        </div>

        {/* STATS RÁPIDOS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-8 pt-8 border-t border-white/10">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">Total Alunos PAEDE</p>
            <p className="text-3xl font-black text-white mt-1">{stats.total}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">TEA (Autismo)</p>
            <p className="text-3xl font-black text-white mt-1">{stats.teaCount}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Frequenta AEE</p>
            <p className="text-3xl font-black text-white mt-1">{stats.inAee}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Possui Cuidador</p>
            <p className="text-3xl font-black text-white mt-1">{stats.withCaregiver}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest">TDAH / Outros</p>
            <p className="text-3xl font-black text-white mt-1">{stats.tdahCount}</p>
          </div>
        </div>
      </div>

      {/* TABELA E FILTROS */}
      <div className="bg-white rounded-[3.5rem] border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* BARRA DE FILTROS */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Estudantes com Laudo & AEE</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                Exibindo {filteredStudents.length} aluno(s) incluídos
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por nome ou turma..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-4 focus:ring-amber-500/10 transition-all"
              />
            </div>

            <select
              value={filterPathology}
              onChange={e => setFilterPathology(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-amber-500/10 transition-all appearance-none cursor-pointer text-amber-800"
            >
              <option value="TODOS">TODAS PATOLOGIAS</option>
              <option value="AUTISMO">TEA (AUTISMO)</option>
              <option value="TDAH">TDAH</option>
              <option value="INTELECTUAL">DEF. INTELECTUAL</option>
              <option value="AUDITIVA">DEF. AUDITIVA</option>
              <option value="VISUAL">DEF. VISUAL</option>
              <option value="DOWN">SÍNDROME DE DOWN</option>
              <option value="PARALISIA">PARALISIA CEREBRAL</option>
            </select>

            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-amber-500/10 transition-all appearance-none cursor-pointer"
            >
              <option value="TODOS">TODAS TURMAS</option>
              {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* LISTA DE ALUNOS PAEDE */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-amber-600" size={36} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando fichas da Educação Especial...</p>
            </div>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((s, idx) => (
              <div 
                key={s.id}
                className="p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:bg-slate-50/70 transition-all group"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-lg shrink-0 border border-amber-200">
                    ♿
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h4 className="font-black text-slate-900 uppercase text-base tracking-tight">{s.name}</h4>
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase">
                        {s.className}
                      </span>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-black uppercase">
                        {s.pathology}
                      </span>
                      {s.cid && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-mono font-black uppercase">
                          CID: {s.cid}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 pt-1">
                      <span>Matrícula: <strong>{s.registration}</strong></span>
                      <span>•</span>
                      <span>Cuidador: <strong className={s.hasCaregiver ? 'text-emerald-700' : 'text-slate-500'}>{s.hasCaregiver ? 'Sim (Em Sala)' : 'Não'}</strong></span>
                      <span>•</span>
                      <span>Sala AEE: <strong className={s.attendsAee ? 'text-blue-700' : 'text-slate-500'}>{s.attendsAee ? 'Frequenta Contraturno' : 'Não'}</strong></span>
                      {s.guardianPhone && (
                        <>
                          <span>•</span>
                          <span>Contato: <strong>{s.guardianPhone}</strong> ({s.guardianName || 'Responsável'})</span>
                        </>
                      )}
                    </div>

                    {s.guidelines && (
                      <p className="text-xs text-slate-600 font-medium bg-amber-50/50 p-3 rounded-xl border border-amber-100 mt-2">
                        💡 <strong>Orientações Pedagógicas para a Sala:</strong> {s.guidelines}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end lg:self-center">
                  <button
                    onClick={() => openEditModal(s)}
                    className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                  >
                    <FileText size={14} /> Atualizar Ficha
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                <Brain size={32} />
              </div>
              <h3 className="text-base font-black text-slate-900 uppercase">Nenhum estudante PAEDE encontrado</h3>
              <p className="text-xs text-slate-400 font-medium max-w-sm">
                Os alunos marcados como PAED na Secretaria Escolar aparecem automaticamente nesta central.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE ATUALIZAÇÃO DA FICHA DA EDUCAÇÃO ESPECIAL */}
      {isEditingModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* CABEÇALHO */}
            <div className="p-8 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-950 text-amber-400 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                  ♿
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight leading-none">
                    Atualizar Ficha de Educação Especial
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-950/70 mt-1">
                    {selectedStudent.name} • {selectedStudent.className}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditingModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-950/10 hover:bg-slate-950/20 flex items-center justify-center text-slate-950 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORMULÁRIO */}
            <form onSubmit={handleSavePaede} className="p-8 overflow-y-auto custom-scrollbar space-y-6 flex-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Patologia / Diagnóstico *</label>
                  <select
                    value={form.pathology}
                    onChange={e => setForm({ ...form, pathology: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all text-amber-950"
                  >
                    {PATHOLOGY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código CID (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: F84.0, F90.0, H90..."
                    value={form.cid}
                    onChange={e => setForm({ ...form, cid: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Possui Cuidador em Sala?</label>
                  <select
                    value={form.hasCaregiver ? 'Sim' : 'Não'}
                    onChange={e => setForm({ ...form, hasCaregiver: e.target.value === 'Sim' })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white"
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim, Possui Cuidador</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequenta Sala Recursos (AEE)?</label>
                  <select
                    value={form.attendsAee ? 'Sim' : 'Não'}
                    onChange={e => setForm({ ...form, attendsAee: e.target.value === 'Sim' })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white"
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim, Frequenta AEE</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Orientações Pedagógicas & Acessibilidade para os Professores
                </label>
                <textarea
                  placeholder="Instruções para os docentes (ex: Prova em fonte 24, comandos claros, pausas estruturadas, suporte do cuidador)..."
                  value={form.guidelines}
                  onChange={e => setForm({ ...form, guidelines: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all h-28 resize-none"
                />
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs font-medium leading-relaxed">
                ℹ️ Esta informação é <strong>compartilhada automaticamente</strong> com a Coordenação Pedagógica, a Equipe Psicossocial e todos os Professores no Diário de Presença.
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Ficha
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default SpecialEducationAEEHub;
