import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  ShieldAlert, 
  X, 
  Save, 
  FileText, 
  HeartHandshake, 
  Building,
  Activity,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useStudents } from '../hooks/useStudents';
import { PsychosocialExternalReferral, ExternalNetworkDestination, PsychosocialRole, ElectronicSignatureProof } from '../types';
import ElectronicSignatureStamp from './ElectronicSignatureStamp';
import ElectronicSignatureModal from './ElectronicSignatureModal';
import { registerSignatureProof } from '../utils/signatureService';

interface PsychosocialExternalNetworkManagerProps {
  user?: any;
  role: PsychosocialRole;
  onNavigateToCase?: (caseId: string) => void;
}

const DESTINATION_CONFIG: Record<ExternalNetworkDestination, { label: string; icon: any; color: string; bg: string; badge: string; description: string }> = {
  CONSELHO_TUTELAR: {
    label: 'Conselho Tutelar',
    icon: Building2,
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Violação grave de direitos, maus-tratos, abandono de incapaz ou evasão escolar reiterada (ECA, Art. 13 e 56).'
  },
  CAPSI_SAUDE_MENTAL: {
    label: 'CAPSi / Saúde Mental (SUS)',
    icon: Activity,
    color: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200',
    badge: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Sofrimento psíquico grave, ideação suicida, automutilação, crises emocionais agudas ou uso de substâncias.'
  },
  CRAS: {
    label: 'CRAS (Assistência Social)',
    icon: HeartHandshake,
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Vulnerabilidade socioeconômica crítica, extrema pobreza, necessidade de inserção no CadÚnico e programas sociais.'
  },
  CREAS: {
    label: 'CREAS (Proteção Especial)',
    icon: ShieldAlert,
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
    badge: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Violência intrafamiliar confirmada, abuso/exploração sexual, trabalho infantil ou medidas socioeducativas.'
  },
  PROMOTORIA_INFANCIA: {
    label: 'Promotoria / Vara da Infância',
    icon: Building,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'Casos reincidentes sem resolução pelo Conselho Tutelar ou situações de grave risco institucional/legal.'
  },
  UBS_SAUDE_BASICA: {
    label: 'UBS / Atenção Básica de Saúde',
    icon: Activity,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Acompanhamento pediátrico, atualização vacinal, exames clínicos gerais ou apoio de enfermagem.'
  },
  OUTRO: {
    label: 'Outro Órgão / Entidade',
    icon: FileText,
    color: 'text-slate-700',
    bg: 'bg-slate-50 border-slate-200',
    badge: 'bg-slate-100 text-slate-900 border-slate-300',
    description: 'Encaminhamentos específicos para ONGs, Defensoria Pública ou serviços especializados.'
  }
};

