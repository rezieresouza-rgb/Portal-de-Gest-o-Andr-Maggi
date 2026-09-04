
export type Shift = 'MATUTINO' | 'VESPERTINO' | 'NOTURNO' | 'INTEGRAL';

export type UserRole = 'ADMINISTRADOR' | 'USUARIO_COMUM' | 'CONVIDADO' | 'GESTAO' | 'SECRETARIA' | 'PROFESSOR' | 'PSICOSSOCIAL' | 'AAE' | 'TAE' | 'AAE_LIMPEZA' | 'AEE_NUTRICAO' | 'MANUTENCAO';

export interface User {
  id: string;
  name: string;
  login: string;
  email?: string;
  role: UserRole;
  jobFunction?: string;
  token?: string;
  lastLogin?: string;
  password?: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  module: string;
  timestamp: number;
  action: string;
}

export interface CalendarEvent {
  dia: number;
  tipo: string;
  categoria?: 'FERIADO' | 'LETIVO' | 'ADMINISTRATIVO' | 'PEDAGOGICO' | 'FERIAS';
}

export interface MonthlyCalendar {
  mes: string;
  eventos: CalendarEvent[];
  orientativo?: string;
}

export interface SchoolCalendarData {
  ano_letivo: number;
  unidade_escolar: string;
  municipio: string;
  meses: MonthlyCalendar[];
}

export type MovementType = 'FÉRIAS' | 'LICENÇA PRÊMIO' | 'LICENÇA MATERNIDADE / GESTANTE' | 'ATESTADO' | 'AFASTAMENTO' | 'RETORNO' | 'TÉRMINO DE CONTRATO' | 'DESLIGAMENTO' | 'REINTEGRAÇÃO / REVERSÃO DE DESLIGAMENTO';

export interface StaffMovement {
  id: string;
  staffId: string;
  staffName?: string; // Optional/Derived
  staffRegistration?: string;
  staffRole?: string;
  staffCpf?: string;
  type: MovementType;
  startDate: string;
  endDate?: string;
  durationDays?: number;
  substituteId?: string;
  substituteIds?: string[]; // Multiple substitutes
  substituteName?: string;
  substituteNames?: string[]; // Multiple substitute names
  reason?: string;
  attachmentUrl?: string;
  notes?: string;
  responsible?: string;
  timestamp?: number;
  created_at?: string;
}

export interface StaffMember {
  id: string;
  code: string; // Código do sistema
  registration: string; // matrícula
  name: string;
  role: UserRole;
  cpf: string;
  birthDate: string;
  entryProfile: string;
  serverType: 'Professor' | 'Apoio' | 'Técnico';
  jobFunction: string;
  shift: Shift; // Turno (Novo Campo)
  qualification: string; // Habilitação (Novo Campo)
  email: string;
  status: 'EM_ATIVIDADE' | 'FERIAS' | 'LICENCA_MEDICA' | 'LICENCA_PREMIO' | 'AFASTADO' | 'TRANSFERIDO' | 'DESLIGADO';
  education?: string;
  workload?: number; // Carga horária
  contractTerm?: { start: string; end: string; }; // Vigência do contrato
  additionalClasses?: string[]; // Aulas adicionais para concursados
  observations?: string;
  assignedSubjects?: string[]; // Disciplina atribuída
  leaveHistory?: { type: string; startDate: string; endDate: string; description: string; }[];
  additionalWorkloadHours?: number; // Carga horária adicional
  additionalWorkloadTerm?: { start: string; end: string; }; // Vigência aulas adicionais
  movementHistory?: StaffMovement[];
  notifyAlerts?: boolean;
  photoUrl?: string;
  password?: string; // transient for user management integration
  userRole?: UserRole; // explicit role override
}

export interface SchoolAnnouncement { id: string; title: string; message: string; date: string; author: string; priority: 'ALTA' | 'NORMAL'; }
export interface SchoolEvent { id: string; title: string; date: string; type: 'REUNIÃO' | 'FORMAÇÃO' | 'CONSELHO' | 'FESTIVO' | 'OUTRO'; location?: string; }
export interface SchoolCelebration { id: string; title: string; day: number; month: number; category: string; iconType: 'PROFESSOR' | 'MERENDEIRA' | 'ZELADOR' | 'SECRETARIA' | 'GESTAO' | 'PSICOSSOCIAL' | 'GERAL' | 'COORDENADOR' | 'BIBLIOTECA' | 'MOTORISTA' | 'TI' | 'VIGILANTE' | 'ORIENTADOR' | 'SOLDADO'; }
export interface BirthdayPerson { id: string; name: string; role: string; day: number; month: number; }
export type OccurrenceCategory = 'INDISCIPLINA' | 'CONFLITO' | 'ATRASO' | 'VIOLÊNCIA' | 'DESCUMPRIMENTO_REGRAS' | 'OUTRO';
export type TramitationSector = 'PROFESSOR' | 'CIVICO_MILITAR' | 'MEDIACAO' | 'BUSCA_ATIVA' | 'PSICOSSOCIAL';
export type TramitationPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type TramitationStatus = 'PENDENTE' | 'EM_ATENDIMENTO' | 'CONCLUIDO' | 'DEVOLVIDO';

