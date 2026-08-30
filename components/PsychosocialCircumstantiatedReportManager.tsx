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
  Lock,
  Loader2,
  ShieldCheck,
  Send,
  Paperclip,
  Image as ImageIcon,
  Clock,
  CheckSquare,
  Square,
  FileCheck,
  Eye,
  RotateCcw,
  ExternalLink,
  Bell,
  AlertCircle,
  Shield
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useStudents } from '../hooks/useStudents';
import { PsychosocialCircumstantiatedReport, PsychosocialRole, ElectronicSignatureProof } from '../types';
import ElectronicSignatureStamp from './ElectronicSignatureStamp';
import ElectronicSignatureModal from './ElectronicSignatureModal';

interface PsychosocialCircumstantiatedReportManagerProps {
  user?: any;
  role: PsychosocialRole | 'COORDENADOR' | 'GESTAO';
  initialStudentName?: string;
  onClose?: () => void;
}

interface RawEvidenceItem {
  id: string;
  type: 'OCORRENCIA' | 'MEDIACAO' | 'PSICOSSOCIAL' | 'FICAI' | 'MILITAR';
  date: string;
  time?: string;
  title: string;
  desc: string;
  category?: string;
  severity?: string;
  author?: string;
  checked: boolean;
}

const DEFAULT_DOCUMENTS_CHECKLIST = [
  'Relatório Geral da Equipe Psicossocial Escolar',
  'Relatório do Professor Mediador / Práticas Restaurativas',
  'Relatório da Coordenação Pedagógica / Laboratório de Letramento',
  'Ficha Disciplinar & Deméritos do Corpo de Alunos (Cívico-Militar)',
  'Atas e Registros de Ocorrências Anteriores (Reincidências)',
  'Boletim de Ocorrência Policial (B.O.)',
  'Ficha FICAI / Notificação de Infrequência Escolar',
  'Evidências das Atividades do Calendário de Mediação Escolar / Palestras'
];

