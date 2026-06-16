import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ArrowLeft,
  Plus,
  Search,
  ChevronDown,
  X,
  FileText,
  CalendarCheck,
  ClipboardList,
  TrendingUp,
  Info,
  Shield,
  Award,
  Flag,
  UserCheck,
  AlertTriangle,
  Trash2,
  Star,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  MessageSquare,
  Activity,
  AlertOctagon,
  Radio,
  Shirt
} from 'lucide-react';
import { INITIAL_STUDENTS } from '../constants/initialData';
import { supabase } from '../supabaseClient';
import { User } from '../types';
import FatosObservadosInbox from '../components/FatosObservadosInbox';
import CivicoMilitarReports from '../components/CivicoMilitarReports';

interface CivicoMilitarModuleProps {
  user: User;
  onExit: () => void;
}

interface InspectionRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  item: string;
  date: string;
  shift: string;
  observations: string;
  responsible: string;
}

interface BehaviorOccurrence {
  id: string;
  type: 'MERIT' | 'DEMERIT';
  category: string;
  points: number;
  date: string;
  observations: string;
  responsible: string;
  disciplinaryMeasure?: string;
  suspensionDays?: number;
  isEscalated?: boolean;
}

interface StudentBehaviorState {
  studentId: string;
  studentName: string;
  className: string;
  score: number;
  isClassLeader: boolean;
  isCivicHighlight: boolean;
  occurrences: BehaviorOccurrence[];
}

interface CivicRoutineRecord {
  id: string;
  date: string;
  shift: string;
  formationOk: boolean;
  commandersPresent: boolean;
  flagsRaised: {
    national: boolean;
    state: boolean;
    municipal: boolean;
  };
  anthemsSung: {
    national: boolean;
    state: boolean;
    school: boolean;
  };
  marchingOk: boolean;
  bulletinRead: boolean;
  responsible: string;
}