export interface OccurrenceTramitation {
  id: string;
  occurrence_id: string;
  from_sector: TramitationSector;
  to_sector: TramitationSector;
  tramitated_by?: string;
  tramitated_by_name?: string;
  reason: string;
  priority: TramitationPriority;
  status: TramitationStatus;
  feedback?: string;
  created_at: string;
  updated_at?: string;
}

export interface PedagogicalOccurrence {
  id: string;
  date: string;
  time: string;
  involvedStudents: string;
  className: string;
  location: string;
  report: string;
  responsible: string;
  category: OccurrenceCategory;
  severity?: string;
  attachments: string[];
  status: 'REGISTRADO' | 'ATA_GERADA' | 'ARQUIVADO';
  timestamp: number;
  student_id?: string;
  current_sector?: TramitationSector;
  tramitation_status?: string;
}
export interface OccurrenceAta { id: string; occurrenceId: string; formalText: string; summary: string; involvedParties: string; suggestedReferrals: string[]; date: string; }
export interface ClassCouncilStudentObservation {
  studentId: string;
  studentName: string;
  pedagogicalProgress: 'SATISFATORIO' | 'PARCIAL' | 'INSATISFATORIO';
  behavioralStatus: 'BOM' | 'REGULAR' | 'CRITICO';
  notes: string;
  recommendations: string;
}

export interface ClassCouncil {
  id: string;
  classroomId: string;
  className?: string;
  bimestre: string;
  date: string;
  generalDiagnosis: string;
  studentObservations: ClassCouncilStudentObservation[];
  decisions: string;
  attendanceTeachers: string[];
  status: 'RASCUNHO' | 'FINALIZADO';
  timestamp: number;
}

export type ExternalNetworkDestination = 
  | 'CONSELHO_TUTELAR'
  | 'CAPSI_SAUDE_MENTAL'
  | 'CRAS'
  | 'CREAS'
  | 'PROMOTORIA_INFANCIA'
  | 'UBS_SAUDE_BASICA'
  | 'OUTRO';

export interface PsychosocialExternalReferral {
  id: string;
  protocolNumber: string;
  studentId?: string;
  studentName: string;
  className: string;
  studentAge?: string;
  birthDate?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianAddress?: string;
  destination: ExternalNetworkDestination;
  destinationName?: string;
  urgency: 'NORMAL' | 'URGENTE' | 'URGENTÍSSIMA';
  reason: string;
  schoolActionsTaken: string;
  psychosocialOpinion: string;
  requestedActions: string;
  professionalName: string;
  professionalRole: string;
  professionalRegister?: string;
  directorName: string;
  referralDate: string;
  status: 'EMITIDO' | 'NOTIFICADO' | 'EM_ACOMPANHAMENTO' | 'RESPOSTA_RECEBIDA' | 'CONCLUÍDO';
  responseNotes?: string;
  createdAt?: string;
  signatures?: ElectronicSignatureProof[];
  isSigned?: boolean;
}

export type PsychosocialSessionType = 
  | 'ESCUTA_INDIVIDUAL_ALUNO'
  | 'ENTREVISTA_FAMILIAR'
  | 'ALINHAMENTO_PEDAGOGICO'
  | 'VISITA_DOMICILIAR'
  | 'ESTUDO_CASO_INTERSETORIAL'
  | 'MANEJO_CRISE_EMOCIONAL';

export interface PsychosocialSessionLog {
  id: string;
  date: string;
  time?: string;
  type: PsychosocialSessionType;
  participants: string;
  professionalName: string;
  professionalRole: string;
  summary: string;
  confidentialNotes?: string;
  immediateActions?: string;
}

export interface PsychosocialProcessStep {
  id: string;
  label: string;
  completed: boolean;
  date?: string;
}

export interface PsychosocialCase {
  id: string;
  caseNumber?: string;
  studentId?: string;
  studentName: string;
  className: string;
  studentAge?: string;
  birthDate?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianAddress?: string;
  status: 'ACOLHIMENTO' | 'EM_ACOMPANHAMENTO' | 'AGUARDANDO_REDE' | 'CONCLUÍDO';
  priority: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'CRÍTICA';
  demandType: 'SAUDE_MENTAL' | 'VULNERABILIDADE_SOCIAL' | 'VIOLENCIA_DOMESTICA' | 'LUTO_CRISE' | 'COMPORTAMENTAL_GRAVE' | 'INFREQUENCIA_EVASAO' | 'OUTRO';
  origin: 'TRIAGEM_MEDIACAO' | 'GESTAO_ESCOLAR' | 'BUSCA_ATIVA' | 'DEMANDA_ESPONTANEA';
  originReferralId?: string;
  openedAt: string;
  closedAt?: string;
  initialDemand: string;
  logs: PsychosocialSessionLog[];
  steps: PsychosocialProcessStep[];
  technicalOpinion?: string;
  schoolRecommendations?: string;
  externalNetworkAction?: string;
  professionalInCharge?: string;
}

