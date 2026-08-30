import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  HeartPulse,
  AlertTriangle,
  PhoneCall,
  ShieldCheck,
  FileText,
  Clock,
  User,
  Users,
  MapPin,
  CheckSquare,
  Square,
  Printer,
  Search,
  Plus,
  Activity,
  Ambulance,
  Flame,
  Stethoscope,
  Info,
  Calendar,
  Save,
  Trash2,
  Share2,
  ChevronRight,
  ShieldAlert,
  BookOpen,
  Send,
  Sparkles
} from 'lucide-react';
import { SchoolHealthIncident, HealthIncidentType, HealthSeverityLevel, HealthIncidentOutcome } from '../types';
import { INITIAL_STUDENTS } from '../constants/initialData';
import { supabase } from '../supabaseClient';

interface SchoolHealthEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudent?: any;
  userRole?: string;
  userName?: string;
  originModule: 'COORDENACAO' | 'CIVICO_MILITAR';
}

const STORAGE_KEY = 'school_health_incidents_v1';

export const SchoolHealthEmergencyModal: React.FC<SchoolHealthEmergencyModalProps> = ({
  isOpen,
  onClose,
  initialStudent,
  userRole = 'GESTAO',
  userName = 'Servidor Responsável',
  originModule
}) => {
  const [activeTab, setActiveTab] = useState<'CHECKLIST' | 'FORMULARIO' | 'HISTORICO' | 'GUIA_LEI_LUCAS'>('CHECKLIST');
  const [dbStudents, setDbStudents] = useState<any[]>(INITIAL_STUDENTS);
  const [incidents, setIncidents] = useState<SchoolHealthIncident[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('TODOS');
  const [selectedIncidentForPrint, setSelectedIncidentForPrint] = useState<SchoolHealthIncident | null>(null);
  const [printDocType, setPrintDocType] = useState<'FICHA_LEI_LUCAS' | 'ENCAMINHAMENTO_SAMU' | 'TERMO_LIBERACAO'>('FICHA_LEI_LUCAS');

  // Form State
  const [selectedStudent, setSelectedStudent] = useState<any>(initialStudent || null);
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<SchoolHealthIncident>>({
    incident_type: 'MAL_ESTAR_SUBITO',
    incident_date: new Date().toLocaleDateString('sv-SE'),
    incident_time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    location: 'Sala de Aula',
    severity_level: 'URGENCIA_AMARELA',
    symptoms_description: '',
    first_aid_actions: '',
    emergency_service_called: 'NENHUM',
    emergency_protocol_number: '',
    emergency_call_time: '',
    parent_contacted_name: '',
    parent_contacted_phone: '',
    parent_contact_time: '',
    parent_decision: 'Responsável informado e a caminho da unidade escolar para retirada do discente.',
    outcome: 'LIBERADO_RESPONSAVEL',
    escort_staff_name: '',
    attendant_name: userName,
    observations: ''
  });

  // Checklist Checkboxes State
  const [redChecks, setRedChecks] = useState<{ [key: string]: boolean }>({
    step1_primary_check: true,
    step2_first_aid: false,
    step3_call_samu: false,
    step4_call_parents: false,
    step5_no_medication_alert: true,
    step6_escort_assigned: false,
    step7_record_signed: false
  });

  const [yellowChecks, setYellowChecks] = useState<{ [key: string]: boolean }>({
    step1_isolate_rest: true,
    step2_vital_signs: false,
    step3_check_preexisting: false,
    step4_contact_guardian: false,
    step5_release_term: false
  });

  // Carregar estudantes do Supabase ou initialData
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('Nome', { ascending: true });
        if (!error && data && data.length > 0) {
          setDbStudents(data);
        }
      } catch (err) {
        console.warn('Usando base local de alunos para saúde:', err);
      }
    };
    fetchStudents();
  }, []);

  // Carregar histórico de incidentes
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const { data, error } = await supabase
          .from('school_health_incidents')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setIncidents(data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return;
        }
      } catch (e) {
        console.warn('Erro ao buscar incidentes de saúde do Supabase:', e);
      }

      // Fallback LocalStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setIncidents(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    };

    if (isOpen) {
      loadIncidents();
    }
  }, [isOpen]);

  // Se initialStudent mudar, atualizar formulário
  useEffect(() => {
    if (initialStudent) {
      setSelectedStudent(initialStudent);
      setFormData(prev => ({
        ...prev,
        student_id: String(initialStudent.CodigoAluno || initialStudent.id || initialStudent.studentId || ''),
        student_name: initialStudent.Nome || initialStudent.name || initialStudent.studentName || '',
        class_name: initialStudent.Turma || initialStudent.class || initialStudent.className || '',
        parent_contacted_name: initialStudent.NomeResponsavel || initialStudent.guardian_name || '',
        parent_contacted_phone: initialStudent.TelefoneContato || initialStudent.contact_phone || ''
      }));
    }
  }, [initialStudent]);

  if (!isOpen) return null;

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      student_id: String(student.CodigoAluno || student.id || ''),
      student_name: student.Nome || student.name || '',
      class_name: student.Turma || student.class || '',
      parent_contacted_name: student.NomeResponsavel || student.guardian_name || '',
      parent_contacted_phone: student.TelefoneContato || student.contact_phone || ''
    }));
    setStudentSearchInput('');
    setIsStudentDropdownOpen(false);
  };

  const handleSaveIncident = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.student_name || !formData.symptoms_description) {
      alert('Por favor, selecione o discente e descreva os sintomas/fatos da ocorrência.');
      return;
    }

    const newIncident: SchoolHealthIncident = {
      id: `health-${Date.now()}`,
      student_id: formData.student_id || selectedStudent?.CodigoAluno || '---',
      student_name: formData.student_name || selectedStudent?.Nome || 'Discente Não Identificado',
      class_name: formData.class_name || selectedStudent?.Turma || '---',
      incident_type: (formData.incident_type as HealthIncidentType) || 'MAL_ESTAR_SUBITO',
      incident_date: formData.incident_date || new Date().toLocaleDateString('sv-SE'),
      incident_time: formData.incident_time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      location: formData.location || 'Sala de Aula',
      severity_level: (formData.severity_level as HealthSeverityLevel) || 'URGENCIA_AMARELA',
      symptoms_description: formData.symptoms_description || '',
      first_aid_actions: formData.first_aid_actions || 'Acolhimento, repouso e hidratação.',
      emergency_service_called: formData.emergency_service_called || 'NENHUM',
      emergency_protocol_number: formData.emergency_protocol_number || '',
      emergency_call_time: formData.emergency_call_time || '',
      parent_contacted_name: formData.parent_contacted_name || selectedStudent?.NomeResponsavel || '',
      parent_contacted_phone: formData.parent_contacted_phone || selectedStudent?.TelefoneContato || '',
      parent_contact_time: formData.parent_contact_time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      parent_decision: formData.parent_decision || 'Responsável notificado.',
      outcome: (formData.outcome as HealthIncidentOutcome) || 'LIBERADO_RESPONSAVEL',
      escort_staff_name: formData.escort_staff_name || '',
      attendant_name: userName || 'Equipe Escolar',
      module_origin: originModule,
      observations: formData.observations || '',
      created_at: new Date().toISOString(),
      timestamp: Date.now()
    };

    // Salvar no estado e localStorage
    const updatedList = [newIncident, ...incidents];
    setIncidents(updatedList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

    // Salvar no Supabase (não-bloqueante)
    try {
      await supabase.from('school_health_incidents').insert([newIncident]);
    } catch (err) {
      console.warn('Erro ao persistir no Supabase, mantido localmente:', err);
    }

    alert('Atendimento de saúde / ocorrência registrado com sucesso!');
    setSelectedIncidentForPrint(newIncident);
    setActiveTab('HISTORICO');
  };

  const handleDeleteIncident = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro de atendimento?')) return;

    const updated = incidents.filter(i => i.id !== id);
    setIncidents(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    try {
      await supabase.from('school_health_incidents').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = !searchTerm ||
      inc.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.symptoms_description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'TODOS' || inc.severity_level === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const filteredStudents = dbStudents.filter(s => {
    if (!studentSearchInput) return true;
    const term = studentSearchInput.toLowerCase();
    return (s.Nome || '').toLowerCase().includes(term) || (s.Turma || '').toLowerCase().includes(term);
  }).slice(0, 15);

  const handlePrintDocument = (incident: SchoolHealthIncident, docType: 'FICHA_LEI_LUCAS' | 'ENCAMINHAMENTO_SAMU' | 'TERMO_LIBERACAO') => {
    setSelectedIncidentForPrint(incident);
    setPrintDocType(docType);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800 my-auto overflow-hidden">
        
        {/* HEADER TIMBRADO INSTITUCIONAL */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-950 via-rose-900 to-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 border-b border-rose-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-rose-300 border border-white/20 font-black text-xl shadow-md shrink-0">
              <HeartPulse size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-white uppercase tracking-tight">
                  Protocolo de Saúde Escolar & Primeiros Socorros
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500/30 border border-rose-400/40 text-rose-200">
                  Lei Lucas nº 13.722/18
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/30 border border-blue-400/40 text-blue-200">
                  Módulo: {originModule === 'COORDENACAO' ? 'Coordenação Pedagógica' : 'Cívico-Militar'}
                </span>
              </div>
              <p className="text-[10px] text-rose-200/80 font-medium uppercase tracking-wider mt-0.5">
                Escola Estadual Cívico-Militar André Antônio Maggi • Triagem, Acolhimento e Emergências
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-black/30 p-1 rounded-2xl border border-white/10 text-[10px] font-black uppercase">
              <button
                type="button"
                onClick={() => setActiveTab('CHECKLIST')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'CHECKLIST' ? 'bg-white text-rose-950 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <CheckSquare size={12} /> Checklist
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('FORMULARIO')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'FORMULARIO' ? 'bg-white text-rose-950 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Plus size={12} /> Novo Registro
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('HISTORICO')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'HISTORICO' ? 'bg-white text-rose-950 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Clock size={12} /> Histórico ({incidents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('GUIA_LEI_LUCAS')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'GUIA_LEI_LUCAS' ? 'bg-amber-400 text-slate-950 shadow-sm font-black' : 'text-amber-300 hover:text-white'
                }`}
              >
                <BookOpen size={12} /> Guia Rápido
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all"
              title="Fechar Janela"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* CORPO DO MODAL (SCROLL INTERNO) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">

          {/* ============================================================ */}
          {/* ABA 1: CHECKLIST DE AÇÃO RÁPIDA (LEI LUCAS & SAMU) */}
          {/* ============================================================ */}
          {activeTab === 'CHECKLIST' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* BANNER DE ALERTA MÉDICO */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3.5 text-rose-950">
                <ShieldAlert size={24} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wide">
                    Regra Geral de Segurança em Saúde Escolar (Protocolo CBM-MT / SAMU)
                  </h4>
                  <p className="text-[11px] text-rose-900 mt-1 leading-relaxed">
                    <strong>NUNCA administre qualquer medicamento ao estudante</strong> (nem analgésicos ou antitérmicos simples como dipirona ou paracetamol), exceto se houver prescrição médica prévia arquivada na secretaria com autorização expressa e escrita dos pais. Em caso de agravo súbito, preste os primeiros socorros imediatos e acione o SAMU 192 ou Bombeiros 193.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* BLOCO CÓDIGO VERMELHO: EMERGÊNCIA GRAVE / ACIDENTE */}
                <div className="p-5 rounded-3xl bg-red-50/50 border-2 border-red-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-red-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                      <h4 className="text-xs font-black text-red-950 uppercase tracking-wide">
                        🚨 Código Vermelho: Emergência / Acidente Grave
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-red-600 text-white">
                      Risco Iminente
                    </span>
                  </div>

                  <p className="text-[10px] text-red-900 italic">
                    Aplicável em: Asfixia/Engasgo total, Parada Respiratória, Convulsão Severa, Traumatismo Craniano c/ Perda de Consciência, Fratura Exposta, Hemorragia Abundante, Choque Anafilático.
                  </p>

                  <div className="space-y-2.5">
                    {[
                      { key: 'step1_primary_check', title: '1. Avaliação Primária e Vias Aéreas', desc: 'Checar responsividade, respiração e pulso. Desobstruir vias aéreas sem movimentar a coluna se houver trauma.' },
                      { key: 'step2_first_aid', title: '2. Primeiros Socorros Imediatos (Lei Lucas)', desc: 'Manobra de Heimlich em engasgos; Posição Lateral de Segurança em convulsões (proteger cabeça); Compressão direta em hemorragias.' },
                      { key: 'step3_call_samu', title: '3. Acionar SAMU 192 ou Bombeiros 193', desc: 'Informar endereço exato da escola, idade do aluno, estado de consciência e sintomas observados. Anotar protocolo.' },
                      { key: 'step4_call_parents', title: '4. Convocação Imediata dos Pais/Responsáveis', desc: 'Telefonar imediatamente para o contato de emergência. Informar o fato e orientar sobre encaminhamento ao hospital/UPA.' },
                      { key: 'step5_no_medication_alert', title: '5. Alerta: Proibição de Medicação', desc: 'Não oferecer líquidos ou medicamentos ao estudante em crise ou inconsciente.' },
                      { key: 'step6_escort_assigned', title: '6. Acompanhamento Escolar na Ambulância', desc: 'Designar um servidor/gestor para acompanhar o aluno na viatura médica até a chegada dos pais na unidade de saúde.' },
                      { key: 'step7_record_signed', title: '7. Lavratura da Ficha de Ocorrência de Saúde', desc: 'Preencher formalmente a Ficha de Atendimento de Primeiros Socorros e entregar cópia aos socorristas.' }
                    ].map(step => (
                      <div
                        key={step.key}
                        onClick={() => setRedChecks(p => ({ ...p, [step.key]: !p[step.key] }))}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          redChecks[step.key] ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-red-100'
                        }`}
                      >
                        <div className="mt-0.5 text-red-600 shrink-0">
                          {redChecks[step.key] ? <CheckSquare size={16} className="text-emerald-600" /> : <Square size={16} className="text-slate-300" />}
                        </div>
                        <div>
                          <span className={`text-[10px] font-black uppercase ${redChecks[step.key] ? 'text-emerald-950' : 'text-red-950'}`}>
                            {step.title}
                          </span>
                          <p className="text-[9px] text-slate-600 mt-0.5 leading-snug">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          severity_level: 'EMERGENCIA_VERMELHA',
                          emergency_service_called: 'SAMU_192',
                          incident_type: 'ACIDENTE_ESCOLAR'
                        }));
                        setActiveTab('FORMULARIO');
                      }}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Plus size={12} /> Registrar Ocorrência Vermelha
                    </button>
                  </div>
                </div>

                {/* BLOCO CÓDIGO AMARELO/VERDE: MAL-ESTAR SÚBITO / URGÊNCIA MODERADA */}
                <div className="p-5 rounded-3xl bg-amber-50/50 border-2 border-amber-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                        🟡 Código Amarelo / Verde: Mal-Estar Súbito
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-amber-500 text-white">
                      Urgência Moderada / Leve
                    </span>
                  </div>

                  <p className="text-[10px] text-amber-900 italic">
                    Aplicável em: Febre alta súbita, Crise de Ansiedade/Pânico, Desmaio breve com recuperação, Vômito/Diarreia, Cólica intensa, Cefaleia forte, Entorse ou escoriação.
                  </p>

                  <div className="space-y-2.5">
                    {[
                      { key: 'step1_isolate_rest', title: '1. Acolhimento em Ambiente Arejado', desc: 'Conduzir o aluno à Sala de Acolhimento/Monitoria. Manter ambiente calmo, ventilado e com água potável.' },
                      { key: 'step2_vital_signs', title: '2. Aferição de Sinais e Queixas', desc: 'Verificar temperatura axilar com termômetro digital e registrar queixas relatadas pelo estudante.' },
                      { key: 'step3_check_preexisting', title: '3. Verificação de Histórico Médico', desc: 'Consultar ficha de matrícula sobre alergias, asma, diabetes ou uso contínuo de medicação prescrita.' },
                      { key: 'step4_contact_guardian', title: '4. Comunicação com Responsável Legal', desc: 'Contatar pai/mãe para informar o estado e solicitar a retirada do aluno ou orientações familiares.' },
                      { key: 'step5_release_term', title: '5. Assinatura do Termo de Liberação', desc: 'Ao entregar o estudante ao responsável, colher assinatura formal no Termo de Liberação por Saúde.' }
                    ].map(step => (
                      <div
                        key={step.key}
                        onClick={() => setYellowChecks(p => ({ ...p, [step.key]: !p[step.key] }))}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          yellowChecks[step.key] ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-amber-100'
                        }`}
                      >
                        <div className="mt-0.5 text-amber-600 shrink-0">
                          {yellowChecks[step.key] ? <CheckSquare size={16} className="text-emerald-600" /> : <Square size={16} className="text-slate-300" />}
                        </div>
                        <div>
                          <span className={`text-[10px] font-black uppercase ${yellowChecks[step.key] ? 'text-emerald-950' : 'text-amber-950'}`}>
                            {step.title}
                          </span>
                          <p className="text-[9px] text-slate-600 mt-0.5 leading-snug">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          severity_level: 'URGENCIA_AMARELA',
                          incident_type: 'MAL_ESTAR_SUBITO'
                        }));
                        setActiveTab('FORMULARIO');
                      }}
                      className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Plus size={12} /> Registrar Mal-Estar / Amarelo
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* ABA 2: FORMULÁRIO DE REGISTRO DE ATENDIMENTO DE SAÚDE */}
          {/* ============================================================ */}
          {activeTab === 'FORMULARIO' && (
            <form onSubmit={handleSaveIncident} className="space-y-6 animate-fadeIn">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Stethoscope size={16} className="text-rose-600" />
                    Registro de Atendimento de Saúde & Acidente Escolar
                  </h4>
                  <p className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">
                    Preencha os dados circunstanciados conforme a Lei Lucas (Lei 13.722/18) e o ECA
                  </p>
                </div>
                <span className="text-[9px] font-mono bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 font-bold">
                  Responsável: {userName}
                </span>
              </div>

              {/* SELEÇÃO DO ESTUDANTE */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                  Identificação do Discente Atendido
                </label>

                {selectedStudent ? (
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 font-black text-sm flex items-center justify-center">
                        {(selectedStudent.Nome || selectedStudent.name || 'A').charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 uppercase">
                          {selectedStudent.Nome || selectedStudent.name}
                        </div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase">
                          Turma: {selectedStudent.Turma || selectedStudent.class || 'Não informada'} • Matrícula: {selectedStudent.CodigoAluno || selectedStudent.id || '---'}
                        </div>
                        {(selectedStudent.NomeResponsavel || selectedStudent.TelefoneContato) && (
                          <div className="text-[9px] text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
                            <Users size={10} /> Responsável: {selectedStudent.NomeResponsavel || '---'} ({selectedStudent.TelefoneContato || 'Sem telefone'})
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      className="text-[9px] font-black uppercase text-slate-400 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-all"
                    >
                      Trocar Aluno
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Digite o nome ou turma do aluno para buscar..."
                      value={studentSearchInput}
                      onChange={e => {
                        setStudentSearchInput(e.target.value);
                        setIsStudentDropdownOpen(true);
                      }}
                      onFocus={() => setIsStudentDropdownOpen(true)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-500"
                    />
                    {isStudentDropdownOpen && (
                      <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                        {filteredStudents.map(s => (
                          <button
                            key={s.CodigoAluno || s.id}
                            type="button"
                            onClick={() => handleSelectStudent(s)}
                            className="w-full text-left p-3 hover:bg-rose-50 text-xs font-bold transition-colors flex justify-between items-center"
                          >
                            <div>
                              <span className="text-slate-900 block">{s.Nome || s.name}</span>
                              <span className="text-[9px] text-slate-400 font-normal uppercase">{s.Turma || s.class} • Código: {s.CodigoAluno}</span>
                            </div>
                            <span className="text-[9px] text-rose-600 font-black uppercase">Selecionar</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DADOS DA OCORRÊNCIA (DATA, HORA, LOCAL, TIPO, GRAVIDADE) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Data</label>
                  <input
                    type="date"
                    value={formData.incident_date}
                    onChange={e => setFormData(prev => ({ ...prev, incident_date: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Hora do Ocorrido</label>
                  <input
                    type="time"
                    value={formData.incident_time}
                    onChange={e => setFormData(prev => ({ ...prev, incident_time: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Local do Incidente</label>
                  <select
                    value={formData.location}
                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  >
                    <option value="Sala de Aula">Sala de Aula</option>
                    <option value="Quadra Poliesportiva">Quadra Poliesportiva</option>
                    <option value="Pátio Escolar">Pátio Escolar / Recreio</option>
                    <option value="Refeitório">Refeitório</option>
                    <option value="Sanitários">Sanitários</option>
                    <option value="Corredor / Escadaria">Corredor / Escadaria</option>
                    <option value="Entrada / Portão Principal">Entrada / Portão Principal</option>
                    <option value="Laboratório / Biblioteca">Laboratório / Biblioteca</option>
                    <option value="Outro Local">Outro Local</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Tipo de Incidente</label>
                  <select
                    value={formData.incident_type}
                    onChange={e => setFormData(prev => ({ ...prev, incident_type: e.target.value as HealthIncidentType }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  >
                    <option value="MAL_ESTAR_SUBITO">Mal-Estar Súbito</option>
                    <option value="ACIDENTE_ESCOLAR">Acidente Escolar (Queda/Corte)</option>
                    <option value="CRISE_ANSIEDADE_PANICO">Crise de Ansiedade / Pânico</option>
                    <option value="CRISE_CONVULSIVA">Crise Convulsiva</option>
                    <option value="HIPOGLICEMIA_DIABETES">Hipoglicemia / Diabetes</option>
                    <option value="REACAO_ALERGICA">Reação Alérgica / Anafilaxia</option>
                    <option value="TRAUMA_QUEDA">Trauma / Suspeita de Fratura</option>
                    <option value="OUTRO">Outra Queixa de Saúde</option>
                  </select>
                </div>

              </div>

              {/* CLASSIFICAÇÃO DE RISCO (TRIAGEM) */}
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                  Classificação de Risco & Triagem
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, severity_level: 'EMERGENCIA_VERMELHA' }))}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2 ${
                      formData.severity_level === 'EMERGENCIA_VERMELHA'
                        ? 'bg-red-600 text-white border-red-700 shadow-md'
                        : 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">🚨</div>
                    <div>
                      <div className="text-[10px] font-black uppercase">Vermelho: Emergência</div>
                      <div className="text-[8px] opacity-90 leading-tight">Risco Iminente / SAMU</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, severity_level: 'URGENCIA_AMARELA' }))}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2 ${
                      formData.severity_level === 'URGENCIA_AMARELA'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                        : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">🟡</div>
                    <div>
                      <div className="text-[10px] font-black uppercase">Amarelo: Urgência</div>
                      <div className="text-[8px] opacity-90 leading-tight">Retirada pelos Pais</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, severity_level: 'LEVE_VERDE' }))}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2 ${
                      formData.severity_level === 'LEVE_VERDE'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">🟢</div>
                    <div>
                      <div className="text-[10px] font-black uppercase">Verde: Leve</div>
                      <div className="text-[8px] opacity-90 leading-tight">Acolhimento Escolar</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* SINTOMAS E PRIMEIROS SOCORROS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Sintomas Observados e Relato dos Fatos *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva detalhadamente os sinais vitais, queixas do aluno, local do trauma ou motivo do mal-estar..."
                    value={formData.symptoms_description}
                    onChange={e => setFormData(prev => ({ ...prev, symptoms_description: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Primeiros Socorros Prestados (Lei Lucas) *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ações adotadas: repouso, hidratação, aferição de temperatura, compressa de gelo, imobilização provisória, posição lateral de segurança, etc."
                    value={formData.first_aid_actions}
                    onChange={e => setFormData(prev => ({ ...prev, first_aid_actions: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              {/* ACIONAMENTO DE EMERGÊNCIA & CONTATO COM PAIS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-rose-50/40 border border-rose-100">
                
                {/* LADO ESQUERDO: SAMU / BOMBEIROS */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-rose-950 uppercase">
                    <Ambulance size={14} className="text-rose-600" />
                    Acionamento de Socorro Especializado
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Serviço Chamado</label>
                    <select
                      value={formData.emergency_service_called}
                      onChange={e => setFormData(prev => ({ ...prev, emergency_service_called: e.target.value as any }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                    >
                      <option value="NENHUM">Nenhum (Resolvido internamente / Responsáveis)</option>
                      <option value="SAMU_192">SAMU 192</option>
                      <option value="BOMBEIROS_193">Corpo de Bombeiros Militar 193</option>
                    </select>
                  </div>

                  {formData.emergency_service_called !== 'NENHUM' && (
                    <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                      <div>
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nº Protocolo SAMU/CBM</label>
                        <input
                          type="text"
                          placeholder="Ex: 2026-98124"
                          value={formData.emergency_protocol_number}
                          onChange={e => setFormData(prev => ({ ...prev, emergency_protocol_number: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Horário da Ligação</label>
                        <input
                          type="time"
                          value={formData.emergency_call_time}
                          onChange={e => setFormData(prev => ({ ...prev, emergency_call_time: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* LADO DIREITO: CONTATO COM PAIS / RESPONSÁVEIS */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase">
                    <PhoneCall size={14} className="text-blue-600" />
                    Comunicação com Pais / Responsáveis
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Responsável Contatado</label>
                      <input
                        type="text"
                        placeholder="Nome do pai/mãe/tutor"
                        value={formData.parent_contacted_name}
                        onChange={e => setFormData(prev => ({ ...prev, parent_contacted_name: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Telefone / Horário</label>
                      <input
                        type="text"
                        placeholder="(66) 99999-9999"
                        value={formData.parent_contacted_phone}
                        onChange={e => setFormData(prev => ({ ...prev, parent_contacted_phone: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Resposta / Deliberação da Família</label>
                    <input
                      type="text"
                      placeholder="Ex: Mãe avisada, compareceu na escola para retirada às 10:20h."
                      value={formData.parent_decision}
                      onChange={e => setFormData(prev => ({ ...prev, parent_decision: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

              </div>

              {/* DESFECHO DO ATENDIMENTO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Desfecho do Aluno</label>
                  <select
                    value={formData.outcome}
                    onChange={e => setFormData(prev => ({ ...prev, outcome: e.target.value as HealthIncidentOutcome }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900"
                  >
                    <option value="RETORNOU_AULA">Retornou à Sala de Aula (Recuperado)</option>
                    <option value="LIBERADO_RESPONSAVEL">Liberado e Entregue ao Responsável Legal</option>
                    <option value="REMOVIDO_SAMU_UPA">Removido pelo SAMU para UPA / Hospital</option>
                    <option value="REMOVIDO_BOMBEIROS">Removido pelos Bombeiros para Hospital</option>
                    <option value="ENCAMINHADO_PSICOSSOCIAL">Encaminhado ao Setor Psicossocial</option>
                  </select>
                </div>

                {formData.outcome?.includes('REMOVIDO') && (
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Servidor Escolar Acompanhante na Ambulância</label>
                    <input
                      type="text"
                      placeholder="Nome do monitor/coordenador que acompanhou o aluno"
                      value={formData.escort_staff_name}
                      onChange={e => setFormData(prev => ({ ...prev, escort_staff_name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* BOTÕES DE SUBMIT */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('CHECKLIST')}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  Voltar ao Checklist
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all"
                >
                  <Save size={14} /> Salvar e Gerar Ficha de Atendimento
                </button>
              </div>

            </form>
          )}

          {/* ============================================================ */}
          {/* ABA 3: HISTÓRICO DE ATENDIMENTOS DE SAÚDE & ACIDENTES */}
          {/* ============================================================ */}
          {activeTab === 'HISTORICO' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Clock size={16} className="text-rose-600" />
                    Livro de Registro de Ocorrências de Saúde e Acidentes Escolares
                  </h4>
                  <p className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">
                    Histórico consolidado compartilhado entre Coordenação Pedagógica e Monitoria Militar
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por aluno, turma ou queixa..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-900 w-56"
                    />
                  </div>

                  <select
                    value={severityFilter}
                    onChange={e => setSeverityFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700"
                  >
                    <option value="TODOS">Todas Gravidades</option>
                    <option value="EMERGENCIA_VERMELHA">🚨 Vermelho (Emergência)</option>
                    <option value="URGENCIA_AMARELA">🟡 Amarelo (Urgência)</option>
                    <option value="LEVE_VERDE">🟢 Verde (Leve)</option>
                  </select>
                </div>
              </div>

              {/* LISTAGEM DE INCIDENTES */}
              {filteredIncidents.length > 0 ? (
                <div className="space-y-3">
                  {filteredIncidents.map(inc => (
                    <div
                      key={inc.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        inc.severity_level === 'EMERGENCIA_VERMELHA'
                          ? 'bg-red-50/50 border-red-200'
                          : inc.severity_level === 'URGENCIA_AMARELA'
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-emerald-50/50 border-emerald-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                            inc.severity_level === 'EMERGENCIA_VERMELHA'
                              ? 'bg-red-600 text-white'
                              : inc.severity_level === 'URGENCIA_AMARELA'
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}>
                            {inc.severity_level === 'EMERGENCIA_VERMELHA' ? '🚨 Emergência Vermelha' : inc.severity_level === 'URGENCIA_AMARELA' ? '🟡 Urgência Amarela' : '🟢 Leve Verde'}
                          </span>
                          <span className="text-xs font-black text-slate-900 uppercase">
                            {inc.student_name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            Turma: {inc.class_name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            Local: {inc.location}
                          </span>
                        </div>

                        <div className="text-[9px] font-mono text-slate-500 font-bold">
                          {new Date(inc.incident_date).toLocaleDateString('pt-BR')} às {inc.incident_time}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] text-slate-700 bg-white/70 p-3 rounded-xl border border-slate-200/60 my-2">
                        <div>
                          <strong className="text-slate-900 uppercase block text-[9px]">Sintomas / Queixa:</strong>
                          <p className="mt-0.5 italic text-slate-600">"{inc.symptoms_description}"</p>
                        </div>
                        <div>
                          <strong className="text-slate-900 uppercase block text-[9px]">Primeiros Socorros Prestados:</strong>
                          <p className="mt-0.5 text-slate-600">{inc.first_aid_actions}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 text-[9px] font-medium text-slate-500 border-t border-slate-200/50">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span><strong>Socorro:</strong> {inc.emergency_service_called} {inc.emergency_protocol_number && `(Prot: ${inc.emergency_protocol_number})`}</span>
                          <span><strong>Família:</strong> {inc.parent_contacted_name || 'Responsável'} {inc.parent_contacted_phone && `(${inc.parent_contacted_phone})`}</span>
                          <span><strong>Desfecho:</strong> <span className="font-bold text-slate-800 uppercase">{inc.outcome}</span></span>
                        </div>

                        {/* BOTÕES DE DOCUMENTO / IMPRESSÃO */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePrintDocument(inc, 'FICHA_LEI_LUCAS')}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs"
                            title="Imprimir Ficha Oficial de Atendimento (Lei Lucas)"
                          >
                            <Printer size={10} /> Ficha Lei Lucas
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrintDocument(inc, 'TERMO_LIBERACAO')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs"
                            title="Imprimir Termo de Liberação ao Responsável"
                          >
                            <FileText size={10} /> Termo Liberação
                          </button>

                          {inc.emergency_service_called !== 'NENHUM' && (
                            <button
                              type="button"
                              onClick={() => handlePrintDocument(inc, 'ENCAMINHAMENTO_SAMU')}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs"
                              title="Imprimir Guia de Encaminhamento SAMU/Hospital"
                            >
                              <Ambulance size={10} /> Guia SAMU
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteIncident(inc.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Excluir Registro"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-50 border border-slate-100 rounded-3xl text-slate-400 space-y-2">
                  <HeartPulse size={36} className="mx-auto text-rose-400" />
                  <h4 className="text-xs font-black uppercase text-slate-700">Nenhum atendimento registrado</h4>
                  <p className="text-[10px] text-slate-400">
                    Utilize a aba "Novo Registro" para lavrar atendimentos de saúde ou acidentes escolares.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/* ABA 4: GUIA RÁPIDO DE PRIMEIROS SOCORROS (LEI LUCAS) */}
          {/* ============================================================ */}
          {activeTab === 'GUIA_LEI_LUCAS' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-tight flex items-center gap-2">
                    <BookOpen size={16} className="text-amber-600" />
                    Manual Operacional de Primeiros Socorros Escolares (Lei Lucas nº 13.722/18)
                  </h4>
                  <p className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">
                    Procedimentos imediatos padronizados para o corpo docente, monitores militares e equipe gestora
                  </p>
                </div>
                <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                  SAMU 192 • Bombeiros 193
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. ENGASGO / ASFIXIA */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-rose-950 uppercase flex items-center gap-1.5">
                      🍞 Engasgo / Obstrução de Vias Aéreas
                    </h5>
                    <span className="text-[8px] font-black bg-rose-200 text-rose-900 px-2 py-0.5 rounded uppercase">Manobra Heimlich</span>
                  </div>
                  <ul className="text-[10px] text-slate-700 space-y-1 list-disc pl-4 leading-relaxed">
                    <li>Posicione-se atrás do aluno em pé ou sentado;</li>
                    <li>Feche o punho de uma mão e posicione-o acima do umbigo e abaixo do tórax;</li>
                    <li>Com a outra mão sobre o punho, realize compressões firmes para dentro e para cima (em "J");</li>
                    <li>Repita até o corpo estranho ser expelido. Se desmaiar, deite o aluno e inicie RCP enquanto aguarda o SAMU 192.</li>
                  </ul>
                </div>

                {/* 2. CRISE CONVULSIVA */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-rose-950 uppercase flex items-center gap-1.5">
                      ⚡ Crise Convulsiva / Epilepsia
                    </h5>
                    <span className="text-[8px] font-black bg-purple-200 text-purple-900 px-2 py-0.5 rounded uppercase">Proteger Cabeça</span>
                  </div>
                  <ul className="text-[10px] text-slate-700 space-y-1 list-disc pl-4 leading-relaxed">
                    <li>Afaste objetos pontiagudos ou duros ao redor;</li>
                    <li>Coloque um casaco ou apoio macio sob a cabeça do aluno;</li>
                    <li><strong>NUNCA coloque a mão ou objetos dentro da boca do aluno</strong>;</li>
                    <li>Após cessarem as contrações, vire o estudante de lado (Posição Lateral de Segurança);</li>
                    <li>Monitore a duração da crise. Se durar mais de 3 a 5 minutos, acione o SAMU 192 imediatamente.</li>
                  </ul>
                </div>

                {/* 3. DESMAIO / SÍNCOPE */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-amber-950 uppercase flex items-center gap-1.5">
                      💨 Desmaio / Queda de Pressão
                    </h5>
                    <span className="text-[8px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded uppercase">Elevar Pernas</span>
                  </div>
                  <ul className="text-[10px] text-slate-700 space-y-1 list-disc pl-4 leading-relaxed">
                    <li>Deite o estudante de costas e eleve as pernas cerca de 30 cm para facilitar o retorno sanguíneo ao cérebro;</li>
                    <li>Afrouxe roupas apertadas (golas, cintos) e garanta ventilação;</li>
                    <li>Não jogue água no rosto nem ofereça alimentos ou remédios enquanto estiver inconsciente;</li>
                    <li>Após acordar, mantenha-o sentado por alguns minutos antes de se levantar.</li>
                  </ul>
                </div>

                {/* 4. TRAUMA / QUEDA COM SUSPEITA DE FRATURA */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-rose-950 uppercase flex items-center gap-1.5">
                      🦴 Trauma / Queda com Suspeita de Fratura
                    </h5>
                    <span className="text-[8px] font-black bg-red-200 text-red-900 px-2 py-0.5 rounded uppercase">Imobilizar</span>
                  </div>
                  <ul className="text-[10px] text-slate-700 space-y-1 list-disc pl-4 leading-relaxed">
                    <li>Não tente colocar o osso no lugar ou movimentar o membro lesionado;</li>
                    <li>Imobilize o membro na posição encontrada utilizando talas improvisadas (papelão, faixas);</li>
                    <li>Aplique bolsa de gelo envolta em pano para conter o inchaço;</li>
                    <li>Se houver suspeita de trauma na cabeça ou coluna, não mova o aluno e acione o SAMU 192.</li>
                  </ul>
                </div>

                {/* 5. CORTES E HEMORRAGIAS */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-red-950 uppercase flex items-center gap-1.5">
                      🩹 Cortes e Hemorragias
                    </h5>
                    <span className="text-[8px] font-black bg-red-200 text-red-900 px-2 py-0.5 rounded uppercase">Pressão Direta</span>
                  </div>
                  <ul className="text-[10px] text-slate-700 space-y-1 list-disc pl-4 leading-relaxed">
                    <li>Lave as mãos e use luvas descartáveis do kit de primeiros socorros;</li>
                    <li>Pressione firmemente o ferimento com gaze ou pano limpo por 5 a 10 minutos;</li>
                    <li>Não remova curativos encharcados; adicione novas gazes por cima;</li>
                    <li>Se o corte for profundo ou não parar de sangrar, encaminhe para atendimento médico/UPA.</li>
                  </ul>
                </div>

                {/* 6. CRISE DE ANSIEDADE / PÂNICO */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-indigo-950 uppercase flex items-center gap-1.5">
                      🧠 Crise de Ansiedade / Hiperventilação
                    </h5>
                    <span className="text-[8px] font-black bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded uppercase">Acolhimento Calmo</span>
                  </div>
                  <ul className="text-[10px] text-slate-700 space-y-1 list-disc pl-4 leading-relaxed">
                    <li>Leve o estudante para um local silencioso e sem aglomerações;</li>
                    <li>Oriente a respiração diafragmática pausada (puxe pelo nariz contando até 4, solte pela boca contando até 4);</li>
                    <li>Valide os sentimentos sem julgamentos (*"Você está seguro aqui, vamos respirar juntos"*);</li>
                    <li>Acione o setor Psicossocial e comunique a família para acolhimento integrado.</li>
                  </ul>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* ============================================================ */}
      {/* SEÇÃO OCULTA: DOCUMENTOS OFICIAIS PARA IMPRESSÃO (PRINT ONLY) */}
      {/* ============================================================ */}
      {selectedIncidentForPrint && (
        <div id="print-health-document" className="hidden print:block fixed inset-0 bg-white p-8 z-50 text-slate-900">
          
          {/* CABEÇALHO OFICIAL MT */}
          <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
            <h1 className="text-sm font-black uppercase tracking-wider">Governo do Estado de Mato Grosso</h1>
            <h2 className="text-xs font-bold uppercase">Secretaria de Estado de Educação — SEDUC/MT</h2>
            <h3 className="text-sm font-black uppercase">Escola Estadual Cívico-Militar André Antônio Maggi</h3>
            <p className="text-[10px] text-slate-600 font-medium">Colíder - MT • Coordenação Pedagógica & Gestão Educacional Militar</p>
            <div className="pt-2">
              <span className="inline-block px-4 py-1 rounded bg-slate-900 text-white font-black text-xs uppercase tracking-widest">
                {printDocType === 'FICHA_LEI_LUCAS' && 'Ficha de Atendimento de Primeiros Socorros — Lei Lucas (Lei nº 13.722/2018)'}
                {printDocType === 'ENCAMINHAMENTO_SAMU' && 'Guia de Encaminhamento e Socorro Emergencial — SAMU 192 / Hospital'}
                {printDocType === 'TERMO_LIBERACAO' && 'Termo de Liberação e Entrega de Discente por Motivo de Saúde'}
              </span>
            </div>
          </div>

          {/* CORPO DO DOCUMENTO */}
          <div className="py-6 space-y-4 text-xs">
            
            <div className="grid grid-cols-2 gap-4 p-4 rounded border border-slate-300 bg-slate-50">
              <div><strong>Discente:</strong> {selectedIncidentForPrint.student_name}</div>
              <div><strong>Matrícula/Código:</strong> {selectedIncidentForPrint.student_id}</div>
              <div><strong>Turma/Ano:</strong> {selectedIncidentForPrint.class_name}</div>
              <div><strong>Data e Horário:</strong> {new Date(selectedIncidentForPrint.incident_date).toLocaleDateString('pt-BR')} às {selectedIncidentForPrint.incident_time}</div>
              <div><strong>Local do Incidente:</strong> {selectedIncidentForPrint.location}</div>
              <div><strong>Classificação de Risco:</strong> {selectedIncidentForPrint.severity_level}</div>
            </div>

            <div className="p-4 rounded border border-slate-300 space-y-2">
              <h4 className="font-black uppercase text-xs">1. Descrição dos Sintomas e Circunstâncias da Ocorrência:</h4>
              <p className="text-[11px] leading-relaxed text-slate-800">{selectedIncidentForPrint.symptoms_description}</p>
            </div>

            <div className="p-4 rounded border border-slate-300 space-y-2">
              <h4 className="font-black uppercase text-xs">2. Procedimentos de Primeiros Socorros Adotados (Lei Lucas):</h4>
              <p className="text-[11px] leading-relaxed text-slate-800">{selectedIncidentForPrint.first_aid_actions}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded border border-slate-300 bg-slate-50">
              <div>
                <strong>Socorro Especializado:</strong> {selectedIncidentForPrint.emergency_service_called}
                {selectedIncidentForPrint.emergency_protocol_number && ` (Prot: ${selectedIncidentForPrint.emergency_protocol_number})`}
              </div>
              <div>
                <strong>Horário Acionamento:</strong> {selectedIncidentForPrint.emergency_call_time || 'N/A'}
              </div>
              <div>
                <strong>Responsável Contatado:</strong> {selectedIncidentForPrint.parent_contacted_name} ({selectedIncidentForPrint.parent_contacted_phone})
              </div>
              <div>
                <strong>Desfecho:</strong> {selectedIncidentForPrint.outcome}
              </div>
            </div>

            {selectedIncidentForPrint.escort_staff_name && (
              <div className="p-3 rounded border border-slate-300 bg-amber-50">
                <strong>Servidor Acompanhante na Ambulância:</strong> {selectedIncidentForPrint.escort_staff_name}
              </div>
            )}

            <div className="pt-8 grid grid-cols-2 gap-12 text-center text-[11px]">
              <div>
                <div className="border-t border-slate-900 pt-1 font-bold">
                  {selectedIncidentForPrint.attendant_name}
                </div>
                <div className="text-slate-600 text-[10px]">Servidor / Gestor Responsável pelo Atendimento</div>
              </div>

              <div>
                <div className="border-t border-slate-900 pt-1 font-bold">
                  {selectedIncidentForPrint.parent_contacted_name || 'Responsável Legal do Discente'}
                </div>
                <div className="text-slate-600 text-[10px]">Assinatura do Pai / Mãe / Responsável Legal</div>
              </div>
            </div>

          </div>

          <div className="pt-6 text-center text-[9px] text-slate-500 border-t border-slate-200">
            Documento emitido eletronicamente pelo Sistema de Gestão Escolar EECM André Maggi em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}.
          </div>

        </div>
      )}

    </div>
  );
};
