
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

export type MovementType = 'FÉRIAS' | 'LICENÇA PRÊMIO' | 'ATESTADO' | 'AFASTAMENTO' | 'RETORNO';

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
  substituteId?: string; // New
  substituteName?: string;
  reason?: string;
  attachmentUrl?: string; // New
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
export interface SchoolCelebration { id: string; title: string; day: number; month: number; category: string; iconType: 'PROFESSOR' | 'MERENDEIRA' | 'ZELADOR' | 'SECRETARIA' | 'GESTAO' | 'PSICOSSOCIAL' | 'GERAL' | 'COORDENADOR' | 'BIBLIOTECA' | 'MOTORISTA' | 'TI' | 'VIGILANTE' | 'ORIENTADOR'; }
export interface BirthdayPerson { id: string; name: string; role: string; day: number; month: number; }
export type OccurrenceCategory = 'INDISCIPLINA' | 'CONFLITO' | 'ATRASO' | 'VIOLÊNCIA' | 'DESCUMPRIMENTO_REGRAS' | 'OUTRO';
export interface PedagogicalOccurrence { id: string; date: string; time: string; involvedStudents: string; className: string; location: string; report: string; responsible: string; category: OccurrenceCategory; attachments: string[]; status: 'REGISTRADO' | 'ATA_GERADA' | 'ARQUIVADO'; timestamp: number; }
export interface OccurrenceAta { id: string; occurrenceId: string; formalText: string; summary: string; involvedParties: string; suggestedReferrals: string[]; date: string; }
export interface PsychosocialReferral { id: string; schoolUnit: string; studentName: string; studentAge: string; className: string; teacherName: string; previousStrategies: string; observedAspects: { learning: string[]; behavioral: string[]; emotional: string[]; }; report: string; status: 'PENDENTE' | 'EM_ACOMPANHAMENTO' | 'CONCLUÍDO'; date: string; timestamp: number; attachments?: string[]; attendanceFrequency?: string; adoptedProcedures?: string[]; }