export interface PsychosocialReferral { 
  id: string; 
  schoolUnit: string; 
  studentName: string; 
  studentAge: string; 
  className: string; 
  teacherName: string; 
  previousStrategies: string; 
  observedAspects: { learning: string[]; behavioral: string[]; emotional: string[]; }; 
  report: string; 
  status: 'PENDENTE' | 'EM_ACOMPANHAMENTO' | 'CONCLUÍDO'; 
  date: string; 
  timestamp: number; 
  priority: 'BAIXA' | 'MEDIA' | 'ALTA'; 
  reason: string; 
  feedback?: string; 
  attachments?: string[]; 
  attendanceFrequency?: string; 
  adopted_procedures?: string[]; 
  referralDestination?: 'BUSCA_ATIVA' | 'MEDIACAO' | 'CONSELHO_TUTELAR' | 'ASSISTENCIA_SOCIAL' | 'PSICOSSOCIAL'; 
  mediationProcedures?: string[];
  origin_case_id?: string;
  psychosocialOpinion?: string;
}

export interface ElectronicSignatureProof {
  id: string;
  documentId: string;
  documentType: 'TERMO_COMPROMISSO' | 'FICAI' | 'RELATORIO_CIRCUNSTANCIADO' | 'ATA_REUNIAO' | 'ENCAMINHAMENTO_MEDIACAO' | 'OUTRO';
  documentTitle: string;
  documentHash: string; // SHA-256 da íntegra do documento
  signerId: string;
  signerName: string;
  signerRole: string;
  signerCpfOrMatricula: string;
  signatureType: 'SENHA_INSTITUCIONAL' | 'PIN_SEGURANCA' | 'TELA_TOUCH' | 'CODIGO_WHATSAPP';
  verificationCode: string; // Ex: AUTH-MAGGI-9F3A-88B1-2026
  signedAt: string; // ISO 8601
  ipAddress?: string;
  legalBasis: string; // "Lei Federal nº 14.063/2020 e MP nº 2.200-2/2001"
  touchSignatureDataUrl?: string; // Desenho da assinatura se feito na tela
  notes?: string;
}

export interface PsychosocialCircumstantiatedReport {
  id: string;
  reportNumber: string; // Ex: RELATÓRIO CIRCUNSTANCIADO Nº 001/2026
  schoolUnit: string;
  incidentDate: string;
  incidentLocation: string;
  involvedStudents: string; // Nomes dos alunos envolvidos
  className?: string;
  recordedFact: string; // 1. Fato Registrado
  schoolMeasuresTaken: string; // 2. Providências Adotadas pela Escola (Comunicação pais, BO, LGPD imagens)
  psychosocialActions: string; // 3. Ações da Equipe Psicossocial, Mediador, Coordenação (Acolhimento, FICAI, Cultura de Paz)
  socioEducationalProfile: string; // 4. Perfil Socioeducacional (Família, Reincidência, Busca Ativa, Rendimento, Pé-de-Meia, Bolsa Família)
  futureForwarding: string; // 5. Encaminhamentos Futuros / Pós-Fato (Promotoria, CAPSi, Conselho)
  attachedDocumentsChecklist: string[]; // 6. Documentos para juntada
  participants: string; // Presentes
  psychosocialProfessional: string;
  mediatorName?: string;
  coordinatorName?: string;
  directorName: string;
  status: 'EM_ANALISE' | 'FINALIZADO' | 'ENCAMINHADO_PROMOTORIA' | 'ENCAMINHADO_CONSELHO';
  createdAt: string;
  signatures?: ElectronicSignatureProof[];
  isSigned?: boolean;
  
  // Evidências Digitais Anexas
  evidenceAttachments?: {
    id: string;
    name: string;
    url: string; // Base64 data URL ou link
    type: 'BO_POLICIAL' | 'PRINT_MENSAGENS' | 'TERMO_FISICO' | 'LAUDO_MEDICO' | 'FOTO_EVIDENCIA' | 'OUTRO';
    date: string;
    description?: string;
  }[];

  // Controle de Protocolo Externo
  externalProtocol?: {
    protocolNumber: string;
    receiptDate: string;
    recipientEntity: 'CONSELHO_TUTELAR' | 'PROMOTORIA_JUSTICA' | 'DRE_SINOP' | 'OUTRO';
    recipientName: string;
    receiptFileUrl?: string; // Recibo carimbado
    notes?: string;
  };

  // Monitoramento de Prazos e Devolutivas
  followUpStatus?: 'AGUARDANDO_DEVOLUTIVA' | 'DEVOLUTIVA_RECEBIDA' | 'REITERACAO_ENVIADA' | 'ARQUIVADO';
  lastFollowUpDate?: string;
  followUpNotes?: string;
}

export interface PsychosocialMeetingAta {
  id: string;
  number: string;
  year: string;
  pauta?: string;
  date: string;
  location?: string;
  participants?: string[];
  objectives?: string;
  definitions?: string[]; // Itens Organizados em tópicos
  forwarding?: string[]; // Tarefas a fazer e quem as fará
  responsible?: string;
  
