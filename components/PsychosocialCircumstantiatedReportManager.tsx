import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Trash2,
  X,
  Save,
  CheckCircle2,
  Building2,
  ShieldAlert,
  HeartHandshake,
  Users,
  Calendar,
  Layers,
  Scale,
  Camera,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  School,
  Lock
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useStudents } from '../hooks/useStudents';
import { PsychosocialCircumstantiatedReport, PsychosocialRole, ElectronicSignatureProof } from '../types';
import ElectronicSignatureStamp from './ElectronicSignatureStamp';
import ElectronicSignatureModal from './ElectronicSignatureModal';

interface PsychosocialCircumstantiatedReportManagerProps {
  user?: any;
  role: PsychosocialRole;
}

const DEFAULT_DOCUMENTS_CHECKLIST = [
  'Relatório Geral da Equipe Psicossocial Escolar',
  'Relatório do Professor Mediador / Práticas Restaurativas',
  'Relatório da Coordenação Pedagógica / Laboratório de Letramento',
  'Atas e Registros de Ocorrências Anteriores (Reincidências)',
  'Boletim de Ocorrência Policial (B.O.)',
  'Ficha FICAI / Notificação de Infrequência Escolar',
  'Evidências das Atividades do Calendário de Mediação Escolar / Palestras'
];