export interface PsychosocialMeetingAta {
  id: string;
  number: string;
  year: string;
  pauta: string;
  date: string;
  location: string;
  participants: string[];
  objectives: string;
  definitions: string[]; // Itens Organizados em tópicos
  forwarding: string[]; // Tarefas a fazer e quem as fará
  responsible: string;
  timestamp: number;
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
export interface Student { id: string; name: string; birthDate: string; address: string; guardianName: string; contactPhone: string; registration_number: string; className: string; status: 'ATIVO' | 'TRANSFERIDO' | 'EVADIDO' | 'FORMADO'; documents: { type: string; status: 'ENTREGUE' | 'PENDENTE'; }[]; }
export interface Classroom { id: string; name: string; year: string; shift: Shift; teacherId: string; studentIds: string[]; schedule: { day: string; subjects: { time: string; subject: string }[]; }[]; }
export interface SecretariatNotification { id: string; title: string; message: string; targetTeacherId?: string; targetClassId?: string; date: string; isRead: boolean; priority: 'ALTA' | 'NORMAL'; }
export interface Book { id: string; title: string; author: string; category: string; isbn?: string; totalCopies: number; availableCopies: number; location: string; }
export interface Reader { id: string; name: string; registration: string; class: string; email?: string; }
export interface Loan { id: string; bookId: string; bookTitle: string; readerId: string; readerName: string; loanDate: string; dueDate: string; status: 'ATIVO' | 'DEVOLVIDO'; returnDate?: string; }
export interface ChromebookBooking { id: string; stationId: string; date: string; shift: Shift; classes: string[]; teacherName: string; className: string; subject: string; observations: string; timestamp: number; }
export interface ScienceLabBooking { id: string; date: string; shift: Shift; classes: string[]; teacherName: string; className: string; subject: string; experimentName: string; needsTechnician: boolean; observations: string; timestamp: number; }
export interface PedagogicalKitchenBooking { id: string; date: string; shift: Shift; classes: string[]; teacherName: string; className: string; subject: string; projectName: string; ingredientsRequested: string; observations: string; timestamp: number; }
export interface LibraryRoomBooking { id: string; date: string; shift: Shift; classes: string[]; teacherName: string; className: string; subject: string; activityType: 'Leitura Livre' | 'Pesquisa Orientada' | 'Contação de Histórias' | 'Exposição' | 'Outros'; needsMediaProjector: boolean; observations: string; timestamp: number; }
export interface MakerLabBooking { id: string; date: string; shift: Shift; classes: string[]; teacherName: string; className: string; subject: string; projectName: string; equipmentUsed: string[]; observations: string; timestamp: number; }
export interface AuditoriumBooking { id: string; date: string; shift: Shift; classes: string[]; teacherName: string; className: string; subject: string; eventName: string; eventType: 'Palestra' | 'Apresentação' | 'Cinema' | 'Ensaio' | 'Reunião' | 'Outros'; needsSound: boolean; needsProjector: boolean; needsAc: boolean; observations: string; timestamp: number; }
export interface AttendanceRecord { id: string; date: string; shift: Shift; className: string; teacherName: string; subject: string; presences: { studentId: string; studentName: string; isPresent: boolean; }[]; timestamp: number; }
export interface ClassroomOccurrence { id: string; date: string; teacherName: string; className: string; studentName: string; type: 'DISCIPLINAR' | 'PEDAGÓGICO' | 'MÉDICO' | 'ELOGIO' | 'OUTRO'; severity: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'CRÍTICA'; description: string; notifiedParents: boolean; timestamp: number; }
export interface PedagogicalSkill { code: string; description: string; }
export interface LessonPlanRow { weekOrDate: string; theme: string; materialPage: string; skillsText: string; content: string; activities: string; methodology: string; duration: string; evaluation: string; }
export interface LessonPlan { id: string; bimestre: string; subject: string; teacher: string; year: string; className: string; weeklyClasses: string; skills: PedagogicalSkill[]; recompositionSkills: PedagogicalSkill[]; themes: string; rows: LessonPlanRow[]; observations?: string; status: 'RASCUNHO' | 'EM_ANALISE' | 'VALIDADO' | 'CORRECAO_SOLICITADA'; coordinationFeedback?: string; timestamp: number; }
export interface StudentGrade { studentId: string; studentName: string; score: number; proficiencyLevel?: 'MUITO_BAIXO' | 'BAIXO' | 'MÉDIO' | 'ALTO'; }
export interface Assessment { id: string; date: string; bimestre: string; className: string; subject: string; teacherName: string; type: 'CAED' | 'SISTEMA ESTRUTURADO' | 'OUTRO'; description: string; max_score: number; grades: StudentGrade[]; timestamp: number; }
export interface ClassroomObservation { escola: string; teacher: string; subject: string; className: string; date: string; observador: string; cargo: string; organizacional: { inicioPontual: number; ritmoAdequado: number; usoEficienteTempo: number; minimizacaoInterrupcoes: number; clarezaTomVoz: number; }; pedagogico: { clarezaObjetivos: number; usoRecursos: number; interacaoAlunos: number; avaliacaoFormativa: number; }; evidencias: string; avaliacaoGeral: 'Adequado' | 'Bom' | 'Excelente' | 'Precisa Melhorar'; feedback?: { pontosFortes: string; pontosMelhorar: string; sugestoesPraticas: string[]; planoAcao: string; escalaFeedback: 'Bom' | 'Excelente' | 'Regular' | 'Precisa Melhorar'; enviadoEm?: number; }; }
export interface PedagogicalProject { id: string; name: string; coordinator: string; bimestre: string; status: 'PLANEJAMENTO' | 'EM_ANDAMENTO' | 'CONCLUÍDO'; impactLevel: 'BAIXO' | 'MÉDIO' | 'ALTO'; description: string; }
export interface PedagogicalMaterial { id: string; name: string; category: string; unit: string; current: number; min: number; }
export interface PedagogicalMaterialRequest { id: string; date: string; teacherName: string; status: 'PENDENTE' | 'APROVADO' | 'ENTREGUE' | 'REJEITADO'; reason: string; timestamp: number; items: { materialId: string; materialName: string; quantity: number; unit: string; }[]; }
export interface EquipmentBooking { id: string; equipmentId: string; equipmentName: string; date: string; shift: Shift; teacherName: string; className: string; status: 'SOLICITADO' | 'RETIRADO' | 'DEVOLVIDO' | 'RECUSADO' | 'LIBERADO'; timestamp: number; returnTimestamp?: number; studentList?: string; }
export interface AssetHistory { id: string; date: string; action: string; responsible: string; notes: string; }
export type AssetCondition = 'EXCELENTE' | 'BOM' | 'REGULAR' | 'PÉSSIMO';
export interface Asset { id: string; description: string; location: string; heritageNumber: string; condition: AssetCondition; photo?: string; isUnserviceable: boolean; unserviceableData?: { date: string; reason: string; responsible: string; }; history: AssetHistory[]; timestamp: number; }
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
export interface PPEDelivery { id: string; employeeName: string; employeeRole: string; ppeId: string; ppeName: string; quantity: number; date: string; timestamp: number; }
export type CleaningMaterialCategory = 'COZINHA' | 'ESCOLA';
export interface CleaningMaterial { id: string; name: string; category: CleaningMaterialCategory; stock: number; minStock: number; unit: string; }
export interface MaterialDelivery { id: string; employeeName: string; employeeRole: string; materialId: string; materialName: string; quantity: number; date: string; timestamp: number; }
export interface MaterialEntry { id: string; supplier: string; materialId: string; materialName: string; quantity: number; date: string; timestamp: number; invoice?: string; }
export type MaintenanceArea = 'ESTRUTURAL' | 'HIDRÁULICA' | 'ELÉTRICA' | 'INCÊNDIO' | 'MOBILIÁRIO' | 'ACESSIBILIDADE' | 'OUTROS';
export type MaintenanceFrequency = 'DIÁRIA' | 'SEMANAL' | 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'BIENAL' | 'QUINQUENAL';
export interface MaintenanceTask { id: string; area: MaintenanceArea; title: string; description: string; frequency: MaintenanceFrequency; dueDate: string; status: 'PENDENTE' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'ALERTA' | 'ATRASADO'; lastPerformed?: string; }
export type ReferralType = 'PEDAGÓGICO' | 'PSICOLÓGICO' | 'SOCIAL' | 'CONSELHO_TUTELAR';
export interface Referral { id: string; studentId: string; studentName: string; type: ReferralType; reason: string; status: 'ABERTO' | 'EM_ACOMPANHAMENTO' | 'CONCLUÍDO'; responsible: string; notes?: string; date: string; }
export type PsychosocialRole = 'PSICOSSOCIAL' | 'GESTAO' | 'PROFESSOR';
export type MediationStatus = 'ABERTURA' | 'PLANEJAMENTO' | 'EXECUÇÃO' | 'CONCLUÍDO';
export type CaseSeverity = 'BAIXA' | 'MÉDIA' | 'ALTA' | 'CRÍTICA';
export interface MediationStep { id: string; label: string; completed: boolean; date?: string; }
export interface MediationCase { id: string; studentId: string; studentName: string; className: string; type: 'CONFLITO' | 'BULLYING' | 'DISCIPLINAR' | 'OUTRO'; severity: CaseSeverity; status: MediationStatus; openedAt: string; description: string; involvedParties: string[]; steps: MediationStep[]; }
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