  // Modelo Professor Mediador
  responsavelMediacao?: string;
  horarioInicio?: string;
  horarioTermino?: string;
  descricaoConflito?: string;
  dataOcorrido?: string;
  parte1Nome?: string;
  interessesParte1?: string;
  parte2Nome?: string;
  interessesParte2?: string;
  desenvolvimentoSessao?: string;
  compromissoParte1?: string;
  compromissoParte2?: string;
  compromissoMutuo?: string;
  encerramentoEncaminhamentos?: string;

  timestamp: number;
  caseId?: string;
  signatures?: ElectronicSignatureProof[];
  isSigned?: boolean;
}

export interface ParentCommitmentTerm {
  id: string;
  termNumber: string; // Ex: TERMO DE COMPROMISSO Nº 001/2026
  studentId?: string;
  studentName: string;
  className: string;
  guardianName: string;
  guardianCpf?: string;
  guardianPhone: string;
  meetingDate: string;
  absencesCount: number;
  absenceReasons: string;
  agreedCommitments: string[]; // Compromissos assumidos pelos pais
  schoolGuidance: string; // Orientações da gestão/coordenação
  responsibleStaff: string; // Coordenador/Gestor que atendeu
  status: 'ASSINADO' | 'PENDENTE_COMPARECIMENTO' | 'DESCUMPRIDO' | 'CUMPRIDO';
  createdAt: string;
  signatures?: ElectronicSignatureProof[];
  isSigned?: boolean;
}

export interface AtaParticipant {
  id?: string;
  name: string;
  role: string;
  document?: string;
}

export interface SchoolAta {
  id: string;
  number: number;
  year: number;
  formatted_number: string;
  module_source: 'SECRETARIA' | 'COORDENACAO' | 'CIVICO_MILITAR' | 'GESTAO';
  category: 'DISCIPLINAR' | 'PEDAGOGICO' | 'PAIS_RESPONSAVEIS' | 'CONSELHO_CLASSE' | 'GESTAO_ALINHAMENTO' | 'GERAL';
  pauta_assunto: string;
  meeting_date: string;
  meeting_time_start: string;
  meeting_time_end: string;
  location: string;
  participants: AtaParticipant[];
  objectives: string;
  content_deliberations: string;
  forwarding_actions: string;
  signatory_name: string;
  signatory_role: string;
  signatories?: { name: string; role?: string }[];
  created_at: string;
}


export interface PedagogicalIntervention {
  id: string;
  student_name: string;
  class_name: string;
  reason: string;
  action_plan: string;
  deadline?: string;
  status: 'EM_ANDAMENTO' | 'AGUARDANDO_FAMILIA' | 'RESOLVIDO';
  created_at: string;
}

export interface RightsViolationNotification {
  id: string;
  notificationDate: string;
  municipality: string;
  uf: string;
  school_name: string;
  school_address: string;
  forward_to: {
    tutelar_council: boolean;
    police_authority: boolean;
    health_system: boolean;
    social_assistance: boolean;
  };
  student: {
    name: string;
    birth_date: string;
    age: string;
    gender: string;
    sus_card: string;
    grade: string;
    has_disability: boolean;
    disability_type: string;
  };
  guardians: {
    names: string;
    address: string;
    phone: string;
    cep: string;
    complement: string;
  };
  violation_type: {
    mistreatment: boolean;
    suicide_attempt: boolean;
    self_harm: boolean;
    psychological_violence: boolean;
    physical_violence: boolean;
    sexual_violence: boolean;
    other: string;
  };
  complementary_info: string;
  director_name: string;
  sent_date: string;
  sent_time: string;
  school_guidelines: string;
  timestamp: number;
}