const PsychosocialExternalNetworkManager: React.FC<PsychosocialExternalNetworkManagerProps> = ({
  user,
  role
}) => {
  const { students: dbStudents } = useStudents();
  const [referrals, setReferrals] = useState<PsychosocialExternalReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDestination, setFilterDestination] = useState<string>('TODOS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<PsychosocialExternalReferral | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

  // Signature modal state
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [signRoleType, setSignRoleType] = useState<'PROFISSIONAL' | 'DIRETOR'>('PROFISSIONAL');

  const currentYear = new Date().getFullYear();

  const [form, setForm] = useState<Partial<PsychosocialExternalReferral>>({
    destination: 'CONSELHO_TUTELAR',
    urgency: 'URGENTE',
    professionalName: user?.name || 'TÉCNICO PSICOSSOCIAL',
    professionalRole: role === 'PSICOLOGO' ? 'PSICÓLOGO(A) ESCOLAR' : role === 'ASSISTENTE_SOCIAL' ? 'ASSISTENTE SOCIAL ESCOLAR' : 'COORDENADOR(A) DA EQUIPE',
    directorName: 'REZIERE DE SOUZA',
    referralDate: new Date().toLocaleDateString('sv-SE'),
    status: 'EMITIDO'
  });

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('psychosocial_external_referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted: PsychosocialExternalReferral[] = data.map((r: any) => ({
          id: r.id,
          protocolNumber: r.protocol_number || ('OF-' + (r.id ? r.id.substring(0, 5) : '001') + '/' + currentYear),
          studentId: r.student_id,
          studentName: r.student_name,
          className: r.class_name,
          studentAge: r.student_age,
          birthDate: r.birth_date,
          guardianName: r.guardian_name,
          guardianPhone: r.guardian_phone,
          guardianAddress: r.guardian_address,
          destination: r.destination,
          destinationName: r.destination_name,
          urgency: r.urgency || 'URGENTE',
          reason: r.reason,
          schoolActionsTaken: r.school_actions_taken,
          psychosocialOpinion: r.psychosocial_opinion,
          requestedActions: r.requested_actions,
          professionalName: r.professional_name,
          professionalRole: r.professional_role,
          professionalRegister: r.professional_register,
          directorName: r.director_name,
          referralDate: r.referral_date,
          status: r.status || 'EMITIDO',
          responseNotes: r.response_notes,
          signatures: r.signatures || [],
          isSigned: r.is_signed || false,
          createdAt: r.created_at
        }));
        setReferrals(formatted);
      } else {
        const saved = localStorage.getItem('psychosocial_external_referrals_v1');
        if (saved) {
          setReferrals(JSON.parse(saved));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar encaminhamentos externos:', err);
      const saved = localStorage.getItem('psychosocial_external_referrals_v1');
      if (saved) setReferrals(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
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
      birthDate: s.DataNascimento || s.birthDate || '',
      guardianName: s.NomeMae || s.NomePai || s.guardianName || '',
      guardianPhone: s.Telefone || s.contactPhone || '',
      guardianAddress: s.Endereco || s.address || ''
    }));
    setStudentSearch('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName?.trim() || !form.reason?.trim() || !form.psychosocialOpinion?.trim()) {
      return alert("Por favor, preencha o estudante, o motivo do encaminhamento e o parecer técnico psicossocial.");
    }

    const nextProtocolNumber = 'OF-' + String(referrals.length + 1).padStart(3, '0') + '/' + currentYear + '-EEAM/PSICOSSOCIAL';
    
    const payload = {
      protocol_number: form.protocolNumber || nextProtocolNumber,
      student_id: form.studentId || null,
      student_name: form.studentName,
      class_name: form.className || '',
      student_age: form.studentAge || '',
      birth_date: form.birthDate || null,
      guardian_name: form.guardianName || '',
      guardian_phone: form.guardianPhone || '',
      guardian_address: form.guardianAddress || '',
      destination: form.destination || 'CONSELHO_TUTELAR',
      destination_name: form.destinationName || '',
      urgency: form.urgency || 'URGENTE',
      reason: form.reason,
      school_actions_taken: form.schoolActionsTaken || '',
      psychosocial_opinion: form.psychosocialOpinion,
      requested_actions: form.requestedActions || '',
      professional_name: form.professionalName || user?.name || 'TÉCNICO PSICOSSOCIAL',
      professional_role: form.professionalRole || 'PSICÓLOGO(A) / ASSISTENTE SOCIAL',
      professional_register: form.professionalRegister || '',
      director_name: form.directorName || 'REZIERE DE SOUZA',
      referral_date: form.referralDate || new Date().toLocaleDateString('sv-SE'),
      status: form.status || 'EMITIDO',
      signatures: [],
      is_signed: false
    };

    try {
      const { data, error } = await supabase
        .from('psychosocial_external_referrals')
        .insert([payload])
        .select();

      if (error) {
        console.warn('Salvando localmente:', error);
      }

      const newRef: PsychosocialExternalReferral = {
        id: data && data[0] ? data[0].id : ('ext-' + Date.now()),
        protocolNumber: payload.protocol_number,
        studentName: payload.student_name,
        className: payload.class_name,
        guardianName: payload.guardian_name,
        guardianPhone: payload.guardian_phone,
        guardianAddress: payload.guardian_address,
        destination: payload.destination as ExternalNetworkDestination,
        urgency: payload.urgency as any,
        reason: payload.reason,
        schoolActionsTaken: payload.school_actions_taken,
        psychosocialOpinion: payload.psychosocial_opinion,
        requestedActions: payload.requested_actions,
        professionalName: payload.professional_name,
        professionalRole: payload.professional_role,
        professionalRegister: payload.professional_register,
        directorName: payload.director_name,
        referralDate: payload.referral_date,
        status: 'EMITIDO',
        signatures: [],
        isSigned: false,
        createdAt: new Date().toISOString()
      };

      const updated = [newRef, ...referrals];
      setReferrals(updated);
      localStorage.setItem('psychosocial_external_referrals_v1', JSON.stringify(updated));
      setIsModalOpen(false);
      setSelectedReferral(newRef);
    } catch (err: any) {
      console.error('Erro ao salvar encaminhamento:', err);
      alert("Erro ao registrar: " + err.message);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("⚠️ Tem certeza que deseja excluir este registro de encaminhamento?")) return;
    try {
      await supabase.from('psychosocial_external_referrals').delete().eq('id', id);
      const updated = referrals.filter(r => r.id !== id);
      setReferrals(updated);
      localStorage.setItem('psychosocial_external_referrals_v1', JSON.stringify(updated));
      if (selectedReferral?.id === id) setSelectedReferral(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch = 
      (r.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.protocolNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.className || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.reason || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDestination = filterDestination === 'TODOS' || r.destination === filterDestination;
    const matchesStatus = filterStatus === 'TODOS' || r.status === filterStatus;

    return matchesSearch && matchesDestination && matchesStatus;
  });

  const handlePrint = (ref: PsychosocialExternalReferral) => {
    setSelectedReferral(ref);
  };

  const handleOpenSignModal = (ref: PsychosocialExternalReferral, roleType: 'PROFISSIONAL' | 'DIRETOR') => {
    setSelectedReferral(ref);
    setSignRoleType(roleType);
    setIsSigningModalOpen(true);
  };

  const handleSignatureComplete = async (proof: ElectronicSignatureProof) => {
    if (!selectedReferral) return;

    const existingSignatures = selectedReferral.signatures || [];
    const updatedSignatures = [...existingSignatures, proof];

    const updatedReferral: PsychosocialExternalReferral = {
      ...selectedReferral,
      signatures: updatedSignatures,
      isSigned: true
    };

    // 1. Atualizar no estado
    setSelectedReferral(updatedReferral);
    const updatedList = referrals.map(r => r.id === updatedReferral.id ? updatedReferral : r);
    setReferrals(updatedList);

    // 2. Salvar no localStorage
    localStorage.setItem('psychosocial_external_referrals_v1', JSON.stringify(updatedList));

    // 3. Atualizar no Supabase
    try {
      await supabase
        .from('psychosocial_external_referrals')
        .update({
          signatures: updatedSignatures,
          is_signed: true
        })
        .eq('id', updatedReferral.id);
    } catch (err) {
      console.warn('Erro ao salvar assinatura no Supabase:', err);
    }

    // 4. Registrar na base pública de conferência
    await registerSignatureProof(proof);

    setIsSigningModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      
      {/* HEADER DE CONTROLE */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-indigo-600 to-rose-600 text-white rounded-3xl shadow-lg shadow-indigo-600/20">
            <Building2 size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Rede de Proteção & Encaminhamentos Externos
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[8px] font-black uppercase tracking-wider">
                ECA • SEDUC/MT
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={11} /> Assinatura Eletrônica
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Emissão formal de ofícios e notificações para Conselho Tutelar, CAPSi/Saúde Mental, CRAS, CREAS e Promotoria.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar aluno, ofício ou motivo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none w-64 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filterDestination}
            onChange={e => setFilterDestination(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none cursor-pointer focus:bg-white"
          >
            <option value="TODOS">Todos os Órgãos</option>
            <option value="CONSELHO_TUTELAR">Conselho Tutelar</option>
            <option value="CAPSI_SAUDE_MENTAL">CAPSi / Saúde Mental</option>
            <option value="CRAS">CRAS</option>
            <option value="CREAS">CREAS</option>
            <option value="PROMOTORIA_INFANCIA">Promotoria</option>
            <option value="UBS_SAUDE_BASICA">UBS / Saúde</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus size={18} /> Novo Ofício de Encaminhamento
          </button>
        </div>
      </div>

      {/* CARDS DOS ENCAMINHAMENTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs font-bold uppercase">
            Carregando ofícios da rede...
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200 space-y-2">
            <Building2 size={40} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-500 uppercase">Nenhum encaminhamento registrado para este filtro.</p>
          </div>
        ) : (
          filteredReferrals.map(ref => {
            const dest = DESTINATION_CONFIG[ref.destination] || DESTINATION_CONFIG.OUTRO;
            const DestIcon = dest.icon;
            const hasSignature = ref.isSigned || (ref.signatures && ref.signatures.length > 0);

            return (
              <div 
                key={ref.id}
                onClick={() => handlePrint(ref)}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      {ref.protocolNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${dest.badge}`}>
                      <DestIcon size={10} className="inline mr-1" />
                      {dest.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase group-hover:text-indigo-600 transition-colors">
                      {ref.studentName}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Turma: {ref.className || 'Não Informada'} • Emissão: {new Date(ref.referralDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {ref.reason}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {hasSignature ? (
                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg uppercase flex items-center gap-1">
                        <ShieldCheck size={10} /> Assinado
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg uppercase flex items-center gap-1">
                        <KeyRound size={10} /> Pendente Assinatura
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrint(ref);
                      }}
                      className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                      title="Visualizar / Imprimir Ofício"
                    >
                      <Printer size={15} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(ref.id, e)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE NOVO ENCAMINHAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 my-8">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 rounded-2xl">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">Novo Ofício à Rede de Proteção</h3>
                  <p className="text-xs text-indigo-300">Expedição Formal Timbrada SEDUC/MT</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSave} className="space-y-6">
                
                {/* DESTINO */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                    1. Órgão / Destino do Encaminhamento *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(DESTINATION_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      const isSelected = form.destination === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, destination: key as any }))}
                          className={`p-3 text-left rounded-2xl border transition-all flex items-start gap-3 ${
                            isSelected ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className={`p-2 rounded-xl bg-white shadow-sm shrink-0 ${config.color}`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase">{config.label}</p>
                            <p className="text-[10px] text-slate-500 line-clamp-1">{config.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* IDENTIFICAÇÃO DO ALUNO */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    2. Estudante Atendido *
                  </label>

                  {form.studentName ? (
                    <div className="flex items-center justify-between p-3 bg-white border border-indigo-200 rounded-xl">
                      <div>
                        <p className="text-xs font-black uppercase text-indigo-950">{form.studentName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{form.className}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setForm(prev => ({ ...prev, studentName: '', studentId: '', className: '' }))}
                        className="p-2 hover:bg-rose-50 text-rose-600 rounded-xl"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text"
                        placeholder="Buscar aluno cadastrado na escola para auto-preenchimento..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      />
                      {filteredStudents.length > 0 && (
                        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 divide-y divide-slate-100 overflow-hidden">
                          {filteredStudents.map((s: any) => (
                            <button
                              key={s.CodigoAluno || s.id}
                              type="button"
                              onClick={() => handleSelectStudent(s)}
                              className="w-full text-left p-3 hover:bg-indigo-50 flex justify-between items-center"
                            >
                              <div>
                                <p className="text-xs font-black uppercase text-slate-900">{s.Nome || s.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{s.Turma || s.className}</p>
                              </div>
                              <span className="text-[10px] font-black text-indigo-600 uppercase">+ Selecionar</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nome do Responsável</label>
                      <input 
                        type="text"
                        value={form.guardianName || ''}
                        onChange={e => setForm(prev => ({ ...prev, guardianName: e.target.value }))}
                        placeholder="Mãe / Pai / Guardião Legal"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Telefone de Contato</label>
                      <input 
                        type="text"
                        value={form.guardianPhone || ''}
                        onChange={e => setForm(prev => ({ ...prev, guardianPhone: e.target.value }))}
                        placeholder="(66) 99999-9999"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Endereço Residencial</label>
                      <input 
                        type="text"
                        value={form.guardianAddress || ''}
                        onChange={e => setForm(prev => ({ ...prev, guardianAddress: e.target.value }))}
                        placeholder="Rua, Número, Bairro"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* MOTIVO E MEDIDAS ESCOLARES */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                        3. Nível de Urgência
                      </label>
                      <select
                        value={form.urgency || 'URGENTE'}
                        onChange={e => setForm(prev => ({ ...prev, urgency: e.target.value as any }))}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase outline-none cursor-pointer"
                      >
                        <option value="NORMAL">Normal (Acompanhamento Regular)</option>
                        <option value="URGENTE">Urgente (Risco Moderado a Alto)</option>
                        <option value="URGENTÍSSIMA">🚨 Urgentíssima (Risco Iminente / Violação Grave)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                        4. Data do Encaminhamento
                      </label>
                      <input 
                        type="date"
                        value={form.referralDate || new Date().toLocaleDateString('sv-SE')}
                        onChange={e => setForm(prev => ({ ...prev, referralDate: e.target.value }))}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      5. Síntese do Fato / Relato Técnico Detalhado *
                    </label>
                    <textarea 
                      rows={4}
                      value={form.reason || ''}
                      onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Descreva detalhadamente o fato ocorrido, histórico discente e violações identificadas..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      6. Medidas e Intervenções já Realizadas pela Escola
                    </label>
                    <textarea 
                      rows={2}
                      value={form.schoolActionsTaken || ''}
                      onChange={e => setForm(prev => ({ ...prev, schoolActionsTaken: e.target.value }))}
                      placeholder="Ex: Reuniões com os pais, escuta com o mediador escolar, busca ativa..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      7. Parecer Técnico Psicossocial *
                    </label>
                    <textarea 
                      rows={3}
                      value={form.psychosocialOpinion || ''}
                      onChange={e => setForm(prev => ({ ...prev, psychosocialOpinion: e.target.value }))}
                      placeholder="Parecer técnico fundamentado com base no ECA e diretrizes da SEDUC/MT..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      8. Providências Solicitadas ao Órgão Externo
                    </label>
                    <input 
                      type="text"
                      value={form.requestedActions || ''}
                      onChange={e => setForm(prev => ({ ...prev, requestedActions: e.target.value }))}
                      placeholder="Ex: Acolhimento familiar, acompanhamento psicológico especializado, inclusão no CadÚnico..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Registrar e Gerar Ofício Oficial
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE IMPRESSÃO / VISUALIZAÇÃO DO OFÍCIO FORMAL (TIMBRADO SEDUC/MT) */}
      {selectedReferral && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[95vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            
            {/* Barra de Ações do Modal */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center no-print">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black bg-indigo-600 px-3 py-1 rounded-lg">
                  {selectedReferral.protocolNumber}
                </span>
                <span className="text-xs font-bold uppercase text-slate-300">Ofício Oficial de Encaminhamento</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenSignModal(selectedReferral, 'PROFISSIONAL')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <KeyRound size={14} /> Assinar (Profissional)
                </button>
                <button
                  onClick={() => handleOpenSignModal(selectedReferral, 'DIRETOR')}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <KeyRound size={14} /> Assinar (Diretor)
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                >
                  <Printer size={16} /> Imprimir (PDF)
                </button>
                <button
                  onClick={() => setSelectedReferral(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* DOCUMENTO OFICIAL FORMATADO */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar print-document bg-white text-slate-900 space-y-6">
              
              {/* CABEÇALHO OFICIAL SEDUC/MT */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <div className="flex justify-center items-center gap-6 mb-2">
                  <img src="/brasao_mt.png" alt="MT" className="h-14 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <img src="/logo-escola-oficial.png" alt="Escola" className="h-14 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Governo do Estado de Mato Grosso</h2>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Secretaria de Estado de Educação — SEDUC/MT</h3>
                <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">E.E. Cívico-Militar André Antônio Maggi</h4>
                <p className="text-[10px] text-slate-600">Diretoria Regional de Educação • Núcleo de Mediação & Equipe Psicossocial Escolar</p>
              </div>

              {/* DADOS DO OFÍCIO */}
              <div className="flex justify-between items-start pt-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono">
                    {selectedReferral.protocolNumber}
                  </p>
                  <p className="text-[11px] font-bold text-slate-600 uppercase mt-0.5">
                    Assunto: Encaminhamento Técnico e Notificação de Proteção Discente
                  </p>
                </div>
                <div className="text-right text-xs font-bold text-slate-700">
                  Colíder - MT, {new Date(selectedReferral.referralDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
                </div>
              </div>

              {/* DESTINATÁRIO */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="font-black text-slate-900 uppercase">
                  Ao Ilustríssimo(a) Senhor(a) Coordenador(a) / Responsável
                </p>
                <p className="font-bold text-indigo-900 uppercase">
                  {DESTINATION_CONFIG[selectedReferral.destination]?.label || 'Órgão da Rede de Garantia de Direitos'}
                </p>
                <p className="text-[11px] text-slate-600">Município de Colíder - Estado de Mato Grosso</p>
              </div>

              {/* CORPO DO OFÍCIO */}
              <div className="space-y-4 text-xs leading-relaxed text-slate-800 text-justify">
                <p>
                  Cumprimentando-o(a) cordialmente, a <strong>Equipe Multidisciplinar Psicossocial</strong> e a <strong>Direção da Escola Estadual Cívico-Militar André Antônio Maggi</strong>, no uso de suas atribuições legais e em conformidade com as diretrizes do <strong>Estatuto da Criança e do Adolescente (Lei Federal nº 8.069/1990, Arts. 13, 56 e 70-A)</strong> e do <strong>Programa Estadual de Mediação Escolar e Cultura de Paz (SEDUC/MT)</strong>, vem por meio deste <strong>ENCAMINHAR</strong> para as devidas providências protetivas o(a) estudante abaixo identificado(a):
                </p>

                {/* QUADRO DE IDENTIFICAÇÃO DO ALUNO */}
                <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-1.5">
                  <p><strong>Estudante:</strong> <span className="uppercase">{selectedReferral.studentName}</span></p>
                  <div className="grid grid-cols-2 gap-2">
                    <p><strong>Turma / Ano:</strong> <span className="uppercase">{selectedReferral.className || 'Não informada'}</span></p>
                    <p><strong>Urgência:</strong> <span className="uppercase font-black text-rose-700">{selectedReferral.urgency}</span></p>
                  </div>
                  <p><strong>Responsável Legal:</strong> <span className="uppercase">{selectedReferral.guardianName || 'Não Informado'}</span></p>
                  <p><strong>Telefone de Contato:</strong> <span>{selectedReferral.guardianPhone || 'Não Informado'}</span></p>
                  <p><strong>Endereço:</strong> <span className="uppercase">{selectedReferral.guardianAddress || 'Não Informado'}</span></p>
                </div>

                {/* SÍNTESE E MOTIVO */}
                <div className="space-y-1">
                  <h5 className="font-black uppercase text-slate-900">1. Síntese do Fato / Demanda Identificada:</h5>
                  <p className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] leading-relaxed">
                    {selectedReferral.reason}
                  </p>
                </div>

                {/* INTERVENÇÕES ESCOLARES */}
                {selectedReferral.schoolActionsTaken && (
                  <div className="space-y-1">
                    <h5 className="font-black uppercase text-slate-900">2. Medidas e Ações Adotadas pela Unidade Escolar:</h5>
                    <p className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] leading-relaxed">
                      {selectedReferral.schoolActionsTaken}
                    </p>
                  </div>
                )}

                {/* PARECER TÉCNICO PSICOSSOCIAL */}
                <div className="space-y-1">
                  <h5 className="font-black uppercase text-slate-900">3. Parecer Técnico Psicossocial:</h5>
                  <p className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] leading-relaxed">
                    {selectedReferral.psychosocialOpinion}
                  </p>
                </div>

                {/* PROVIDÊNCIAS SOLICITADAS */}
                {selectedReferral.requestedActions && (
                  <div className="space-y-1">
                    <h5 className="font-black uppercase text-slate-900">4. Providências Solicitadas à Rede Intersetorial:</h5>
                    <p className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] leading-relaxed">
                      {selectedReferral.requestedActions}
                    </p>
                  </div>
                )}

                <p className="pt-2">
                  Colocamo-nos à disposição para complementação de informações e articulação técnica no âmbito do plano de proteção integral e garantia do direito à educação e saúde integral deste discente.
                </p>
              </div>

              {/* SELOS DE ASSINATURA ELETRÔNICA OFICIAL */}
              {selectedReferral.signatures && selectedReferral.signatures.length > 0 ? (
                <div className="my-6 space-y-4">
                  {selectedReferral.signatures.map((sig, idx) => (
                    <ElectronicSignatureStamp key={idx} signature={sig} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-8 pt-10 text-center text-xs">
                  <div className="border-t border-slate-900 pt-2 space-y-0.5">
                    <p className="font-black uppercase text-slate-900">{selectedReferral.professionalName}</p>
                    <p className="text-[10px] text-slate-600 uppercase font-bold">{selectedReferral.professionalRole}</p>
                    <p className="text-[9px] text-slate-500 uppercase">Equipe Psicossocial Escolar</p>
                  </div>
                  <div className="border-t border-slate-900 pt-2 space-y-0.5">
                    <p className="font-black uppercase text-slate-900">{selectedReferral.directorName}</p>
                    <p className="text-[10px] text-slate-600 uppercase font-bold">Diretor Escolar</p>
                    <p className="text-[9px] text-slate-500 uppercase">E.E. Cívico-Militar André Antônio Maggi</p>
                  </div>
                </div>
              )}

              {/* PROTOCOLO DE RECEBIMENTO DO ÓRGÃO */}
              <div className="mt-8 p-3 border border-dashed border-slate-400 rounded-xl text-[10px] text-slate-600 flex justify-between items-center">
                <span>Recebido por: _____________________________________</span>
                <span>Data: ___/___/______</span>
                <span>Assinatura/Carimbo: _________________________</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ASSINATURA ELETRÔNICA */}
      {isSigningModalOpen && selectedReferral && (
        <ElectronicSignatureModal
          isOpen={isSigningModalOpen}
          onClose={() => setIsSigningModalOpen(false)}
          documentTitle={`OFÍCIO DE ENCAMINHAMENTO - ${selectedReferral.studentName}`}
          documentType="OFÍCIO ESCOLAR"
          documentContentText={`OFÍCIO DE ENCAMINHAMENTO Nº ${selectedReferral.protocolNumber}\nESTUDANTE: ${selectedReferral.studentName}\nÓRGÃO DESTINO: ${selectedReferral.destination}\nSÍNTESE: ${selectedReferral.reason}\nPARECER: ${selectedReferral.psychosocialOpinion}`}
          allowedRoles={['DIRETOR', 'PSICOLOGO', 'ASSISTENTE_SOCIAL', 'COORDENADOR', 'ADMIN']}
          defaultSignerRole={signRoleType === 'DIRETOR' ? 'DIRETOR ESCOLAR' : selectedReferral.professionalRole}
          onSignatureComplete={handleSignatureComplete}
        />
      )}

    </div>
  );
};

export default PsychosocialExternalNetworkManager;
