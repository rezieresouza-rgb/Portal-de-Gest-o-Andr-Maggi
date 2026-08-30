import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Music,
  Edit2,
  Trash2,
  Phone,
  Calendar,
  CheckCircle2,
  X,
  Printer,
  Shield,
  Award,
  Drum,
  Volume2,
  School,
  Sparkles,
  ArrowRight,
  Loader2,
  Check
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { SCHOOL_CLASSES, INITIAL_STUDENTS } from '../constants/initialData';

interface EducarteMembersProps {
  members: any[];
  onSaveMember: (member: any) => void;
  onDeleteMember: (id: string) => void;
}

const NAIPES = ['METAIS', 'MADEIRAS', 'PERCUSSÃO', 'LINHA DE FRENTE'];

const INSTRUMENTS_BY_NAIPE: Record<string, string[]> = {
  'METAIS': ['Trompete (Bb)', 'Trombone de Vara', 'Trombone de Pisto', 'Trompa (F)', 'Eufônio / Bombardino', 'Tuba / Sousafone'],
  'MADEIRAS': ['Saxofone Alto (Eb)', 'Saxofone Tenor (Bb)', 'Clarinete (Bb)', 'Flauta Transversal (C)'],
  'PERCUSSÃO': ['Bumbo Marcial', 'Caixa Tenor', 'Pratos a Dois', 'Quadriton / Quintiton', 'Lira / Glockenspiel'],
  'LINHA DE FRENTE': ['Baliza Principal', 'Baliza Auxiliar', 'Porta-Bandeira / Estandarte', 'Corpo Coreográfico']
};

const LEVELS = ['INICIANTE', 'INTERMEDIÁRIO', 'AVANÇADO / SOLISTA', 'CHEFE DE NAIPE'];