export enum ContractStatus { ACTIVE = 'ATIVO', INACTIVE = 'INATIVO', COMPLETED = 'CONCLUÍDO' }
export interface ContractItem { id: string; description: string; contractedQuantity: number; acquiredQuantity: number; unit: string; unitPrice: number; brand?: string; }
export interface Contract { id: string; number: string; supplierId: string; supplierName: string; startDate: string; endDate: string; status: ContractStatus; type: string; items: ContractItem[]; }
export interface Order { id: string; orderNumber: string; contractNumber: string; supplierName: string; issueDate: string; deliveryDate: string; totalValue: number; observations: string; items: { description: string; quantity: number; unit: string; unitPrice: number; brand: string; }[]; }
export interface Student { id: string; name: string; birthDate: string; gender?: string; address: string; guardianName: string; contactPhone: string; registration_number: string; className: string; enrollment_date?: string; adjustment_date?: string; status: 'ATIVO' | 'TRANSFERIDO' | 'EVADIDO' | 'FORMADO'; documents: { type: string; status: 'ENTREGUE' | 'PENDENTE'; }[]; }
export interface Classroom { id: string; name: string; year: string; shift: Shift; teacherId: string; studentIds: string[]; schedule: { day: string; subjects: { time: string; subject: string }[]; }[]; }
export interface SecretariatNotification { id: string; title: string; message: string; targetTeacherId?: string; targetClassId?: string; date: string; isRead: boolean; priority: 'ALTA' | 'NORMAL'; }
export interface Book { id: string; title: string; author: string; category: string; isbn?: string; totalCopies: number; availableCopies: number; location: string; internalRegistration?: string; registrationDate?: string; bookType?: 'AVULSO' | 'COLEÇÃO'; volumeNumber?: string; subtitle?: string; colorTag?: string; coverUrl?: string; synopsis?: string; isApaBook?: boolean; }
export interface Reader { id: string; name: string; registration: string; class: string; email?: string; }
export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  readerId: string;
  readerName: string;
  loanDate: string;
  dueDate: string;
  status: 'ATIVO' | 'DEVOLVIDO' | 'RESERVA' | 'RESERVA_DISPONIVEL' | 'CANCELADO';
  returnDate?: string;
  isApaLoan?: boolean;
  reservationDate?: string;
  notes?: string;
}
export interface ChromebookBooking { id: string; stationId: string; date: string; shift: Shift; classes: string[]; teacherName: string; className: string; subject: string; observations: string; timestamp: number; }
export interface ScienceLabBooking { id: string; date: string; shift: Shift; classes: string[]; teacherName: string; className: string; subject: string; experimentName: string; needsTechnician: boolean; observations: string; timestamp: number; }
export interface PedagogicalKitchenBooking { id: string; date: string; shift: Shift; classes: string[]; teacherName: string; className: string; subject: string; projectName: string; ingredientsRequested: string; observations: string; timestamp: number; }
export interface LibraryRoomBooking { id: string; date: string; shift: Shift; classes: string[]; teacherName: string; className: string; subject: string; activityType: 'Leitura Livre' | 'Pesquisa Orientada' | 'Contação de Histórias' | 'Exposição' | 'Outros'; needsMediaProjector: boolean; observations: string; timestamp: number; }
export interface MakerLabBooking { id: string; date: string; shift: Shift; classes: string[]; teacherName: string; className: string; subject: string; projectName: string; equipmentUsed: string[]; observations: string; timestamp: number; }
export interface AuditoriumBooking { id: string; date: string; shift: Shift; classes: string[]; teacherName: string; className: string; subject: string; eventName: string; eventType: 'Palestra' | 'Apresentação' | 'Cinema' | 'Ensaio' | 'Reunião' | 'Outros'; needsSound: boolean; needsProjector: boolean; needsAc: boolean; observations: string; timestamp: number; }
export interface AttendanceRecord { id: string; date: string; shift: Shift; className: string; teacherName: string; subject: string; presences: { studentId: string; studentName: string; isPresent: boolean; }[]; timestamp: number; }
export interface ClassroomOccurrence { id: string; date: string; teacherName: string; className: string; studentName: string; type: 'DISCIPLINAR' | 'PEDAGÓGICO' | 'MÉDICO' | 'ELOGIO' | 'OUTRO'; severity: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'CRÍTICA'; description: string; notifiedParents: boolean; timestamp: number; }
export interface PedagogicalSkill { code: string; description: string; knowledgeObject?: string; }
export interface LessonPlanRow { weekOrDate: string; theme: string; materialPage: string; skillsText: string; content: string; activities: string; methodology: string; duration: string; evaluation: string; recomposition?: string; }
export interface LessonPlan { id: string; bimestre: string; subject: string; teacher: string; year: string; className: string; classNames?: string[]; weeklyClasses: string; skills: PedagogicalSkill[]; recompositionSkills: PedagogicalSkill[]; themes: string; rows: LessonPlanRow[]; observations?: string; status: 'RASCUNHO' | 'EM_ANALISE' | 'VALIDADO' | 'CORRECAO_SOLICITADA'; coordinationFeedback?: string; timestamp: number; history?: { role: string; text: string; date: string; }[]; }
export interface StudentGrade { studentId: string; studentName: string; score: number; proficiencyLevel?: 'MUITO_BAIXO' | 'BAIXO' | 'MÉDIO' | 'ALTO'; }
export interface Assessment { id: string; date: string; bimestre: string; className: string; subject: string; teacherName: string; type: 'CAED' | 'SISTEMA ESTRUTURADO' | 'OUTRO'; description: string; max_score: number; grades: StudentGrade[]; timestamp: number; }
export interface ClassroomObservation { escola: string; teacher: string; subject: string; className: string; date: string; observador: string; cargo: string; organizacional: { inicioPontual: number; ritmoAdequado: number; usoEficienteTempo: number; minimizacaoInterrupcoes: number; clarezaTomVoz: number; }; pedagogico: { clarezaObjetivos: number; usoRecursos: number; interacaoAlunos: number; avaliacaoFormativa: number; }; evidencias: string; avaliacaoGeral: 'Adequado' | 'Bom' | 'Excelente' | 'Precisa Melhorar'; feedback?: { pontosFortes: string; pontosMelhorar: string; sugestoesPraticas: string[]; planoAcao: string; escalaFeedback: 'Bom' | 'Excelente' | 'Regular' | 'Precisa Melhorar'; enviadoEm?: number; }; }
export interface PedagogicalProject { id: string; name: string; coordinator: string; bimestre: string; status: 'PLANEJAMENTO' | 'EM_ANDAMENTO' | 'CONCLUÍDO'; impactLevel: 'BAIXO' | 'MÉDIO' | 'ALTO'; description: string; }
export interface PedagogicalMaterial { id: string; name: string; category: string; unit: string; current: number; min: number; }
export interface PedagogicalMaterialRequest { id: string; date: string; teacherName: string; status: 'PENDENTE' | 'APROVADO' | 'ENTREGUE' | 'REJEITADO'; reason: string; timestamp: number; items: { materialId: string; materialName: string; quantity: number; unit: string; }[]; }
export interface EquipmentBooking { id: string; equipmentId: string; equipmentName: string; date: string; shift: Shift; teacherName: string; className: string; status: 'SOLICITADO' | 'RETIRADO' | 'DEVOLVIDO' | 'RECUSADO' | 'LIBERADO'; timestamp: number; returnTimestamp?: number; studentList?: string; }
export interface AssetHistory { id: string; date: string; action: string; responsible: string; notes: string; }
export type AssetCondition = 'EXCELENTE' | 'BOM' | 'REGULAR' | 'PÉSSIMO';
export interface Asset { id: string; description: string; location: string; heritageNumber: string; condition: AssetCondition; photo?: string; isUnserviceable: boolean; unserviceableData?: { date: string; reason: string; responsible: string; }; history: AssetHistory[]; timestamp: number; acquisitionDocument?: string; acquisitionYear?: string; }
export interface TechnicalSheetIngredient { description: string; perCapitaLiquido: number; }
export interface TechnicalSheet { preparationName: string; ingredients: TechnicalSheetIngredient[]; }
export interface ShoppingListItem {
  description: string;
  quantity: number;
  unit: string;
  week: number;
  supplierName: string;
  contractNumber: string;
  isPerishable: boolean;
  unit_price: number;
  selected?: boolean;
  contractId?: string;
  contractItemId?: string;
  observations?: string;
}