const PsychosocialCircumstantiatedReportManager: React.FC<PsychosocialCircumstantiatedReportManagerProps> = ({
  user,
  role,
  initialStudentName,
  onClose
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
  const [isCompilingDossier, setIsCompilingDossier] = useState(false);

  // Checklist Interativo de Provas
  const [evidenceItems, setEvidenceItems] = useState<RawEvidenceItem[]>([]);
  const [showEvidenceChecklist, setShowEvidenceChecklist] = useState(false);
  const [studentMilitaryScore, setStudentMilitaryScore] = useState<number | null>(null);

  // Modal de Protocolo Externo
  const [protocolModalReport, setProtocolModalReport] = useState<PsychosocialCircumstantiatedReport | null>(null);
  const [protocolForm, setProtocolForm] = useState({
    protocolNumber: '',
    receiptDate: new Date().toLocaleDateString('sv-SE'),
    recipientEntity: 'CONSELHO_TUTELAR' as 'CONSELHO_TUTELAR' | 'PROMOTORIA_JUSTICA' | 'DRE_SINOP' | 'OUTRO',
    recipientName: '',
    notes: '',
    receiptFileUrl: ''
  });

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
    status: 'FINALIZADO',
    evidenceAttachments: []
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
          createdAt: r.created_at,
          evidenceAttachments: r.evidence_attachments || [],
          externalProtocol: r.external_protocol || undefined,
          followUpStatus: r.follow_up_status || undefined
        }));
        setReports(formatted);
      } else {
        const saved = localStorage.getItem('psychosocial_circumstantiated_reports_v1');
        if (saved) {
          setReports(JSON.parse(saved));
        } else {
          // Modelo padrão
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
            createdAt: new Date().toISOString(),
            evidenceAttachments: []
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

  // Pre-carregar aluno inicial se fornecido
  useEffect(() => {
    if (initialStudentName && initialStudentName.trim()) {
      setIsModalOpen(true);
      const foundStudent = dbStudents.find(s => 
        (s.Nome || s.name || '').toLowerCase().includes(initialStudentName.toLowerCase())
      );
      const targetClass = foundStudent ? (foundStudent.Turma || foundStudent.className || '') : '';
      setForm(prev => ({
        ...prev,
        involvedStudents: initialStudentName,
        className: targetClass
      }));
      handleAutoCompileDossier(initialStudentName, targetClass);
    }
  }, [initialStudentName, dbStudents]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim() || studentSearch.length < 2) return [];
    return dbStudents.filter(s =>
      (s.Nome || s.name || '').toLowerCase().includes(studentSearch.toLowerCase())
    ).slice(0, 8);
  }, [studentSearch, dbStudents]);

  const handleSelectStudent = (s: any) => {
    const studentName = s.Nome || s.name;
    const currentInvolved = form.involvedStudents ? `${form.involvedStudents}, ${studentName}` : studentName;
    const targetClass = s.Turma || s.className || '';
    setForm(prev => ({
      ...prev,
      involvedStudents: currentInvolved,
      className: prev.className || targetClass
    }));
    setStudentSearch('');
    handleAutoCompileDossier(studentName, targetClass);
  };

  // Classificação da Nota Disciplinar Militar
  const getMilitaryConcept = (score: number) => {
    if (score >= 9.0) return 'EXCEPCIONAL';
    if (score >= 8.0) return 'ÓTIMO';
    if (score >= 7.0) return 'BOM';
    if (score >= 5.0) return 'REGULAR';
    if (score >= 3.0) return 'INSUFICIENTE';
    return 'INCOMPATÍVEL';
  };

  // Compilação inteligente com checklist de evidências
  const handleAutoCompileDossier = async (studentName: string, className: string) => {
    if (!studentName.trim()) {
      alert('Por favor, selecione ou informe o nome do estudante para compilar o dossiê.');
      return;
    }

    setIsCompilingDossier(true);
    try {
      const cleanName = studentName.trim();

      // 1. Ocorrências Gerais (Supabase)
      const { data: occData } = await supabase
        .from('occurrences')
        .select('*')
        .ilike('student_name', `%${cleanName}%`)
        .order('date', { ascending: true });

      // 2. Mediações Escolares (Supabase)
      const { data: medData } = await supabase
        .from('mediation_cases')
        .select('*')
        .ilike('student_name', `%${cleanName}%`)
        .order('opened_at', { ascending: true });

      // 3. Encaminhamentos Psicossociais (Supabase)
      const { data: psychoData } = await supabase
        .from('psychosocial_referrals')
        .select('*')
        .ilike('student_name', `%${cleanName}%`)
        .order('date', { ascending: true });

      // 4. FICAI / Busca Ativa (LocalStorage)
      let ficaiRecords: any[] = [];
      try {
        const savedFicai = localStorage.getItem('busca_ativa_ficai_records_v2');
        if (savedFicai) {
          const list = JSON.parse(savedFicai);
          ficaiRecords = list.filter((f: any) => (f.studentName || '').toLowerCase().includes(cleanName.toLowerCase()));
        }
      } catch (e) {}

      // 5. CÍVICO-MILITAR: Deméritos, Nota de Conduta e Medidas Disciplinares
      let loadedMilitaryScore: number | null = null;
      let militaryDemerits: any[] = [];
      try {
        const savedScores = localStorage.getItem('civico_militar_student_scores_v3');
        if (savedScores) {
          const list = JSON.parse(savedScores);
          const studentState = list.find((s: any) => 
            (s.studentName || '').toLowerCase().includes(cleanName.toLowerCase())
          );
          if (studentState) {
            loadedMilitaryScore = typeof studentState.score === 'number' ? studentState.score : 10.0;
            militaryDemerits = (studentState.occurrences || []).filter((o: any) => o.type === 'DEMERIT');
          }
        }
      } catch (e) {}
      setStudentMilitaryScore(loadedMilitaryScore);

      // 6. CÍVICO-MILITAR: Documentos Formais, Termos e Fatos Observados
      let militaryDocs: any[] = [];
      try {
        const savedDocs1 = localStorage.getItem('civico_militar_documentos_v2');
        const savedDocs2 = localStorage.getItem('civic_militar_docs_history_v1');
        const list1 = savedDocs1 ? JSON.parse(savedDocs1) : [];
        const list2 = savedDocs2 ? JSON.parse(savedDocs2) : [];
        const combined = [...list1, ...list2];
        militaryDocs = combined.filter((m: any) => 
          (m.studentName || '').toLowerCase().includes(cleanName.toLowerCase())
        );
      } catch (e) {}

      // 7. CÍVICO-MILITAR: Inspeções de Postura / Uniforme
      let militaryInspections: any[] = [];
      try {
        const savedInsp = localStorage.getItem('civico_militar_inspections_v2');
        if (savedInsp) {
          const list = JSON.parse(savedInsp);
          militaryInspections = list.filter((i: any) => 
            (i.studentName || '').toLowerCase().includes(cleanName.toLowerCase())
          );
        }
      } catch (e) {}

      // Montar lista unificada de evidências com toggle
      const compiledEvidenceList: RawEvidenceItem[] = [];

      // A. Ocorrências Gerais
      (occData || []).forEach((o: any, idx: number) => {
        const cleanDesc = (o.description || '').replace(/\[(?:SETOR|ORIGEM|TRAMITADO)[^\]]*\]/gi, '').trim();
        compiledEvidenceList.push({
          id: `occ-${o.id || idx}`,
          type: 'OCORRENCIA',
          date: o.date || 'S/D',
          time: o.time,
          title: `Ocorrência #${idx + 1} (${o.category || 'Geral'})`,
          desc: cleanDesc,
          category: o.category,
          severity: o.severity,
          author: o.responsible_name,
          checked: true
        });
      });

      // B. Mediações
      (medData || []).forEach((m: any, idx: number) => {
        compiledEvidenceList.push({
          id: `med-${m.id || idx}`,
          type: 'MEDIACAO',
          date: m.opened_at ? m.opened_at.split('T')[0] : '2026',
          title: `Procedimento de Mediação #${idx + 1} (${m.type || 'Conflito'})`,
          desc: (m.description || '').trim(),
          category: m.type,
          checked: true
        });
      });

      // C. Psicossocial
      (psychoData || []).forEach((p: any, idx: number) => {
        compiledEvidenceList.push({
          id: `psy-${p.id || idx}`,
          type: 'PSICOSSOCIAL',
          date: p.date || '2026',
          title: `Atendimento Psicossocial #${idx + 1} (${p.status || 'Atendido'})`,
          desc: (p.report || p.reason || '').trim(),
          checked: true
        });
      });

      // D. FICAI
      ficaiRecords.forEach((f: any, idx: number) => {
        compiledEvidenceList.push({
          id: `ficai-${idx}`,
          type: 'FICAI',
          date: f.date || '2026',
          title: `Ficha FICAI / Infrequência Escolar #${idx + 1}`,
          desc: `Notificação de infrequência registrada na Busca Ativa com ${f.faltasConsecutivas || '5+'} faltas consecutivas.`,
          checked: true
        });
      });

      // E. CÍVICO-MILITAR: Deméritos e Medidas Disciplinares
      militaryDemerits.forEach((dem: any, idx: number) => {
        const measure = dem.disciplinaryMeasure ? ` [Medida Disciplinar: ${dem.disciplinaryMeasure}]` : '';
        const susp = dem.suspensionDays ? ` (${dem.suspensionDays} dias de suspensão)` : '';
        compiledEvidenceList.push({
          id: `mil-dem-${idx}`,
          type: 'MILITAR',
          date: dem.date || '2026',
          title: `Demérito Disciplinar Militar #${idx + 1} (${dem.category || 'Conduta'}) [-${dem.points || 0.5} pts]`,
          desc: `Infração: ${dem.observations || dem.category}${measure}${susp} • Aplicado por: ${dem.responsible || 'Corpo de Alunos'}`,
          category: dem.category,
          severity: (dem.points || 0) >= 2.0 ? 'ALTA' : 'MÉDIA',
          author: dem.responsible || 'Monitoria Militar',
          checked: true
        });
      });

      // F. CÍVICO-MILITAR: Documentos e Termos Militares
      militaryDocs.forEach((m: any, idx: number) => {
        compiledEvidenceList.push({
          id: `mil-doc-${idx}`,
          type: 'MILITAR',
          date: m.date || '2026',
          title: `Documento Disciplinar Militar #${idx + 1} (${m.templateLabel || 'Termo Disciplinar'})`,
          desc: m.fields?.achado || m.fields?.motivo || m.templateLabel || 'Termo / Notificação Disciplinar formal do Corpo de Alunos.',
          checked: true
        });
      });

      // G. CÍVICO-MILITAR: Inspeções
      militaryInspections.forEach((insp: any, idx: number) => {
        compiledEvidenceList.push({
          id: `mil-insp-${idx}`,
          type: 'MILITAR',
          date: insp.date || '2026',
          title: `Inspeção de Uniforme / Postura #${idx + 1} (${insp.item || 'Uniforme'})`,
          desc: `Não-conformidade: ${insp.observations || insp.item} • Turno: ${insp.shift || 'Geral'}`,
          checked: true
        });
      });

      setEvidenceItems(compiledEvidenceList);
      setShowEvidenceChecklist(compiledEvidenceList.length > 0);

      // Gerar redação baseada nas evidências selecionadas
      generateFormalTextsFromEvidence(compiledEvidenceList, cleanName, className, loadedMilitaryScore);

    } catch (e: any) {
      console.error('Erro na compilação:', e);
      alert('Erro ao compilar dados do estudante: ' + e.message);
    } finally {
      setIsCompilingDossier(false);
    }
  };

  // Atualizar textos formais a partir dos itens marcados
  const generateFormalTextsFromEvidence = (
    items: RawEvidenceItem[],
    studentName: string,
    className: string,
    militaryScoreOverride?: number | null
  ) => {
    const activeOccurrences = items.filter(i => i.checked && i.type === 'OCORRENCIA');
    const activeMediation = items.filter(i => i.checked && i.type === 'MEDIACAO');
    const activePsycho = items.filter(i => i.checked && i.type === 'PSICOSSOCIAL');
    const activeFicai = items.filter(i => i.checked && i.type === 'FICAI');
    const activeMilitar = items.filter(i => i.checked && i.type === 'MILITAR');

    const milScore = militaryScoreOverride !== undefined ? militaryScoreOverride : studentMilitaryScore;

    // 1. FATOS REGISTRADOS
    let compiledFacts = '';
    if (activeOccurrences.length > 0) {
      compiledFacts += `HISTÓRICO DE OCORRÊNCIAS ESCOLARES (${activeOccurrences.length} registros):\n`;
      activeOccurrences.forEach((o, idx) => {
        compiledFacts += `\n• Ocorrência #${idx + 1} (${o.date}${o.time ? ` às ${o.time}` : ''}): Categoria: ${o.category || 'Geral'} [Gravidade: ${o.severity || 'Média'}]\nRelato: ${o.desc}\nRegistrado por: ${o.author || 'Equipe Escolar'}\n`;
      });
    }

    if (activeMilitar.length > 0 || milScore !== null) {
      compiledFacts += `\nHISTÓRICO DISCIPLINAR DO CORPO DE ALUNOS (REGIME CÍVICO-MILITAR - ${activeMilitar.length} registros):\n`;
      if (milScore !== null) {
        compiledFacts += `• Nota de Conduta & Comportamento Militar Atual: ${milScore.toFixed(1)}/10.0 [Classificação: ${getMilitaryConcept(milScore)}]\n`;
      }
      activeMilitar.forEach((m, idx) => {
        compiledFacts += `• Registro Disciplinar #${idx + 1} (${m.date}): ${m.title} — ${m.desc}\n`;
      });
    }

    if (!compiledFacts) {
      compiledFacts = `Estudante ${studentName} apresenta histórico de condutas disciplinares recorrentes, conflitos interpessoais e necessidade de intervenção intersetorial da rede de proteção.`;
    }

    // 2. PROVIDÊNCIAS ESCOLARES ADOTADAS (INCLUINDO MEDIDAS DISCIPLINARES MILITARES)
    let compiledMeasures = `1. Atendimento e Notificação aos Responsáveis: A gestão escolar convocou os pais/responsáveis legais para ciência formal das ocorrências, sendo firmados termos de compromisso e orientações sobre os deveres previstos no regimento escolar;\n`;
    compiledMeasures += `2. Intervenções Pedagógicas e Restaurativas: A equipe de coordenação realizou acompanhamento em sala de aula, orientações individuais e advertências pedagógicas cabíveis;\n`;
    compiledMeasures += `3. Informação sobre a LGPD (Lei Federal nº 13.709/2018): Esclareceu-se à família sobre o sigilo das gravações do circuito interno de monitoramento da escola, resguardando a imagem de outros menores envolvidos;\n`;
    compiledMeasures += `4. Esgotamento das Medidas Administrativas: A unidade escolar empregou todos os recursos pedagógicos, preventivos e restaurativos disponíveis em âmbito institucional, justificando o presente acionamento da rede de proteção;\n`;

    const militaryMeasures = activeMilitar.filter(m => 
      m.desc.includes('Medida Disciplinar') || 
      m.desc.includes('Termo') || 
      m.desc.includes('Advertência') || 
      m.desc.includes('suspensão') ||
      m.desc.includes('Infração')
    );

    if (militaryMeasures.length > 0) {
      compiledMeasures += `5. Medidas Disciplinares Aplicadas pelo Corpo de Alunos (Cívico-Militar):\n`;
      militaryMeasures.forEach((mm, idx) => {
        compiledMeasures += `   • Registro #${idx + 1} (${mm.date}): ${mm.desc}\n`;
      });
    }

    // 3. AÇÕES DA EQUIPE PSICOSSOCIAL E MEDIAÇÃO
    let compiledPsychosocial = '';
    if (activeMediation.length > 0) {
      compiledPsychosocial += `AÇÕES DO PROFESSOR MEDIADOR / CULTURA DE PAZ (${activeMediation.length} procedimentos):\n`;
      activeMediation.forEach((m, idx) => {
        compiledPsychosocial += `• Procedimento #${idx + 1} (${m.date}): Tipo: ${m.category || 'Conflito'}\nEscuta/Relato: ${m.desc.substring(0, 180)}...\n`;
      });
    }

    if (activePsycho.length > 0) {
      compiledPsychosocial += `\nACOMPANHAMENTO MULTIPROFISSIONAL PSICOSSOCIAL (${activePsycho.length} registros):\n`;
      activePsycho.forEach((p, idx) => {
        compiledPsychosocial += `• Atendimento #${idx + 1} (${p.date}): ${p.desc.substring(0, 180)}...\n`;
      });
    }

    if (!compiledPsychosocial) {
      compiledPsychosocial = `Acolhimento da família e do estudante pelo Professor Mediador e pela Equipe Psicossocial Escolar, realização de escuta qualificada individualizada e aplicação de práticas de resolução pacífica de conflitos.`;
    }

    // 4. PERFIL SOCIOEDUCACIONAL (INCLUINDO CONCEITO DISCIPLINAR CÍVICO-MILITAR)
    let compiledProfile = `Estudante: ${studentName} | Turma: ${className || 'Regular'}\n`;
    if (milScore !== null) {
      compiledProfile += `• Regime Disciplinar Cívico-Militar: Nota de Conduta ${milScore.toFixed(1)}/10.0 [Classificação: ${getMilitaryConcept(milScore)}], acumulando ${activeMilitar.length} registros de deméritos e infrações disciplinares aplicadas pela monitoria militar;\n`;
    }
    if (activeFicai.length > 0) {
      compiledProfile += `• Notificação de Infrequência Escolar (FICAI) ativa na Busca Ativa;\n`;
    }
    compiledProfile += `• Apresenta reincidência comportamental e fragilidade no vínculo protetivo familiar;\n`;
    compiledProfile += `• Necessidade de acompanhamento técnico continuado pelos órgãos do Sistema de Garantia de Direitos.`;

    // 5. ENCAMINHAMENTO CONSELHO TUTELAR / MINISTÉRIO PÚBLICO
    let compiledForwarding = `Diante do esgotamento dos recursos pedagógicos e administrativos no âmbito escolar, com fulcro no Artigo 56, incisos I, II e III da Lei Federal nº 8.069/1990 (Estatuto da Criança e do Adolescente - ECA), a E.E. Cívico-Militar André Antônio Maggi encaminha o presente RELATÓRIO CIRCUNSTANCIADO:\n\n`;
    compiledForwarding += `1. Ao CONSELHO TUTELAR DO MUNICÍPIO DE COLÍDER - MT: Para aplicação das medidas de proteção à criança/adolescente (Art. 136, I e II, ECA) e aplicação de deveres aos pais/responsáveis (Art. 129, ECA);\n\n`;
    compiledForwarding += `2. À PROMOTORIA DE JUSTIÇA DA INFÂNCIA E JUVENTUDE DA COMARCA DE COLÍDER - MT (MINISTÉRIO PÚBLICO ESTADUAL): Para conhecimento, registro no sistema de proteção e eventuais providências cíveis/infracionais cabíveis.`;

    setForm(prev => ({
      ...prev,
      involvedStudents: studentName,
      className: className || prev.className,
      recordedFact: compiledFacts,
      schoolMeasuresTaken: compiledMeasures,
      psychosocialActions: compiledPsychosocial,
      socioEducationalProfile: compiledProfile,
      futureForwarding: compiledForwarding,
      status: 'ENCAMINHADO_CONSELHO'
    }));
  };

  const handleToggleEvidenceItem = (id: string) => {
    const updated = evidenceItems.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    setEvidenceItems(updated);
    generateFormalTextsFromEvidence(updated, form.involvedStudents || '', form.className || '');
  };

  const handleSelectAllEvidence = (selectAll: boolean) => {
    const updated = evidenceItems.map(item => ({ ...item, checked: selectAll }));
    setEvidenceItems(updated);
    generateFormalTextsFromEvidence(updated, form.involvedStudents || '', form.className || '');
  };

  // Upload de Evidências Digitais (B.O., Prints, Fotos)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: any) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        const newAttachment = {
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          name: file.name,
          url: base64Url,
          type: type || 'OUTRO',
          date: new Date().toLocaleDateString('sv-SE'),
          description: `Anexo Documental: ${file.name}`
        };

        setForm(prev => ({
          ...prev,
          evidenceAttachments: [...(prev.evidenceAttachments || []), newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (attId: string) => {
    setForm(prev => ({
      ...prev,
      evidenceAttachments: (prev.evidenceAttachments || []).filter(a => a.id !== attId)
    }));
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
      createdAt: form.createdAt || new Date().toISOString(),
      evidenceAttachments: form.evidenceAttachments || [],
      externalProtocol: form.externalProtocol,
      followUpStatus: form.followUpStatus
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

  // Salvar Protocolo Externo
  const handleSaveProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!protocolModalReport) return;

    const updatedProtocol = {
      protocolNumber: protocolForm.protocolNumber || `PROT-${Date.now().toString().substring(6)}`,
      receiptDate: protocolForm.receiptDate,
      recipientEntity: protocolForm.recipientEntity,
      recipientName: protocolForm.recipientName || 'Servidor Plantonista',
      notes: protocolForm.notes,
      receiptFileUrl: protocolForm.receiptFileUrl
    };

    const updatedReport: PsychosocialCircumstantiatedReport = {
      ...protocolModalReport,
      externalProtocol: updatedProtocol,
      followUpStatus: 'AGUARDANDO_DEVOLUTIVA',
      status: protocolForm.recipientEntity === 'PROMOTORIA_JUSTICA' ? 'ENCAMINHADO_PROMOTORIA' : 'ENCAMINHADO_CONSELHO'
    };

    const updatedList = reports.map(r => r.id === updatedReport.id ? updatedReport : r);
    setReports(updatedList);
    localStorage.setItem('psychosocial_circumstantiated_reports_v1', JSON.stringify(updatedList));
    setProtocolModalReport(null);
    alert("✅ Protocolo de entrega registrado com sucesso!");
  };

  // Cálculo de SLA / Dias Decorridos desde o Protocolo
  const getProtocolSlaBadge = (report: PsychosocialCircumstantiatedReport) => {
    if (!report.externalProtocol?.receiptDate) return null;
    const protocolDate = new Date(report.externalProtocol.receiptDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - protocolDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 15) {
      return (
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
          <Clock size={11} /> {diffDays}d decorridos (Em Prazo)
        </span>
      );
    } else if (diffDays <= 30) {
      return (
        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
          <Clock size={11} /> {diffDays}d (Aguardando Resposta)
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 animate-pulse">
          <AlertCircle size={11} /> {diffDays}d (Reiteração Necessária!)
        </span>
      );
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
            <Scale size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Relatórios Circunstanciados (Juntada de Fatos)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[8px] font-black uppercase tracking-wider">
                Conselho Tutelar & Ministério Público
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Instrumento formal de juntada probatória com medidas disciplinares cívico-militares, fundamentação no ECA (Art. 56), anexos digitais e protocolos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
                status: 'FINALIZADO',
                evidenceAttachments: []
              });
              setEvidenceItems([]);
              setShowEvidenceChecklist(false);
              setStudentMilitaryScore(null);
              setIsModalOpen(true);
            }}
            className="px-6 py-3.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Novo Relatório Circunstanciado
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número de relatório, estudante, turma ou fato..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destino:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
          >
            <option value="TODOS">Todos os Relatórios</option>
            <option value="FINALIZADO">✓ Finalizados (Tratativas Escolares)</option>
            <option value="ENCAMINHADO_CONSELHO">🏢 Encaminhado ao Conselho Tutelar</option>
            <option value="ENCAMINHADO_PROMOTORIA">🏛️ Encaminhado ao Ministério Público</option>
          </select>
        </div>
      </div>

      {/* GRID DE RELATÓRIOS CIRCUNSTANCIADOS */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="animate-spin mx-auto mb-2 text-indigo-600" size={32} />
          <p className="text-xs font-bold uppercase tracking-widest">Carregando Relatórios...</p>
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
          {filteredReports.map(rep => {
            const hasProtocol = Boolean(rep.externalProtocol?.protocolNumber);
            const totalAttachments = (rep.evidenceAttachments || []).length;

            return (
              <div
                key={rep.id}
                className="bg-white border border-slate-200/90 rounded-[2rem] p-6 hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col justify-between gap-4 group relative overflow-hidden"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-800 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {rep.reportNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleDelete(rep.id, e)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Excluir Relatório"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 uppercase leading-tight line-clamp-1">
                    {rep.involvedStudents}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                    {rep.className || 'Turma não especificada'} • {new Date(rep.incidentDate).toLocaleDateString('pt-BR')}
                  </p>

                  <p className="text-xs text-slate-600 line-clamp-3 mt-3 font-medium text-justify">
                    {rep.recordedFact}
                  </p>

                  {/* BADGES DE PROTOCOLO E ANEXOS */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {hasProtocol ? (
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                        <FileCheck size={11} /> Prot: {rep.externalProtocol?.protocolNumber}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase">
                        Sem Protocolo Externo
                      </span>
                    )}

                    {getProtocolSlaBadge(rep)}

                    {totalAttachments > 0 && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                        <Paperclip size={10} /> {totalAttachments} anexo(s)
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setProtocolModalReport(rep);
                      setProtocolForm({
                        protocolNumber: rep.externalProtocol?.protocolNumber || '',
                        receiptDate: rep.externalProtocol?.receiptDate || new Date().toLocaleDateString('sv-SE'),
                        recipientEntity: rep.externalProtocol?.recipientEntity || 'CONSELHO_TUTELAR',
                        recipientName: rep.externalProtocol?.recipientName || '',
                        notes: rep.externalProtocol?.notes || '',
                        receiptFileUrl: rep.externalProtocol?.receiptFileUrl || ''
                      });
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    title="Registrar número de protocolo do Conselho Tutelar ou Ministério Público"
                  >
                    <Send size={13} /> {hasProtocol ? 'Ver Protocolo' : 'Registrar Protocolo'}
                  </button>

                  <button
                    onClick={() => setSelectedReport(rep)}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <Eye size={13} /> Ver Documento A4
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 bg-white rounded-[3rem] border border-slate-200 space-y-3">
          <Scale size={48} className="mx-auto text-slate-300" />
          <h4 className="text-base font-black uppercase text-slate-700">Nenhum relatório circunstanciado encontrado</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Clique em "Novo Relatório Circunstanciado" acima para compilar o dossiê do estudante.
          </p>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DO RELATÓRIO CIRCUNSTANCIADO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[94vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg">
                  <Scale size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Relatório Circunstanciado Oficial</h3>
                  <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest">
                    Compilador de Provas & Juntada • Conselho Tutelar & Ministério Público
                  </p>
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
                      placeholder="Buscar aluno no banco escolar para carregar dados automaticamente..."
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
                            <span className="text-[10px] font-black text-indigo-600 uppercase">+ Selecionar & Compilar</span>
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

                  {/* BOTÃO DE JUNTADA AUTOMÁTICA DE FATOS E PROVAS */}
                  {form.involvedStudents && (
                    <button
                      type="button"
                      onClick={() => handleAutoCompileDossier(form.involvedStudents || '', form.className || '')}
                      disabled={isCompilingDossier}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-rose-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-98 transition-all border border-white/20"
                    >
                      {isCompilingDossier ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Compilando Histórico e Medidas Disciplinares...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} /> ⚡ Compilar Juntada Automática de Fatos (Ocorrências + Medidas Militares + Mediações + Faltas)
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* PAINEL INTERATIVO DE SELEÇÃO DE EVIDÊNCIAS / PROVAS */}
                {showEvidenceChecklist && evidenceItems.length > 0 && (
                  <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-3xl space-y-3 animate-in fade-in">
                    <div className="flex justify-between items-center pb-2 border-b border-indigo-200 flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-indigo-950 uppercase tracking-tight flex items-center gap-2">
                            <CheckSquare size={16} className="text-indigo-600" />
                            Checklist Interativo de Provas ({evidenceItems.filter(i => i.checked).length}/{evidenceItems.length} selecionadas)
                          </h4>
                          {studentMilitaryScore !== null && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                              <Shield size={10} /> Nota Cívico-Militar: {studentMilitaryScore.toFixed(1)}/10 ({getMilitaryConcept(studentMilitaryScore)})
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-indigo-700 font-medium mt-0.5">
                          Marque ou desmarque ocorrências, medidas disciplinares militares e mediações para compor o texto oficial.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectAllEvidence(true)}
                          className="px-2.5 py-1 bg-white text-indigo-700 rounded-lg text-[9px] font-black uppercase border border-indigo-200 hover:bg-indigo-100"
                        >
                          Marcar Todas
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectAllEvidence(false)}
                          className="px-2.5 py-1 bg-white text-slate-600 rounded-lg text-[9px] font-black uppercase border border-slate-200 hover:bg-slate-100"
                        >
                          Desmarcar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                      {evidenceItems.map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleEvidenceItem(item.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                            item.checked
                              ? item.type === 'MILITAR'
                                ? 'bg-blue-50/80 border-blue-300 shadow-sm text-blue-950'
                                : 'bg-white border-indigo-400 shadow-sm text-indigo-950'
                              : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-indigo-600 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                item.type === 'MILITAR' ? 'bg-blue-600 text-white' :
                                item.type === 'MEDIACAO' ? 'bg-purple-600 text-white' :
                                item.type === 'FICAI' ? 'bg-rose-600 text-white' :
                                'bg-slate-200 text-slate-700'
                              }`}>
                                {item.type}
                              </span>
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                                {item.date}
                              </span>
                              <span className="text-[10px] font-black uppercase truncate text-indigo-900">
                                {item.title}
                              </span>
                            </div>
                            <p className="text-[10px] line-clamp-2 mt-1 font-medium leading-tight">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 1. FATO REGISTRADO */}
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-1">
                    1. Fato Registrado (Descrição do Incidente & Histórico Disciplinar)
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.recordedFact || ''}
                    onChange={e => setForm(prev => ({ ...prev, recordedFact: e.target.value }))}
                    placeholder="Descreva a ocorrência dos fatos, atitudes observadas, palavras proferidas ou agressões..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 2. PROVIDÊNCIAS ADOTADAS PELA ESCOLA (INCLUINDO MEDIDAS CÍVICO-MILITARES) */}
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-1">
                    2. Providências Adotadas pela Escola & Medidas Disciplinares Aplicadas
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.schoolMeasuresTaken || ''}
                    onChange={e => setForm(prev => ({ ...prev, schoolMeasuresTaken: e.target.value }))}
                    placeholder="Comunicação aos responsáveis, advertências militares, termos de ajuste de conduta, LGPD..."
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
                    placeholder="Acolhimento da família e estudante, referenciamento para rede de apoio, abertura de FICAI, ações de cultura de paz..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 4. PERFIL SOCIOEDUCACIONAL */}
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-1">
                    4. Perfil Socioeducacional & Conceito de Conduta Cívico-Militar
                  </label>
                  <textarea
                    rows={4}
                    value={form.socioEducationalProfile || ''}
                    onChange={e => setForm(prev => ({ ...prev, socioEducationalProfile: e.target.value }))}
                    placeholder="Nota de conduta militar, comportamento no domicílio, reincidência, monitoramento de frequência na Busca Ativa, rendimento pedagógico e programas sociais..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 5. ENCAMINHAMENTOS FUTUROS (PÓS-FATO) */}
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-1">
                    5. Encaminhamentos Futuros & Juntada de Documentos (Conselho Tutelar & MP)
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

                {/* 7. EVIDÊNCIAS DIGITAIS E ANEXOS (UPLOAD DE ARQUIVOS / BOLETINS / PRINTS) */}
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <Paperclip size={16} className="text-indigo-600" />
                        Galeria de Anexos & Evidências Digitais ({(form.evidenceAttachments || []).length})
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Anexe cópias digitalizadas do B.O., prints de ameaças, fotos de termos físicos, partes disciplinares militares ou laudos médicos.
                      </p>
                    </div>

                    <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center gap-1.5 shrink-0">
                      <Plus size={14} /> + Anexar Arquivo / Imagem
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'OUTRO')}
                      />
                    </label>
                  </div>

                  {(form.evidenceAttachments || []).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(form.evidenceAttachments || []).map((att, attIdx) => (
                        <div key={att.id || attIdx} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3 relative group">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {att.url.startsWith('data:image') ? (
                              <img src={att.url} alt={att.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shrink-0">
                                <FileText size={18} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-800 uppercase truncate">{att.name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{att.date}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-all"
                            title="Remover Anexo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 text-center py-4 font-medium italic">
                      Nenhum arquivo ou evidência anexada ainda. Clique no botão acima para adicionar.
                    </p>
                  )}
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
                      <option value="ENCAMINHADO_CONSELHO">🏢 Encaminhado ao Conselho Tutelar</option>
                      <option value="ENCAMINHADO_PROMOTORIA">🏛️ Encaminhado à Promotoria da Infância e Juventude</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Participantes Presentes</label>
                    <input
                      type="text"
                      value={form.participants || ''}
                      onChange={e => setForm(prev => ({ ...prev, participants: e.target.value }))}
                      placeholder="Pais, Estudantes, Técnico Psicossocial, Mediadora, Direção, Monitoria Militar..."
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

      {/* MODAL DE PROTOCOLO EXTERNO (CONSELHO TUTELAR / MINISTÉRIO PÚBLICO) */}
      {protocolModalReport && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600 rounded-xl text-white">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">Registrar Protocolo Externo</h3>
                  <p className="text-[10px] text-purple-300 font-bold uppercase">
                    {protocolModalReport.reportNumber}
                  </p>
                </div>
              </div>
              <button onClick={() => setProtocolModalReport(null)} className="p-2 text-slate-400 hover:text-white rounded-xl">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProtocol} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Órgão Destinatário:
                </label>
                <select
                  value={protocolForm.recipientEntity}
                  onChange={e => setProtocolForm(prev => ({ ...prev, recipientEntity: e.target.value as any }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white"
                >
                  <option value="CONSELHO_TUTELAR">🏢 Conselho Tutelar do Município de Colíder - MT</option>
                  <option value="PROMOTORIA_JUSTICA">🏛️ Promotoria da Infância e Juventude (Ministério Público)</option>
                  <option value="DRE_SINOP">🎓 DRE-Sinop / SEDUC-MT</option>
                  <option value="OUTRO">Outro Órgão da Rede de Garantia de Direitos</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Número do Protocolo:
                  </label>
                  <input
                    type="text"
                    required
                    value={protocolForm.protocolNumber}
                    onChange={e => setProtocolForm(prev => ({ ...prev, protocolNumber: e.target.value }))}
                    placeholder="Ex: PROT-CT-2026-084"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Data do Recebimento:
                  </label>
                  <input
                    type="date"
                    required
                    value={protocolForm.receiptDate}
                    onChange={e => setProtocolForm(prev => ({ ...prev, receiptDate: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Nome do Conselheiro / Servidor que Recebeu:
                </label>
                <input
                  type="text"
                  required
                  value={protocolForm.recipientName}
                  onChange={e => setProtocolForm(prev => ({ ...prev, recipientName: e.target.value }))}
                  placeholder="Nome completo do conselheiro ou oficial"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Observações / Prazos Acordados:
                </label>
                <textarea
                  rows={2}
                  value={protocolForm.notes}
                  onChange={e => setProtocolForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Prazo estipulado para devolutiva, audiência designada, etc..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProtocolModalReport(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/20"
                >
                  Salvar Protocolo
                </button>
              </div>
            </form>
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
                <p className="text-[10px] text-slate-600">Diretoria Regional de Educação de Sinop • Corpo de Alunos, Núcleo de Mediação Escolar e Equipe Psicossocial</p>
              </div>

              {/* TÍTULO DO DOCUMENTO */}
              <div className="text-center my-4">
                <h2 className="text-base font-black uppercase text-slate-900 tracking-wider">
                  {selectedReport.reportNumber}
                </h2>
                {selectedReport.externalProtocol?.protocolNumber && (
                  <p className="text-[11px] font-mono font-bold text-slate-600 mt-1 uppercase">
                    Protocolo de Entrega: {selectedReport.externalProtocol.protocolNumber} ({selectedReport.externalProtocol.recipientEntity}) em {selectedReport.externalProtocol.receiptDate}
                  </p>
                )}
              </div>

              {/* DATA E LOCAL */}
              <div className="text-xs space-y-1 border border-slate-300 p-3 rounded-lg bg-slate-50">
                <p><strong>Data e Local:</strong> {new Date(selectedReport.incidentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}, {selectedReport.incidentLocation}.</p>
                <p><strong>Estudantes Envolvidos:</strong> <span className="uppercase font-bold">{selectedReport.involvedStudents}</span> ({selectedReport.className || 'Turma não informada'})</p>
              </div>

              {/* CORPO DO RELATÓRIO */}
              <div className="space-y-4 text-xs leading-relaxed text-slate-800 text-justify">
                
                {/* 1. FATO */}
                <div className="space-y-1">
                  <h5 className="font-black uppercase text-slate-900">1. Fato Registrado & Histórico de Ocorrências e Infrações Disciplinares:</h5>
                  <p className="p-3 bg-white border border-slate-300 rounded-lg text-[11px] leading-relaxed whitespace-pre-line">
                    {selectedReport.recordedFact}
                  </p>
                </div>

                {/* 2. PROVIDÊNCIAS */}
                <div className="space-y-1">
                  <h5 className="font-black uppercase text-slate-900">2. Providências Adotadas pela Unidade Escolar & Medidas Disciplinares Aplicadas:</h5>
                  <p className="p-3 bg-white border border-slate-300 rounded-lg text-[11px] leading-relaxed whitespace-pre-line">
                    {selectedReport.schoolMeasuresTaken}
                  </p>
                </div>

                {/* 3. AÇÕES DA EQUIPE PSICOSSOCIAL E MEDIADOR */}
                {selectedReport.psychosocialActions && (
                  <div className="space-y-1">
                    <h5 className="font-black uppercase text-slate-900">3. Ações da Equipe Psicossocial, Professor Mediador e Coordenação:</h5>
                    <p className="p-3 bg-white border border-slate-300 rounded-lg text-[11px] leading-relaxed whitespace-pre-line">
                      {selectedReport.psychosocialActions}
                    </p>
                  </div>
                )}

                {/* 4. PERFIL SOCIOEDUCACIONAL */}
                {selectedReport.socioEducationalProfile && (
                  <div className="space-y-1">
                    <h5 className="font-black uppercase text-slate-900">4. Perfil Socioeducacional & Regime Disciplinar Cívico-Militar:</h5>
                    <p className="p-3 bg-white border border-slate-300 rounded-lg text-[11px] leading-relaxed whitespace-pre-line">
                      {selectedReport.socioEducationalProfile}
                    </p>
                  </div>
                )}

                {/* 5. ENCAMINHAMENTOS FUTUROS */}
                {selectedReport.futureForwarding && (
                  <div className="space-y-1">
                    <h5 className="font-black uppercase text-slate-900">5. Encaminhamentos & Fundamentação Jurídica (Art. 56 e 136, ECA):</h5>
                    <p className="p-3 bg-white border border-slate-300 rounded-lg text-[11px] leading-relaxed whitespace-pre-line">
                      {selectedReport.futureForwarding}
                    </p>
                  </div>
                )}

                {/* 6. DOCUMENTOS ANEXOS */}
                {selectedReport.attachedDocumentsChecklist && selectedReport.attachedDocumentsChecklist.length > 0 && (
                  <div className="space-y-1">
                    <h5 className="font-black uppercase text-slate-900">6. Checklist de Documentos Anexados para Juntada:</h5>
                    <div className="p-3 bg-white border border-slate-300 rounded-lg text-[11px] space-y-1">
                      {selectedReport.attachedDocumentsChecklist.map((doc, idx) => (
                        <p key={idx}>☑ {doc}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. EVIDÊNCIAS DIGITAIS ANEXADAS */}
                {(selectedReport.evidenceAttachments || []).length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h5 className="font-black uppercase text-slate-900">7. Evidências Documentais Anexadas:</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {(selectedReport.evidenceAttachments || []).map((att, idx) => (
                        <div key={idx} className="border border-slate-300 rounded-lg p-2 bg-slate-50 space-y-1 text-center">
                          <p className="text-[10px] font-black uppercase text-slate-800">Anexo {idx + 1}: {att.name}</p>
                          {att.url.startsWith('data:image') && (
                            <img src={att.url} alt={att.name} className="max-h-48 mx-auto rounded border border-slate-200 object-contain" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* SELOS DE ASSINATURA ELETRÔNICA INSTITUCIONAL */}
              {selectedReport.signatures && selectedReport.signatures.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-300 space-y-3">
                  <h6 className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                    Assinaturas Eletrônicas Válidas (Lei Federal nº 14.063/2020):
                  </h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedReport.signatures.map((sig, sIdx) => (
                      <ElectronicSignatureStamp key={sIdx} proof={sig} />
                    ))}
                  </div>
                </div>
              )}

              {/* ASSINATURAS FÍSICAS TIMBRADAS */}
              <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-1">
                  <div className="border-b border-slate-900 w-48 mx-auto mb-1"></div>
                  <p className="font-black uppercase">{selectedReport.directorName || 'REZIERE DE SOUZA'}</p>
                  <p className="text-[10px] text-slate-600 uppercase">Diretor Escolar</p>
                </div>

                <div className="space-y-1">
                  <div className="border-b border-slate-900 w-48 mx-auto mb-1"></div>
                  <p className="font-black uppercase">{selectedReport.coordinatorName || 'COORDENAÇÃO PEDAGÓGICA'}</p>
                  <p className="text-[10px] text-slate-600 uppercase">Coordenação Pedagógica</p>
                </div>

                <div className="space-y-1 mt-4">
                  <div className="border-b border-slate-900 w-48 mx-auto mb-1"></div>
                  <p className="font-black uppercase">{selectedReport.mediatorName || 'DANÚBIA DE CASTRO ALMEIDA'}</p>
                  <p className="text-[10px] text-slate-600 uppercase">Professora Mediadora Escolar</p>
                </div>

                <div className="space-y-1 mt-4">
                  <div className="border-b border-slate-900 w-48 mx-auto mb-1"></div>
                  <p className="font-black uppercase">{selectedReport.psychosocialProfessional || 'TÉCNICO PSICOSSOCIAL'}</p>
                  <p className="text-[10px] text-slate-600 uppercase">Técnico Psicossocial</p>
                </div>
              </div>

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
          user={user}
          onSignatureSuccess={(proof) => {
            const currentSignatures = selectedReport.signatures || [];
            const updated = {
              ...selectedReport,
              signatures: [...currentSignatures, proof],
              isSigned: true
            };
            setSelectedReport(updated);
            const list = reports.map(r => r.id === updated.id ? updated : r);
            setReports(list);
            localStorage.setItem('psychosocial_circumstantiated_reports_v1', JSON.stringify(list));
            setIsSignatureModalOpen(false);
          }}
        />
      )}

    </div>
  );
};

export default PsychosocialCircumstantiatedReportManager;