const EducarteMembers: React.FC<EducarteMembersProps> = ({
  members,
  onSaveMember,
  onDeleteMember
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNaipe, setSelectedNaipe] = useState('TODOS');
  const [selectedLevel, setSelectedLevel] = useState('TODOS');
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'secretariat' | 'form'>('secretariat');
  const [editingMember, setEditingMember] = useState<any | null>(null);

  // Alunos da Secretaria
  const [secretariatStudents, setSecretariatStudents] = useState<any[]>([]);
  const [loadingSecretariat, setLoadingSecretariat] = useState(false);
  const [filterSecretariatClass, setFilterSecretariatClass] = useState('TODAS');
  const [searchSecretariat, setSearchSecretariat] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    studentId: '',
    name: '',
    classroomName: SCHOOL_CLASSES[0] || '6º ANO A',
    shift: 'VESPERTINO (CONTRATURNO)',
    naipe: 'METAIS',
    instrument: 'Trompete (Bb)',
    level: 'INICIANTE',
    guardianName: '',
    guardianPhone: '',
    isPaed: false,
    enrollmentDate: new Date().toLocaleDateString('sv-SE'),
    status: 'ATIVO',
    notes: ''
  });

  // Carregar Alunos da Secretaria (Supabase + Fallback INITIAL_STUDENTS)
  const fetchSecretariatStudents = async () => {
    setLoadingSecretariat(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          name,
          registration_number,
          paed,
          status,
          guardian_name,
          phone,
          enrollments (
            status,
            classrooms (
              name,
              shift
            )
          )
        `)
        .eq('status', 'ATIVO')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        // Fallback para os alunos do initialData
        const initialMapped = INITIAL_STUDENTS.map(s => ({
          id: s.CodigoAluno || s.id,
          name: s.Nome,
          registration: s.Matricula || s.CodigoAluno,
          classroomName: s.Turma,
          shift: s.Turno,
          guardianName: s.Mae || s.Responsavel || 'Responsável',
          guardianPhone: s.Telefone || '(66) 99999-0000',
          isPaed: s.PAED === 'Sim'
        }));
        setSecretariatStudents(initialMapped);
      } else {
        const mapped = data.map((s: any) => {
          const activeEnrollment = s.enrollments?.find((e: any) => e.status === 'ATIVO') || s.enrollments?.[0];
          return {
            id: s.id,
            name: s.name,
            registration: s.registration_number,
            classroomName: activeEnrollment?.classrooms?.name || 'Turma Regular',
            shift: activeEnrollment?.classrooms?.shift || 'MATUTINO',
            guardianName: s.guardian_name || '',
            guardianPhone: s.phone || '',
            isPaed: s.paed === true
          };
        });
        setSecretariatStudents(mapped);
      }
    } catch (e) {
      console.warn("Using initialData fallback for Secretariat students", e);
      const initialMapped = INITIAL_STUDENTS.map(s => ({
        id: s.CodigoAluno || s.id,
        name: s.Nome,
        registration: s.Matricula || s.CodigoAluno,
        classroomName: s.Turma,
        shift: s.Turno,
        guardianName: s.Mae || s.Responsavel || 'Responsável',
        guardianPhone: s.Telefone || '(66) 99999-0000',
        isPaed: s.PAED === 'Sim'
      }));
      setSecretariatStudents(initialMapped);
    } finally {
      setLoadingSecretariat(false);
    }
  };

  useEffect(() => {
    fetchSecretariatStudents();
  }, []);

  const openNewModal = () => {
    setEditingMember(null);
    setModalMode('secretariat');
    setFormData({
      id: crypto.randomUUID(),
      studentId: '',
      name: '',
      classroomName: SCHOOL_CLASSES[0] || '6º ANO A',
      shift: 'VESPERTINO (CONTRATURNO)',
      naipe: 'METAIS',
      instrument: 'Trompete (Bb)',
      level: 'INICIANTE',
      guardianName: '',
      guardianPhone: '',
      isPaed: false,
      enrollmentDate: new Date().toLocaleDateString('sv-SE'),
      status: 'ATIVO',
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Ao selecionar um aluno da Secretaria
  const handleSelectFromSecretariat = (student: any) => {
    // Sugere o turno de contraturno
    const contraturno = student.shift === 'MATUTINO' ? 'VESPERTINO (CONTRATURNO)' : 'MATUTINO (CONTRATURNO)';

    setFormData({
      ...formData,
      studentId: student.id,
      name: student.name,
      classroomName: student.classroomName || SCHOOL_CLASSES[0],
      shift: contraturno,
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      isPaed: student.isPaed || false
    });
    setModalMode('form');
  };

  const openEditModal = (m: any) => {
    setEditingMember(m);
    setModalMode('form');
    setFormData({
      id: m.id,
      studentId: m.studentId || '',
      name: m.name,
      classroomName: m.classroomName || SCHOOL_CLASSES[0],
      shift: m.shift || 'VESPERTINO (CONTRATURNO)',
      naipe: m.naipe || 'METAIS',
      instrument: m.instrument || 'Trompete (Bb)',
      level: m.level || 'INICIANTE',
      guardianName: m.guardianName || '',
      guardianPhone: m.guardianPhone || '',
      isPaed: m.isPaed || false,
      enrollmentDate: m.enrollmentDate || new Date().toLocaleDateString('sv-SE'),
      status: m.status || 'ATIVO',
      notes: m.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Por favor, preencha o nome do integrante.");
      return;
    }
    onSaveMember(formData);
    setIsModalOpen(false);
  };

  const filteredMembers = useMemo(() => {
    return members
      .filter(m => selectedNaipe === 'TODOS' || m.naipe === selectedNaipe)
      .filter(m => selectedLevel === 'TODOS' || m.level === selectedLevel)
      .filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.instrument || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.classroomName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [members, selectedNaipe, selectedLevel, searchTerm]);

  // Alunos da Secretaria Filtrados
  const filteredSecretariat = useMemo(() => {
    const enrolledNames = new Set(members.map(m => m.name.toUpperCase()));

    return secretariatStudents
      .filter(s => filterSecretariatClass === 'TODAS' || s.classroomName === filterSecretariatClass)
      .filter(s =>
        s.name.toLowerCase().includes(searchSecretariat.toLowerCase()) ||
        (s.classroomName || '').toLowerCase().includes(searchSecretariat.toLowerCase())
      )
      .map(s => ({
        ...s,
        isAlreadyEnrolled: enrolledNames.has(s.name.toUpperCase())
      }));
  }, [secretariatStudents, filterSecretariatClass, searchSecretariat, members]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* CABEÇALHO COM CONTROLES */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="text-amber-500" size={26} /> Integrantes da Banda & Naipes
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Cadastro de Músicos, Corpo Coreográfico e Balizas • Integrado com a Secretaria
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => window.print()}
            className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2"
          >
            <Printer size={16} /> Imprimir Relação
          </button>
          
          <button
            onClick={openNewModal}
            className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <School size={16} /> Puxar Alunos da Secretaria
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={selectedNaipe}
              onChange={e => setSelectedNaipe(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer text-amber-900"
            >
              <option value="TODOS">TODOS OS NAIPES</option>
              {NAIPES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <select
            value={selectedLevel}
            onChange={e => setSelectedLevel(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
          >
            <option value="TODOS">TODOS OS NÍVEIS</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Buscar por nome, instrumento..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* GRADE DE INTEGRANTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.length > 0 ? (
          filteredMembers.map(m => (
            <div
              key={m.id}
              className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-4 hover:border-amber-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    m.naipe === 'METAIS' ? 'bg-amber-100 text-amber-900' :
                    m.naipe === 'MADEIRAS' ? 'bg-blue-100 text-blue-900' :
                    m.naipe === 'PERCUSSÃO' ? 'bg-rose-100 text-rose-900' : 'bg-purple-100 text-purple-900'
                  }`}>
                    {m.naipe}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                    m.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {m.status}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-base uppercase leading-tight">{m.name}</h3>
                    {m.isPaed && <span className="text-[10px]" title="Aluno PAEDE / AEE">♿</span>}
                  </div>
                  <p className="text-xs font-black text-amber-600 uppercase mt-0.5 flex items-center gap-1.5">
                    <Music size={14} /> {m.instrument || 'Instrumentista'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-xs text-slate-600 font-bold">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Turma Regular:</span>
                    <span className="text-slate-900">{m.classroomName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Nível:</span>
                    <span className="text-indigo-700">{m.level}</span>
                  </div>
                  {m.guardianPhone && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                      <span className="text-slate-400 font-medium">Contato:</span>
                      <a
                        href={`https://wa.me/55${m.guardianPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <Phone size={10} /> {m.guardianPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(m)}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                  title="Editar Integrante"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Deseja remover ${m.name} do Projeto Educarte?`)) {
                      onDeleteMember(m.id);
                    }
                  }}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all"
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-white rounded-[3rem] border border-slate-200">
            Nenhum integrante cadastrado nesta categoria
          </div>
        )}
      </div>

      {/* MODAL DE MATRÍCULA COM BUSCA DA SECRETARIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-8 md:p-10 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95">
            
            {/* CABEÇALHO DO MODAL */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <School className="text-amber-500" size={22} /> Matrícula no Projeto Educarte
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase">
                  {modalMode === 'secretariat' ? 'Selecione o aluno cadastrado na Secretaria Escolar' : 'Defina o Naipe e Instrumento do Aluno'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* ABA 1: LISTA DE ALUNOS DA SECRETARIA */}
            {modalMode === 'secretariat' ? (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Turma:</label>
                    <select
                      value={filterSecretariatClass}
                      onChange={e => setFilterSecretariatClass(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
                    >
                      <option value="TODAS">TODAS AS TURMAS</option>
                      {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Pesquisar por nome do aluno..."
                      value={searchSecretariat}
                      onChange={e => setSearchSecretariat(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {loadingSecretariat ? (
                  <div className="py-16 text-center text-slate-400 text-xs font-black uppercase flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin text-amber-500" /> Carregando alunos da Secretaria...
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-100 border border-slate-100 rounded-2xl">
                    {filteredSecretariat.length > 0 ? (
                      filteredSecretariat.map(student => (
                        <div
                          key={student.id}
                          className={`p-4 flex items-center justify-between gap-4 transition-all ${
                            student.isAlreadyEnrolled ? 'bg-slate-50/50 opacity-60' : 'hover:bg-amber-50/50 cursor-pointer'
                          }`}
                          onClick={() => {
                            if (!student.isAlreadyEnrolled) handleSelectFromSecretariat(student);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs uppercase ${
                              student.isAlreadyEnrolled ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {student.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-slate-900 text-xs uppercase">{student.name}</h4>
                                {student.isPaed && <span className="text-[10px]" title="PAEDE / AEE">♿</span>}
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">
                                Turma: {student.classroomName} • Turno: {student.shift}
                              </p>
                            </div>
                          </div>

                          <div>
                            {student.isAlreadyEnrolled ? (
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                                <Check size={12} /> Já Matriculado
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectFromSecretariat(student);
                                }}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-sm"
                              >
                                Selecionar <ArrowRight size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Nenhum aluno encontrado nesta busca
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        id: crypto.randomUUID(),
                        studentId: '',
                        name: '',
                        classroomName: SCHOOL_CLASSES[0] || '6º ANO A',
                        shift: 'VESPERTINO (CONTRATURNO)',
                        naipe: 'METAIS',
                        instrument: 'Trompete (Bb)',
                        level: 'INICIANTE',
                        guardianName: '',
                        guardianPhone: '',
                        isPaed: false,
                        enrollmentDate: new Date().toLocaleDateString('sv-SE'),
                        status: 'ATIVO',
                        notes: ''
                      });
                      setModalMode('form');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                  >
                    + Cadastrar aluno manualmente sem puxar da secretaria
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black uppercase text-xs"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              /* ABA 2: FORMULÁRIO DE CONFIRMAÇÃO DE MATRÍCULA NO EDUCARTE */
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* DADOS PUXADOS DA SECRETARIA */}
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-1">
                      <School size={12} /> Dados Puxados da Secretaria
                    </span>
                    {!editingMember && (
                      <button
                        type="button"
                        onClick={() => setModalMode('secretariat')}
                        className="text-[10px] font-black text-blue-700 hover:underline uppercase"
                      >
                        Trocar Aluno
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-900 text-sm uppercase">{formData.name || 'Nome do Estudante'}</p>
                    {formData.isPaed && <span className="text-xs font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded">♿ PAEDE</span>}
                  </div>
                  <p className="text-xs text-slate-600 font-bold uppercase">
                    Turma Regular: {formData.classroomName} • Turno do Contraturno: {formData.shift}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Naipe Musical</label>
                    <select
                      value={formData.naipe}
                      onChange={e => {
                        const newNaipe = e.target.value;
                        const defaultInst = INSTRUMENTS_BY_NAIPE[newNaipe]?.[0] || 'Outro';
                        setFormData({ ...formData, naipe: newNaipe, instrument: defaultInst });
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white cursor-pointer text-amber-900"
                    >
                      {NAIPES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instrumento / Função</label>
                    <select
                      value={formData.instrument}
                      onChange={e => setFormData({ ...formData, instrument: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white cursor-pointer"
                    >
                      {(INSTRUMENTS_BY_NAIPE[formData.naipe] || []).map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível de Experiência</label>
                    <select
                      value={formData.level}
                      onChange={e => setFormData({ ...formData, level: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white cursor-pointer"
                    >
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Matrícula</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white cursor-pointer"
                    >
                      <option value="ATIVO">ATIVO</option>
                      <option value="LICENCIADO">LICENCIADO</option>
                      <option value="DESLIGADO">DESLIGADO</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Responsável</label>
                    <input
                      type="text"
                      value={formData.guardianName}
                      onChange={e => setFormData({ ...formData, guardianName: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp / Telefone</label>
                    <input
                      type="text"
                      value={formData.guardianPhone}
                      onChange={e => setFormData({ ...formData, guardianPhone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingMember) setModalMode('secretariat');
                      else setIsModalOpen(false);
                    }}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20 flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Confirmar Matrícula no Educarte
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default EducarteMembers;