export type SchoolEnvironmentCategory =
  | 'SALA_AULA'
  | 'AUDITORIO'
  | 'SALA_RECURSOS'
  | 'LABORATORIO'
  | 'BIBLIOTECA'
  | 'ADMINISTRATIVO'
  | 'SANITARIO'
  | 'CIRCULACAO'
  | 'CALCADA_INTERNA'
  | 'CALCADA_EXTERNA'
  | 'PATIO_REFEITORIO'
  | 'COMPLEMENTAR'
  | 'EXTERNA';

export interface SchoolEnvironment { id: string; name: string; category: SchoolEnvironmentCategory; complianceRate: number; }
export type CleaningFrequency = 'DIÁRIA' | 'SEMANAL' | 'MENSAL' | 'TRIMESTRAL';
export interface CleaningTask { id: string; environmentId: string; assignedEmployeeId: string; title: string; frequency: CleaningFrequency; status: 'PENDENTE' | 'CONCLUÍDO'; lastPerformed?: string; observations?: string; }
export interface PrintedDocument { id: string; title: string; reference_date: string; status: 'ASSINADO' | 'PENDENTE_ASSINATURA'; }
export interface CleaningEmployee { id: string; name: string; shift: 'MATUTINO' | 'VESPERTINO' | 'NOTURNO'; isFixed?: boolean; scope?: string; }
export type PPECategory = 'COZINHA' | 'LIMPEZA' | 'MANUTENÇÃO';
export interface PPEItem { id: string; name: string; category: PPECategory; currentStock: number; minStock: number; unit: string; }
export interface PPEDeliveryItem {
  ppeId: string;
  ppeName: string;
  quantity: number;
}

export interface PPEDelivery {
  id: string;
  employeeName: string;
  employeeRole: string;
  items: PPEDeliveryItem[];
  date: string;
  timestamp: number;
}
export type CleaningMaterialCategory = 'COZINHA' | 'ESCOLA';
export interface CleaningMaterial { id: string; name: string; category: CleaningMaterialCategory; stock: number; minStock: number; unit: string; }
export interface MaterialDelivery { id: string; employeeName: string; employeeRole: string; materialId: string; materialName: string; quantity: number; date: string; timestamp: number; }
export interface MaterialEntry { id: string; supplier: string; materialId: string; materialName: string; quantity: number; date: string; timestamp: number; invoice?: string; }
export type MaintenanceArea = 'ESTRUTURAL' | 'HIDRÁULICA' | 'ELÉTRICA' | 'INCÊNDIO' | 'MOBILIÁRIO' | 'ACESSIBILIDADE' | 'OUTROS';
export type MaintenanceFrequency = 'DIÁRIA' | 'SEMANAL' | 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'BIENAL' | 'QUINQUENAL';
export interface MaintenanceTask { id: string; area: MaintenanceArea; title: string; description: string; frequency: MaintenanceFrequency; dueDate: string; status: 'PENDENTE' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'ALERTA' | 'ATRASADO'; lastPerformed?: string; }
export type ReferralType = 
  | 'EVASÃO_INFREQUÊNCIA' 
  | 'CONFLITO_FAMILIAR' 
  | 'VULNERABILIDADE_SOCIAL' 
  | 'SAÚDE_MENTAL' 
  | 'BULLYING_CONFLITO' 
  | 'REDE_DE_PROTEÇÃO' 
  | 'PEDAGÓGICO' 
  | 'OUTRO';