const CivicoMilitarModule: React.FC<CivicoMilitarModuleProps> = ({ user, onExit }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rotina' | 'inspecao' | 'comportamento' | 'honra' | 'documentos' | 'relatorios'>('dashboard');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  // Documentações States
  const [docSearchTerm, setDocSearchTerm] = useState('');
  const [selectedStudentForDoc, setSelectedStudentForDoc] = useState<any | null>(null);
  const [selectedDocTemplate, setSelectedDocTemplate] = useState('termo_ciencia');
  const [docFields, setDocFields] = useState({
    responsibleName: '',
    responsibleRg: '',
    responsibleCpf: '',
    responsibleAddress: '',
    city: 'Colíder - MT',
    date: new Date().toISOString().split('T')[0],
    // Fato Observado fields
    series: '',
    discipline: '',
    teacher: user ? user.name : '',
    achado: '',
    monitor: 'Monitor Silva',
    recebidoDate: new Date().toISOString().split('T')[0],
    // Ficha de Medida Disciplinar fields
    faltaDate: new Date().toISOString().split('T')[0],
    medidaAplicada: '',
    falta: '',
    itensEnquadramento: '',
    outroEnquadramento: '',
    atenuantes: '',
    agravantes: '',
    gestorMilitar: '',
    documentNumber: '',
    // Termo de Adequação de Conduta fields
    obrigacoesPrazo: '',
    gestorEducacional: '',
    coordenadorName: '',
    // Autorização Uniforme Incompleto fields
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    motivoUniforme: '',
    pecaFaltante: ''
  });
  const [docHistory, setDocHistory] = useState<any[]>([]);

  const nextFichaNumber = useMemo(() => {
    if (selectedDocTemplate !== 'ficha_medida_disciplinar') return '';
    const currentYear = new Date().getFullYear();
    const fichasThisYear = docHistory.filter(d => {
      return d.template === 'ficha_medida_disciplinar' && new Date(d.date).getFullYear() === currentYear;
    });
    return `${(fichasThisYear.length + 1).toString().padStart(3, '0')}/${currentYear}`;
  }, [selectedDocTemplate, docHistory]);

  const nextTaceNumber = useMemo(() => {
    if (selectedDocTemplate !== 'termo_adequacao_conduta') return '';
    const currentYear = new Date().getFullYear();
    const tacesThisYear = docHistory.filter(d => {
      return d.template === 'termo_adequacao_conduta' && new Date(d.date).getFullYear() === currentYear;
    });
    return `${(tacesThisYear.length + 1).toString().padStart(3, '0')}/${currentYear}`;
  }, [selectedDocTemplate, docHistory]);

  const nextAutorizacaoNumber = useMemo(() => {
    if (selectedDocTemplate !== 'autorizacao_uniforme') return '';
    const currentYear = new Date().getFullYear();
    const docsThisYear = docHistory.filter(d => {
      return d.template === 'autorizacao_uniforme' && new Date(d.date).getFullYear() === currentYear;
    });
    return `${(docsThisYear.length + 1).toString().padStart(3, '0')}/${currentYear}`;
  }, [selectedDocTemplate, docHistory]);

  // Automatically infer Series/Year when a student is selected
  useEffect(() => {
    if (selectedStudentForDoc) {
      const classParts = selectedStudentForDoc.Turma.split(' ');
      let inferredSeries = selectedStudentForDoc.Turma;
      if (classParts.length >= 2) {
        const anoWord = classParts[1].toLowerCase() === 'ano' ? 'Ano' : classParts[1];
        inferredSeries = `${classParts[0]} ${anoWord}`;
      }
      setDocFields(prev => ({
        ...prev,
        series: prev.series || inferredSeries,
        responsibleName: selectedStudentForDoc.NomeResponsavel || prev.responsibleName,
        responsibleAddress: selectedStudentForDoc.TelefoneContato ? `(Tel: ${selectedStudentForDoc.TelefoneContato})` : prev.responsibleAddress
      }));
    }
  }, [selectedStudentForDoc]);

  // Modals
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isBehaviorModalOpen, setIsBehaviorModalOpen] = useState(false);
  const [selectedStudentState, setSelectedStudentState] = useState<StudentBehaviorState | null>(null);

  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isInspectionModalOpen) {
      setStudentSearchTerm('');
      setIsStudentDropdownOpen(false);
    }
  }, [isInspectionModalOpen]);

  const filteredStudentsForInspection = useMemo(() => {
    if (!studentSearchTerm) return dbStudents;
    const term = studentSearchTerm.toLowerCase();
    return dbStudents.filter(s =>
      s.Nome.toLowerCase().includes(term) ||
      s.Turma.toLowerCase().includes(term)
    );
  }, [dbStudents, studentSearchTerm]);

  // Form Fields
  const [newInspection, setNewInspection] = useState({
    studentId: '',
    item: 'Farda incompleta',
    date: new Date().toISOString().split('T')[0],
    observations: ''
  });

  const [newOccurrence, setNewOccurrence] = useState({
    type: 'DEMERIT' as 'MERIT' | 'DEMERIT',
    category: '1. Apresentar-se com uniforme diferente do estabelecido pelo regulamento do uniforme',
    date: new Date().toISOString().split('T')[0],
    observations: '',
    disciplinaryMeasure: 'Advertência Oral',
    suspensionDays: 1
  });

  // Main lists loaded from LocalStorage
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [routines, setRoutines] = useState<CivicRoutineRecord[]>([]);
  const [studentStates, setStudentStates] = useState<StudentBehaviorState[]>([]);
  const [dbStudents, setDbStudents] = useState<any[]>(INITIAL_STUDENTS);

  // Load students from Supabase
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*, enrollments(status, classrooms(name, shift))');

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped = data.map((s: any) => {
            const activeEnr = s.enrollments?.find((e: any) => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO') || s.enrollments?.[0];
            return {
              CodigoAluno: s.registration_number,
              Nome: s.name,
              Turma: activeEnr?.classrooms?.name || 'SEM TURMA',
              Turno: activeEnr?.classrooms?.shift || '---',
              DataNascimento: s.birth_date,
              PAED: s.paed ? 'Sim' : 'Não',
              TransporteEscolar: s.school_transport ? 'Sim' : 'Não',
              NomeResponsavel: s.guardian_name || '',
              TelefoneContato: s.contact_phone || ''
            };
          });
          setDbStudents(mapped);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    };
    fetchStudents();
  }, []);

  // Civic Routine Form Checklist State
  const [routineForm, setRoutineForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'MATUTINO',
    formationOk: true,
    commandersPresent: true,
    flagNational: true,
    flagState: true,
    flagMunicipal: true,
    anthemNational: true,
    anthemState: true,
    anthemSchool: true,
    marchingOk: true,
    bulletinRead: true
  });

  // 1. Initial Data Load & Sync
  useEffect(() => {
    // A. Inspections
    try {
      const savedInspections = localStorage.getItem('civico_militar_inspections_v2');
      if (savedInspections) {
        setInspections(JSON.parse(savedInspections));
      } else {
        localStorage.setItem('civico_militar_inspections_v2', JSON.stringify([]));
        setInspections([]);
      }
    } catch (e) {
      console.error(e);
    }

    // B. Civic Routines
    try {
      const savedRoutines = localStorage.getItem('civico_militar_routines_v2');
      if (savedRoutines) {
        setRoutines(JSON.parse(savedRoutines));
      } else {
        localStorage.setItem('civico_militar_routines_v2', JSON.stringify([]));
        setRoutines([]);
      }
    } catch (e) {
      console.error(e);
    }

    // C. Student Behavior Scores
    try {
      const savedScores = localStorage.getItem('civico_militar_student_scores_v3');
      if (savedScores) {
        // Check for new students in dbStudents that are not in savedScores
        const saved = JSON.parse(savedScores) as StudentBehaviorState[];
        const newStudents = dbStudents.filter(dbS => !saved.find(s => s.studentId === dbS.CodigoAluno));
        if (newStudents.length > 0) {
          const addedStates: StudentBehaviorState[] = newStudents.map(s => ({
            studentId: s.CodigoAluno,
            studentName: s.Nome,
            className: s.Turma,
            score: 8.0,
            isClassLeader: false,
            isCivicHighlight: false,
            occurrences: []
          }));
          setStudentStates([...saved, ...addedStates]);
        } else {
          setStudentStates(saved);
        }
      } else {
        // Initialize behavior states for all dbStudents
        const initialStates: StudentBehaviorState[] = dbStudents.map((s, idx) => ({
          studentId: s.CodigoAluno,
          studentName: s.Nome,
          className: s.Turma,
          score: 8.0, // Baseado no Art. 45, § 2º do Regulamento Disciplinar (grau numérico 8,0)
          isClassLeader: false,
          isCivicHighlight: false,
          occurrences: []
        }));
        localStorage.setItem('civico_militar_student_scores_v3', JSON.stringify(initialStates));
        setStudentStates(initialStates);
      }
    } catch (e) {
      console.error(e);
    }

    // D. Document History
    try {
      let currentDocs: any[] = [];
      const savedDocs = localStorage.getItem('civico_militar_documentos_v2');
      if (savedDocs) {
        currentDocs = JSON.parse(savedDocs);
      }
      
      // Migrate v1 docs to v2
      const oldDocs = localStorage.getItem('civico_militar_documentos_v1');
      if (oldDocs) {
        const oldParsed = JSON.parse(oldDocs);
        const newOnes = oldParsed.filter((oldDoc: any) => !currentDocs.some((d: any) => d.id === oldDoc.id));
        if (newOnes.length > 0) {
          currentDocs = [...newOnes, ...currentDocs].sort((a, b) => b.timestamp - a.timestamp);
          localStorage.setItem('civico_militar_documentos_v2', JSON.stringify(currentDocs));
        }
        localStorage.removeItem('civico_militar_documentos_v1');
      }

      setDocHistory(currentDocs);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync state to local storage when state changes
  const saveInspectionsToStorage = (list: InspectionRecord[]) => {
    localStorage.setItem('civico_militar_inspections_v2', JSON.stringify(list));
    setInspections(list);
  };

  const saveRoutinesToStorage = (list: CivicRoutineRecord[]) => {
    localStorage.setItem('civico_militar_routines_v2', JSON.stringify(list));
    setRoutines(list);
  };

  const saveStudentStatesToStorage = (list: StudentBehaviorState[]) => {
    localStorage.setItem('civico_militar_student_scores_v3', JSON.stringify(list));
    setStudentStates(list);
    // If a modal is open for a student, update its local copy as well
    if (selectedStudentState) {
      const updated = list.find(s => s.studentId === selectedStudentState.studentId);
      if (updated) setSelectedStudentState(updated);
    }
  };

  const saveDocHistoryToStorage = (list: any[]) => {
    localStorage.setItem('civico_militar_documentos_v2', JSON.stringify(list));
    setDocHistory(list);
  };

  // 2. Computed Statistics
  const stats = useMemo(() => {
    const totalStudents = studentStates.length;
    const perfectScoreCount = studentStates.filter(s => s.score >= 10).length;
    const averageScore = totalStudents > 0 
      ? (studentStates.reduce((acc, curr) => acc + curr.score, 0) / totalStudents).toFixed(2)
      : '10.00';

    const recentInspectionsCount = inspections.filter(i => {
      const diffTime = Math.abs(Date.now() - new Date(i.date).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length;

    // Routine adherence rate
    const lastRoutines = routines.slice(0, 10);
    const completedSteps = lastRoutines.reduce((acc, curr) => {
      let count = 0;
      if (curr.formationOk) count++;
      if (curr.commandersPresent) count++;
      if (curr.flagsRaised.national) count++;
      if (curr.flagsRaised.state) count++;
      if (curr.flagsRaised.municipal) count++;
      if (curr.anthemsSung.national) count++;
      if (curr.anthemsSung.state) count++;
      if (curr.anthemsSung.school) count++;
      if (curr.marchingOk) count++;
      if (curr.bulletinRead) count++;
      return acc + (count / 10);
    }, 0);
    const complianceRate = lastRoutines.length > 0 
      ? Math.round((completedSteps / lastRoutines.length) * 100)
      : 100;

    return {
      totalStudents,
      perfectScoreCount,
      averageScore,
      recentInspectionsCount,
      complianceRate
    };
  }, [studentStates, inspections, routines]);

  // Classes list
  const classesList = useMemo(() => {
    const classesSet = new Set(dbStudents.map(s => s.Turma));
    return Array.from(classesSet).filter(c => c && c !== 'SEM TURMA').sort();
  }, [dbStudents]);

  // Filtered Students for behavior management
  const filteredStudents = useMemo(() => {
    return studentStates.filter(s => {
      const matchesSearch = s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.studentId.includes(searchTerm);
      const matchesClass = selectedClass === 'ALL' || s.className === selectedClass;
      return matchesSearch && matchesClass;
    });
  }, [studentStates, searchTerm, selectedClass]);

  // Filtered Students for document auto-complete
  const docFilteredStudents = useMemo(() => {
    if (!docSearchTerm.trim()) return [];
    return dbStudents.filter(s =>
      s.Nome.toLowerCase().includes(docSearchTerm.toLowerCase()) ||
      s.CodigoAluno.includes(docSearchTerm)
    ).slice(0, 5);
  }, [docSearchTerm, dbStudents]);

  // Date formatter helper
  const formatDocDate = (dateStr: string) => {
    if (!dateStr) return '___ de ____________ de ______';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const day = date.getDate();
        const monthNames = [
          'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
          'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day} de ${month} de ${year}`;
      }
    } catch (e) {
      console.error(e);
    }
    return '___ de ____________ de ______';
  };

  const formatSimpleDate = (dateStr: string) => {
    if (!dateStr) return '____/____/________';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (e) {
      console.error(e);
    }
    return dateStr;
  };

  // Highlighted Students for Honor Roll
  const honorRollStudents = useMemo(() => {
    return studentStates
      .filter(s => {
        const matchesClass = selectedClass === 'ALL' || s.className === selectedClass;
        return matchesClass && (s.score >= 9.5 || s.isCivicHighlight || s.isClassLeader);
      })
      .sort((a, b) => b.score - a.score);
  }, [studentStates, selectedClass]);

  // Helper lists for merit/demerit drop-downs
  const meritOptions = [
    { category: 'Elogio Individual', points: 0.50 },
    { category: 'Elogio Coletivo', points: 0.30 },
    { category: 'Média Bimestral >= 8,0 (Art. 50)', points: 0.50 },
    { category: '2 Meses sem Medida Disciplinar (Art. 51)', points: 0.20 }
  ];

  const disciplinaryMeasuresList = [
    'Advertência Oral',
    'Advertência Escrita',
    'Suspensão de Sala de Aula',
    'Ações Educativas',
    'Transferência Educativa',
    'Estudo Orientado de Caráter Educativo'
  ];

  const demeritOptions = [
    // Faltas Leves (1 a 26) - 0.2 pts
    { category: '1. Apresentar-se com uniforme diferente do estabelecido pelo regulamento do uniforme', severity: 'LEVE', points: 0.2 },
    { category: '2. Apresentar-se com barba ou bigode sem fazer', severity: 'LEVE', points: 0.2 },
    { category: '3. Comparecer à EECM com cabelo em desalinho ou fora do padrão estabelecido pelas diretrizes dos Uniformes', severity: 'LEVE', points: 0.2 },
    { category: '4. Chegar atrasado a EECM para o início das aulas, instrução, treinamento, formatura ou atividade escolar', severity: 'LEVE', points: 0.2 },
    { category: '5. Comparecer a EECM sem levar o material necessário', severity: 'LEVE', points: 0.2 },
    { category: '6. Adentrar ou permanecer em qualquer dependência da EECM, sem autorização', severity: 'LEVE', points: 0.2 },
    { category: '7. Consumir alimentos, balas, doces líquidos ou mascar chicletes durante a aula, instrução, treinamento, formatura, atividade escolar, e nas dependências da EECM, salvo quando devidamente autorizado', severity: 'LEVE', points: 0.2 },
    { category: '8. Conversar ou se mexer quando estiver em forma', severity: 'LEVE', points: 0.2 },
    { category: '9. Deixar de entregar à Monitoria, Secretaria ou à Coordenação, qualquer objeto que não lhe pertença que tenha encontrado na EECM', severity: 'LEVE', points: 0.2 },
    { category: '10. Deixar de retribuir cumprimentos ou de prestar sinais de respeito regulamentares, previstos no Manual do Aluno', severity: 'LEVE', points: 0.2 },
    { category: '11. Deixar material escolar, objetos ou peças de uniforme em locais inapropriados dentro ou fora da unidade escolar', severity: 'LEVE', points: 0.2 },
    { category: '12. Descartar papéis, restos de comida, embalagens ou qualquer objeto no chão ou fora de locais apropriados', severity: 'LEVE', points: 0.2 },
    { category: '13. Dobrar qualquer peça de uniforme para diminuir seu tamanho, desfigurando sua originalidade', severity: 'LEVE', points: 0.2 },
    { category: '14. Debruçar-se sobre a carteira e dormir durante o horário das aulas ou instruções', severity: 'LEVE', points: 0.2 },
    { category: '15. Executar movimentos de ordem unida de forma displicente ou desatenciosa', severity: 'LEVE', points: 0.2 },
    { category: '16. Fazer ou provocar excessivo barulho em qualquer dependência da EECM, durante o horário de aula', severity: 'LEVE', points: 0.2 },
    { category: '17. Não levar ao conhecimento de autoridade competente falta ou irregularidade que presenciar ou de que tiver ciência', severity: 'LEVE', points: 0.2 },
    { category: '18. Perturbar o estudo do(s) colega(s), com ruídos ou brincadeiras', severity: 'LEVE', points: 0.2 },
    { category: '19. Utilizar-se, na sala, de qualquer publicação estranha a sua atividade escolar, salvo quando autorizado', severity: 'LEVE', points: 0.2 },
    { category: '20. Retardar ou contribuir para o atraso da execução de qualquer atividade sem justo motivo', severity: 'LEVE', points: 0.2 },
    { category: '21. Sentar-se no chão, atentando contra a postura e compostura, estando uniformizado, exceto quando em aula de educação Física', severity: 'LEVE', points: 0.2 },
    { category: '22. Utilizar qualquer tipo de jogo, brinquedo, figurinhas, coleções no interior da EECM', severity: 'LEVE', points: 0.2 },
    { category: '23. Usar, a aluna, piercings, brinco fora do padrão estabelecido, mais de um brinco em cada orelha, alargador ou similares, quando uniformizado, durante a aula, instrução, treinamento, formatura ou atividade escolar', severity: 'LEVE', points: 0.2 },
    { category: '24. Usar, o aluno, piercings, brinco, alargador ou similares, quando uniformizado, durante a aula, instrução, treinamento, formatura ou atividade escolar', severity: 'LEVE', points: 0.2 },
    { category: '25. Usar, quando uniformizado, boné, capuz ou outros adornos, durante a atividade escolar', severity: 'LEVE', points: 0.2 },
    { category: '26. Ficar na sala de aula durante os intervalos e as formaturas diárias', severity: 'LEVE', points: 0.2 },

    // Faltas Médias (27 a 62) - 0.5 pts
    { category: '27. Atrasar ou deixar de atender ao chamado da Diretoria, coordenação, Oficial de Gestão Educacional-Militar, o Oficial de Gestão Cívico-Militar, Monitores, professores ou servidores no exercício de sua função', severity: 'MÉDIA', points: 0.5 },
    { category: '28. Deixar de comparecer a qualquer atividade extraclasse para a qual tenha sido designado, exceto quando devidamente justificado', severity: 'MÉDIA', points: 0.5 },
    { category: '29. Deixar de comparecer às atividades escolares, formaturas, ou delas se ausentar, sem autorização', severity: 'MÉDIA', points: 0.5 },
    { category: '30. Deixar de cumprir ou esquivar-se de medidas disciplinares impostas pelo Gestor Educacional-Militar', severity: 'MÉDIA', points: 0.5 },
    { category: '31. Deixar de devolver à EECM, dentro do prazo estipulado, documentos devidamente assinados pelo seu responsável', severity: 'MÉDIA', points: 0.5 },
    { category: '32. Deixar de devolver, no prazo fixado, livros da biblioteca ou outros materiais pertencentes às EECM', severity: 'MÉDIA', points: 0.5 },
    { category: '33. Deixar de entregar ao pai ou responsável, documento que lhe foi encaminhado pela EECM', severity: 'MÉDIA', points: 0.5 },
    { category: '34. Deixar de executar tarefas atribuídas da Diretoria, coordenação, Oficial de Gestão Educacional-Militar, o Oficial de Gestão Cívico-Militar, Monitores, professores ou servidores no exercício de sua função', severity: 'MÉDIA', points: 0.5 },
    { category: '35. Deixar de zelar por sua apresentação pessoal', severity: 'MÉDIA', points: 0.5 },
    { category: '36. Dirigir memoriais ou petições a qualquer autoridade, sobre assuntos da alçada da Diretoria e do Oficial de Gestão Educacional-Militar', severity: 'MÉDIA', points: 0.5 },
    { category: '37. Entrar ou sair da EECM por locais não permitidos', severity: 'MÉDIA', points: 0.5 },
    { category: '38. Espalhar boatos ou notícias tendenciosas por qualquer meio', severity: 'MÉDIA', points: 0.5 },
    { category: '39. Tocar a sirene, sem ordem para tal', severity: 'MÉDIA', points: 0.5 },
    { category: '40. Fumar dentro ou nas imediações da EECM ou quando uniformizado', severity: 'MÉDIA', points: 0.5 },
    { category: '41. Ingressar ou sair da EECM sem estar com o uniforme regulamentar, bem como trocar de roupa (trajes civis) dentro da EECM ou em suas mediações', severity: 'MÉDIA', points: 0.5 },
    { category: '42. Ler ou distribuir, dentro da EECM, publicações estampas ou jornais que atentem contra a disciplina, a moral e a ordem pública', severity: 'MÉDIA', points: 0.5 },
    { category: '43. Manter contato físico que denote envolvimento de cunho amoroso (namoro, beijos, etc.) quando devidamente uniformizado, dentro da EECM ou fora dele', severity: 'MÉDIA', points: 0.5 },
    { category: '44. Não zelar pelo nome da Instituição que representa, deixando de portar-se adequadamente em qualquer ambiente, quando uniformizado ou em atividades relacionadas a EECM', severity: 'MÉDIA', points: 0.5 },
    { category: '45. Negar-se a colaborar ou participar nos eventos, formaturas, solenidades, desfiles oficiais da EECM', severity: 'MÉDIA', points: 0.5 },
    { category: '46. Ofender a moral de colegas ou de qualquer membro da Comunidade Escolar por atos, gestos ou palavras', severity: 'MÉDIA', points: 0.5 },
    { category: '47. Portar-se de forma inconveniente em sala de aula ou outro local de instrução/recreação, bem como transportes de uso coletivo', severity: 'MÉDIA', points: 0.5 },
    { category: '48. Portar-se de maneira desrespeitosa ou inconveniente nos eventos sociais ou esportivos, promovidos ou com a participação da EECM ou fora dela', severity: 'MÉDIA', points: 0.5 },
    { category: '49. Proferir palavras de baixo calão, incompatíveis com as normas da boa educação, ou grafá-las em qualquer lugar', severity: 'MÉDIA', points: 0.5 },
    { category: '50. Propor ou aceitar transação pecuniária de qualquer natureza, no interior da EECM, sem a devida autorização', severity: 'MÉDIA', points: 0.5 },
    { category: '51. Provocar ou disseminar a discórdia entre colegas', severity: 'MÉDIA', points: 0.5 },
    { category: '52. Publicar ou contribuir para que sejam publicadas mensagens, fotos, vídeos ou qualquer outro documento, na Internet ou qualquer outro meio de comunicação, que possam expor a integrante da EECM', severity: 'MÉDIA', points: 0.5 },
    { category: '53. Retirar ou tentar retirar objeto, de qualquer dependência da EECM, ou mesmo deles servir-se, sem ordem do responsável e/ou do proprietário', severity: 'MÉDIA', points: 0.5 },
    { category: '54. Sair de forma sem autorização', severity: 'MÉDIA', points: 0.5 },
    { category: '55. Sair, entrar ou permanecer na sala de aula sem permissão', severity: 'MÉDIA', points: 0.5 },
    { category: '56. Ser retirado, por mau comportamento, de sala de aula ou qualquer ambiente em que esteja sendo realizada atividade', severity: 'MÉDIA', points: 0.5 },
    { category: '57. Simular doença para esquivar-se ao atendimento de obrigações e de atividades escolares', severity: 'MÉDIA', points: 0.5 },
    { category: '58. Tomar parte em jogos de azar ou em apostas na unidade escolar ou fora dela, uniformizados ou não', severity: 'MÉDIA', points: 0.5 },
    { category: '59. Usar as instalações ou equipamentos esportivos do EECM, sem uniformes adequados, ou sem autorização', severity: 'MÉDIA', points: 0.5 },
    { category: '60. Usar o uniforme ou o nome do EECM em ambiente inapropriado', severity: 'MÉDIA', points: 0.5 },
    { category: '61. Utilizar, sem autorização, telefones celulares ou quaisquer aparelhos eletrônicos ou não, durante as atividades escolares', severity: 'MÉDIA', points: 0.5 },
    { category: '62. Usar indevidamente distintivos ou insígnias', severity: 'MÉDIA', points: 0.5 },

    // Faltas Graves (63 a 91) - 1.0 pts
    { category: '63. Assinar pelo responsável, documento que deva ser entregue à unidade escolar', severity: 'GRAVE', points: 1.0 },
    { category: '64. Causar danos ao patrimônio da unidade escolar', severity: 'GRAVE', points: 1.0 },
    { category: '65. Causar ou contribuir para a ocorrência de acidentes de qualquer natureza', severity: 'GRAVE', points: 1.0 },
    { category: '66. Comunicar-se com outro aluno ou utilizar-se de qualquer meio não permitido durante qualquer instrumento de avaliação', severity: 'GRAVE', points: 1.0 },
    { category: '67. Denegrir o nome da EECM e/ou de qualquer de seus membros através de procedimentos desrespeitosos, seja por palavras, gestos, meio virtual ou outros', severity: 'GRAVE', points: 1.0 },
    { category: '68. Desrespeitar, desobedecer ou desafiar a Diretoria, coordenação, Oficial de gestão Educacional-Militar, o Oficial de Gestão Cívico-Militar, Monitores, professores ou servidores unidade escolar', severity: 'GRAVE', points: 1.0 },
    { category: '69. Divulgar, ou concorrer para que isso aconteça, qualquer imagem ou matéria que induza a apologia às drogas, à violência e/ou pornografia', severity: 'GRAVE', points: 1.0 },
    { category: '70. Entrar na unidade escolar, ou dela se ausentar, sem autorização', severity: 'GRAVE', points: 1.0 },
    { category: '71. Extraviar documentos que estejam sob sua responsabilidade', severity: 'GRAVE', points: 1.0 },
    { category: '72. Faltar com a verdade e/ou utilizar-se do anonimato para a prática de qualquer falta disciplinar', severity: 'GRAVE', points: 1.0 },
    { category: '73. Fazer uso, portar, distribuir, estar sob ação ou induzir outrem ao uso de bebida alcoólica, entorpecentes, tóxicos ou produtos alucinógenos, no interior da EECM, em suas imediações estando ou não uniformizado', severity: 'GRAVE', points: 1.0 },
    { category: '74. Hastear ou arriar bandeiras e estandartes, sem autorização', severity: 'GRAVE', points: 1.0 },
    { category: '75. Instigar colegas a cometer faltas disciplinares e/ou ações delituosas que comprometam o bom nome da EECM', severity: 'GRAVE', points: 1.0 },
    { category: '76. Manter contato físico com denotação libidinosa no ambiente da EECM ou fora dela', severity: 'GRAVE', points: 1.0 },
    { category: '77. Obter ou fazer uso de imagens, vídeos, áudios ou de qualquer tipo de publicação difamatória contra qualquer membro da Comunidade Escolar', severity: 'GRAVE', points: 1.0 },
    { category: '78. Ofender membros da Comunidade Escolar com a prática de Bullying e Cyberbullying', severity: 'GRAVE', points: 1.0 },
    { category: '79. Pichar ou causar qualquer poluição visual ou sonora dentro e nas proximidades da EECM', severity: 'GRAVE', points: 1.0 },
    { category: '80. Portar objetos que ameacem a segurança individual e/ou da coletividade', severity: 'GRAVE', points: 1.0 },
    { category: '81. Praticar atos contrários ao culto e ao respeito aos símbolos nacionais', severity: 'GRAVE', points: 1.0 },
    { category: '82. Promover ou tomar parte de qualquer manifestação coletiva que venha a macular o nome da EECM e/ou que prejudique o bom andamento das aulas e/ou avaliações', severity: 'GRAVE', points: 1.0 },
    { category: '83. Promover trote de qualquer natureza', severity: 'GRAVE', points: 1.0 },
    { category: '84. Promover, incitar ou envolver-se em rixa, inclusive luta corporal, dentro ou fora da EECM, estando ou não uniformizado', severity: 'GRAVE', points: 1.0 },
    { category: '85. Provocar ou tomar parte, uniformizado ou estando na EECM, em manifestações de natureza política', severity: 'GRAVE', points: 1.0 },
    { category: '86. Rasurar, violar ou alterar documento ou o conteúdo dos mesmos', severity: 'GRAVE', points: 1.0 },
    { category: '87. Representar a EECM e/ou por ela tomar compromisso, sem estar para isso autorizado', severity: 'GRAVE', points: 1.0 },
    { category: '88. Ter em seu poder, introduzir, ler ou distribuir, dentro da EECM, cartazes, jornais ou publicações que atentem contra a disciplina e/ou o moral ou de cunho político-partidário', severity: 'GRAVE', points: 1.0 },
    { category: '89. Utilizar ou subtrair indevidamente objetos ou valores alheios', severity: 'GRAVE', points: 1.0 },
    { category: '90. Utilizar-se de processos fraudulentos na realização de trabalhos pedagógicos', severity: 'GRAVE', points: 1.0 },
    { category: '91. Utilizar-se indevidamente e/ou causar avariar e/ou destruição do patrimônio pertencente a EECM', severity: 'GRAVE', points: 1.0 },
    
    // Faltas "Outras" / Abertas
    { category: '[OUTROS] Falta Leve (Descrever na observação)', severity: 'LEVE', points: 0.2 },
    { category: '[OUTROS] Falta Média (Descrever na observação)', severity: 'MÉDIA', points: 0.5 },
    { category: '[OUTROS] Falta Grave (Descrever na observação)', severity: 'GRAVE', points: 1.0 }
  ];

  // Behavior Categories depending on score
  const getBehaviorStatus = (score: number) => {
    if (score >= 10.0) return { label: 'EXCEPCIONAL', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
    if (score >= 9.0) return { label: 'ÓTIMO', color: 'text-emerald-500 bg-emerald-50 border-emerald-100' };
    if (score >= 7.0) return { label: 'BOM', color: 'text-blue-500 bg-blue-50 border-blue-100' };
    if (score >= 5.0) return { label: 'REGULAR', color: 'text-amber-500 bg-amber-50 border-amber-100' };
    if (score >= 2.0) return { label: 'INSUFICIENTE', color: 'text-orange-500 bg-orange-50 border-orange-100' };
    return { label: 'INCOMPATÍVEL', color: 'text-red-600 bg-red-50 border-red-100' };
  };

  // Dashboard Advanced Stats
  const advancedStats = useMemo(() => {
    // 1. Top 10 Honra
    const topHonra = [...studentStates].sort((a, b) => b.score - a.score).slice(0, 10);
    
    // 2. Top 10 Alerta
    const topAlerta = [...studentStates].sort((a, b) => a.score - b.score).slice(0, 10);

    // 3. Ranking de Turmas
    const classScores: Record<string, { total: number; count: number }> = {};
    studentStates.forEach(s => {
      if (s.className && s.className !== 'SEM TURMA') {
        if (!classScores[s.className]) classScores[s.className] = { total: 0, count: 0 };
        classScores[s.className].total += s.score;
        classScores[s.className].count += 1;
      }
    });
    const rankingTurmas = Object.entries(classScores)
      .map(([className, data]) => ({
        className,
        avg: data.total / data.count
      }))
      .sort((a, b) => b.avg - a.avg);

    // 4. Termômetro Disciplinar & 5. Feed de Ocorrências
    let elogios = 0, leves = 0, medias = 0, graves = 0;
    const allOccurrences: any[] = [];
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    studentStates.forEach(s => {
      s.occurrences.forEach(o => {
        // Feed
        allOccurrences.push({
          ...o,
          studentName: s.studentName,
          className: s.className,
          studentId: s.studentId,
        });

        // Termômetro (apenas mês atual)
        const d = new Date(o.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          if (o.type === 'MERIT') elogios++;
          else {
            const def = demeritOptions.find(dOpt => dOpt.category === o.category);
            if (def?.severity === 'LEVE') leves++;
            else if (def?.severity === 'MÉDIA') medias++;
            else if (def?.severity === 'GRAVE') graves++;
          }
        }
      });
    });
    
    allOccurrences.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const feedOcorrencias = allOccurrences.slice(0, 15); // Últimas 15

    // 6. Censo do Fardamento
    const fardamentoStats: Record<string, number> = {};
    inspections.forEach(i => {
      fardamentoStats[i.item] = (fardamentoStats[i.item] || 0) + 1;
    });
    const censoFardamento = Object.entries(fardamentoStats)
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count);

    // 7. Lideranças
    const lideres = studentStates.filter(s => s.isClassLeader);

    // 8. Meta do Batalhão
    const totalStudents = studentStates.length;
    const excellenceCount = studentStates.filter(s => s.score >= 8.0).length;
    const excellenceRate = totalStudents > 0 ? Math.round((excellenceCount / totalStudents) * 100) : 100;

    return {
      topHonra,
      topAlerta,
      rankingTurmas,
      termometro: { elogios, leves, medias, graves },
      feedOcorrencias,
      censoFardamento,
      lideres,
      excellenceRate
    };
  }, [studentStates, inspections]);

  // 3. Actions
  const handleAddInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInspection.studentId) {
      alert('Por favor, selecione um aluno válido da lista.');
      return;
    }

    const studentObj = dbStudents.find(s => s.CodigoAluno === newInspection.studentId);
    if (!studentObj) return;

    const record: InspectionRecord = {
      id: `insp-${Date.now()}`,
      studentId: newInspection.studentId,
      studentName: studentObj.Nome,
      className: studentObj.Turma,
      item: newInspection.item,
      date: newInspection.date,
      shift: studentObj.Turno,
      observations: newInspection.observations,
      responsible: user.name || 'Gestor'
    };

    const updated = [record, ...inspections];
    saveInspectionsToStorage(updated);

    // Reset Form
    setNewInspection({
      studentId: '',
      item: 'Farda incompleta',
      date: new Date().toISOString().split('T')[0],
      observations: ''
    });
    setIsInspectionModalOpen(false);
  };

  const handleDeleteInspection = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta inspeção?')) {
      const updated = inspections.filter(i => i.id !== id);
      saveInspectionsToStorage(updated);
    }
  };

  const handleAddOccurrence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentState) return;

    let points = 0.2;
    let isEscalated = false;
    let effectiveSeverity = 'LEVE';

    if (newOccurrence.type === 'MERIT') {
      const merit = meritOptions.find(o => o.category === newOccurrence.category);
      points = merit ? merit.points : 0.5;
    } else {
      const dem = demeritOptions.find(o => o.category === newOccurrence.category);
      const originalSeverity = dem ? dem.severity : 'LEVE';

      // Calculate points based on the Disciplinary Measure (Art 46)
      switch (newOccurrence.disciplinaryMeasure) {
        case 'Advertência Oral': points = 0.1; break;
        case 'Advertência Escrita': points = 0.3; break;
        case 'Suspensão de Sala de Aula': points = 0.5 * (newOccurrence.suspensionDays || 1); break;
        case 'Ações Educativas': points = 1.0; break;
        case 'Transferência Educativa': points = 2.0; break; // Assumed severe deduction
        case 'Estudo Orientado de Caráter Educativo': points = 0.5; break;
        default: points = 0.1;
      }

      const prevLeves = selectedStudentState.occurrences.filter(o => o.type === 'DEMERIT' && demeritOptions.find(d => d.category === o.category)?.severity === 'LEVE').length;
      const prevMediasBase = selectedStudentState.occurrences.filter(o => o.type === 'DEMERIT' && demeritOptions.find(d => d.category === o.category)?.severity === 'MÉDIA').length;
      const prevEscalatedLeves = Math.floor(prevLeves / 3);
      
      effectiveSeverity = originalSeverity;

      if (originalSeverity === 'LEVE') {
         if ((prevLeves + 1) % 3 === 0) {
             effectiveSeverity = 'MÉDIA';
             isEscalated = true;
         }
      }

      const totalMediasAntes = prevMediasBase + prevEscalatedLeves;
      if (effectiveSeverity === 'MÉDIA') {
         if ((totalMediasAntes + 1) % 2 === 0) {
             effectiveSeverity = 'GRAVE';
             isEscalated = true;
         }
      }
      
      if (isEscalated) {
          alert(`Atenção: Por reincidência, o sistema detectou que esta ocorrência configura uma Falta ${effectiveSeverity}. Certifique-se de que a medida selecionada seja adequada à reincidência.`);
      }
    }

    const occurrence: BehaviorOccurrence = {
      id: `occ-${Date.now()}`,
      type: newOccurrence.type,
      category: newOccurrence.category,
      points,
      date: newOccurrence.date,
      observations: newOccurrence.observations,
      responsible: user.name || 'Gestor',
      disciplinaryMeasure: newOccurrence.type === 'DEMERIT' ? newOccurrence.disciplinaryMeasure : undefined,
      suspensionDays: (newOccurrence.type === 'DEMERIT' && newOccurrence.disciplinaryMeasure === 'Suspensão de Sala de Aula') ? newOccurrence.suspensionDays : undefined,
      isEscalated: isEscalated
    };

    // Calculate new score
    let newScore = selectedStudentState.score;
    if (newOccurrence.type === 'MERIT') {
      newScore = Math.min(10, parseFloat((newScore + points).toFixed(2)));
    } else {
      newScore = Math.max(0, parseFloat((newScore - points).toFixed(2)));
    }

    const updatedStates = studentStates.map(s => {
      if (s.studentId === selectedStudentState.studentId) {
        return {
          ...s,
          score: newScore,
          occurrences: [occurrence, ...s.occurrences]
        };
      }
      return s;
    });

    saveStudentStatesToStorage(updatedStates);

    // Reset Form
    setNewOccurrence({
      type: 'DEMERIT',
      category: '1. Apresentar-se com uniforme diferente do estabelecido pelo regulamento do uniforme',
      date: new Date().toISOString().split('T')[0],
      observations: '',
      disciplinaryMeasure: 'Advertência Oral',
      suspensionDays: 1
    });
  };

  const handleGenerateMeasureDoc = (occ: BehaviorOccurrence, studentId: string) => {
    // 1. Encontrar o aluno na base da secretaria
    const student = dbStudents.find(s => s.CodigoAluno === studentId);
    if (!student) return;

    // 2. Setar aba de documentos e template
    setActiveTab('documentos');
    setSelectedDocTemplate('ficha_medida_disciplinar');
    setSelectedStudentForDoc(student);

    // 3. Descobrir a gravidade original (LEVE/MÉDIA/GRAVE)
    let severity = 'LEVE';
    const def = demeritOptions.find(d => d.category === occ.category);
    if (def) severity = def.severity;
    
    // Se foi agravada por reincidência, subir um nível
    if (occ.isEscalated) {
       if (severity === 'LEVE') severity = 'MÉDIA';
       else if (severity === 'MÉDIA') severity = 'GRAVE';
    }

    // 4. Preencher automaticamente o formulário do documento
    setDocFields(prev => ({
      ...prev,
      faltaDate: occ.date,
      medidaAplicada: occ.disciplinaryMeasure || 'Advertência Oral',
      falta: severity,
      itensEnquadramento: occ.category,
      achado: occ.observations,
      date: new Date().toISOString().split('T')[0],
      city: 'Colíder - MT',
      teacher: user?.name || '',
      monitor: occ.responsible,
      atenuantes: '',
      agravantes: occ.isEscalated ? 'Reincidência' : ''
    }));

    // 5. Fechar modal atual
    setIsBehaviorModalOpen(false);
  };

  const handleDeleteOccurrence = (studentId: string, occId: string) => {
    if (!window.confirm('Excluir esta ocorrência? A nota de atitude do aluno será recalculada.')) return;

    const student = studentStates.find(s => s.studentId === studentId);
    if (!student) return;

    const targetOcc = student.occurrences.find(o => o.id === occId);
    if (!targetOcc) return;

    // Recalculate score by reversing the operation
    let newScore = student.score;
    if (targetOcc.type === 'MERIT') {
      newScore = Math.max(0, parseFloat((newScore - targetOcc.points).toFixed(2)));
    } else {
      newScore = Math.min(10, parseFloat((newScore + targetOcc.points).toFixed(2)));
    }

    const updatedStates = studentStates.map(s => {
      if (s.studentId === studentId) {
        return {
          ...s,
          score: newScore,
          occurrences: s.occurrences.filter(o => o.id !== occId)
        };
      }
      return s;
    });

    saveStudentStatesToStorage(updatedStates);
  };

  const handleToggleLeader = (studentId: string) => {
    const updated = studentStates.map(s => {
      if (s.studentId === studentId) {
        return { ...s, isClassLeader: !s.isClassLeader };
      }
      return s;
    });
    saveStudentStatesToStorage(updated);
  };

  const handleToggleHighlight = (studentId: string) => {
    const updated = studentStates.map(s => {
      if (s.studentId === studentId) {
        return { ...s, isCivicHighlight: !s.isCivicHighlight };
      }
      return s;
    });
    saveStudentStatesToStorage(updated);
  };

  const handleSaveRoutine = (e: React.FormEvent) => {
    e.preventDefault();

    const record: CivicRoutineRecord = {
      id: `rot-${Date.now()}`,
      date: routineForm.date,
      shift: routineForm.shift,
      formationOk: routineForm.formationOk,
      commandersPresent: routineForm.commandersPresent,
      flagsRaised: {
        national: routineForm.flagNational,
        state: routineForm.flagState,
        municipal: routineForm.flagMunicipal
      },
      anthemsSung: {
        national: routineForm.anthemNational,
        state: routineForm.anthemState,
        school: routineForm.anthemSchool
      },
      marchingOk: routineForm.marchingOk,
      bulletinRead: routineForm.bulletinRead,
      responsible: user.name || 'Diretor'
    };

    const updated = [record, ...routines];
    saveRoutinesToStorage(updated);

    alert('Rotina cívica diária registrada com sucesso!');

    // Reset Checklist (keep date/shift)
    setRoutineForm(prev => ({
      ...prev,
      formationOk: true,
      commandersPresent: true,
      flagNational: true,
      flagState: true,
      flagMunicipal: true,
      anthemNational: true,
      anthemState: true,
      anthemSchool: true,
      marchingOk: true,
      bulletinRead: true
    }));
  };

  const handleDeleteRoutine = (id: string) => {
    if (window.confirm('Deseja excluir este registro de rotina cívica?')) {
      const updated = routines.filter(r => r.id !== id);
      saveRoutinesToStorage(updated);
    }
  };

  // Documentações Handlers
  const handlePrintDocument = () => {
    if (!selectedStudentForDoc) {
      alert('Por favor, selecione um aluno antes de gerar o documento.');
      return;
    }
    if (selectedDocTemplate === 'termo_ciencia' && !docFields.responsibleName) {
      alert('Por favor, preencha o nome do responsável.');
      return;
    }
    if (selectedDocTemplate === 'fato_observado' && !docFields.achado) {
      alert('Por favor, preencha o relato do fato observado (achado).');
      return;
    }

    const newDocRecord = {
      id: `doc-${Date.now()}`,
      studentId: selectedStudentForDoc.CodigoAluno,
      studentName: selectedStudentForDoc.Nome,
      className: selectedStudentForDoc.Turma,
      shiftName: selectedStudentForDoc.Turno,
      template: selectedDocTemplate,
      templateLabel: selectedDocTemplate === 'termo_ciencia' 
        ? 'Termo de Ciência e Concordância' 
        : selectedDocTemplate === 'fato_observado' ? 'Relatório de Fato Observado' 
        : selectedDocTemplate === 'autorizacao_uniforme' ? 'Autorização de Uniforme Incompleto'
        : selectedDocTemplate === 'termo_adequacao_conduta' ? 'Termo de Adequação de Conduta Escolar'
        : 'Ficha de Medida Disciplinar',
      date: docFields.date,
      fields: { 
        ...docFields,
        documentNumber: selectedDocTemplate === 'ficha_medida_disciplinar' 
          ? (docFields.documentNumber || nextFichaNumber) 
          : selectedDocTemplate === 'termo_adequacao_conduta'
          ? (docFields.documentNumber || nextTaceNumber)
          : selectedDocTemplate === 'autorizacao_uniforme'
          ? (docFields.documentNumber || nextAutorizacaoNumber)
          : docFields.documentNumber
      },
      timestamp: Date.now()
    };

    const updatedHistory = [newDocRecord, ...docHistory];
    saveDocHistoryToStorage(updatedHistory);

    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDeleteDocFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Deseja excluir permanentemente este documento do histórico?')) {
      const updated = docHistory.filter(d => d.id !== id);
      saveDocHistoryToStorage(updated);
    }
  };

  const handleClearDocForm = () => {
    setSelectedStudentForDoc(null);
    setDocSearchTerm('');
    setDocFields({
      responsibleName: '',
      responsibleRg: '',
      responsibleCpf: '',
      responsibleAddress: '',
      city: 'Colíder - MT',
      date: new Date().toISOString().split('T')[0],
      series: '',
      discipline: '',
      teacher: user ? user.name : '',
      achado: '',
      monitor: 'Monitor Silva',
      recebidoDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleLoadDocFromHistory = (record: any) => {
    setSelectedDocTemplate(record.template);
    const student = dbStudents.find(s => s.CodigoAluno === record.studentId) || {
      Nome: record.studentName,
      Turma: record.className,
      Turno: record.shiftName,
      CodigoAluno: record.studentId
    };
    setSelectedStudentForDoc(student);
    setDocSearchTerm(student.Nome);
    setDocFields(record.fields);
  };
  const recentFatosObservados = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return docHistory.filter(d => 
      d.template === 'fato_observado' && 
      d.date && 
      d.date.startsWith(today)
    );
  }, [docHistory]);

  const handleInboxPunicao = (studentName: string, category: string, disciplinaryMeasure: string, suspensionDays: number | undefined, observations: string, retroDate: string) => {
    const studentState = studentStates.find(s => s.studentName === studentName);
    if (!studentState) return;

    let points = 0.2;
    let isEscalated = false;
    let effectiveSeverity = 'LEVE';

    const dem = demeritOptions.find(o => o.category === category);
    const originalSeverity = dem ? dem.severity : 'LEVE';

    switch (disciplinaryMeasure) {
      case 'Advertência Oral': points = 0.1; break;
      case 'Advertência Escrita': points = 0.3; break;
      case 'Suspensão de Sala de Aula': points = 0.5 * (suspensionDays || 1); break;
      case 'Ações Educativas': points = 1.0; break;
      case 'Transferência Educativa': points = 2.0; break;
      case 'Estudo Orientado de Caráter Educativo': points = 0.5; break;
      default: points = 0.1;
    }

    const prevLeves = studentState.occurrences.filter(o => o.type === 'DEMERIT' && demeritOptions.find(d => d.category === o.category)?.severity === 'LEVE').length;
    const prevMediasBase = studentState.occurrences.filter(o => o.type === 'DEMERIT' && demeritOptions.find(d => d.category === o.category)?.severity === 'MÉDIA').length;
    const prevEscalatedLeves = Math.floor(prevLeves / 3);
    
    effectiveSeverity = originalSeverity;

    if (originalSeverity === 'LEVE') {
       if ((prevLeves + 1) % 3 === 0) {
           effectiveSeverity = 'MÉDIA';
           isEscalated = true;
       }
    }

    const totalMediasAntes = prevMediasBase + prevEscalatedLeves;
    if (effectiveSeverity === 'MÉDIA') {
       if ((totalMediasAntes + 1) % 2 === 0) {
           effectiveSeverity = 'GRAVE';
           isEscalated = true;
       }
    }
    
    if (isEscalated) {
        alert(`Atenção: Por reincidência, a punição do aluno ${studentName} escalou para uma Falta ${effectiveSeverity}.`);
    }

    const occurrence: BehaviorOccurrence = {
      id: `occ-${Date.now()}`,
      type: 'DEMERIT',
      category: category,
      points,
      date: retroDate,
      observations: observations,
      responsible: user.name || 'Gestor',
      disciplinaryMeasure: disciplinaryMeasure,
      suspensionDays: disciplinaryMeasure === 'Suspensão de Sala de Aula' ? suspensionDays : undefined,
      isEscalated: isEscalated
    };

    let newScore = Math.max(0, parseFloat((studentState.score - points).toFixed(2)));

    const updatedStates = studentStates.map(s => {
      if (s.studentId === studentState.studentId) {
        return {
          ...s,
          score: newScore,
          occurrences: [occurrence, ...s.occurrences]
        };
      }
      return s;
    });

    saveStudentStatesToStorage(updatedStates);
  };

  const expiredAuthorizations = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return docHistory.filter(d => {
      if (d.template !== 'autorizacao_uniforme' || !d.fields || !d.fields.dataFim) return false;
      return d.fields.dataFim < today;
    });
  }, [docHistory]);

  const handlePreencherDocumentoDaInbox = (occ: any) => {
    const student = dbStudents.find(s => s.Nome === occ.student_name);
    if (student) {
      setSelectedStudentForDoc(student);
      setDocSearchTerm(student.Nome);
    } else {
      setDocSearchTerm(occ.student_name || '');
    }

    setDocFields({
      date: occ.date,
      recebidoDate: '',
      teacher: occ.responsible_name || '',
      monitor: '',
      series: occ.classroom_name || '',
      discipline: 'MÚLTIPLAS',
      achado: occ.description || '',
      city: 'Colíder - MT'
    });
    
    setSelectedDocTemplate('fato_observado');
    setActiveTab('documentos');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Sidebar do Módulo */}
      <aside className="w-80 bg-slate-950 flex flex-col no-print border-r border-slate-900 shadow-2xl relative z-10">
        <div className="p-8 bg-slate-900/40 border-b border-slate-900/80">
          <h1 className="text-xl font-black flex items-center gap-3">
            <span className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20 text-white">
              <Shield size={22} className="fill-white/10 text-white" />
            </span>
            Cívico-Militar
          </h1>
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mt-3 ml-1">Portal André Maggi</p>
        </div>

        {/* Abas */}
        <nav className="flex-1 mt-8 px-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/10'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
          >
            <ClipboardList size={18} /> Painel Geral
          </button>
          <button
            onClick={() => setActiveTab('rotina')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'rotina'
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/10'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
          >
            <Flag size={18} /> Rotina Cívica
          </button>
          <button
            onClick={() => setActiveTab('inspecao')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'inspecao'
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/10'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
          >
            <UserCheck size={18} /> Inspeção Fardamento
          </button>
          <button
            onClick={() => setActiveTab('comportamento')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'comportamento'
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/10'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
          >
            <TrendingUp size={18} /> Conduta & Atitude
          </button>
          <button
            onClick={() => setActiveTab('honra')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'honra'
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/10'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
          >
            <Award size={18} /> Quadro de Honra
          </button>
          <button
            onClick={() => setActiveTab('documentos')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'documentos'
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/10'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
          >
            <FileText size={18} /> Documentações
          </button>
          <button
            onClick={() => setActiveTab('fatos_observados')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'fatos_observados'
              ? 'bg-amber-600 text-white shadow-xl shadow-amber-600/10'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
          >
            <MessageSquare size={18} /> Caixa de Fatos
          </button>
          <button
            onClick={() => setActiveTab('relatorios')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'relatorios'
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/10'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
          >
            <TrendingUp size={18} /> Relatórios
          </button>
        </nav>

        {/* Info Card */}
        <div className="mx-4 mb-6 p-5 bg-slate-900 border border-slate-800 rounded-3xl">
          <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-3">
            <Info size={14} /> Diretrizes
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
            Módulo oficial de acompanhamento disciplinar, apresentação e cerimonial militar da EE André Maggi / MT.
          </p>
        </div>

        {/* Rodapé */}
        <div className="p-6 border-t border-slate-800/80">
          <button onClick={onExit} className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-slate-900 hover:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-300 border border-slate-800">
            <ArrowLeft size={16} /> Hub do Sistema
          </button>
        </div>
      </aside>

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Header */}
        <header className="h-24 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              {activeTab === 'dashboard' && <ClipboardList size={22} />}
              {activeTab === 'rotina' && <Flag size={22} />}
              {activeTab === 'inspecao' && <UserCheck size={22} />}
              {activeTab === 'comportamento' && <TrendingUp size={22} />}
              {activeTab === 'honra' && <Award size={22} />}
              {activeTab === 'documentos' && <FileText size={22} />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {activeTab === 'dashboard' && 'Painel Geral Disciplinar'}
                {activeTab === 'rotina' && 'Rotina Cívico-Militar Diária'}
                {activeTab === 'inspecao' && 'Inspeção de Uniformes e Padrões'}
                {activeTab === 'comportamento' && 'Gestão de Conduta e Atitude'}
                {activeTab === 'honra' && 'Quadro de Honra e Destaques'}
                {activeTab === 'documentos' && 'Preenchimento de Documentos'}
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {activeTab === 'dashboard' && 'Indicadores e Resumos Escolares'}
                {activeTab === 'rotina' && 'Controle de Formatura, Hasteamento e Hinos'}
                {activeTab === 'inspecao' && 'Apresentação Pessoal e Fardamento'}
                {activeTab === 'comportamento' && 'Histórico de Méritos e Deméritos'}
                {activeTab === 'honra' && 'Líderes de Turma e Destaques de Atitude'}
                {activeTab === 'documentos' && 'Emissão e Impressão de Fichas Oficiais'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
              <Shield size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Rotina Ativa</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-600/10">CM</div>
          </div>
        </header>

        {/* Área com Scroll */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          
          {/* TAB 1: DASHBOARD AVANÇADO */}
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              
              {recentFatosObservados.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex items-center justify-between shadow-sm relative overflow-hidden animate-in slide-in-from-top-4">
                   <div className="absolute top-0 left-0 bottom-0 w-2 bg-amber-400"></div>
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                         <AlertTriangle size={24} className="animate-pulse" />
                      </div>
                      <div>
                         <h3 className="text-amber-800 font-black text-sm uppercase">Novo Fato Observado Recebido</h3>
                         <p className="text-amber-700/80 text-[10px] font-bold uppercase mt-1">Existem {recentFatosObservados.length} relatórios enviados pelos professores aguardando análise hoje.</p>
                      </div>
                   </div>
                   <button onClick={() => setActiveTab('documentos')} className="px-5 py-3 bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-amber-600 transition-colors shadow-md">
                      Analisar Agora
                   </button>
                </div>
              )}

              {expiredAuthorizations.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-6 rounded-[2rem] flex items-center justify-between shadow-sm relative overflow-hidden animate-in slide-in-from-top-4">
                   <div className="absolute top-0 left-0 bottom-0 w-2 bg-red-500"></div>
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                         <AlertTriangle size={24} className="animate-pulse" />
                      </div>
                      <div>
                         <h3 className="text-red-800 font-black text-sm uppercase">Autorizações de Uniforme Vencidas</h3>
                         <p className="text-red-700/80 text-[10px] font-bold uppercase mt-1">Existem {expiredAuthorizations.length} autorizações temporárias que já passaram do prazo de validade.</p>
                      </div>
                   </div>
                   <button onClick={() => setActiveTab('documentos')} className="px-5 py-3 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-red-700 transition-colors shadow-md">
                      Verificar Alunos
                   </button>
                </div>
              )}

              {/* 1. Meta do Batalhão & Termômetro */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Meta do Batalhão */}
                 <div className="lg:col-span-2 bg-gradient-to-br from-blue-900 to-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Award size={120} /></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-blue-300 mb-2">Meta de Excelência Escolar</h3>
                    <div className="flex items-end gap-4 relative z-10">
                       <span className="text-6xl font-black">{advancedStats.excellenceRate}%</span>
                       <span className="text-xs font-semibold text-blue-200 mb-2 uppercase max-w-[200px]">Dos alunos estão com nota igual ou superior a 8.0</span>
                    </div>
                    {/* Barra de Progresso */}
                    <div className="w-full h-3 bg-slate-800 rounded-full mt-6 overflow-hidden relative z-10">
                       <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${advancedStats.excellenceRate}%` }}></div>
                    </div>
                 </div>

                 {/* Termômetro Disciplinar do Mês */}
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2"><Activity size={16} className="text-blue-500" /> Termômetro Mensal</h3>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600">Elogios Registrados</span>
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black">{advancedStats.termometro.elogios}</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600">Faltas Leves</span>
                          <span className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-black">{advancedStats.termometro.leves}</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600">Faltas Médias</span>
                          <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-black">{advancedStats.termometro.medias}</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600">Faltas Graves</span>
                          <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-black">{advancedStats.termometro.graves}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* 2. Rankings Top 10 e Batalha das Turmas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                 {/* Top 10 Honra */}
                 <div className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm shadow-emerald-50 text-slate-800">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-3 mb-6">
                       <Award size={20} className="text-emerald-500" /> Destaques de Honra
                    </h3>
                    <div className="space-y-4">
                       {advancedStats.topHonra.slice(0, 5).map((s, idx) => (
                          <div key={s.studentId} className="flex items-center gap-3 group">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-transform group-hover:scale-110 ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-100 text-slate-500' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'}`}>
                                {idx + 1}º
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-800 truncate uppercase">{s.studentName}</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase">{s.className}</div>
                             </div>
                             <div className="text-sm font-black text-emerald-600">{s.score.toFixed(1)}</div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Top 10 Alertas */}
                 <div className="bg-white p-8 rounded-[2.5rem] border border-red-100 shadow-sm shadow-red-50 text-slate-800">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-3 mb-6">
                       <AlertOctagon size={20} className="text-red-500" /> Alerta Disciplinar
                    </h3>
                    <div className="space-y-4">
                       {advancedStats.topAlerta.slice(0, 5).map((s, idx) => (
                          <div key={s.studentId} className="flex items-center gap-3 group">
                             <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xs font-black transition-transform group-hover:scale-110">
                                <AlertTriangle size={12} />
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-800 truncate uppercase">{s.studentName}</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase">{s.className}</div>
                             </div>
                             <div className="text-sm font-black text-red-600">{s.score.toFixed(1)}</div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Batalha das Turmas */}
                 <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-sm shadow-blue-50 text-slate-800">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-3 mb-6">
                       <Users size={20} className="text-blue-500" /> Batalha das Turmas
                    </h3>
                    <div className="space-y-4">
                       {advancedStats.rankingTurmas.slice(0, 5).map((t, idx) => (
                          <div key={t.className} className="flex items-center gap-3 group">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-transform group-hover:scale-110 ${idx === 0 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-slate-50 text-slate-500'}`}>
                                {idx + 1}
                             </div>
                             <div className="flex-1 font-bold text-sm text-slate-700 uppercase">{t.className}</div>
                             <div className="text-sm font-black text-slate-900">{t.avg.toFixed(2)}</div>
                          </div>
                       ))}
                    </div>
                 </div>

              </div>

              {/* 3. Feed e Censo */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 
                 {/* Feed de Ocorrências em Tempo Real */}
                 <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm text-slate-800">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-3 mb-6">
                       <Radio size={20} className="text-indigo-500" /> Feed de Ocorrências Recentes
                    </h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                       {advancedStats.feedOcorrencias.map(occ => (
                          <div key={occ.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4 transition-all hover:bg-white hover:shadow-sm">
                             <div className={`p-2 rounded-xl mt-1 ${occ.type === 'MERIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                {occ.type === 'MERIT' ? <Award size={16} /> : <AlertOctagon size={16} />}
                             </div>
                             <div className="flex-1">
                                <div className="text-xs font-black text-slate-900 uppercase">
                                  {occ.studentName} 
                                  <span className="text-slate-400 font-medium normal-case ml-2">• {occ.className}</span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-600 mt-1">{occ.category}</div>
                                <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-2 flex items-center gap-2">
                                   <Clock size={10} /> {formatSimpleDate(occ.date)} • Por: {occ.responsible.split(' ')[0]}
                                </div>
                             </div>
                             <div className={`text-xs font-black ${occ.type === 'MERIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {occ.type === 'MERIT' ? '+' : '-'}{occ.points.toFixed(1)} pts
                             </div>
                          </div>
                       ))}
                       {advancedStats.feedOcorrencias.length === 0 && (
                          <div className="text-center text-slate-400 font-semibold text-xs py-8 uppercase">Nenhum registro recente</div>
                       )}
                    </div>
                 </div>

                 {/* Censo do Fardamento e Xerifes */}
                 <div className="space-y-8">
                    {/* Censo do Fardamento */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm text-slate-800">
                       <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-3 mb-6">
                          <Shirt size={20} className="text-amber-500" /> Falhas de Fardamento
                       </h3>
                       <div className="space-y-5">
                          {advancedStats.censoFardamento.slice(0, 6).map((item, idx) => {
                             const percent = Math.round((item.count / Math.max(inspections.length, 1)) * 100);
                             return (
                                <div key={item.item}>
                                   <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                                      <span className="text-slate-700 truncate pr-2 max-w-[200px]" title={item.item}>{item.item}</span>
                                      <span className="text-slate-400">{percent}%</span>
                                   </div>
                                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${idx === 0 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${percent}%` }}></div>
                                   </div>
                                </div>
                             );
                          })}
                          {advancedStats.censoFardamento.length === 0 && (
                             <div className="text-center text-slate-400 font-semibold text-[10px] py-4 uppercase">Nenhuma inspeção falha registrada</div>
                          )}
                       </div>
                    </div>

                    {/* Mural de Lideranças */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm text-slate-800">
                       <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-3 mb-6">
                          <Star size={20} className="text-indigo-500 fill-indigo-500" /> Líderes de Turma
                       </h3>
                       <div className="space-y-3">
                          {advancedStats.lideres.slice(0, 5).map(lider => (
                             <div key={lider.studentId} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                                   {lider.className.split(' ')[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="text-xs font-bold text-slate-800 truncate uppercase">{lider.studentName}</div>
                                   <div className="text-[9px] text-slate-400 font-bold uppercase">{lider.className}</div>
                                </div>
                             </div>
                          ))}
                          {advancedStats.lideres.length === 0 && (
                             <div className="text-center text-slate-400 font-semibold text-[10px] py-4 uppercase">Nenhum líder nomeado</div>
                          )}
                          {advancedStats.lideres.length > 5 && (
                             <button onClick={() => setActiveTab('honra')} className="w-full mt-2 py-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 rounded-xl transition-colors">
                                Ver Todos ({advancedStats.lideres.length})
                             </button>
                          )}
                       </div>
                    </div>
                 </div>

              </div>

            </div>
          )}

          {/* TAB 2: ROTINA CÍVICA */}
          {activeTab === 'rotina' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Form de Lançamento */}
              <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6 text-slate-800">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Plus size={18} className="text-blue-600" /> Registrar Formatura Geral
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Checklist de Cerimonial Cívico</p>
                </div>

                <form onSubmit={handleSaveRoutine} className="space-y-6">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Data de Referência</label>
                    <input
                      type="date"
                      value={routineForm.date}
                      onChange={e => setRoutineForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Turno</label>
                    <select
                      value={routineForm.shift}
                      onChange={e => setRoutineForm(prev => ({ ...prev, shift: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                    >
                      <option value="MATUTINO">MATUTINO</option>
                      <option value="VESPERTINO">VESPERTINO</option>
                      <option value="NOTURNO">NOTURNO</option>
                    </select>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Rotina Executada</label>
                    
                    <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/60 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={routineForm.formationOk}
                        onChange={e => setRoutineForm(prev => ({ ...prev, formationOk: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Formação e Alinhamento das Turmas</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/60 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={routineForm.commandersPresent}
                        onChange={e => setRoutineForm(prev => ({ ...prev, commandersPresent: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Apresentação dos Chefes de Turma</span>
                    </label>

                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Bandeiras Hasteadas</span>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="flex flex-col items-center p-2 bg-white border border-slate-200/60 rounded-lg cursor-pointer text-center">
                          <input
                            type="checkbox"
                            checked={routineForm.flagNational}
                            onChange={e => setRoutineForm(prev => ({ ...prev, flagNational: e.target.checked }))}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white mb-2 w-3.5 h-3.5"
                          />
                          <span className="text-[9px] font-bold text-slate-600 uppercase">Nacional</span>
                        </label>
                        <label className="flex flex-col items-center p-2 bg-white border border-slate-200/60 rounded-lg cursor-pointer text-center">
                          <input
                            type="checkbox"
                            checked={routineForm.flagState}
                            onChange={e => setRoutineForm(prev => ({ ...prev, flagState: e.target.checked }))}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white mb-2 w-3.5 h-3.5"
                          />
                          <span className="text-[9px] font-bold text-slate-600 uppercase">Estadual</span>
                        </label>
                        <label className="flex flex-col items-center p-2 bg-white border border-slate-200/60 rounded-lg cursor-pointer text-center">
                          <input
                            type="checkbox"
                            checked={routineForm.flagMunicipal}
                            onChange={e => setRoutineForm(prev => ({ ...prev, flagMunicipal: e.target.checked }))}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white mb-2 w-3.5 h-3.5"
                          />
                          <span className="text-[9px] font-bold text-slate-600 uppercase">Municipal</span>
                        </label>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Canto dos Hinos</span>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="flex flex-col items-center p-2 bg-white border border-slate-200/60 rounded-lg cursor-pointer text-center">
                          <input
                            type="checkbox"
                            checked={routineForm.anthemNational}
                            onChange={e => setRoutineForm(prev => ({ ...prev, anthemNational: e.target.checked }))}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white mb-2 w-3.5 h-3.5"
                          />
                          <span className="text-[9px] font-bold text-slate-600 uppercase">Nacional</span>
                        </label>
                        <label className="flex flex-col items-center p-2 bg-white border border-slate-200/60 rounded-lg cursor-pointer text-center">
                          <input
                            type="checkbox"
                            checked={routineForm.anthemState}
                            onChange={e => setRoutineForm(prev => ({ ...prev, anthemState: e.target.checked }))}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white mb-2 w-3.5 h-3.5"
                          />
                          <span className="text-[9px] font-bold text-slate-600 uppercase">Estadual</span>
                        </label>
                        <label className="flex flex-col items-center p-2 bg-white border border-slate-200/60 rounded-lg cursor-pointer text-center">
                          <input
                            type="checkbox"
                            checked={routineForm.anthemSchool}
                            onChange={e => setRoutineForm(prev => ({ ...prev, anthemSchool: e.target.checked }))}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white mb-2 w-3.5 h-3.5"
                          />
                          <span className="text-[9px] font-bold text-slate-600 uppercase">Escola</span>
                        </label>
                      </div>
                    </div>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/60 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={routineForm.marchingOk}
                        onChange={e => setRoutineForm(prev => ({ ...prev, marchingOk: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Desfile das Turmas / Ordem Unida</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/60 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={routineForm.bulletinRead}
                        onChange={e => setRoutineForm(prev => ({ ...prev, bulletinRead: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Leitura do Boletim Interno / Avisos</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Salvar Relatório
                  </button>
                </form>
              </div>

              {/* Histórico */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6 text-slate-800">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Flag size={18} className="text-blue-600" /> Histórico Geral de Formaturas Cívicas
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Registros de Conformidade e Hinos</p>
                </div>

                <div className="space-y-6">
                  {routines.map(rot => (
                    <div key={rot.id} className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-black text-slate-900 uppercase">{new Date(rot.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
                          <span className="px-2 py-0.5 text-[8px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded uppercase">{rot.shift}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Responsável: {rot.responsible}</p>
                        
                        {/* Grid de Checks */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[9px] font-black uppercase text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <span className={rot.formationOk ? 'text-emerald-600' : 'text-slate-300'}>●</span> Alinhamento
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={rot.commandersPresent ? 'text-emerald-600' : 'text-slate-300'}>●</span> Comandantes
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={rot.marchingOk ? 'text-emerald-600' : 'text-slate-300'}>●</span> Ordem Unida
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={rot.bulletinRead ? 'text-emerald-600' : 'text-slate-300'}>●</span> Boletim Interno
                          </div>
                        </div>

                        {/* Hasteamento e Hino Details */}
                        <div className="flex flex-wrap gap-4 pt-2 text-[9px] font-black uppercase text-slate-400">
                          <div>
                            Bandeiras: 
                            <span className={`ml-1 font-bold ${rot.flagsRaised.national ? 'text-slate-900' : 'text-slate-300'}`}>BR</span>
                            <span className={`ml-1 font-bold ${rot.flagsRaised.state ? 'text-blue-600' : 'text-slate-300'}`}>MT</span>
                            <span className={`ml-1 font-bold ${rot.flagsRaised.municipal ? 'text-amber-600' : 'text-slate-300'}`}>MUN</span>
                          </div>
                          <div>
                            Hinos: 
                            <span className={`ml-1 font-bold ${rot.anthemsSung.national ? 'text-slate-900' : 'text-slate-300'}`}>NAC</span>
                            <span className={`ml-1 font-bold ${rot.anthemsSung.state ? 'text-blue-600' : 'text-slate-300'}`}>EST</span>
                            <span className={`ml-1 font-bold ${rot.anthemsSung.school ? 'text-amber-600' : 'text-slate-300'}`}>ESC</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 justify-end">
                        <button
                          onClick={() => handleDeleteRoutine(rot.id)}
                          className="p-3 bg-red-50 hover:bg-red-600 hover:text-white border border-red-100 text-red-600 rounded-xl transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {routines.length === 0 && (
                    <div className="py-12 text-center text-slate-400 uppercase font-semibold text-xs border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                      Nenhuma rotina cívica cadastrada.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: INSPEÇÃO */}
          {activeTab === 'inspecao' && (
            <div className="space-y-8">
              {/* Header com Ações */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar aluno..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 w-full transition-all text-slate-900 placeholder-slate-400"
                  />
                </div>

                <div className="flex gap-4">
                  <select
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-black uppercase text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="ALL">Todas as Turmas</option>
                    {classesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setIsInspectionModalOpen(true)}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/10 transition-all flex items-center gap-2"
                  >
                    <Plus size={16} /> Nova Inspeção
                  </button>
                </div>
              </div>

              {/* Lista em Grid de Inspeções */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {inspections
                  .filter(i => {
                    const matchesSearch = i.studentName.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesClass = selectedClass === 'ALL' || i.className === selectedClass;
                    return matchesSearch && matchesClass;
                  })
                  .map(insp => (
                    <div key={insp.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between text-slate-800">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-base shadow-inner">
                            {insp.studentName.charAt(0)}
                          </div>
                          <span className="px-2 py-0.5 text-[8px] font-black text-amber-700 bg-amber-50 border border-amber-200 rounded uppercase">
                            {insp.className}
                          </span>
                        </div>

                        <h3 className="font-black text-slate-900 uppercase text-xs mb-1 line-clamp-1 tracking-tight">{insp.studentName}</h3>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-4">Ref: {insp.shift}</p>

                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-semibold text-slate-700 mb-4">
                          <span className="text-[8px] text-amber-600 font-black uppercase block mb-1">Item Identificado:</span>
                          {insp.item}
                        </div>

                        {insp.observations && (
                          <div className="p-3 bg-slate-50/50 rounded-xl text-[9px] text-slate-500 leading-relaxed mb-4 italic">
                            "{insp.observations}"
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                        <span>{new Date(insp.date).toLocaleDateString('pt-BR')}</span>
                        <button
                          onClick={() => handleDeleteInspection(insp.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Excluir Registro"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                {inspections.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-500 uppercase font-semibold text-xs border-2 border-dashed border-slate-200 rounded-[3rem]">
                    Nenhuma inspeção registrada para os filtros selecionados.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: COMPORTAMENTO */}
          {activeTab === 'comportamento' && (
            <div className="space-y-8">
              {/* Header com Ações */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar aluno por nome..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 w-full transition-all text-slate-900 placeholder-slate-400"
                  />
                </div>

                <div className="flex gap-4">
                  <select
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-black uppercase text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="ALL">Todas as Turmas</option>
                    {classesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabela de Alunos e Comportamentos */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-sm overflow-hidden text-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-black tracking-widest text-[9px] pb-3">
                        <th className="pb-3 pl-2">Cod.</th>
                        <th className="pb-3">Nome do Aluno</th>
                        <th className="pb-3">Turma</th>
                        <th className="pb-3 text-center">Líder</th>
                        <th className="pb-3 text-center">Destaque</th>
                        <th className="pb-3 text-center">Ocorrências</th>
                        <th className="pb-3 text-center">Nota Atitude</th>
                        <th className="pb-3 text-center">Comportamento</th>
                        <th className="pb-3 text-right pr-2">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(student => {
                        const status = getBehaviorStatus(student.score);
                        return (
                          <tr key={student.studentId} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-slate-700">
                            <td className="py-4 pl-2 font-mono text-slate-400 text-[10px]">{student.studentId}</td>
                            <td className="py-4 font-bold uppercase text-slate-900 truncate max-w-[280px]">
                              <div>{student.studentName}</div>
                              {(() => {
                                const dbStudent = dbStudents.find(s => s.CodigoAluno === student.studentId);
                                if (dbStudent && (dbStudent.NomeResponsavel || dbStudent.TelefoneContato)) {
                                  return (
                                    <div className="text-[8px] text-slate-400 mt-0.5 flex items-center gap-1 font-semibold normal-case tracking-wider">
                                      <Users size={8} /> 
                                      {dbStudent.NomeResponsavel || 'Não informado'}
                                      {dbStudent.TelefoneContato && ` • ${dbStudent.TelefoneContato}`}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </td>
                            <td className="py-4 text-slate-600 font-bold">{student.className}</td>
                            <td className="py-4 text-center">
                              <button
                                onClick={() => handleToggleLeader(student.studentId)}
                                className={`p-1.5 rounded-lg border transition-all ${student.isClassLeader 
                                  ? 'bg-blue-50 text-blue-600 border-blue-200' 
                                  : 'text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                title={student.isClassLeader ? "Revogar Líder de Turma" : "Nomear Líder de Turma"}
                              >
                                <Star size={14} className={student.isClassLeader ? 'fill-blue-600' : ''} />
                              </button>
                            </td>
                            <td className="py-4 text-center">
                              <button
                                onClick={() => handleToggleHighlight(student.studentId)}
                                className={`p-1.5 rounded-lg border transition-all ${student.isCivicHighlight 
                                  ? 'bg-amber-50 text-amber-600 border-amber-200' 
                                  : 'text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                title={student.isCivicHighlight ? "Remover Destaque Cívico" : "Nomear Destaque Cívico"}
                              >
                                <Sparkles size={14} className={student.isCivicHighlight ? 'fill-amber-600' : ''} />
                              </button>
                            </td>
                            <td className="py-4 text-center font-bold text-slate-500">
                              <div className="flex flex-col items-center gap-1.5">
                                 <span className="text-xs">{student.occurrences.length}</span>
                                 {student.occurrences.length > 0 && (
                                   <div className="flex gap-1">
                                      {(() => {
                                        const leves = student.occurrences.filter(o => o.type === 'DEMERIT' && demeritOptions.find(d => d.category === o.category)?.severity === 'LEVE').length;
                                        const medias = student.occurrences.filter(o => o.type === 'DEMERIT' && demeritOptions.find(d => d.category === o.category)?.severity === 'MÉDIA').length;
                                        const graves = student.occurrences.filter(o => o.type === 'DEMERIT' && demeritOptions.find(d => d.category === o.category)?.severity === 'GRAVE').length;
                                        const agravadas = student.occurrences.filter(o => o.isEscalated).length;
                                        
                                        return (
                                           <>
                                              {leves > 0 && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[8px] rounded" title="Leves">L: {leves}</span>}
                                              {medias > 0 && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[8px] rounded" title="Médias">M: {medias}</span>}
                                              {graves > 0 && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[8px] rounded" title="Graves">G: {graves}</span>}
                                              {agravadas > 0 && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[8px] rounded" title="Agravadas por Reincidência">⚡ {agravadas}</span>}
                                           </>
                                        );
                                      })()}
                                   </div>
                                 )}
                              </div>
                            </td>
                            <td className="py-4 text-center font-black text-slate-900 text-sm">
                              {student.score.toFixed(1)}
                            </td>
                            <td className="py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black border uppercase ${status.color}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="py-4 text-right pr-2">
                              <button
                                onClick={() => {
                                  setSelectedStudentState(student);
                                  setIsBehaviorModalOpen(true);
                                }}
                                className="px-4 py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                              >
                                Detalhes
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400 uppercase font-semibold text-xs">
                            Nenhum aluno encontrado para a pesquisa.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: QUADRO DE HONRA */}
          {activeTab === 'honra' && (
            <div className="space-y-8">
              {/* Filtro e Títulos */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <Award size={22} className="text-amber-500" /> Galeria dos Alunos Destaques
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Liderança, Disciplina e Atitude Cívica Exemplar</p>
                </div>

                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-black uppercase text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ALL">Todas as Turmas</option>
                  {classesList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Grid de Alunos Destaque */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {honorRollStudents.map(student => (
                  <div key={student.studentId} className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 hover:border-amber-300 shadow-sm hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between text-center text-slate-800">
                    
                    {/* Efeitos de Fundo para Alamar de Honra */}
                    {student.score >= 10 && (
                      <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-500/10 to-transparent w-24 h-24 rounded-bl-[5rem] pointer-events-none flex items-start justify-end p-4">
                        <Award size={24} className="text-amber-500 animate-pulse" />
                      </div>
                    )}

                    <div className="flex flex-col items-center pt-4">
                      {/* Distintivo / Avatar */}
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl mb-4 border-2 shadow-xl ${
                        student.score >= 10 
                          ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300 text-amber-600' 
                          : 'bg-slate-50 border-slate-200 text-blue-600'
                      }`}>
                        {student.studentName.charAt(0)}
                      </div>

                      <h4 className="font-black text-slate-900 uppercase text-xs mb-1 line-clamp-1 max-w-[200px]">{student.studentName}</h4>
                      <span className="px-2.5 py-0.5 text-[8px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded uppercase mb-4">
                        {student.className}
                      </span>

                      {/* Nota de Atitude */}
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl w-full mb-4">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block mb-0.5">Nota de Atitude</span>
                        <span className="text-2xl font-black text-slate-900">{student.score.toFixed(1)}</span>
                      </div>

                      {/* Distintivos Virtuais */}
                      <div className="flex flex-wrap gap-2 justify-center">
                        {student.score >= 10 && (
                          <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Shield size={10} className="fill-amber-500/20" /> Alamar de Honra
                          </span>
                        )}
                        {student.isClassLeader && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Star size={10} className="fill-blue-600/20" /> Líder de Turma
                          </span>
                        )}
                        {student.isCivicHighlight && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-600 border border-purple-200 rounded-xl text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={10} /> Destaque Cívico
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-[8px] font-black uppercase text-slate-400">
                      <span>Comportamento</span>
                      <span className={student.score >= 9.0 ? 'text-emerald-600' : 'text-blue-600'}>
                        {getBehaviorStatus(student.score).label}
                      </span>
                    </div>

                  </div>
                ))}

                {honorRollStudents.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-400 uppercase font-semibold text-xs border-2 border-dashed border-slate-200 rounded-[3rem]">
                    Nenhum aluno no Quadro de Honra.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: DOCUMENTOS */}
          {activeTab === 'documentos' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                
                {/* CONFIGURAÇÃO / FORMULÁRIO */}
                <div className="xl:col-span-5 bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-6 no-print text-slate-800">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Preenchimento da Ficha</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Preencha os campos para atualizar o documento</p>
                  </div>

                  {/* Modelo */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Modelo do Documento</label>
                    <select
                      value={selectedDocTemplate}
                      onChange={e => setSelectedDocTemplate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 uppercase"
                    >
                      <option value="termo_ciencia">Termo de Ciência e Concordância</option>
                      <option value="fato_observado">Relatório de Fato Observado</option>
                      <option value="ficha_medida_disciplinar">Ficha de Medida Disciplinar (Anexo III)</option>
                      <option value="termo_adequacao_conduta">Termo de Adequação de Conduta Escolar (TACE)</option>
                      <option value="autorizacao_uniforme">Autorização Temporária de Uniforme Incompleto</option>
                    </select>
                  </div>

                  {/* Busca do Aluno */}
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Buscar Aluno</label>
                    {selectedStudentForDoc ? (
                      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-slate-800">
                        <div className="text-xs">
                          <p className="font-black text-blue-700 uppercase">{selectedStudentForDoc.Nome}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">{selectedStudentForDoc.Turma} • {selectedStudentForDoc.Turno}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedStudentForDoc(null);
                            setDocSearchTerm('');
                          }}
                          className="text-slate-500 hover:text-slate-800 text-sm font-bold bg-slate-200 hover:bg-slate-300 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                          title="Remover seleção"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            type="text"
                            placeholder="Digite o nome ou código do aluno..."
                            value={docSearchTerm}
                            onChange={e => setDocSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                          />
                        </div>
                        {docFilteredStudents.length > 0 && (
                          <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-100">
                            {docFilteredStudents.map(student => (
                              <button
                                key={student.CodigoAluno}
                                onClick={() => {
                                  setSelectedStudentForDoc(student);
                                  setDocSearchTerm(student.Nome);
                                }}
                                className="w-full text-left p-3 hover:bg-blue-50 text-xs text-slate-800 uppercase font-bold transition-colors flex justify-between items-center"
                              >
                                <div>
                                  <p>{student.Nome}</p>
                                  <p className="text-[9px] text-slate-400 font-medium normal-case">{student.Turma} • {student.Turno} • Código: {student.CodigoAluno}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Dados Condicionais do Modelo */}
                  {(selectedDocTemplate === 'termo_ciencia' || selectedDocTemplate === 'termo_adequacao_conduta') ? (
                    <div className="border-t border-slate-100 pt-5 space-y-4">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        {selectedDocTemplate === 'termo_ciencia' ? 'Dados do Responsável' : 'Dados do TACE'}
                      </h4>
                      
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Nome Completo</label>
                        <input
                          type="text"
                          value={docFields.responsibleName}
                          onChange={e => setDocFields(prev => ({ ...prev, responsibleName: e.target.value }))}
                          placeholder="Nome do pai, mãe ou responsável legal"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Identidade / RG</label>
                          <input
                            type="text"
                            value={docFields.responsibleRg}
                            onChange={e => setDocFields(prev => ({ ...prev, responsibleRg: e.target.value }))}
                            placeholder="Digite o RG"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">CPF</label>
                          <input
                            type="text"
                            value={docFields.responsibleCpf}
                            onChange={e => setDocFields(prev => ({ ...prev, responsibleCpf: e.target.value }))}
                            placeholder="Digite o CPF"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Endereço Completo</label>
                        <input
                          type="text"
                          value={docFields.responsibleAddress}
                          onChange={e => setDocFields(prev => ({ ...prev, responsibleAddress: e.target.value }))}
                          placeholder="Rua, número, bairro, cidade"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                        />
                      </div>

                      {selectedDocTemplate === 'termo_adequacao_conduta' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Número do Documento</label>
                            <input
                              type="text"
                              value={docFields.documentNumber}
                              onChange={e => setDocFields(prev => ({ ...prev, documentNumber: e.target.value }))}
                              placeholder={`Automático: ${nextTaceNumber}`}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                            />
                            <p className="text-[9px] text-slate-400 italic mt-1">Deixe em branco para preenchimento automático.</p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Resumo do Fato Gerador (Achado)</label>
                            <textarea
                              value={docFields.achado}
                              onChange={e => setDocFields(prev => ({ ...prev, achado: e.target.value }))}
                              placeholder="Resumo do fato que deu origem à celebração do TACE..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400 min-h-[60px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Obrigações e Prazo</label>
                            <textarea
                              value={docFields.obrigacoesPrazo}
                              onChange={e => setDocFields(prev => ({ ...prev, obrigacoesPrazo: e.target.value }))}
                              placeholder="A estudante aceita e obriga-se a (descrever o acordo e período)..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400 min-h-[60px]"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Gestor Cívico-Militar</label>
                              <input
                                type="text"
                                value={docFields.gestorMilitar}
                                onChange={e => setDocFields(prev => ({ ...prev, gestorMilitar: e.target.value }))}
                                placeholder="Capitão Fulano"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Gestor Educacional Militar</label>
                              <input
                                type="text"
                                value={docFields.gestorEducacional}
                                onChange={e => setDocFields(prev => ({ ...prev, gestorEducacional: e.target.value }))}
                                placeholder="Tenente Sicrano"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Diretor(a) Escolar</label>
                              <input
                                type="text"
                                value={docFields.teacher}
                                onChange={e => setDocFields(prev => ({ ...prev, teacher: e.target.value }))}
                                placeholder="JOÃO PAULO..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Coordenador(a) Pedagógica</label>
                              <input
                                type="text"
                                value={docFields.coordenadorName}
                                onChange={e => setDocFields(prev => ({ ...prev, coordenadorName: e.target.value }))}
                                placeholder="MARISTELA..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : selectedDocTemplate === 'ficha_medida_disciplinar' ? (
                    <div className="border-t border-slate-100 pt-5 space-y-4">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Dados da Ficha de Medida Disciplinar</h4>
                      
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Número do Documento</label>
                        <input
                          type="text"
                          value={docFields.documentNumber}
                          onChange={e => setDocFields(prev => ({ ...prev, documentNumber: e.target.value }))}
                          placeholder={`Automático: ${nextFichaNumber}`}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                        />
                        <p className="text-[9px] text-slate-400 italic mt-1">Deixe em branco para preenchimento automático.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Data da Infração</label>
                          <input
                            type="date"
                            value={docFields.faltaDate}
                            onChange={e => setDocFields(prev => ({ ...prev, faltaDate: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Série / Ano</label>
                          <input
                            type="text"
                            value={docFields.series}
                            onChange={e => setDocFields(prev => ({ ...prev, series: e.target.value }))}
                            placeholder="Ex: 6º Ano"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Disciplina</label>
                          <input
                            type="text"
                            value={docFields.discipline}
                            onChange={e => setDocFields(prev => ({ ...prev, discipline: e.target.value }))}
                            placeholder="Ex: Matemática"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Professor</label>
                          <input
                            type="text"
                            value={docFields.teacher}
                            onChange={e => setDocFields(prev => ({ ...prev, teacher: e.target.value }))}
                            placeholder="Nome do professor"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Medida Disciplinar Aplicada</label>
                        <select
                          value={docFields.medidaAplicada}
                          onChange={e => setDocFields(prev => ({ ...prev, medidaAplicada: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 uppercase"
                        >
                          <option value="">Selecione...</option>
                          <option value="Advertência Oral">Advertência Oral</option>
                          <option value="Advertência Escrita">Advertência Escrita</option>
                          <option value="Suspensão de Sala de Aula">Suspensão de Sala de Aula</option>
                          <option value="Ações Educativas">Ações Educativas</option>
                          <option value="Transferência Educativa">Transferência Educativa</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Falta Disciplinar (Descrição)</label>
                        <textarea
                          value={docFields.falta}
                          onChange={e => setDocFields(prev => ({ ...prev, falta: e.target.value }))}
                          placeholder="Descreva a falta disciplinar cometida..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400 min-h-[60px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Enquadramento no Regulamento (Itens)</label>
                        <select
                          value={docFields.itensEnquadramento}
                          onChange={e => {
                            const value = e.target.value;
                            setDocFields(prev => ({
                              ...prev,
                              itensEnquadramento: value,
                              // clear outroEnquadramento when not 'Outro'
                              outroEnquadramento: value !== 'Outro' ? '' : prev.outroEnquadramento,
                            }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                        >
                          <option value="">Selecione...</option>
                          <option value="Advertência Oral">Advertência Oral</option>
                          <option value="Advertência Escrita">Advertência Escrita</option>
                          <option value="Suspensão de Sala de Aula">Suspensão de Sala de Aula</option>
                          <option value="Ações Educativas">Ações Educativas</option>
                          <option value="Transferência Educativa">Transferência Educativa</option>
                          <option value="Outro">Outro</option>
                        </select>
                        {docFields.itensEnquadramento === 'Outro' && (
                          <input
                            type="text"
                            placeholder="Descreva o ato não listado"
                            value={docFields.outroEnquadramento || ''}
                            onChange={e => setDocFields(prev => ({ ...prev, outroEnquadramento: e.target.value }))}
                            className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Atenuantes</label>
                          <textarea
                            value={docFields.atenuantes}
                            onChange={e => setDocFields(prev => ({ ...prev, atenuantes: e.target.value }))}
                            placeholder="Circunstâncias atenuantes..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400 min-h-[60px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Agravantes</label>
                          <textarea
                            value={docFields.agravantes}
                            onChange={e => setDocFields(prev => ({ ...prev, agravantes: e.target.value }))}
                            placeholder="Circunstâncias agravantes..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400 min-h-[60px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Gestor Educacional Militar</label>
                        <input
                          type="text"
                          value={docFields.gestorMilitar}
                          onChange={e => setDocFields(prev => ({ ...prev, gestorMilitar: e.target.value }))}
                          placeholder="Nome do gestor que assinará"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  ) : selectedDocTemplate === 'fato_observado' ? (
                    <div className="border-t border-slate-100 pt-5 space-y-4">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Dados do Fato Observado</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Série / Ano</label>
                          <input
                            type="text"
                            value={docFields.series}
                            onChange={e => setDocFields(prev => ({ ...prev, series: e.target.value }))}
                            placeholder="Ex: 6º Ano"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Disciplina</label>
                          <input
                            type="text"
                            value={docFields.discipline}
                            onChange={e => setDocFields(prev => ({ ...prev, discipline: e.target.value }))}
                            placeholder="Ex: Matemática"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Professor</label>
                          <input
                            type="text"
                            value={docFields.teacher}
                            onChange={e => setDocFields(prev => ({ ...prev, teacher: e.target.value }))}
                            placeholder="Nome do professor"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Monitor</label>
                          <input
                            type="text"
                            value={docFields.monitor}
                            onChange={e => setDocFields(prev => ({ ...prev, monitor: e.target.value }))}
                            placeholder="Nome do monitor"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">ACHADO: relato sucinto e objetivo</label>
                        <textarea
                          value={docFields.achado}
                          onChange={e => setDocFields(prev => ({ ...prev, achado: e.target.value }))}
                          placeholder="Relate aqui o fato observado de forma sucinta e objetiva..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400 min-h-[100px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Data do Fato</label>
                          <input
                            type="date"
                            value={docFields.date}
                            onChange={e => setDocFields(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Data de Recebimento</label>
                          <input
                            type="date"
                            value={docFields.recebidoDate}
                            onChange={e => setDocFields(prev => ({ ...prev, recebidoDate: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  ) : selectedDocTemplate === 'autorizacao_uniforme' ? (
                    <div className="border-t border-slate-100 pt-5 space-y-4">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Dados da Autorização</h4>
                      
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Número do Documento</label>
                        <input
                          type="text"
                          value={docFields.documentNumber}
                          onChange={e => setDocFields(prev => ({ ...prev, documentNumber: e.target.value }))}
                          placeholder={`Automático: ${nextAutorizacaoNumber}`}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder-slate-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Peça Faltante / Incompleta</label>
                        <input
                          type="text"
                          value={docFields.pecaFaltante}
                          onChange={e => setDocFields(prev => ({ ...prev, pecaFaltante: e.target.value }))}
                          placeholder="Ex: Tênis preto padrão, Calça padrão..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Motivo / Justificativa</label>
                        <textarea
                          value={docFields.motivoUniforme}
                          onChange={e => setDocFields(prev => ({ ...prev, motivoUniforme: e.target.value }))}
                          placeholder="Motivo da ausência da peça..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 min-h-[60px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Data de Início</label>
                          <input
                            type="date"
                            value={docFields.dataInicio}
                            onChange={e => setDocFields(prev => ({ ...prev, dataInicio: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Data de Término</label>
                          <input
                            type="date"
                            value={docFields.dataFim}
                            onChange={e => setDocFields(prev => ({ ...prev, dataFim: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Gestor Cívico-Militar / Escolar</label>
                        <input
                          type="text"
                          value={docFields.gestorMilitar}
                          onChange={e => setDocFields(prev => ({ ...prev, gestorMilitar: e.target.value }))}
                          placeholder="Nome de quem assina"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* Detalhes Gerais */}
                  <div className="border-t border-slate-100 pt-5 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Cidade / UF</label>
                      <input
                        type="text"
                        value={docFields.city}
                        onChange={e => setDocFields(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                      />
                    </div>
                    {(selectedDocTemplate === 'termo_ciencia' || selectedDocTemplate === 'termo_adequacao_conduta') && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Data</label>
                        <input
                          type="date"
                          value={docFields.date}
                          onChange={e => setDocFields(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                        />
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="pt-4 flex gap-4">
                    <button
                      onClick={handlePrintDocument}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <FileText size={16} /> Imprimir / Salvar PDF
                    </button>
                    <button
                      onClick={handleClearDocForm}
                      className="px-4 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-200"
                      title="Limpar formulário"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {/* PRÉ-VISUALIZAÇÃO DO DOCUMENTO (SIMULAÇÃO A4) */}
                <div className="xl:col-span-7 flex justify-center overflow-x-auto">
                  <div 
                    id="document-print-area" 
                    className="w-[210mm] min-h-[297mm] p-[20mm] bg-white text-black shadow-2xl relative overflow-hidden select-none mx-auto border border-gray-200 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:h-auto"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                  >
                    
                    {/* Estilo para ocultar decorações em tela cheia na hora de imprimir */}
                    <style>{`
                      @media print {
                        body * {
                          visibility: hidden !important;
                        }
                        #document-print-area, #document-print-area * {
                          visibility: visible !important;
                        }
                        #document-print-area {
                          position: absolute !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: 210mm !important;
                          height: 297mm !important;
                          background: white !important;
                          color: black !important;
                          padding: 20mm !important;
                          margin: 0 !important;
                          box-shadow: none !important;
                          border: none !important;
                        }
                        .print-decorations {
                          display: none !important;
                        }
                      }
                    `}</style>

                    {/* Molduras/Decorações Coloridas - Identidade MT (Escondidas na impressão para economizar tinta) */}
                    {/* Top Right Decoration (Wave with Dot Grid) */}
                    <svg className="print-decorations absolute right-0 top-0 w-[240px] h-[150px] opacity-75 pointer-events-none" viewBox="0 0 240 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 240,0 L 80,0 C 110,40 150,70 240,90 Z" fill="#0f264c" opacity="0.85" />
                      <path d="M 240,0 L 120,0 C 150,50 180,90 240,120 Z" fill="#06b6d4" opacity="0.25" />
                      <path d="M 240,0 L 160,0 C 180,30 200,60 240,80 Z" fill="#818cf8" opacity="0.2" />
                      <defs>
                        <pattern id="dot-grid-white" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                          <circle cx="2" cy="2" r="0.75" fill="#ffffff" opacity="0.6" />
                        </pattern>
                      </defs>
                      <path d="M 240,0 L 80,0 C 110,40 150,70 240,90 Z" fill="url(#dot-grid-white)" />
                    </svg>

                    {/* Middle Left Yellow Circle */}
                    <svg className="print-decorations absolute left-0 top-[180px] w-[30px] h-[60px] opacity-60 pointer-events-none" viewBox="0 0 30 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 0,5 C 18,5 30,18 30,30 C 30,42 18,55 0,55 Z" fill="#f59e0b" />
                    </svg>

                    {/* Bottom Left Light Blue Wave */}
                    <svg className="print-decorations absolute left-0 bottom-0 w-[140px] h-[170px] opacity-60 pointer-events-none" viewBox="0 0 140 170" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 0,170 L 0,70 C 35,80 70,110 110,170 Z" fill="#06b6d4" opacity="0.25" />
                      <path d="M 0,170 L 0,100 C 25,110 50,130 80,170 Z" fill="#22d3ee" opacity="0.35" />
                    </svg>

                    {/* Bottom Right Tan/Yellow/Orange Wave */}
                    <svg className="print-decorations absolute right-0 bottom-0 w-[180px] h-[140px] opacity-50 pointer-events-none" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 180,140 L 70,140 C 95,115 130,90 180,80 Z" fill="#f59e0b" opacity="0.25" />
                      <path d="M 180,140 L 110,140 C 125,128 150,105 180,95 Z" fill="#d97706" opacity="0.2" />
                    </svg>

                    {/* Logo/Número no topo direito */}
                    <div className="absolute right-[20mm] top-[15mm] flex flex-col items-center text-center pointer-events-none w-[120px]">
                      <span className="text-[12px] font-black text-[#0f264c] leading-tight">
                        {selectedDocTemplate === 'termo_ciencia' ? '42' : '43'}
                      </span>
                      <img src="/logo-escola-oficial.png" alt="Logo Escola" className="w-[80px] h-auto object-contain drop-shadow-sm" />
                    </div>

                    {/* Cabeçalho do Documento */}
                    <div className="text-center pr-32 pl-4 mb-6">
                      <p className="text-[11px] font-black text-black uppercase tracking-wider mb-1">
                        {selectedDocTemplate === 'termo_ciencia' ? 'Anexo I' : 'Anexo II'}
                      </p>
                      <p className="text-[11px] font-black text-black uppercase leading-tight">Estado de Mato Grosso</p>
                      <p className="text-[10px] font-black text-black uppercase leading-tight mt-0.5">Secretaria de Estado de Educação</p>
                      <p className="text-[9px] font-black text-black uppercase leading-tight mt-0.5">Superintendência de Escolas Militares e Cívico-Militares</p>
                      <p className="text-[10px] font-black text-black uppercase leading-tight mt-0.5">Escola Estadual Cívico-Militar</p>
                      <p className="text-[10px] font-black text-black uppercase leading-tight mt-0.5">André Antônio Maggi</p>
                      <div className="border-b border-black w-full my-4"></div>
                    </div>

                    {selectedDocTemplate === 'termo_ciencia' ? (
                      <>
                        {/* Título do Termo */}
                        <div className="text-center my-10">
                          <h2 className="text-base font-black text-gray-900 tracking-wider uppercase">Termo de Ciência e Concordância</h2>
                        </div>

                        {/* Texto do Documento */}
                        <div className="text-sm text-gray-900 leading-[1.8] space-y-6 text-justify" style={{ textIndent: '2.5cm' }}>
                          <p>
                            Eu, <span className="font-black border-b border-gray-400 px-1 uppercase">{docFields.responsibleName || '___________________________________________________'}</span> (nome completo), 
                            portador do documento de Identidade nº <span className="font-black border-b border-gray-400 px-1">{docFields.responsibleRg || '________________________'}</span>, 
                            CPF nº <span className="font-black border-b border-gray-400 px-1">{docFields.responsibleCpf || '____________________'}</span>, 
                            residente e domiciliado em <span className="font-black border-b border-gray-400 px-1 uppercase">{docFields.responsibleAddress || '________________________________________________________________________'}</span> (endereço completo), 
                            responsável legal pelo aluno(a) <span className="font-black border-b border-gray-400 px-1 uppercase">{selectedStudentForDoc ? selectedStudentForDoc.Nome : '___________________________________________________'}</span> (nome completo), 
                            matriculado na turma <span className="font-black border-b border-gray-400 px-1 uppercase">{selectedStudentForDoc ? `${selectedStudentForDoc.Turma} (${selectedStudentForDoc.Turno})` : '_________________________'}</span>, 
                            Declaro, para todos os fins úteis, que:
                          </p>

                          <p>
                            Estou familiarizado com as disposições contidas no Manual das Escolas Cívicas e Militares do Estado, 
                            incluindo, mas não se limitando a, normas disciplinares, regulamentos internos, diretrizes educacionais, 
                            procedimentos de segurança e protocolos administrativos.
                          </p>

                          <p>
                            Aceito o conteúdo dos documentos de orientação, sejam eles o Regulamento Disciplinar Escolar, 
                            o Projeto de Política Pedagógica, as Normas e Orientações a que se referem, nomeadamente a apresentação pessoal 
                            e o sistema de créditos e reduções, bem como, afirmo que tenho conhecimento dos documentos aqui citados.
                          </p>
                        </div>

                        {/* Local e Data */}
                        <div className="text-right mt-16 text-sm text-gray-900 font-medium">
                          <p>
                            {docFields.city}, {formatDocDate(docFields.date)}.
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1 mr-4 italic">(local e data)</p>
                        </div>

                        {/* Assinatura do Responsável */}
                        <div className="mt-28 flex flex-col items-center">
                          <div className="w-96 border-t border-black"></div>
                          <p className="text-xs font-black uppercase text-gray-900 tracking-wide mt-2">Nome e assinatura do responsável</p>
                        </div>
                      </>
                    ) : selectedDocTemplate === 'termo_adequacao_conduta' ? (
                      <>
                        {/* Título do Termo */}
                        <div className="text-center my-6">
                          <h2 className="text-base font-black text-gray-900 tracking-wider uppercase">Termo de Adequação de Conduta Escolar (TACE)</h2>
                          <div className="flex justify-end mt-4">
                            <p className="text-[11px] font-bold text-gray-900 uppercase leading-tight text-justify w-1/2">
                              Nº {docFields.documentNumber || nextTaceNumber}, Celebrado entre a EECM André Antônio Maggi e o(s) responsável(eis) pelo(a) estudante {selectedStudentForDoc ? selectedStudentForDoc.Nome : '___________________________'}, objetivando o cumprimento de obrigações.
                            </p>
                          </div>
                        </div>

                        {/* Texto do Documento */}
                        <div className="text-sm text-gray-900 leading-[1.8] space-y-4 text-justify" style={{ textIndent: '2.5cm' }}>
                          <p>
                            Pelo presente instrumento particular, a EECM <span className="font-black uppercase">André Antônio Maggi</span>, com personalidade jurídica de direito privado, com sede e foro em {docFields.city ? docFields.city.split('-')[0].trim() : 'Colíder'} - MT, inscrita no CNPJ nº 11.906.357/0001-50, representada, neste ato, pelo(a) Diretor(a) Escolar Sr(a). <span className="font-black uppercase">{docFields.teacher || 'JOÃO PAULO DOS SANTOS NETO'}</span>, celebra com o(a) Sr(a). <span className="font-black border-b border-gray-400 px-1 uppercase">{docFields.responsibleName || '___________________________________________________'}</span> (pai/mãe/responsável), CPF: <span className="font-black border-b border-gray-400 px-1">{docFields.responsibleCpf || '____________________'}</span>, responsável(eis) pelo(s) Sr(s). <span className="font-black border-b border-gray-400 px-1 uppercase">{selectedStudentForDoc ? selectedStudentForDoc.Nome : '___________________________________________________'}</span>, estudante do <span className="font-black uppercase">{docFields.series || '___________'}</span>. O presente Termo de Adequação de Conduta Escolar (TACE), tem por objetivo ajustar o comportamento do Aluno(a) em conformidade com as normas e regulamentos da Escola Estadual Cívico-Militar, garantindo um ambiente escolar saudável e disciplinado, sob as seguintes condições:
                          </p>
                        </div>

                        <div className="text-sm text-gray-900 space-y-4 mt-6 text-justify">
                          <p className="font-bold">Considerando que:</p>
                          <ol className="list-decimal pl-5 space-y-2">
                            <li>A Escola tem como missão proporcionar um ambiente de ensino disciplinado, organizado e propício ao desenvolvimento integral dos alunos.</li>
                            <li>O Aluno(a) e seu Responsável têm o dever de cumprir e zelar pelo cumprimento das normas e regulamentos da Escola.</li>
                            <li>Recentemente, foram observados comportamentos e atitudes do(a) estudante que não estão em conformidade com as normas da Escola.</li>
                          </ol>

                          <p className="font-bold text-base mt-4">Do Fato</p>
                          <p>Resumo do fato que deu origem à celebração do TACE: <span className="underline decoration-dotted">{docFields.achado || '_________________________________________________________________'}</span></p>

                          <p className="font-bold text-base mt-4">Do Reconhecimento</p>
                          <p>O estudante, neste ato representado por seu responsável, <span className="font-black border-b border-gray-400 px-1 uppercase">{docFields.responsibleName || '___________________________________________________'}</span>, reconhece e assume a responsabilidade pelas irregularidades a que deu causa e compromete-se a ajustar sua conduta, assim como observar os deveres e medidas disciplinares previstos no Regulamento Disciplinar das EECM e Regimento Escolar.</p>

                          <p className="font-bold text-base mt-4">Das Obrigações e Prazo</p>
                          <p>A estudante aceita e obriga-se a <span className="underline decoration-dotted">{docFields.obrigacoesPrazo || '_________________________________________________________________'}</span>, sob pena de ser instaurado o respectivo procedimento administrativo disciplinar, sem prejuízo da apuração relativa à inobservância das obrigações previstas neste TACE.</p>

                          <p className="font-bold text-base mt-4">Da Fiscalização</p>
                          <p>A fiscalização do cumprimento dos compromissos estabelecidos neste Termo de Adequação de Conduta Escolar, será de responsabilidade da Gestão Cívico-Militar, através dos Monitores, juntamente com a Coordenação Pedagógica, através dos Professores.</p>

                          <p className="font-bold text-base mt-4">Consequências do Não Cumprimento:</p>
                          <p>O não cumprimento das obrigações estabelecidas neste Termo poderá resultar em medidas disciplinares, conforme previsto no Artigo 13, do Regulamento Disciplinar das Escolas Estaduais Cívico-Militares e Regimento Interno da Escola, incluindo advertências, suspensões, ações educativas e, em casos extremos, a transferência educativa do(a) Estudante.</p>

                          <p className="font-bold text-base mt-4">Disposições Gerais:</p>
                          <p>Este Termo é firmado em duas vias de igual teor, ficando uma via em posse da Escola e outra em posse do Responsável.</p>
                        </div>

                        {/* Local e Data */}
                        <div className="text-center mt-10 text-sm text-gray-900 font-medium">
                          <p>{docFields.city || 'Colíder - MT'}, {formatDocDate(docFields.date)}.</p>
                        </div>

                        {/* Assinaturas */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-16 mt-16 text-xs text-gray-900 break-inside-avoid">
                          <div className="flex flex-col items-center">
                            <div className="w-full border-t border-black"></div>
                            <p className="font-bold uppercase mt-2 text-center">{docFields.teacher || 'JOÃO PAULO DOS SANTOS NETO'}</p>
                            <p className="text-center">Diretor(a) Escolar</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-full border-t border-black"></div>
                            <p className="font-bold uppercase mt-2 text-center">{docFields.gestorMilitar || 'Capitão ANTONIO JOÃO RIBEIRO'}</p>
                            <p className="text-center">Gestor Cívico-Militar</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-full border-t border-black"></div>
                            <p className="font-bold uppercase mt-2 text-center">{docFields.responsibleName || '___________________________________'}</p>
                            <p className="text-center">Responsável ou Aluno + 18 anos</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-full border-t border-black"></div>
                            <p className="font-bold uppercase mt-2 text-center">{docFields.coordenadorName || 'MARISTELA LÚCIA PONTES DE ALCANTARA'}</p>
                            <p className="text-center">Coordenadora Pedagógica</p>
                          </div>
                          <div className="col-span-2 flex flex-col items-center">
                            <div className="w-1/2 border-t border-black"></div>
                            <p className="font-bold uppercase mt-2 text-center">{docFields.gestorEducacional || 'Tenente MARCELO DEL BOSCO DA COSTA'}</p>
                            <p className="text-center">Gestor Educacional Militar</p>
                          </div>
                        </div>
                      </>
                    ) : selectedDocTemplate === 'ficha_medida_disciplinar' ? (
                      <>
                        {/* Título da Ficha */}
                        <div className="text-center my-6">
                          <h2 className="text-base font-black text-gray-900 tracking-wider uppercase">Ficha de Medida Disciplinar</h2>
                          <p className="text-sm font-bold text-gray-900 mt-1">Notificação de Medida Disciplinar Número: {docFields.documentNumber || nextFichaNumber}</p>
                        </div>

                        {/* Dados Básicos */}
                        <div className="space-y-4 text-xs text-gray-900 mb-6">
                          <div className="flex items-end">
                            <span className="font-bold mr-1.5 whitespace-nowrap">Estudante:</span>
                            <span className="flex-1 border-b border-gray-400 font-semibold px-2 uppercase h-5 leading-5 truncate">
                              {selectedStudentForDoc ? selectedStudentForDoc.Nome : '__________________________________________________________________________'}
                            </span>
                          </div>

                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-6 flex items-end">
                              <span className="font-bold mr-1.5 whitespace-nowrap">Série:</span>
                              <span className="flex-1 border-b border-gray-400 font-semibold px-2 uppercase h-5 leading-5 truncate">
                                {docFields.series || '___________________'}
                              </span>
                            </div>
                            <div className="col-span-6 flex items-end">
                              <span className="font-bold mr-1.5 whitespace-nowrap">Turma:</span>
                              <span className="flex-1 border-b border-gray-400 font-semibold px-2 uppercase h-5 leading-5 truncate">
                                {selectedStudentForDoc ? selectedStudentForDoc.Turma : '_________________'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-6 flex items-end">
                              <span className="font-bold mr-1.5 whitespace-nowrap">Disciplina:</span>
                              <span className="flex-1 border-b border-gray-400 font-semibold px-2 uppercase h-5 leading-5 truncate">
                                {docFields.discipline || '______________________'}
                              </span>
                            </div>
                            <div className="col-span-6 flex items-end">
                              <span className="font-bold mr-1.5 whitespace-nowrap">Data:</span>
                              <span className="flex-1 border-b border-gray-400 font-semibold px-2 text-center h-5 leading-5 truncate">
                                {formatSimpleDate(docFields.date)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-end">
                            <span className="font-bold mr-1.5 whitespace-nowrap">Professor:</span>
                            <span className="flex-1 border-b border-gray-400 font-semibold px-2 uppercase h-5 leading-5 truncate">
                              {docFields.teacher || '_____________________________________'}
                            </span>
                          </div>
                        </div>

                        {/* Texto Notificação */}
                        <div className="text-xs text-gray-900 text-justify space-y-4 mb-6 leading-relaxed">
                          <p>
                            Senhor (a) responsável, informamos que, no dia <span className="font-bold underline decoration-dotted underline-offset-4">{formatSimpleDate(docFields.date)}</span>, o estudante recebeu uma 
                            Notificação de Medida Disciplinar de <span className="font-bold underline decoration-dotted underline-offset-4 uppercase">{docFields.medidaAplicada || '_____________________________________'}</span>, o que 
                            poderá ocasionar a perda de créditos. O período recursal está previsto no Art. 44, § 1º, do 
                            Capítulo X do Regulamento Disciplinar das EECM-MT. A defesa poderá ser feita por escrito, no 
                            prazo de 3 (três) dias úteis a contar do dia do recebimento da Notificação. A Medida Disciplinar 
                            será efetivada ou arquivada conforme despacho do gestor competente. O estudante supracitado 
                            cometeu a seguinte falta disciplinar no dia <span className="font-bold underline decoration-dotted underline-offset-4">{formatSimpleDate(docFields.faltaDate)}</span>: <span className="font-bold uppercase">{docFields.falta || '___________________________________________________________________________________'}</span>, 
                            sendo enquadrado no(s) item(ns) abaixo, conforme Apêndice I Regulamento Disciplinar das EECM-MT: 
                            <span className="font-bold ml-1 uppercase">{docFields.itensEnquadramento === 'Outro' ? (docFields.outroEnquadramento || '_____________________________________________________') : (docFields.itensEnquadramento || '_____________________________________________________')}</span>.
                          </p>
                        </div>

                        {/* Circunstâncias */}
                        <div className="space-y-4 mb-10 text-xs text-gray-900">
                          <div className="space-y-1">
                            <p className="font-bold">Circunstâncias atenuantes:</p>
                            <p className="border-b border-gray-400 h-5 px-1 uppercase">{docFields.atenuantes}</p>
                            <p className="border-b border-gray-400 h-5"></p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold">Circunstâncias agravantes:</p>
                            <p className="border-b border-gray-400 h-5 px-1 uppercase">{docFields.agravantes}</p>
                            <p className="border-b border-gray-400 h-5"></p>
                          </div>
                        </div>

                        {/* Assinatura Gestor (Página 1) */}
                        <div className="mt-16 mb-8 flex flex-col items-center">
                          <div className="w-80 border-t border-black"></div>
                          <p className="text-xs font-bold uppercase text-gray-900 mt-2">{docFields.gestorMilitar || 'Gestor Educacional Militar'}</p>
                        </div>

                        {/* Recebimento (Página 1) */}
                        <div className="flex justify-between items-end text-xs text-gray-900 mt-12 mb-16">
                          <p>
                            Recebi 1ª via em ____/____/________
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 text-xs text-gray-900 mb-16 break-after-page">
                          <div className="flex flex-col items-center">
                            <div className="border-t border-black w-full"></div>
                            <p className="mt-2 text-center">Nome completo do Responsável</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="border-t border-black w-full"></div>
                            <p className="mt-2 text-center">Assinatura do Responsável</p>
                          </div>
                        </div>

                        {/* PAGE 2 */}
                        <div className="pt-8">
                          {/* Cabeçalho Anexo III p2 (opcional, PDF tem algo similar) */}
                          <div className="text-right pr-4 mb-8">
                            <p className="text-[11px] font-black text-black uppercase tracking-wider">Anexo III (Pág 2)</p>
                          </div>

                          <div className="space-y-6 text-xs text-gray-900">
                            <div>
                              <p className="font-bold uppercase mb-4">DEFESA DO RESPONSÁVEL OU DO ESTUDANTE (SE MAIOR DE IDADE)</p>
                              <div className="space-y-6">
                                <div className="border-b border-gray-400 w-full h-4"></div>
                                <div className="border-b border-gray-400 w-full h-4"></div>
                                <div className="border-b border-gray-400 w-full h-4"></div>
                                <div className="border-b border-gray-400 w-full h-4"></div>
                                <div className="border-b border-gray-400 w-full h-4"></div>
                              </div>
                            </div>
                            
                            <div className="text-center my-6">
                              <p>__________________________________, ________de________________________de____________.</p>
                            </div>

                            <div className="space-y-2 mb-10">
                              <div className="flex items-end">
                                <span className="mr-2">Nome do Responsável ou do Estudante:</span>
                                <span className="flex-1 border-b border-gray-400"></span>
                              </div>
                              <div className="flex items-end w-2/3">
                                <span className="mr-2">RG:</span>
                                <span className="flex-1 border-b border-gray-400"></span>
                              </div>
                              <div className="flex items-end w-2/3">
                                <span className="mr-2">Telefone:</span>
                                <span className="flex-1 border-b border-gray-400"></span>
                              </div>
                            </div>

                            <div className="flex flex-col items-center mb-16">
                              <div className="w-80 border-t border-black"></div>
                              <p className="mt-2">Assinatura</p>
                            </div>

                            <div>
                              <p className="font-bold uppercase mb-4">DESPACHO DO GESTOR COMPETENTE:</p>
                              <div className="space-y-6">
                                <div className="border-b border-gray-400 w-full h-4"></div>
                                <div className="border-b border-gray-400 w-full h-4"></div>
                                <div className="border-b border-gray-400 w-full h-4"></div>
                                <div className="border-b border-gray-400 w-full h-4"></div>
                                <div className="border-b border-gray-400 w-full h-4"></div>
                              </div>
                            </div>

                            <div className="text-center my-8">
                              <p>__________________________________, ________de________________________de____________.</p>
                            </div>

                            <div className="flex flex-col items-center mt-12 mb-8">
                              <div className="w-80 border-t border-black"></div>
                              <p className="mt-2">Gestor competente</p>
                            </div>
                          </div>
                        </div>

                      </>
                    ) : selectedDocTemplate === 'fato_observado' ? (
                      <>
                        {/* Título do Fato Observado */}
                        <div className="text-center my-6">
                          <h2 className="text-base font-black text-gray-900 tracking-wider uppercase">Relatório de Fato Observado</h2>
                        </div>

                        {/* Dados Básicos */}
                        <div className="space-y-4 text-xs text-gray-900 mb-6">
                          <div className="flex items-end">
                            <span className="font-bold mr-1.5 whitespace-nowrap">Estudante:</span>
                            <span className="flex-1 border-b border-gray-400 font-semibold px-2 uppercase h-5 leading-5 truncate">
                              {selectedStudentForDoc ? selectedStudentForDoc.Nome : '__________________________________________________________________________'}
                            </span>
                          </div>

                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-4 flex items-end">
                              <span className="font-bold mr-1.5 whitespace-nowrap">Série:</span>
                              <span className="flex-1 border-b border-gray-400 font-semibold px-2 uppercase h-5 leading-5 truncate">
                                {docFields.series || '___________________'}
                              </span>
                            </div>
                            <div className="col-span-4 flex items-end">
                              <span className="font-bold mr-1.5 whitespace-nowrap">Turma:</span>
                              <span className="flex-1 border-b border-gray-400 font-semibold px-2 uppercase h-5 leading-5 truncate">
                                {selectedStudentForDoc ? selectedStudentForDoc.Turma : '_________________'}
                              </span>
                            </div>
                            <div className="col-span-4 flex items-end">
                              <span className="font-bold mr-1.5 whitespace-nowrap">Disciplina:</span>
                              <span className="flex-1 border-b border-gray-400 font-semibold px-2 uppercase h-5 leading-5 truncate">
                                {docFields.discipline || '______________________'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-8 flex items-end">
                              <span className="font-bold mr-1.5 whitespace-nowrap">Professor:</span>
                              <span className="flex-1 border-b border-gray-400 font-semibold px-2 uppercase h-5 leading-5 truncate">
                                {docFields.teacher || '_____________________________________'}
                              </span>
                            </div>
                            <div className="col-span-4 flex items-end">
                              <span className="font-bold mr-1.5 whitespace-nowrap">Data:</span>
                              <span className="flex-1 border-b border-gray-400 font-semibold px-2 text-center h-5 leading-5 truncate">
                                {formatSimpleDate(docFields.date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bloco de ACHADO */}
                        <div className="mt-8 mb-6">
                          <p className="text-xs font-bold text-gray-900 uppercase mb-2">
                            ACHADO: <span className="font-normal italic lowercase">relato sucinto e objetivo</span>
                          </p>
                          
                          <div 
                            className="w-full text-[12px] leading-[28px] text-gray-900 whitespace-pre-wrap break-all text-justify font-mono border border-gray-200 rounded-lg p-4"
                            style={{ 
                              minHeight: '198px',
                              backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #cbd5e1 27px, #cbd5e1 28px)',
                              backgroundAttachment: 'local',
                              fontFamily: 'monospace',
                              fontStyle: 'italic',
                              textTransform: 'uppercase'
                            }}
                          >
                            {docFields.achado || (
                              <span className="text-gray-300 select-none">
                                O TEXTO DO RELATO APARECERÁ AQUI ALINHADO ÀS LINHAS DO DOCUMENTO.
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Local e Data */}
                        <div className="text-center my-8 text-xs text-gray-900 font-medium">
                          <p>
                            {docFields.city || '__________________________'}, {formatDocDate(docFields.date)}.
                          </p>
                        </div>

                        {/* Assinaturas */}
                        <div className="grid grid-cols-2 gap-8 mt-12 text-xs text-gray-900">
                          <div className="flex flex-col items-stretch">
                            <div className="border-t border-black w-full my-2"></div>
                            <p className="font-bold text-center uppercase tracking-wide text-[9px] mb-0.5">Assinatura do professor</p>
                            <p className="text-[8px] text-gray-500 text-center font-medium truncate uppercase">{docFields.teacher}</p>
                          </div>
                          <div className="flex flex-col items-stretch">
                            <div className="border-t border-black w-full my-2"></div>
                            <p className="font-bold text-center uppercase tracking-wide text-[9px] mb-0.5">Assinatura do monitor</p>
                            <p className="text-[8px] text-gray-500 text-center font-medium truncate uppercase">{docFields.monitor}</p>
                          </div>
                        </div>

                        {/* Recebido block */}
                        <div className="mt-12 text-xs text-gray-900 font-medium border-t border-gray-200 pt-6">
                          <p>
                            Recebido em {docFields.city ? docFields.city.split('-')[0].trim() : '________________'}, {formatDocDate(docFields.recebidoDate)}.
                          </p>
                        </div>
                      </>
                    ) : selectedDocTemplate === 'autorizacao_uniforme' ? (
                      <>
                        <div className="text-center my-10">
                          <h2 className="text-lg font-black text-gray-900 uppercase">AUTORIZAÇÃO TEMPORÁRIA PARA USO INCOMPLETO DO UNIFORME</h2>
                          <p className="text-sm font-bold text-gray-900 mt-2">Nº {docFields.documentNumber || nextAutorizacaoNumber}</p>
                        </div>

                        <div className="text-sm text-gray-900 text-justify leading-relaxed space-y-6 mt-8">
                          <p>
                            Autorizo o(a) estudante <strong>{selectedStudentForDoc?.Nome || '____________________________________________________'}</strong>, 
                            devidamente matriculado(a) na turma <strong>{selectedStudentForDoc?.Turma || '___________'}</strong>, 
                            a frequentar as atividades escolares com o uniforme incompleto, devido à ausência da seguinte peça:
                          </p>

                          <div className="pl-8 font-bold italic">
                            - {docFields.pecaFaltante || '____________________________________________________'}
                          </div>

                          <p>
                            <strong>Justificativa / Motivo:</strong> {docFields.motivoUniforme || '_________________________________________________________________________________________'}
                          </p>

                          <p>
                            <strong>Período de Validade:</strong> Esta autorização é válida do dia <strong>{formatDocDate(docFields.dataInicio)}</strong> ao dia <strong>{formatDocDate(docFields.dataFim)}</strong>.
                          </p>
                          
                          <p className="mt-4 italic text-xs">
                            * O uso incompleto do uniforme só é permitido mediante esta autorização devidamente assinada.
                            O(a) estudante compromete-se a regularizar a situação após o término do período de validade estipulado acima.
                          </p>
                        </div>

                        <div className="text-center mt-16 mb-20 text-sm">
                          <p>{docFields.city ? docFields.city.split('-')[0].trim() : 'Colíder'}, {formatDocDate(docFields.date)}.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-16 text-sm text-gray-900 mt-16 pb-12">
                          <div className="flex flex-col items-center">
                            <div className="border-t border-black w-2/3"></div>
                            <p className="font-bold uppercase mt-2 text-center">{selectedStudentForDoc?.Nome || 'NOME DO ESTUDANTE'}</p>
                            <p className="text-center">Estudante</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="border-t border-black w-2/3"></div>
                            <p className="font-bold uppercase mt-2 text-center">{docFields.responsibleName || 'NOME DO RESPONSÁVEL'}</p>
                            <p className="text-center">Responsável Legal</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="border-t border-black w-2/3"></div>
                            <p className="font-bold uppercase mt-2 text-center">{docFields.gestorMilitar || 'NOME DO GESTOR CÍVICO-MILITAR / ESCOLAR'}</p>
                            <p className="text-center">Gestor Cívico-Militar / Escolar</p>
                          </div>
                        </div>
                      </>
                    ) : null}

                  </div>
                </div>

              </div>

              {/* HISTÓRICO DE DOCUMENTOS EMITIDOS */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm no-print space-y-6 text-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <FileText className="text-blue-600" /> Histórico de Documentações Geradas
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Veja ou reabra documentos preenchidos anteriormente</p>
                </div>

                {docHistory.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 uppercase font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
                    Nenhum documento gerado no histórico.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                          <th className="py-3 px-4">Aluno</th>
                          <th className="py-3 px-4">Turma / Turno</th>
                          <th className="py-3 px-4">Responsável</th>
                          <th className="py-3 px-4">Documento</th>
                          <th className="py-3 px-4">Data Emissão</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {docHistory.map(record => (
                          <tr 
                            key={record.id} 
                            onClick={() => handleLoadDocFromHistory(record)}
                            className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                          >
                            <td className="py-4 px-4 font-black text-slate-900 uppercase">{record.studentName}</td>
                            <td className="py-4 px-4 text-slate-600 font-medium uppercase">{record.className} • {record.shiftName}</td>
                            <td className="py-4 px-4 text-slate-600 uppercase">{record.fields.responsibleName}</td>
                            <td className="py-4 px-4 text-blue-600 font-semibold">{record.templateLabel}</td>
                            <td className="py-4 px-4 text-slate-500 font-medium">{new Date(record.date).toLocaleDateString('pt-BR')}</td>
                            <td className="py-4 px-4 text-right space-x-2">
                              <button
                                onClick={(e) => handleDeleteDocFromHistory(record.id, e)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Excluir do Histórico"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'fatos_observados' && (
             <FatosObservadosInbox 
                onPreencherDocumento={handlePreencherDocumentoDaInbox} 
                demeritOptions={demeritOptions}
                disciplinaryMeasuresList={disciplinaryMeasuresList}
                onAplicarPunicao={handleInboxPunicao}
             />
          )}

          {activeTab === 'relatorios' && (
             <CivicoMilitarReports studentStates={studentStates} />
          )}

        </div>
      </main>

      {/* MODAL 1: LANÇAR INSPEÇÃO */}
      {isInspectionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <UserCheck size={18} className="text-blue-600" /> Registrar Ocorrência de Fardamento
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Apresentação Pessoal do Aluno</p>
              </div>
              <button onClick={() => setIsInspectionModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleAddInspection} className="space-y-5">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Aluno</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={
                      (() => {
                        const selected = dbStudents.find(s => s.CodigoAluno === newInspection.studentId);
                        return selected ? `${selected.Nome} (${selected.Turma})` : "Digitar nome do aluno...";
                      })()
                    }
                    value={studentSearchTerm}
                    onChange={e => {
                      setStudentSearchTerm(e.target.value);
                      setIsStudentDropdownOpen(true);
                    }}
                    onFocus={(e) => {
                      setIsStudentDropdownOpen(true);
                      const selected = dbStudents.find(s => s.CodigoAluno === newInspection.studentId);
                      if (selected && !studentSearchTerm) {
                        setStudentSearchTerm(selected.Nome);
                      }
                      setTimeout(() => {
                        e.target.select();
                      }, 50);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setIsStudentDropdownOpen(false);
                      }, 200);
                    }}
                    className="w-full pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl py-3 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                  />
                  {newInspection.studentId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setNewInspection(prev => ({ ...prev, studentId: '' }));
                        setStudentSearchTerm('');
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown size={16} />
                    </div>
                  )}

                  {isStudentDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredStudentsForInspection.length > 0 ? (
                        filteredStudentsForInspection.map(s => (
                          <button
                            key={s.CodigoAluno}
                            type="button"
                            onMouseDown={() => {
                              setNewInspection(prev => ({ ...prev, studentId: s.CodigoAluno }));
                              setStudentSearchTerm(`${s.Nome} (${s.Turma})`);
                              setIsStudentDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors flex flex-col ${
                              newInspection.studentId === s.CodigoAluno ? 'bg-blue-50 font-semibold' : ''
                            }`}
                          >
                            <span className="text-slate-900 font-semibold">{s.Nome}</span>
                            <span className="text-slate-400 text-[10px] uppercase font-bold mt-0.5">{s.Turma}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center">Nenhum aluno encontrado</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Item Identificado</label>
                <select
                  value={newInspection.item}
                  onChange={e => setNewInspection(prev => ({ ...prev, item: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                >
                  <option value="Farda incompleta">Farda incompleta</option>
                  <option value="Farda suja / amarrotada">Farda suja / amarrotada</option>
                  <option value="Cabelo fora do padrão (corte/penteado)">Cabelo fora do padrão (corte/penteado)</option>
                  <option value="Calçado fora da norma (cor/limpeza)">Calçado fora da norma (cor/limpeza)</option>
                  <option value="Sem calçado fechado">Sem calçado fechado</option>
                  <option value="Jaqueta fora do padrão (outra cor)">Jaqueta fora do padrão (outra cor)</option>
                  <option value="Adornos proibidos (brincos, colares, anéis)">Adornos proibidos (brincos, colares, anéis)</option>
                  <option value="Unhas sem corte / esmalte inadequado">Unhas sem corte / esmalte inadequado</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Data da Ocorrência</label>
                <input
                  type="date"
                  value={newInspection.date}
                  onChange={e => setNewInspection(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Observações Detalhadas</label>
                <textarea
                  value={newInspection.observations}
                  onChange={e => setNewInspection(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Descreva detalhes específicos da inconformidade..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 min-h-[80px]"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsInspectionModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/10"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETALHES DE COMPORTAMENTO / LANÇAR OCORRÊNCIA */}
      {isBehaviorModalOpen && selectedStudentState && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-8 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800">
            
            {/* Esquerda: Informações Gerais e Formulário de Lançamento */}
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[280px]">
                    {selectedStudentState.studentName}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Turma: {selectedStudentState.className} • Código: {selectedStudentState.studentId}
                  </p>
                  {(() => {
                    const studentFull = dbStudents.find(s => s.CodigoAluno === selectedStudentState.studentId);
                    if (studentFull && (studentFull.NomeResponsavel || studentFull.TelefoneContato)) {
                      return (
                        <p className="text-[9px] text-blue-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                          <Users size={10} /> 
                          {studentFull.NomeResponsavel || 'RESPONSÁVEL NÃO INFORMADO'} 
                          {studentFull.TelefoneContato && ` • ${studentFull.TelefoneContato}`}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Placa de Nota de Atitude */}
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl flex justify-between items-center text-slate-900">
                <div>
                  <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block mb-0.5">Nota de Atitude</span>
                  <span className="text-3xl font-black text-slate-900">{selectedStudentState.score.toFixed(1)}</span>
                </div>
                <span className={`px-3 py-1 rounded-xl text-[10px] font-black border uppercase ${getBehaviorStatus(selectedStudentState.score).color}`}>
                  {getBehaviorStatus(selectedStudentState.score).label}
                </span>
              </div>

              {/* Form Lançamento de Méritos / Deméritos */}
              <form onSubmit={handleAddOccurrence} className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Lançar Ação / Incidente</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewOccurrence(prev => ({
                        ...prev,
                        type: 'DEMERIT',
                        category: demeritOptions[0].category
                      }));
                    }}
                    className={`py-2 rounded-xl text-[9px] font-black uppercase border transition-all flex items-center justify-center gap-1.5 ${
                      newOccurrence.type === 'DEMERIT'
                        ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
                        : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ThumbsDown size={12} /> Demérito (Falta)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewOccurrence(prev => ({
                        ...prev,
                        type: 'MERIT',
                        category: meritOptions[0].category
                      }));
                    }}
                    className={`py-2 rounded-xl text-[9px] font-black uppercase border transition-all flex items-center justify-center gap-1.5 ${
                      newOccurrence.type === 'MERIT'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm'
                        : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ThumbsUp size={12} /> Mérito (Elogio)
                  </button>
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Enquadramento / Categoria</label>
                  <select
                    value={newOccurrence.category}
                    onChange={e => setNewOccurrence(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                  >
                    {newOccurrence.type === 'MERIT' ? (
                      meritOptions.map(m => (
                        <option key={m.category} value={m.category}>
                          {m.category} (+{m.points.toFixed(2)})
                        </option>
                      ))
                    ) : (
                      demeritOptions.map(d => (
                        <option key={d.category} value={d.category}>
                          [{d.severity}] {d.category}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Data</label>
                  <input
                    type="date"
                    value={newOccurrence.date}
                    onChange={e => setNewOccurrence(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                    required
                  />
                </div>

                {newOccurrence.type === 'DEMERIT' && (
                  <>
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Medida Disciplinar Aplicada</label>
                      <select
                        value={newOccurrence.disciplinaryMeasure || 'Advertência Oral'}
                        onChange={e => setNewOccurrence(prev => ({ ...prev, disciplinaryMeasure: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                      >
                        {disciplinaryMeasuresList.map(measure => {
                          let pts = 0.1;
                          if (measure === 'Advertência Escrita') pts = 0.3;
                          else if (measure === 'Suspensão de Sala de Aula') pts = 0.5;
                          else if (measure === 'Ações Educativas') pts = 1.0;
                          else if (measure === 'Transferência Educativa') pts = 2.0;
                          else if (measure === 'Estudo Orientado de Caráter Educativo') pts = 0.5;
                          
                          return (
                            <option key={measure} value={measure}>
                              {measure} {measure === 'Suspensão de Sala de Aula' ? `(-${pts.toFixed(2)} por dia)` : `(-${pts.toFixed(2)})`}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {newOccurrence.disciplinaryMeasure === 'Suspensão de Sala de Aula' && (
                      <div>
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Quantidade de Dias (-0,50 / dia)</label>
                        <input
                          type="number"
                          min="1"
                          max="3"
                          value={newOccurrence.suspensionDays || 1}
                          onChange={e => setNewOccurrence(prev => ({ ...prev, suspensionDays: parseInt(e.target.value) || 1 }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900"
                          required
                        />
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                    {newOccurrence.category.startsWith('9') ? 'Descrição da Falta (Obrigatório)' : 'Detalhes / Observações'}
                  </label>
                  <textarea
                    value={newOccurrence.observations}
                    onChange={e => setNewOccurrence(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder={newOccurrence.category.startsWith('9') ? "Especifique a falta e descreva os detalhes do fato gerador..." : "Descreva detalhes específicos do fato gerador..."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 min-h-[60px]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-3.5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all ${
                    newOccurrence.type === 'MERIT'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/10'
                      : 'bg-red-600 hover:bg-red-500 shadow-red-600/10'
                  }`}
                >
                  Aplicar Lançamento
                </button>
              </form>
            </div>

            {/* Direita: Histórico de Ocorrências e Botão de Fechar */}
            <div className="flex flex-col h-full border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 justify-between">
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[420px] pr-2 custom-scrollbar">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Histórico de Atitude</h4>
                
                <div className="space-y-3">
                  {selectedStudentState.occurrences.map(occ => (
                    <div key={occ.id} className={`p-4 rounded-2xl border ${
                      occ.type === 'MERIT'
                        ? 'bg-emerald-50/50 border-emerald-100'
                        : 'bg-red-50/50 border-red-100'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase ${
                          occ.type === 'MERIT' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {occ.type === 'MERIT' ? `MÉRITO (+${occ.points})` : `DEMÉRITO (-${occ.points})`}
                        </span>
                        <span className="text-[8px] font-bold text-slate-500">{new Date(occ.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <h5 className="text-[10px] font-black text-slate-800 uppercase">{occ.category}</h5>
                      <p className="text-[9px] text-slate-600 mt-1 italic">"{occ.observations}"</p>
                      
                      {occ.disciplinaryMeasure && (
                        <div className="mt-2 bg-white/60 p-2 rounded border border-slate-100 flex items-center justify-between">
                          <span className="text-[8px] font-black uppercase text-slate-500">Medida Aplicada:</span>
                          <span className="text-[9px] font-bold text-indigo-700">
                             {occ.disciplinaryMeasure}
                             {occ.suspensionDays ? ` (${occ.suspensionDays} dia${occ.suspensionDays > 1 ? 's' : ''})` : ''}
                          </span>
                        </div>
                      )}

                      {occ.isEscalated && (
                        <div className="mt-1 bg-red-100 text-red-700 px-2 py-1 rounded text-[8px] font-black uppercase inline-flex items-center gap-1">
                           <AlertTriangle size={10} /> Agravada por Reincidência
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 text-[8px] font-bold text-slate-500 uppercase">
                        <span>Monitor: {occ.responsible.split(' ')[0]}</span>
                        <div className="flex items-center gap-3">
                          {occ.type === 'DEMERIT' && (
                             <button
                               type="button"
                               onClick={() => handleGenerateMeasureDoc(occ, selectedStudentState.studentId)}
                               className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                               title="Gerar Ficha de Medida Disciplinar"
                             >
                               <FileText size={10} /> Gerar Ficha
                             </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteOccurrence(selectedStudentState.studentId, occ.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedStudentState.occurrences.length === 0 && (
                    <p className="text-center text-slate-500 py-16 text-[9px] font-black uppercase">Excelente conduta. Nenhuma ocorrência registrada.</p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsBehaviorModalOpen(false);
                    setSelectedStudentState(null);
                  }}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Fechar Painel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CivicoMilitarModule;