const PsychosocialCircumstantiatedReportManager: React.FC<PsychosocialCircumstantiatedReportManagerProps> = ({
  user,
  role
}) => {
  const { students: dbStudents } = useStudents();
  const [reports, setReports] = useState<PsychosocialCircumstantiatedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  
  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PsychosocialCircumstantiatedReport | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  // Form State
  const [form, setForm] = useState<Partial<PsychosocialCircumstantiatedReport>>({
    reportNumber: '',
    schoolUnit: 'EE CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI',
    incidentDate: new Date().toLocaleDateString('sv-SE'),
    incidentLocation: 'Nas dependências da Unidade Escolar',
    involvedStudents: '',
    className: '',
    recordedFact: '',
    schoolMeasuresTaken: '',
    psychosocialActions: '',
    socioEducationalProfile: '',
    futureForwarding: '',
    attachedDocumentsChecklist: DEFAULT_DOCUMENTS_CHECKLIST,
    participants: '',
    psychosocialProfessional: user?.name || 'TÉCNICO PSICOSSOCIAL',
    mediatorName: 'DANÚBIA DE CASTRO ALMEIDA',
    coordinatorName: 'COORDENAÇÃO PEDAGÓGICA',
    directorName: 'REZIERE DE SOUZA',
    status: 'FINALIZADO'
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('psychosocial_circumstantiated_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const formatted: PsychosocialCircumstantiatedReport[] = data.map((r: any) => ({
          id: r.id,
          reportNumber: r.report_number || ('RELATÓRIO CIRCUNSTANCIADO Nº ' + String(r.id).substring(0, 3) + '/' + currentYear),
          schoolUnit: r.school_unit || 'EE CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI',
          incidentDate: r.incident_date,
          incidentLocation: r.incident_location,
          involvedStudents: r.involved_students,
          className: r.class_name,
          recordedFact: r.recorded_fact,
          schoolMeasuresTaken: r.school_measures_taken,
          psychosocialActions: r.psychosocial_actions,
          socioEducationalProfile: r.socio_educational_profile,
          futureForwarding: r.future_forwarding,
          attachedDocumentsChecklist: Array.isArray(r.attached_documents_checklist) ? r.attached_documents_checklist : DEFAULT_DOCUMENTS_CHECKLIST,
          participants: r.participants,
          psychosocialProfessional: r.psychosocial_professional,
          mediatorName: r.mediator_name,
          coordinatorName: r.coordinator_name,
          directorName: r.director_name,
          status: r.status || 'FINALIZADO',
          createdAt: r.created_at
        }));
        setReports(formatted);
      } else {
        const saved = localStorage.getItem('psychosocial_circumstantiated_reports_v1');
        if (saved) {
          setReports(JSON.parse(saved));
        } else {
          // Inserir modelo padrão baseado no arquivo oficial do usuário
          const defaultItem: PsychosocialCircumstantiatedReport = {
            id: 'rep-default-001',
            reportNumber: `RELATÓRIO CIRCUNSTANCIADO Nº 001/${currentYear}`,
            schoolUnit: 'EE CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI',
            incidentDate: `${currentYear}-04-18`,
            incidentLocation: 'Nas dependências da Unidade Escolar',
            involvedStudents: 'Estudantes envolvidos no incidente',
            className: '9º Ano A / Ensino Fundamental',
            recordedFact: 'Ocorrência de incidente disciplinar e conflito interpessoal entre estudantes, com postura inadequada e agressão verbal/injúria.',
            schoolMeasuresTaken: 'A escola conversou com os estudantes e comunicou imediatamente os responsáveis legais. A família foi atendida para esclarecimento dos fatos. A gestão informou sobre as diretrizes da Lei Geral de Proteção de Dados Pessoais (LGPD nº 13.709/2018) quanto à impossibilidade de compartilhamento de imagens das câmeras contendo outros menores. Foram reforçadas as regras de boa convivência e sanções do regimento escolar.',
            psychosocialActions: 'Acolhimento da família e do estudante pela equipe psicossocial, com proposta de referenciamento para a rede de apoio. Abertura de ficha de acompanhamento e aplicação de práticas de cultura de paz (Círculos de Paz, rodas de conversa e aconselhamento individual).',
            socioEducationalProfile: 'Responsável relatou histórico de agressividade no domicílio. Estudante com registros de reincidência comportamental e infrequência escolar monitorada pela Busca Ativa. Rendimento pedagógico com defasagem em Língua Portuguesa e Matemática, com indicação para o Laboratório de Letramento. Elegível aos programas sociais Pé-de-Meia e Bolsa Família.',
            futureForwarding: 'A equipe psicossocial e a mediação escolar realizarão novas escutas individualizadas e organizarão a juntada de documentos para protocolo e referenciamento junto à Promotoria da Infância e Juventude e ao Conselho Tutelar.',
            attachedDocumentsChecklist: DEFAULT_DOCUMENTS_CHECKLIST,
            participants: 'Estudantes, Responsáveis Legais, Equipe Psicossocial, Professora Mediadora, Coordenação e Direção',
            psychosocialProfessional: user?.name || 'TÉCNICO PSICOSSOCIAL',
            mediatorName: 'DANÚBIA DE CASTRO ALMEIDA',
            coordinatorName: 'COORDENAÇÃO PEDAGÓGICA',
            directorName: 'REZIERE DE SOUZA',
            status: 'ENCAMINHADO_PROMOTORIA',
            createdAt: new Date().toISOString()
          };
          setReports([defaultItem]);
          localStorage.setItem('psychosocial_circumstantiated_reports_v1', JSON.stringify([defaultItem]));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar relatórios circunstanciados:', err);
      const saved = localStorage.getItem('psychosocial_circumstantiated_reports_v1');
      if (saved) setReports(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim() || studentSearch.length < 2) return [];
    return dbStudents.filter(s =>
      (s.Nome || s.name || '').toLowerCase().includes(studentSearch.toLowerCase())
    ).slice(0, 8);
  }, [studentSearch, dbStudents]);

  const handleSelectStudent = (s: any) => {
    const studentName = s.Nome || s.name;
    const currentInvolved = form.involvedStudents ? `${form.involvedStudents}, ${studentName}` : studentName;
    setForm(prev => ({
      ...prev,
      involvedStudents: currentInvolved,
      className: prev.className || s.Turma || s.className || ''
    }));
    setStudentSearch('');
  };

  const handleToggleChecklistItem = (item: string) => {
    const current = form.attachedDocumentsChecklist || [];
    if (current.includes(item)) {
      setForm(prev => ({ ...prev, attachedDocumentsChecklist: current.filter(i => i !== item) }));
    } else {
      setForm(prev => ({ ...prev, attachedDocumentsChecklist: [...current, item] }));
    }
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.involvedStudents?.trim() || !form.recordedFact?.trim() || !form.schoolMeasuresTaken?.trim()) {
      return alert("Por favor, preencha os estudantes envolvidos, o fato registrado e as providências adotadas pela escola.");
    }

    const nextNumber = `RELATÓRIO CIRCUNSTANCIADO Nº ${String(reports.length + 1).padStart(3, '0')}/${currentYear}`;
    const reportId = form.id || ('rep-' + Date.now());

    const payload: PsychosocialCircumstantiatedReport = {
      id: reportId,
      reportNumber: form.reportNumber || nextNumber,
      schoolUnit: form.schoolUnit || 'EE CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI',
      incidentDate: form.incidentDate || new Date().toLocaleDateString('sv-SE'),
      incidentLocation: form.incidentLocation || 'Nas dependências da Unidade Escolar',
      involvedStudents: form.involvedStudents,
      className: form.className || '',
      recordedFact: form.recordedFact,
      schoolMeasuresTaken: form.schoolMeasuresTaken,
      psychosocialActions: form.psychosocialActions || '',
      socioEducationalProfile: form.socioEducationalProfile || '',
      futureForwarding: form.futureForwarding || '',
      attachedDocumentsChecklist: form.attachedDocumentsChecklist || DEFAULT_DOCUMENTS_CHECKLIST,
      participants: form.participants || '',
      psychosocialProfessional: form.psychosocialProfessional || user?.name || 'TÉCNICO PSICOSSOCIAL',
      mediatorName: form.mediatorName || 'DANÚBIA DE CASTRO ALMEIDA',
      coordinatorName: form.coordinatorName || 'COORDENAÇÃO PEDAGÓGICA',
      directorName: form.directorName || 'REZIERE DE SOUZA',
      status: form.status || 'FINALIZADO',
      createdAt: form.createdAt || new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('psychosocial_circumstantiated_reports').upsert([{
        id: payload.id,
        report_number: payload.reportNumber,
        school_unit: payload.schoolUnit,
        incident_date: payload.incidentDate,
        incident_location: payload.incidentLocation,
        involved_students: payload.involvedStudents,
        class_name: payload.className,
        recorded_fact: payload.recordedFact,
        school_measures_taken: payload.schoolMeasuresTaken,
        psychosocial_actions: payload.psychosocialActions,
        socio_educational_profile: payload.socioEducationalProfile,
        future_forwarding: payload.futureForwarding,
        attached_documents_checklist: payload.attachedDocumentsChecklist,
        participants: payload.participants,
        psychosocial_professional: payload.psychosocialProfessional,
        mediator_name: payload.mediatorName,
        coordinator_name: payload.coordinatorName,
        director_name: payload.directorName,
        status: payload.status
      }]);

      if (error) {
        console.warn('Salvando localmente:', error);
      }

      const updatedList = reports.some(r => r.id === payload.id)
        ? reports.map(r => r.id === payload.id ? payload : r)
        : [payload, ...reports];

      setReports(updatedList);
      localStorage.setItem('psychosocial_circumstantiated_reports_v1', JSON.stringify(updatedList));
      setIsModalOpen(false);
      setSelectedReport(payload);
      alert("✅ Relatório Circunstanciado salvo com sucesso!");
    } catch (err: any) {
      console.error('Erro ao salvar relatório:', err);
      alert("Erro ao salvar: " + err.message);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("⚠️ Tem certeza que deseja excluir este Relatório Circunstanciado?")) return;

    try {
      await supabase.from('psychosocial_circumstantiated_reports').delete().eq('id', id);
      const updated = reports.filter(r => r.id !== id);
      setReports(updated);
      localStorage.setItem('psychosocial_circumstantiated_reports_v1', JSON.stringify(updated));
      if (selectedReport?.id === id) setSelectedReport(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch =
      (r.reportNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.involvedStudents || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.className || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.recordedFact || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'TODOS' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      
      {/* HEADER DE CONTROLE */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-indigo-600 to-rose-600 text-white rounded-3xl shadow-lg shadow-indigo-600/20">
            <FileText size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Relatórios Circunstanciados (Juntada de Fatos)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[8px] font-black uppercase tracking-wider">
                Modelo Oficial SEDUC/MT • NME
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Instrumento formal de registro minucioso de incidentes, perfil socioeducacional e juntada para a Promotoria e Rede de Proteção.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por número, aluno ou fato..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none w-64 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none cursor-pointer focus:bg-white"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="FINALIZADO">Finalizados (Interno)</option>
            <option value="ENCAMINHADO_PROMOTORIA">Encaminhado à Promotoria</option>
            <option value="ENCAMINHADO_CONSELHO">Encaminhado ao Conselho Tutelar</option>
          </select>

          <button
            onClick={() => {
              setForm({
                reportNumber: `RELATÓRIO CIRCUNSTANCIADO Nº ${String(reports.length + 1).padStart(3, '0')}/${currentYear}`,
                schoolUnit: 'EE CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI',
                incidentDate: new Date().toLocaleDateString('sv-SE'),
                incidentLocation: 'Nas dependências da Unidade Escolar',
                involvedStudents: '',
                className: '',
                recordedFact: '',
                schoolMeasuresTaken: '',
                psychosocialActions: '',
                socioEducationalProfile: '',
                futureForwarding: '',
                attachedDocumentsChecklist: DEFAULT_DOCUMENTS_CHECKLIST,
                participants: '',
                psychosocialProfessional: user?.name || 'TÉCNICO PSICOSSOCIAL',
                mediatorName: 'DANÚBIA DE CASTRO ALMEIDA',
                coordinatorName: 'COORDENAÇÃO PEDAGÓGICA',
                directorName: 'REZIERE DE SOUZA',
                status: 'FINALIZADO'
              });
              setIsModalOpen(true);
            }}
            className="px-5 py-3 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus size={16} /> Novo Relatório Circunstanciado
          </button>
        </div>
      </div>

      {/* CARDS DE ATALHOS / ESTATÍSTICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total de Relatórios</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{reports.length}</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <FileText size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block">Juntadas p/ Promotoria</span>
            <span className="text-2xl font-black text-rose-700 mt-1 block">
              {reports.filter(r => r.status === 'ENCAMINHADO_PROMOTORIA').length}
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <Scale size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block">Conselho Tutelar</span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">
              {reports.filter(r => r.status === 'ENCAMINHADO_CONSELHO').length}
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Building2 size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block">Tratativas Internas</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {reports.filter(r => r.status === 'FINALIZADO').length}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* LISTAGEM DOS RELATÓRIOS */}
      <div className="grid grid-cols-1 gap-4 no-print">
        {filteredReports.map(rep => (
          <div
            key={rep.id}
            onClick={() => setSelectedReport(rep)}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow-xl transition-all cursor-pointer group flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-5 flex-1">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 shrink-0 bg-indigo-50 border-indigo-200 text-indigo-700">
                <FileText size={26} />
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                    {rep.reportNumber}
                  </span>
                  <h4 className="text-base font-black text-slate-900 uppercase">{rep.involvedStudents}</h4>
                  
                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                    rep.status === 'ENCAMINHADO_PROMOTORIA' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    rep.status === 'ENCAMINHADO_CONSELHO' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {rep.status === 'ENCAMINHADO_PROMOTORIA' ? '🏛️ Promotoria da Infância' :
                     rep.status === 'ENCAMINHADO_CONSELHO' ? '🏢 Conselho Tutelar' : '✓ Registrado / Finalizado'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                  <strong>Fato:</strong> {rep.recordedFact}
                </p>

                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase flex-wrap">
                  <span>Turma: <strong className="text-slate-700">{rep.className || 'Geral'}</strong></span>
                  <span>•</span>
                  <span>Data do Fato: <strong className="text-slate-700">{new Date(rep.incidentDate).toLocaleDateString('pt-BR')}</strong></span>
                  <span>•</span>
                  <span>Local: <strong className="text-slate-700">{rep.incidentLocation}</strong></span>
                  <span>•</span>
                  <span>Anexos: <strong className="text-indigo-700">{rep.attachedDocumentsChecklist?.length || 0} itens</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedReport(rep);
                  setTimeout(() => window.print(), 300);
                }}
                className="px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
                title="Imprimir Relatório Oficial com Timbre SEDUC/MT"
              >
                <Printer size={14} />
                <span>Imprimir Relatório</span>
              </button>

              <button
                onClick={(e) => handleDelete(rep.id, e)}
                className="p-2.5 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                title="Excluir Registro"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <FileText size={48} className="mx-auto mb-3 text-slate-200" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Nenhum relatório circunstanciado registrado
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DO RELATÓRIO CIRCUNSTANCIADO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[94vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Relatório Circunstanciado Oficial</h3>
                  <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest">Modelo de Registro & Juntada de Documentos • SEDUC/MT</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-xl">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form onSubmit={handleSaveReport} className="space-y-6">
                
                {/* CABEÇALHO E NÚMERO */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Número do Relatório</label>
                    <input
                      type="text"
                      value={form.reportNumber || ''}
                      onChange={e => setForm(prev => ({ ...prev, reportNumber: e.target.value }))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Data do Ocorrido / Fato</label>
                    <input
                      type="date"
                      value={form.incidentDate || ''}
                      onChange={e => setForm(prev => ({ ...prev, incidentDate: e.target.value }))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Local do Fato</label>
                    <input
                      type="text"
                      value={form.incidentLocation || ''}
                      onChange={e => setForm(prev => ({ ...prev, incidentLocation: e.target.value }))}
                      placeholder="Ex: Sala de Aula, Pátio, Dependências..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                {/* BUSCA E ESTUDANTES ENVOLVIDOS */}
                <div className="space-y-3 p-5 bg-slate-50 rounded-3xl border border-slate-200">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    Identificação dos Estudantes Envolvidos e Turma
                  </label>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar aluno no banco escolar para adicionar aos envolvidos..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500"
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
                            <span className="text-[10px] font-black text-indigo-600 uppercase">+ Adicionar</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nomes dos Estudantes Envolvidos</label>
                      <input
                        required
                        type="text"
                        value={form.involvedStudents || ''}
                        onChange={e => setForm(prev => ({ ...prev, involvedStudents: e.target.value }))}
                        placeholder="Ex: João da Silva, Maria dos Santos..."
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ano / Turma</label>
                      <input
                        type="text"
                        value={form.className || ''}
                        onChange={e => setForm(prev => ({ ...prev, className: e.target.value }))}
                        placeholder="Ex: 9º Ano A / Ensino Fundamental"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 1. FATO REGISTRADO */}
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-1">
                    1. Fato Registrado (Descrição do Incidente)
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.recordedFact || ''}
                    onChange={e => setForm(prev => ({ ...prev, recordedFact: e.target.value }))}
                    placeholder="Descreva a ocorrência dos fatos, atitudes observadas, palavras proferidas ou agressões..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 2. PROVIDÊNCIAS ADOTADAS PELA ESCOLA */}
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-1">
                    2. Providências Adotadas pela Escola
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.schoolMeasuresTaken || ''}
                    onChange={e => setForm(prev => ({ ...prev, schoolMeasuresTaken: e.target.value }))}
                    placeholder="Comunicação aos responsáveis, socorro/assistência médica, Boletim de Ocorrência, escuta individual, orientações regimentais e informação sobre a LGPD (não fornecimento de imagens de câmeras de menores)..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 3. AÇÕES ESPECÍFICAS DA EQUIPE PSICOSSOCIAL / MEDIADOR */}
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-1">
                    3. Ações Específicas da Equipe Psicossocial, Professor Mediador e Coordenação
                  </label>
                  <textarea
                    rows={3}
                    value={form.psychosocialActions || ''}
                    onChange={e => setForm(prev => ({ ...prev, psychosocialActions: e.target.value }))}
                    placeholder="Acolhimento da família e estudante, referenciamento para rede de apoio, abertura de FICAI, ações de cultura de paz (Círculos Restaurativos, rodas de conversa)..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 4. PERFIL SOCIOEDUCACIONAL */}
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-1">
                    4. Perfil Socioeducacional do Estudante
                  </label>
                  <textarea
                    rows={4}
                    value={form.socioEducationalProfile || ''}
                    onChange={e => setForm(prev => ({ ...prev, socioEducationalProfile: e.target.value }))}
                    placeholder="Comportamento no domicílio, reincidência, monitoramento de frequência na Busca Ativa, rendimento pedagógico (Letramento/Matemática) e programas sociais (Pé-de-Meia, Bolsa Família)..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 5. ENCAMINHAMENTOS FUTUROS (PÓS-FATO) */}
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-1">
                    5. Encaminhamentos Futuros & Juntada de Documentos
                  </label>
                  <textarea
                    rows={3}
                    value={form.futureForwarding || ''}
                    onChange={e => setForm(prev => ({ ...prev, futureForwarding: e.target.value }))}
                    placeholder="Escutas individualizadas, intensificação de práticas de mediação e protocolo da juntada de documentos junto à Promotoria da Infância / Conselho Tutelar..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 6. CHECKLIST DE DOCUMENTOS PARA JUNTADA */}
                <div className="space-y-2 p-5 bg-slate-50 rounded-3xl border border-slate-200">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">
                    6. Documentos para Juntada (Checklist de Anexos Oficiais)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEFAULT_DOCUMENTS_CHECKLIST.map(docItem => {
                      const isChecked = (form.attachedDocumentsChecklist || []).includes(docItem);
                      return (
                        <div
                          key={docItem}
                          onClick={() => handleToggleChecklistItem(docItem)}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold cursor-pointer transition-all ${
                            isChecked ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-indigo-600 cursor-pointer"
                          />
                          <span>{docItem}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DESTINO / STATUS E ASSINATURAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Status / Destino do Relatório</label>
                    <select
                      value={form.status || 'FINALIZADO'}
                      onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none cursor-pointer"
                    >
                      <option value="FINALIZADO">✓ Finalizado (Tratativas Escolares)</option>
                      <option value="ENCAMINHADO_PROMOTORIA">🏛️ Encaminhado à Promotoria da Infância e Juventude</option>
                      <option value="ENCAMINHADO_CONSELHO">🏢 Encaminhado ao Conselho Tutelar</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Participantes Presentes</label>
                    <input
                      type="text"
                      value={form.participants || ''}
                      onChange={e => setForm(prev => ({ ...prev, participants: e.target.value }))}
                      placeholder="Pais, Estudantes, Técnico Psicossocial, Mediadora, Direção..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Salvar e Gerar Documento Oficial
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTO OFICIAL FORMATADO PARA IMPRESSÃO (MODELO SEDUC/MT) */}
      {selectedReport && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[96vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            
            {/* Header de Ações */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center no-print flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black bg-indigo-600 px-3 py-1 rounded-lg">
                  {selectedReport.reportNumber}
                </span>
                <span className="text-xs font-bold uppercase text-slate-300">Documento Oficial SEDUC/MT</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
                  title="Assinar com Senha Institucional"
                >
                  <ShieldCheck size={16} /> Assinar com Senha
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                >
                  <Printer size={16} /> Imprimir Documento
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
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
                <p className="text-[10px] text-slate-600">Diretoria Regional de Educação de Sinop • Núcleo de Mediação Escolar e Equipe Psicossocial</p>
              </div>

              {/* TÍTULO DO DOCUMENTO */}
              <div className="text-center my-4">
                <h2 className="text-base font-black uppercase text-slate-900 tracking-wider">
                  {selectedReport.reportNumber}
                </h2>
              </div>

              {/* DATA E LOCAL */}
              <div className="text-xs space-y-1 border border-slate-300 p-3 rounded-lg bg-slate-50">
                <p><strong>Data e Local:</strong> {new Date(selectedReport.incidentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}, {selectedReport.incidentLocation}.</p>
                <p><strong>Estudantes Envolvidos:</strong> <span className="uppercase">{selectedReport.involvedStudents}</span> ({selectedReport.className || 'Turma não informada'})</p>
              </div>

              {/* CORPO DO RELATÓRIO */}
              <div className="space-y-4 text-xs leading-relaxed text-slate-800 text-justify">
                
                {/* 1. FATO */}
                <div className="space-y-1">
                  <h5 className="font-black uppercase text-slate-900">1. Fato Registrado:</h5>
                  <p className="p-3 bg-white border border-slate-300 rounded-lg text-[11px] leading-relaxed">
                    {selectedReport.recordedFact}
                  </p>
                </div>

                {/* 2. PROVIDÊNCIAS */}
                <div className="space-y-1">
                  <h5 className="font-black uppercase text-slate-900">2. Providências Adotadas pela Escola:</h5>
                  <p className="p-3 bg-white border border-slate-300 rounded-lg text-[11px] leading-relaxed">
                    {selectedReport.schoolMeasuresTaken}
                  </p>
                </div>

                {/* 3. AÇÕES DA EQUIPE PSICOSSOCIAL E MEDIADOR */}
                {selectedReport.psychosocialActions && (
                  <div className="space-y-1">
                    <h5 className="font-black uppercase text-slate-900">3. Ações Específicas da Equipe Psicossocial, Professor Mediador e Coordenação:</h5>
                    <p className="p-3 bg-white border border-slate-300 rounded-lg text-[11px] leading-relaxed">
                      {selectedReport.psychosocialActions}
                    </p>
                  </div>
                )}

                {/* 4. PERFIL SOCIOEDUCACIONAL */}
                {selectedReport.socioEducationalProfile && (
                  <div className="space-y-1">
                    <h5 className="font-black uppercase text-slate-900">4. Perfil Socioeducacional do Estudante:</h5>
                    <p className="p-3 bg-white border border-slate-300 rounded-lg text-[11px] leading-relaxed">
                      {selectedReport.socioEducationalProfile}
                    </p>
                  </div>
                )}

                {/* 5. ENCAMINHAMENTOS FUTUROS */}
                {selectedReport.futureForwarding && (
                  <div className="space-y-1">
                    <h5 className="font-black uppercase text-slate-900">5. Encaminhamentos Futuros (Pós-Fato):</h5>
                    <p className="p-3 bg-white border border-slate-300 rounded-lg text-[11px] leading-relaxed">
                      {selectedReport.futureForwarding}
                    </p>
                  </div>
                )}

                {/* 6. DOCUMENTOS PARA JUNTADA */}
                {selectedReport.attachedDocumentsChecklist && selectedReport.attachedDocumentsChecklist.length > 0 && (
                  <div className="space-y-1">
                    <h5 className="font-black uppercase text-slate-900">6. Documentos para Juntada (Anexos):</h5>
                    <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
                      {selectedReport.attachedDocumentsChecklist.map((item, idx) => (
                        <p key={idx} className="text-[10px] text-slate-700 flex items-center gap-1.5">
                          <span className="font-bold text-indigo-700">✓</span> {item}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ASSINATURAS OFICIAIS */}
              <div className="pt-8 space-y-8 text-xs">
                <div className="grid grid-cols-2 gap-8 text-center">
                  <div className="border-t border-slate-900 pt-2 space-y-0.5">
                    <p className="font-black uppercase text-slate-900">{selectedReport.psychosocialProfessional}</p>
                    <p className="text-[10px] text-slate-600 uppercase font-bold">Equipe Psicossocial Escolar</p>
                  </div>
                  <div className="border-t border-slate-900 pt-2 space-y-0.5">
                    <p className="font-black uppercase text-slate-900">{selectedReport.mediatorName}</p>
                    <p className="text-[10px] text-slate-600 uppercase font-bold">Professor(a) Mediador(a)</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 text-center">
                  <div className="border-t border-slate-900 pt-2 space-y-0.5">
                    <p className="font-black uppercase text-slate-900">{selectedReport.coordinatorName}</p>
                    <p className="text-[10px] text-slate-600 uppercase font-bold">Coordenação Pedagógica</p>
                  </div>
                  <div className="border-t border-slate-900 pt-2 space-y-0.5">
                    <p className="font-black uppercase text-slate-900">{selectedReport.directorName}</p>
                    <p className="text-[10px] text-slate-600 uppercase font-bold">Diretor Escolar</p>
                    <p className="text-[9px] text-slate-500 uppercase">E.E. Cívico-Militar André Antônio Maggi</p>
                  </div>
                </div>
              </div>

              {/* SELO DE ASSINATURA ELETRÔNICA OFICIAL */}
              {selectedReport.signatures && selectedReport.signatures.length > 0 && (
                <div className="pt-4 space-y-3">
                  {selectedReport.signatures.map((sig, idx) => (
                    <ElectronicSignatureStamp key={idx} signature={sig} />
                  ))}
                </div>
              )}

              {/* PROTOCOLO DE RECEBIMENTO DO ÓRGÃO EXTERNO */}
              {selectedReport.status !== 'FINALIZADO' && (
                <div className="mt-6 p-3 border border-dashed border-slate-400 rounded-xl text-[10px] text-slate-600 flex justify-between items-center">
                  <span>Recebido pelo Órgão (Promotoria/CT): __________________________</span>
                  <span>Data: ___/___/______</span>
                  <span>Carimbo/Assinatura: _________________________</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ASSINATURA ELETRÔNICA */}
      {isSignatureModalOpen && selectedReport && (
        <ElectronicSignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          documentId={selectedReport.id}
          documentType="RELATORIO_CIRCUNSTANCIADO"
          documentTitle={selectedReport.reportNumber}
          documentContent={selectedReport}
          defaultSignerName={user?.name || selectedReport.directorName || 'DIRETOR ESCOLAR'}
          defaultSignerRole={role === 'PSICOLOGO' ? 'PSICÓLOGO(A) ESCOLAR' : role === 'ASSISTENTE_SOCIAL' ? 'ASSISTENTE SOCIAL' : 'DIRETOR ESCOLAR'}
          onSignatureComplete={handleSignatureComplete}
        />
      )}
    </div>
  );
};

export default PsychosocialCircumstantiatedReportManager;