export type ReferralPriority = 'BAIXA' | 'MÉDIA' | 'ALTA' | 'URGENTE';

export interface Referral { 
  id: string; 
  studentId: string; 
  studentName: string; 
  type: ReferralType; 
  priority: ReferralPriority;
  reason: string; 
  status: 'ABERTO' | 'EM_ACOMPANHAMENTO' | 'CONCLUÍDO'; 
  responsible: string; 
  notes?: string; 
  date: string; 
  feedback?: string;
  origin_case_id?: string;
}
export type PsychosocialRole = 'PSICOSSOCIAL' | 'GESTAO' | 'PROFESSOR';
export type MediationStatus = 'ABERTURA' | 'PLANEJAMENTO' | 'EXECUÇÃO' | 'CONCLUÍDO';
export type CaseSeverity = 'BAIXA' | 'MÉDIA' | 'ALTA' | 'CRÍTICA';
export interface MediationStep { id: string; label: string; completed: boolean; date?: string; }
export interface MediationLog { id: string; date: string; professional: string; content: string; category?: string; photo?: string; photos?: string[]; }
export type MediationCaseType = 'CONFLITO' | 'BULLYING' | 'FAMILIAR' | 'INFREQUÊNCIA' | 'EMOCIONAL' | 'DISCIPLINAR' | 'CELULAR' | 'DISCRIMINAÇÃO' | 'CÍRCULO DE PAZ' | 'OUTRO' | string;
export interface MediationCase { 
  id: string; 
  studentId: string; 
  studentName: string; 
  className: string; 
  type: MediationCaseType; 
  severity: CaseSeverity; 
  status: MediationStatus; 
  openedAt: string; 
  closedAt?: string; 
  description: string; 
  involvedParties: string[]; 
  steps: MediationStep[]; 
  logs: MediationLog[]; 
  feedback?: string; 
  originReferralId?: string; 
  teacherName?: string;
  targetScope?: 'INDIVIDUAL' | 'GRUPO' | 'TURMA';
  participantsCount?: number;
}
export type MediationCalendarMonth = 
  | 'FEVEREIRO' 
  | 'MARÇO' 
  | 'ABRIL' 
  | 'MAIO' 
  | 'JUNHO' 
  | 'JULHO' 
  | 'AGOSTO' 
  | 'SETEMBRO' 
  | 'OUTUBRO' 
  | 'NOVEMBRO';

export type MediationActionType = 
  | 'PALESTRA' 
  | 'CÍRCULO_DE_PAZ' 
  | 'OFICINA' 
  | 'CAMPANHA' 
  | 'CAPACITAÇÃO' 
  | 'REUNIÃO_FAMILIAR' 
  | 'AÇÃO_COLETIVA' 
  | 'OUTRO';

export interface MediationCalendarAction {
  id: string;
  month: MediationCalendarMonth;
  orientativoNumber: string;
  theme: string;
  title: string;
  actionType: MediationActionType;
  targetAudience: string;
  classes: string[];
  participantCount: number;
  executionDate: string;
  responsibleMediator: string;
  partnerships?: string;
  description: string;
  outcomes?: string;
  status: 'PLANEJADA' | 'EM_ANDAMENTO' | 'CONCLUÍDA' | 'CANCELADA';
  evidenceUrls?: string[];
  photos?: string[];
  photo?: string;
  createdAt?: string;
}

export interface PsychosocialAppointment { id: string; studentId: string; studentName: string; date: string; time: string; professionalName: string; type: 'ESCUTA_INDIVIDUAL' | 'CIRCULO_PAZ' | 'REUNIAO_FAMILIAR' | 'VISITA_DOMICILIAR'; notes: string; isConfidential: boolean; }
export type CampaignStatus = 'PLANEJAMENTO' | 'ATIVO' | 'CONCLUÍDO';
export interface CampaignMaterial { id: string; name: string; type: 'PDF' | 'VÍDEO' | 'LINK' | 'IMAGEM'; url: string; }
export interface CampaignActivity { id: string; title: string; date: string; time: string; location: string; responsible: string; }
export interface CampaignFeedback { id: string; authorName: string; role: string; className: string; padding: number; rating: number; comment: string; date: string; }
export interface Campaign { id: string; name: string; theme: string; startDate: string; endDate: string; status: CampaignStatus; responsibleTeam: string[]; materials: CampaignMaterial[]; schedule: CampaignActivity[]; feedbacks: CampaignFeedback[]; relatedCasesIds: string[]; targetClasses: string[]; reachCount?: number; }
export type OccurrenceType = 'NÃO_ENTREGA' | 'PRODUTO_ESTRAGADO' | 'FORA_DO_PADRÃO' | 'ENTREGA_PARCIAL';
export type OccurrenceStatus = 'PENDENTE' | 'RESOLVIDO' | 'REINCIDENTE' | 'EM_ANALISE';
export interface SupplierOccurrence { id: string; supplierId: string; supplierName: string; orderNumber?: string; type: OccurrenceType; status: OccurrenceStatus; description: string; items_affected: string[]; issueDate: string; orderDate?: string; deadlineDate?: string; photo?: string; responsible: string; notification_sent: boolean; resolutionDate?: string; }

