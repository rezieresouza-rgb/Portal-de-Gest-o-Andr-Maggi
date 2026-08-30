import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Printer,
  Trash2,
  X,
  Save,
  CheckCircle2,
  FileText,
  Calendar,
  Users,
  ShieldCheck,
  AlertTriangle,
  Send,
  MessageCircle,
  Phone,
  Clock,
  Building2,
  School,
  Lock
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useStudents } from '../hooks/useStudents';
import { ParentCommitmentTerm, ElectronicSignatureProof } from '../types';
import { extractPhoneNumbers, buildWhatsAppUrl, generateBuscaAtivaMessage } from '../utils/phoneUtils';
import ElectronicSignatureStamp from './ElectronicSignatureStamp';
import ElectronicSignatureModal from './ElectronicSignatureModal';

const DEFAULT_COMMITMENTS = [
  'Garantir a presença diária e pontual do estudante em todas as aulas;',
  'Acompanhar a realização das tarefas escolares e cadernos pedagógicos;',
  'Apresentar atestado médico ou justificativa formal em até 48 horas após qualquer ausência;',
  'Comparecer à escola sempre que convocado pela equipe gestora ou pedagógica;',
  'Comunicar imediatamente a escola em caso de mudança de telefone ou endereço residencial.'
];

const BuscaAtivaParentCommitmentManager: React.FC = () => {
  const { students: dbStudents } = useStudents();
  const [terms, setTerms] = useState<ParentCommitmentTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<ParentCommitmentTerm | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureTarget, setSignatureTarget] = useState<'STAFF' | 'PARENT'>('STAFF');

  const currentYear = new Date().getFullYear();

  // Form State
  const [form, setForm] = useState<Partial<ParentCommitmentTerm>>({
    termNumber: '',
    studentName: '',
    className: '',
    guardianName: '',
    guardianCpf: '',
    guardianPhone: '',
    meetingDate: new Date().toLocaleDateString('sv-SE'),
    absencesCount: 5,
    absenceReasons: '',
    agreedCommitments: DEFAULT_COMMITMENTS,
    schoolGuidance: 'A escola orientou a família quanto à importância da assiduidade escolar para o desenvolvimento pedagógico e informou sobre as sanções previstas no Estatuto da Criança e do Adolescente (Lei nº 8.069/1990, Art. 56) e a condicionalidade de 85% de frequência do Programa Bolsa Família.',
    responsibleStaff: 'COORDENAÇÃO PEDAGÓGICA / DIREÇÃO',
    status: 'ASSINADO'
  });

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parent_commitment_terms')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const formatted: ParentCommitmentTerm[] = data.map((t: any) => ({
          id: t.id,
          termNumber: t.term_number || ('TERMO Nº ' + String(t.id).substring(0, 3) + '/' + currentYear),
          studentId: t.student_id,
          studentName: t.student_name,
          className: t.class_name,
          guardianName: t.guardian_name,
          guardianCpf: t.guardian_cpf,
          guardianPhone: t.guardian_phone,
          meetingDate: t.meeting_date,
          absencesCount: t.absences_count || 0,
          absenceReasons: t.absence_reasons,
          agreedCommitments: Array.isArray(t.agreed_commitments) ? t.agreed_commitments : DEFAULT_COMMITMENTS,
          schoolGuidance: t.school_guidance,
          responsibleStaff: t.responsible_staff,
          status: t.status || 'ASSINADO',
          createdAt: t.created_at
        }));
        setTerms(formatted);
      } else {
        const saved = localStorage.getItem('parent_commitment_terms_v1');
        if (saved) {
          setTerms(JSON.parse(saved));
        } else {
          // Mock inicial para demonstração
          const defaultItem: ParentCommitmentTerm = {
            id: 'term-001',
            termNumber: `TERMO DE COMPROMISSO Nº 001/${currentYear}`,
            studentName: 'Estudante em Acompanhamento',
            className: '7º Ano A',
            guardianName: 'Mãe / Responsável Legal',
            guardianCpf: '***.***.***-**',
            guardianPhone: '(66) 99999-9999',
            meetingDate: new Date().toLocaleDateString('sv-SE'),
            absencesCount: 6,
            absenceReasons: 'Dificuldade de despertar e transporte, sem justificativa médica.',
            agreedCommitments: DEFAULT_COMMITMENTS,
            schoolGuidance: 'A equipe gestora esclareceu os deveres dos pais conforme o Art. 56 do ECA e a meta de 85% do Bolsa Família, firmando o compromisso de frequência integral.',
            responsibleStaff: 'COORDENAÇÃO PEDAGÓGICA / DIREÇÃO',
            status: 'ASSINADO',
            createdAt: new Date().toISOString()
          };
          setTerms([defaultItem]);
          localStorage.setItem('parent_commitment_terms_v1', JSON.stringify([defaultItem]));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar termos de compromisso:', err);
      const saved = localStorage.getItem('parent_commitment_terms_v1');
      if (saved) setTerms(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim() || studentSearch.length < 2) return [];
    return dbStudents.filter(s =>
      (s.Nome || s.name || '').toLowerCase().includes(studentSearch.toLowerCase())
    ).slice(0, 8);
  }, [studentSearch, dbStudents]);

  const handleSelectStudent = (s: any) => {
    setForm(prev => ({
      ...prev,
      studentId: s.CodigoAluno || s.id,
      studentName: s.Nome || s.name,
      className: s.Turma || s.className || '',
      guardianName: s.NomeMae || s.NomePai || s.guardianName || '',
      guardianPhone: s.Telefone || s.contactPhone || ''
    }));
    setStudentSearch('');
  };

  const handleToggleCommitment = (item: string) => {
    const current = form.agreedCommitments || [];
    if (current.includes(item)) {
      setForm(prev => ({ ...prev, agreedCommitments: current.filter(i => i !== item) }));
    } else {
      setForm(prev => ({ ...prev, agreedCommitments: [...current, item] }));
    }
  };

  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName?.trim() || !form.guardianName?.trim() || !form.absenceReasons?.trim()) {
      return alert("Por favor, preencha o estudante, o responsável e o motivo das ausências.");
    }

    const nextNumber = `TERMO DE COMPROMISSO Nº ${String(terms.length + 1).padStart(3, '0')}/${currentYear}`;
    const termId = form.id || ('term-' + Date.now());

    const payload: ParentCommitmentTerm = {
      id: termId,
      termNumber: form.termNumber || nextNumber,
      studentId: form.studentId,
      studentName: form.studentName,
      className: form.className || '',
      guardianName: form.guardianName,
      guardianCpf: form.guardianCpf || '',
      guardianPhone: form.guardianPhone || '',
      meetingDate: form.meetingDate || new Date().toLocaleDateString('sv-SE'),
      absencesCount: form.absencesCount || 0,
      absenceReasons: form.absenceReasons,
      agreedCommitments: form.agreedCommitments || DEFAULT_COMMITMENTS,
      schoolGuidance: form.schoolGuidance || '',
      responsibleStaff: form.responsibleStaff || 'COORDENAÇÃO PEDAGÓGICA / DIREÇÃO',
      status: form.status || 'ASSINADO',
      createdAt: form.createdAt || new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('parent_commitment_terms').upsert([{
        id: payload.id,
        term_number: payload.termNumber,
        student_id: payload.studentId,
        student_name: payload.studentName,
        class_name: payload.className,
        guardian_name: payload.guardianName,
        guardian_cpf: payload.guardianCpf,
        guardian_phone: payload.guardianPhone,
        meeting_date: payload.meetingDate,
        absences_count: payload.absencesCount,
        absence_reasons: payload.absenceReasons,
        agreed_commitments: payload.agreedCommitments,
        school_guidance: payload.schoolGuidance,
        responsible_staff: payload.responsibleStaff,
        status: payload.status
      }]);

      if (error) {
        console.warn('Salvando localmente:', error);
      }

      const updatedList = terms.some(t => t.id === payload.id)
        ? terms.map(t => t.id === payload.id ? payload : t)
        : [payload, ...terms];

      setTerms(updatedList);
      localStorage.setItem('parent_commitment_terms_v1', JSON.stringify(updatedList));
      setIsModalOpen(false);
      setSelectedTerm(payload);
      alert("✅ Termo de Compromisso registrado com sucesso!");
    } catch (err: any) {
      console.error('Erro ao salvar termo:', err);
      alert("Erro ao salvar: " + err.message);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("⚠️ Deseja excluir este Termo de Compromisso?")) return;

    try {
      await supabase.from('parent_commitment_terms').delete().eq('id', id);
      const updated = terms.filter(t => t.id !== id);
      setTerms(updated);
      localStorage.setItem('parent_commitment_terms_v1', JSON.stringify(updated));
      if (selectedTerm?.id === id) setSelectedTerm(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTerms = terms.filter(t => {
    const matchesSearch =
      (t.termNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.guardianName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.className || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'TODOS' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenSignatureModal = (target: 'STAFF' | 'PARENT') => {
    setSignatureTarget(target);
    setIsSignatureModalOpen(true);
  };

  const handleSignatureComplete = (proof: ElectronicSignatureProof) => {
    if (!selectedTerm) return;
    const existingSigs = selectedTerm.signatures || [];
    const updatedSigs = [...existingSigs.filter(s => s.signerRole !== proof.signerRole), proof];
    
    const updatedTerm: ParentCommitmentTerm = {
      ...selectedTerm,
      signatures: updatedSigs,
      isSigned: true,
      status: 'ASSINADO'
    };

    setSelectedTerm(updatedTerm);
    const updatedList = terms.map(t => t.id === updatedTerm.id ? updatedTerm : t);
    setTerms(updatedList);
    localStorage.setItem('parent_commitment_terms_v1', JSON.stringify(updatedList));

    alert(`✅ Documento assinado eletronicamente por ${proof.signerName}!\nCódigo Verificador: ${proof.verificationCode}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      
      {/* HEADER */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-3xl shadow-lg shadow-emerald-600/20">
            <UserCheck size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Convocações & Termos de Compromisso
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[8px] font-black uppercase tracking-wider">
                Ensino Fundamental (6º ao 9º Ano)
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Registro das reuniões presenciais na escola e termos de ciência assinados com certificação digital (Lei nº 14.063/2020).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por aluno, responsável ou termo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500 w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none cursor-pointer focus:bg-white"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ASSINADO">✓ Assinados na Escola</option>
            <option value="PENDENTE_COMPARECIMENTO">⏳ Aguardando Comparecimento</option>
            <option value="CUMPRIDO">🟢 Compromisso Cumprido</option>
            <option value="DESCUMPRIDO">🚨 Descumprido (Reincidente)</option>
          </select>

          <button
            onClick={() => {
              setForm({
                termNumber: `TERMO DE COMPROMISSO Nº ${String(terms.length + 1).padStart(3, '0')}/${currentYear}`,
                studentName: '',
                className: '',
                guardianName: '',
                guardianCpf: '',
                guardianPhone: '',
                meetingDate: new Date().toLocaleDateString('sv-SE'),
                absencesCount: 5,
                absenceReasons: '',
                agreedCommitments: DEFAULT_COMMITMENTS,
                schoolGuidance: 'A escola orientou a família quanto à importância da assiduidade escolar para o desenvolvimento pedagógico e informou sobre as sanções previstas no Estatuto da Criança e do Adolescente (Lei nº 8.069/1990, Art. 56) e a condicionalidade de 85% de frequência do Programa Bolsa Família.',
                responsibleStaff: 'COORDENAÇÃO PEDAGÓGICA / DIREÇÃO',
                status: 'ASSINADO'
              });
              setIsModalOpen(true);
            }}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus size={16} /> Novo Termo de Compromisso
          </button>
        </div>
      </div>

      {/* LISTAGEM DE TERMOS */}
      <div className="grid grid-cols-1 gap-4 no-print">
        {filteredTerms.map(term => (
          <div
            key={term.id}
            onClick={() => setSelectedTerm(term)}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-xl transition-all cursor-pointer group flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-5 flex-1">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 shrink-0 bg-emerald-50 border-emerald-200 text-emerald-700">
                <FileText size={26} />
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    {term.termNumber}
                  </span>
                  <h4 className="text-base font-black text-slate-900 uppercase">{term.studentName}</h4>
                  <span className="text-xs font-bold text-slate-500 uppercase">({term.className})</span>

                  {term.signatures && term.signatures.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck size={10} /> Assinado Digitalmente ({term.signatures.length})
                    </span>
                  )}

                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                    term.status === 'ASSINADO' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    term.status === 'PENDENTE_COMPARECIMENTO' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    term.status === 'CUMPRIDO' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {term.status === 'ASSINADO' ? '✓ Termo Assinado' :
                     term.status === 'PENDENTE_COMPARECIMENTO' ? '⏳ Aguardando Pais' :
                     term.status === 'CUMPRIDO' ? '🟢 Assiduidade Recuperada' : '🚨 Reincidente'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium line-clamp-1 leading-relaxed">
                  <strong>Responsável Presente:</strong> {term.guardianName} {term.guardianPhone && `(${term.guardianPhone})`}
                </p>

                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase flex-wrap">
                  <span>Reunião em: <strong className="text-slate-700">{new Date(term.meetingDate).toLocaleDateString('pt-BR')}</strong></span>
                  <span>•</span>
                  <span>Faltas Acumuladas: <strong className="text-rose-600">{term.absencesCount} ausências</strong></span>
                  <span>•</span>
                  <span>Atendido por: <strong className="text-slate-700">{term.responsibleStaff}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const phones = extractPhoneNumbers(term.guardianPhone);
                  if (phones.length === 0) {
                    alert(`Telefone não cadastrado para o responsável ${term.guardianName}.`);
                    return;
                  }
                  const msg = generateBuscaAtivaMessage('CONVOCATION', {
                    studentName: term.studentName,
                    className: term.className,
                    guardianName: term.guardianName,
                    absencesCount: term.absencesCount
                  });
                  window.open(buildWhatsAppUrl(phones[0].cleaned, msg), '_blank');
                }}
                className="px-3.5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Notificar Responsável via WhatsApp"
              >
                <MessageCircle size={14} /> WhatsApp
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTerm(term);
                  setTimeout(() => window.print(), 300);
                }}
                className="px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
                title="Imprimir Termo de Compromisso Oficial"
              >
                <Printer size={14} />
                <span>Imprimir Termo</span>
              </button>

              <button
                onClick={(e) => handleDelete(term.id, e)}
                className="p-2.5 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                title="Excluir Registro"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {filteredTerms.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <UserCheck size={48} className="mx-auto mb-3 text-slate-200" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Nenhum termo de compromisso registrado
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE CRIAÇÃO DO TERMO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[94vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="p-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Termo de Ciência & Compromisso de Frequência</h3>
                  <p className="text-xs text-slate-300">Convocação presencial dos pais conforme Art. 56 do ECA e Programa Bolsa Família</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-xl">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form onSubmit={handleSaveTerm} className="space-y-6">
                
                {/* BUSCA DE ALUNO */}
                <div className="space-y-3 p-5 bg-slate-50 rounded-3xl border border-slate-200">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    1. Identificação do Estudante (6º ao 9º Ano)
                  </label>

                  {form.studentName ? (
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black">
                          {form.studentName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase text-slate-900">{form.studentName}</p>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase">Turma: {form.className || 'Não Informada'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, studentName: '', studentId: '', className: '', guardianName: '', guardianPhone: '' }))}
                        className="p-2 hover:bg-rose-50 text-rose-600 rounded-xl"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Buscar aluno no banco escolar..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {filteredStudents.length > 0 && (
                        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 divide-y divide-slate-100 overflow-hidden">
                          {filteredStudents.map((s: any) => (
                            <button
                              key={s.CodigoAluno || s.id}
                              type="button"
                              onClick={() => handleSelectStudent(s)}
                              className="w-full text-left p-3 hover:bg-emerald-50 flex justify-between items-center"
                            >
                              <div>
                                <p className="text-xs font-black uppercase text-slate-900">{s.Nome || s.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{s.Turma || s.className}</p>
                              </div>
                              <span className="text-[10px] font-black text-emerald-600 uppercase">+ Selecionar</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Responsável Comparecente</label>
                      <input
                        required
                        type="text"
                        value={form.guardianName || ''}
                        onChange={e => setForm(prev => ({ ...prev, guardianName: e.target.value }))}
                        placeholder="Mãe / Pai / Guardião"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">CPF do Responsável</label>
                      <input
                        type="text"
                        value={form.guardianCpf || ''}
                        onChange={e => setForm(prev => ({ ...prev, guardianCpf: e.target.value }))}
                        placeholder="000.000.000-00"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Telefone de Contato</label>
                      <input
                        type="text"
                        value={form.guardianPhone || ''}
                        onChange={e => setForm(prev => ({ ...prev, guardianPhone: e.target.value }))}
                        placeholder="(66) 99999-9999"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* DETALHES DO ATENDIMENTO */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      2. Data do Atendimento
                    </label>
                    <input
                      type="date"
                      value={form.meetingDate || ''}
                      onChange={e => setForm(prev => ({ ...prev, meetingDate: e.target.value }))}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      3. Faltas Acumuladas
                    </label>
                    <input
                      type="number"
                      value={form.absencesCount || 0}
                      onChange={e => setForm(prev => ({ ...prev, absencesCount: Number(e.target.value) }))}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      4. Atendido por:
                    </label>
                    <input
                      type="text"
                      value={form.responsibleStaff || ''}
                      onChange={e => setForm(prev => ({ ...prev, responsibleStaff: e.target.value }))}
                      placeholder="Coordenação / Direção"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                </div>

                {/* MOTIVO ALEGADO */}
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-1">
                    5. Justificativa / Motivo das Ausências Alegado pela Família:
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.absenceReasons || ''}
                    onChange={e => setForm(prev => ({ ...prev, absenceReasons: e.target.value }))}
                    placeholder="Descreva as razões apresentadas pelos pais para as faltas do estudante..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* COMPROMISSOS ACORDADOS */}
                <div className="space-y-2 p-5 bg-slate-50 rounded-3xl border border-slate-200">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">
                    6. Compromissos Assumidos pelos Responsáveis Legais (Checklist):
                  </label>
                  <div className="space-y-2">
                    {DEFAULT_COMMITMENTS.map(item => {
                      const isChecked = (form.agreedCommitments || []).includes(item);
                      return (
                        <div
                          key={item}
                          onClick={() => handleToggleCommitment(item)}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold cursor-pointer transition-all ${
                            isChecked ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-emerald-600 cursor-pointer"
                          />
                          <span>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Salvar Termo e Gerar Documento p/ Assinatura
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTO OFICIAL FORMATADO PARA IMPRESSÃO */}
      {selectedTerm && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[96vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            
            {/* Header de Ações */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center no-print flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black bg-emerald-600 px-3 py-1 rounded-lg">
                  {selectedTerm.termNumber}
                </span>
                <span className="text-xs font-bold uppercase text-slate-300">Termo Oficial SEDUC/MT</span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleOpenSignatureModal('STAFF')}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
                  title="Assinar como Diretor / Servidor com senha institucional"
                >
                  <ShieldCheck size={16} /> Assinar Diretor (Senha)
                </button>

                <button
                  onClick={() => handleOpenSignatureModal('PARENT')}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
                  title="Assinar como Responsável Legal na tela touch ou mouse"
                >
                  <UserCheck size={16} /> Assinar Responsável (Touch)
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                >
                  <Printer size={16} /> Imprimir
                </button>
                <button
                  onClick={() => setSelectedTerm(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* DOCUMENTO OFICIAL A4 */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar print-document bg-white text-slate-900 space-y-6">
              
              {/* CABEÇALHO OFICIAL */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <div className="flex justify-center items-center gap-6 mb-2">
                  <img src="/brasao_mt.png" alt="MT" className="h-14 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <img src="/logo-escola-oficial.png" alt="Escola" className="h-14 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Governo do Estado de Mato Grosso</h2>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Secretaria de Estado de Educação — SEDUC/MT</h3>
                <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">E.E. Cívico-Militar André Antônio Maggi</h4>
                <p className="text-[10px] text-slate-600">Diretoria Regional de Educação de Sinop • Núcleo de Busca Ativa Escolar</p>
              </div>

              {/* TÍTULO */}
              <div className="text-center my-4">
                <h2 className="text-base font-black uppercase text-slate-900 tracking-wider">
                  {selectedTerm.termNumber}
                </h2>
                <p className="text-xs font-bold uppercase text-slate-600">
                  Ciência e Responsabilidade sobre a Frequência Escolar Obrigatória
                </p>
              </div>

              {/* IDENTIFICAÇÃO */}
              <div className="text-xs space-y-1.5 border border-slate-300 p-4 rounded-xl bg-slate-50 leading-relaxed">
                <p><strong>Estudante:</strong> <span className="uppercase">{selectedTerm.studentName}</span> | <strong>Turma:</strong> <span className="uppercase">{selectedTerm.className}</span></p>
                <p><strong>Responsável Legal:</strong> <span className="uppercase">{selectedTerm.guardianName}</span> {selectedTerm.guardianCpf && `| CPF: ${selectedTerm.guardianCpf}`}</p>
                <p><strong>Telefone de Contato:</strong> <span>{selectedTerm.guardianPhone || 'Não informado'}</span></p>
                <p><strong>Data do Atendimento Presencial:</strong> {new Date(selectedTerm.meetingDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <p><strong>Total de Faltas Injustificadas Registradas:</strong> <span className="font-bold text-rose-700">{selectedTerm.absencesCount} ausências</span></p>
              </div>

              {/* CORPO DO TERMO */}
              <div className="space-y-4 text-xs leading-relaxed text-slate-800 text-justify">
                <p>
                  Aos {new Date(selectedTerm.meetingDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}, compareceu a esta Unidade Escolar o(a) responsável legal acima qualificado(a), o(a) qual foi formalmente cientificado(a) sobre a infrequência escolar reiterada do(a) discente, nos termos do <strong>Artigo 205 da Constituição Federal</strong>, do <strong>Artigo 56, inciso II do Estatuto da Criança e do Adolescente (Lei Federal nº 8.069/1990)</strong> e das normas do <strong>Programa Bolsa Família (condicionalidade de 85% de frequência escolar mínima)</strong>.
                </p>

                <div className="space-y-1">
                  <h5 className="font-black uppercase text-slate-900">1. Motivo das Ausências Declarado pelo Responsável:</h5>
                  <p className="p-3 bg-white border border-slate-300 rounded-lg text-[11px] leading-relaxed">
                    {selectedTerm.absenceReasons}
                  </p>
                </div>

                <div className="space-y-1">
                  <h5 className="font-black uppercase text-slate-900">2. Compromissos Assumidos pelo Responsável Legal:</h5>
                  <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1.5">
                    {selectedTerm.agreedCommitments.map((c, i) => (
                      <p key={i} className="text-[11px] text-slate-800 flex items-start gap-1.5">
                        <span className="font-bold text-emerald-700">[{i + 1}]</span> {c}
                      </p>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-600">
                  O(A) responsável declara estar plenamente ciente de que a reincidência de faltas injustificadas após a assinatura deste termo ensejará a imediata emissão da <strong>FICAI (Ficha de Comunicação de Aluno Infrequente)</strong> e encaminhamento formal ao <strong>Conselho Tutelar e Ministério Público do Estado de Mato Grosso</strong>.
                </p>
              </div>

              {/* ASSINATURAS OFICIAIS */}
              <div className="grid grid-cols-2 gap-10 pt-10 text-center text-xs">
                <div className="border-t border-slate-900 pt-2 space-y-0.5">
                  <p className="font-black uppercase text-slate-900">{selectedTerm.guardianName}</p>
                  <p className="text-[10px] text-slate-600 uppercase font-bold">Responsável Legal pelo(a) Discente</p>
                </div>
                <div className="border-t border-slate-900 pt-2 space-y-0.5">
                  <p className="font-black uppercase text-slate-900">REZIERE DE SOUZA</p>
                  <p className="text-[10px] text-slate-600 uppercase font-bold">Diretor Escolar</p>
                  <p className="text-[9px] text-slate-500 uppercase">E.E. Cívico-Militar André Antônio Maggi</p>
                </div>
              </div>

              {/* CARIMBOS E SELOS DE ASSINATURA ELETRÔNICA (LEI Nº 14.063/2020) */}
              {selectedTerm.signatures && selectedTerm.signatures.length > 0 && (
                <div className="pt-4 space-y-3">
                  {selectedTerm.signatures.map((sig, idx) => (
                    <ElectronicSignatureStamp key={idx} signature={sig} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ASSINATURA ELETRÔNICA */}
      {isSignatureModalOpen && selectedTerm && (
        <ElectronicSignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          documentId={selectedTerm.id}
          documentType="TERMO_COMPROMISSO"
          documentTitle={selectedTerm.termNumber}
          documentContent={selectedTerm}
          defaultSignerName={signatureTarget === 'STAFF' ? 'REZIERE DE SOUZA' : selectedTerm.guardianName}
          defaultSignerRole={signatureTarget === 'STAFF' ? 'DIRETOR ESCOLAR' : 'RESPONSÁVEL LEGAL'}
          allowParentMode={signatureTarget === 'PARENT'}
          onSignatureComplete={handleSignatureComplete}
        />
      )}
    </div>
  );
};

export default BuscaAtivaParentCommitmentManager;