export interface ClassSchedule {
  id: string;
  classroom_id: string;
  day_of_week: number; // 1-5
  time_slot: string;
  subject: string;
  teacher_id?: string;
  teacher_name?: string; // Derived
}

export interface StudentMovement {
  id: string;
  student_id: string;
  movement_type: 'TRANSFERENCIA' | 'ATESTADO' | 'ABANDONO' | 'OBITO' | 'OUTROS';
  transfer_subtype?: 'INTERNA' | 'EXTERNA';
  is_reclassified?: boolean;
  description: string;
  movement_date: string;
  created_at?: string;
}

export type PreventiveStatus = 'PENDENTE' | 'AGENDADO' | 'EM_EXECUCAO' | 'CONCLUIDO';

export interface PreventiveMaintenanceItem {
  id: string;
  category: string;
  item: string;
  intervention: string;
  description: string;
  frequency: MaintenanceFrequency;
  status: PreventiveStatus;
  lastExecutionDate?: string;
  nextDueDate?: string;
  responsibleId?: string;
  cost?: number;
  observations?: string;
}

export interface ActionPlanTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ActionPlan {
  id: string;
  assessment_id: string;
  diagnosis: string;
  skills_to_reinforce: string;
  tasks: ActionPlanTask[];
  created_at: string;
}

export type ChromebookStatus = 'DISPONIVEL' | 'EMPRESTADO' | 'EM_MANUTENCAO' | 'INSERVIVEL' | 'RESERVADO';
export type ChromebookPhysicalCondition = 'OTIMO' | 'BOM' | 'COM_AVARIA' | 'INOPERANTE';

export interface ChromebookAssetItem {
  id: string;
  assetTag: string;
  internalNumber?: string;
  serialNumber: string;
  brand: string;
  model: string;
  stationId: string;
  status: ChromebookStatus;
  condition: ChromebookPhysicalCondition;
  hasCharger: boolean;
  notes?: string;
  lastInspectionDate?: string;
  created_at?: string;
}

export interface ChromebookMaintenanceLog {
  id: string;
  chromebookId: string;
  assetTag: string;
  serialNumber: string;
  defectType: 'TELA' | 'BATERIA' | 'TECLADO' | 'CARREGADOR' | 'SISTEMA' | 'ESTRUTURA' | 'OUTRO';
  description: string;
  reportedBy: string;
  reportDate: string;
  status: 'ABERTO' | 'EM_REPARO' | 'CONCLUIDO' | 'CANCELADO';
  resolutionNotes?: string;
  completedDate?: string;
  cost?: number;
}

export interface ChromebookCheckout {
  id: string;
  stationId: string;
  teacherName: string;
  className: string;
  shift: Shift;
  checkoutDate: string;
  checkoutTime: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: 'ATIVO' | 'DEVOLVIDO' | 'DEVOLVIDO_COM_AVARIA';
  quantityCheckedOut: number;
  chromebookSerialNumbers: string[];
  missingChargersCount?: number;
  returnNotes?: string;
  checkedBy?: string;
}

export type HealthIncidentType = 'MAL_ESTAR_SUBITO' | 'ACIDENTE_ESCOLAR' | 'CRISE_ANSIEDADE_PANICO' | 'CRISE_CONVULSIVA' | 'HIPOGLICEMIA_DIABETES' | 'REACAO_ALERGICA' | 'TRAUMA_QUEDA' | 'OUTRO';

export type HealthSeverityLevel = 'EMERGENCIA_VERMELHA' | 'URGENCIA_AMARELA' | 'LEVE_VERDE';

export type HealthIncidentOutcome = 'RETORNOU_AULA' | 'LIBERADO_RESPONSAVEL' | 'REMOVIDO_SAMU_UPA' | 'REMOVIDO_BOMBEIROS' | 'ENCAMINHADO_PSICOSSOCIAL';

export interface SchoolHealthIncident {
  id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  incident_type: HealthIncidentType;
  incident_date: string;
  incident_time: string;
  location: string;
  severity_level: HealthSeverityLevel;
  symptoms_description: string;
  first_aid_actions: string;
  emergency_service_called: 'SAMU_192' | 'BOMBEIROS_193' | 'NENHUM';
  emergency_protocol_number?: string;
  emergency_call_time?: string;
  parent_contacted_name: string;
  parent_contacted_phone: string;
  parent_contact_time: string;
  parent_decision: string;
  outcome: HealthIncidentOutcome;
  escort_staff_name?: string;
  attendant_name: string;
  module_origin: 'COORDENACAO' | 'CIVICO_MILITAR';
  observations?: string;
  created_at?: string;
  timestamp?: number;
}

export interface Transaction {
  id: string;
  fund_id?: string;
  date: string;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  value: number;
  category: string;
  invoice_number?: string;
  receipt_url?: string;
  status?: string;
  paf_classification?: string;
  supplier?: string;
  cnpj?: string;
  expense_type?: string;
  payment_method?: string;
  destination?: string;
  document_type?: string;
  check_number?: string;
  created_at?: string;
}
