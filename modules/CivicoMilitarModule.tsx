import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ArrowLeft,
  Plus,
  Search,
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
  BookOpen
} from 'lucide-react';
import { INITIAL_STUDENTS } from '../constants/initialData';
import { User } from '../types';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rotina' | 'inspecao' | 'comportamento' | 'honra'>('dashboard');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  // Modals
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isBehaviorModalOpen, setIsBehaviorModalOpen] = useState(false);
  const [selectedStudentState, setSelectedStudentState] = useState<StudentBehaviorState | null>(null);

  // Form Fields
  const [newInspection, setNewInspection] = useState({
    studentId: '',
    item: 'Farda incompleta',
    date: new Date().toISOString().split('T')[0],
    observations: ''
  });

  const [newOccurrence, setNewOccurrence] = useState({
    type: 'DEMERIT' as 'MERIT' | 'DEMERIT',
    category: 'Conversa paralela em forma',
    date: new Date().toISOString().split('T')[0],
    observations: ''
  });

  // Main lists loaded from LocalStorage
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [routines, setRoutines] = useState<CivicRoutineRecord[]>([]);
  const [studentStates, setStudentStates] = useState<StudentBehaviorState[]>([]);

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
      const savedInspections = localStorage.getItem('civico_militar_inspections_v1');
      if (savedInspections) {
        setInspections(JSON.parse(savedInspections));
      } else {
        const mock: InspectionRecord[] = [
          {
            id: 'insp-1',
            studentId: '2667280',
            studentName: 'YURY LINS DOS SANTOS MOTA',
            className: '6º ANO A',
            item: 'Calçado fora da norma (cor/limpeza)',
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            shift: 'MATUTINO',
            observations: 'Tênis esportivo colorido, fora do padrão regulamentar preto.',
            responsible: 'Monitor Silva'
          },
          {
            id: 'insp-2',
            studentId: '2667264',
            studentName: 'MICAEL AZEVEDO PEREIRA',
            className: '6º ANO A',
            item: 'Cabelo fora do padrão (corte/penteado)',
            date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
            shift: 'MATUTINO',
            observations: 'Corte com listra/desenho nas laterais.',
            responsible: 'Monitor Silva'
          }
        ];
        localStorage.setItem('civico_militar_inspections_v1', JSON.stringify(mock));
        setInspections(mock);
      }
    } catch (e) {
      console.error(e);
    }

    // B. Civic Routines
    try {
      const savedRoutines = localStorage.getItem('civico_militar_routines_v1');
      if (savedRoutines) {
        setRoutines(JSON.parse(savedRoutines));
      } else {
        const mockRoutines: CivicRoutineRecord[] = [
          {
            id: 'rot-1',
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            shift: 'MATUTINO',
            formationOk: true,
            commandersPresent: true,
            flagsRaised: { national: true, state: true, municipal: true },
            anthemsSung: { national: true, state: true, school: false },
            marchingOk: true,
            bulletinRead: true,
            responsible: 'Dir. Adjunto Tenente Costa'
          },
          {
            id: 'rot-2',
            date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
            shift: 'VESPERTINO',
            formationOk: true,
            commandersPresent: true,
            flagsRaised: { national: true, state: true, municipal: true },
            anthemsSung: { national: true, state: false, school: true },
            marchingOk: true,
            bulletinRead: true,
            responsible: 'Dir. Adjunto Tenente Costa'
          }
        ];
        localStorage.setItem('civico_militar_routines_v1', JSON.stringify(mockRoutines));
        setRoutines(mockRoutines);
      }
    } catch (e) {
      console.error(e);
    }

    // C. Student Behavior Scores
    try {
      const savedScores = localStorage.getItem('civico_militar_student_scores_v1');
      if (savedScores) {
        setStudentStates(JSON.parse(savedScores));
      } else {
        // Initialize behavior states for all INITIAL_STUDENTS
        const initialStates: StudentBehaviorState[] = INITIAL_STUDENTS.map((s, idx) => ({
          studentId: s.CodigoAluno,
          studentName: s.Nome,
          className: s.Turma,
          score: idx % 15 === 0 ? 9.5 : (idx % 25 === 0 ? 8.8 : 10.0), // Give a few students some custom initial scores
          isClassLeader: idx === 5 || idx === 35 || idx === 85,
          isCivicHighlight: idx === 12 || idx === 92,
          occurrences: idx % 15 === 0 ? [
            {
              id: `occ-${idx}-1`,
              type: 'DEMERIT',
              category: 'Conversa paralela em forma',
              points: 0.5,
              date: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString().split('T')[0],
              observations: 'Conversa reiterada durante o hasteamento da bandeira.',
              responsible: 'Monitor Silva'
            }
          ] : (idx % 25 === 0 ? [
            {
              id: `occ-${idx}-1`,
              type: 'DEMERIT',
              category: 'Atraso para a formatura',
              points: 0.2,
              date: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString().split('T')[0],
              observations: 'Apresentou-se após o início da chamada geral.',
              responsible: 'Monitor Silva'
            },
            {
              id: `occ-${idx}-2`,
              type: 'DEMERIT',
              category: 'Uniforme desalinhado',
              points: 1.0,
              date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              observations: 'Farda sem passar, sapato desalinhado.',
              responsible: 'Monitor Silva'
            }
          ] : [])
        }));
        localStorage.setItem('civico_militar_student_scores_v1', JSON.stringify(initialStates));
        setStudentStates(initialStates);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync state to local storage when state changes
  const saveInspectionsToStorage = (list: InspectionRecord[]) => {
    localStorage.setItem('civico_militar_inspections_v1', JSON.stringify(list));
    setInspections(list);
  };

  const saveRoutinesToStorage = (list: CivicRoutineRecord[]) => {
    localStorage.setItem('civico_militar_routines_v1', JSON.stringify(list));
    setRoutines(list);
  };

  const saveStudentStatesToStorage = (list: StudentBehaviorState[]) => {
    localStorage.setItem('civico_militar_student_scores_v1', JSON.stringify(list));
    setStudentStates(list);
    // If a modal is open for a student, update its local copy as well
    if (selectedStudentState) {
      const updated = list.find(s => s.studentId === selectedStudentState.studentId);
      if (updated) setSelectedStudentState(updated);
    }
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
    const classesSet = new Set(INITIAL_STUDENTS.map(s => s.Turma));
    return Array.from(classesSet).sort();
  }, []);

  // Filtered Students for behavior management
  const filteredStudents = useMemo(() => {
    return studentStates.filter(s => {
      const matchesSearch = s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.studentId.includes(searchTerm);
      const matchesClass = selectedClass === 'ALL' || s.className === selectedClass;
      return matchesSearch && matchesClass;
    });
  }, [studentStates, searchTerm, selectedClass]);

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
    { category: 'Ação de solidariedade exemplar', points: 0.2 },
    { category: 'Zelo incomum pelo patrimônio escolar', points: 0.2 },
    { category: 'Destaque acadêmico/pedagógico', points: 0.2 },
    { category: 'Destaque na Ordem Unida / Formatura', points: 0.2 },
    { category: 'Auxílio voluntário à equipe de gestão', points: 0.2 },
    { category: 'Atitude cívica exemplar comprovada', points: 0.3 }
  ];

  const demeritOptions = [
    // Leve
    { category: 'Atraso para a formatura', severity: 'LEVE', points: 0.2 },
    { category: 'Conversa paralela em forma', severity: 'LEVE', points: 0.2 },
    { category: 'Uniforme desalinhado / amassado', severity: 'LEVE', points: 0.2 },
    { category: 'Deixar material jogado / desorganizado', severity: 'LEVE', points: 0.2 },
    { category: 'Adorno proibido em forma', severity: 'LEVE', points: 0.2 },
    // Média
    { category: 'Desrespeito leve aos colegas', severity: 'MÉDIA', points: 0.5 },
    { category: 'Mascar chiclete ou comer em forma', severity: 'MÉDIA', points: 0.5 },
    { category: 'Uso indevido de celular/aparelho eletrônico', severity: 'MÉDIA', points: 0.5 },
    { category: 'Faltar com a verdade com superior', severity: 'MÉDIA', points: 0.5 },
    // Grave
    { category: 'Desrespeito à autoridade escolar/docente', severity: 'GRAVE', points: 1.0 },
    { category: 'Linguagem obscena / insubordinação', severity: 'GRAVE', points: 1.0 },
    { category: 'Briga / empurrões / vias de fato', severity: 'GRAVE', points: 1.0 },
    { category: 'Danos ao patrimônio (depredação/pichação)', severity: 'GRAVE', points: 1.0 },
    // Gravíssima
    { category: 'Agressão física deliberada', severity: 'GRAVÍSSIMA', points: 2.0 },
    { category: 'Evasão do recinto escolar sem permissão', severity: 'GRAVÍSSIMA', points: 2.0 },
    { category: 'Prática de bullying grave', severity: 'GRAVÍSSIMA', points: 2.0 },
    { category: 'Ato contra a moral cívico-militar', severity: 'GRAVÍSSIMA', points: 2.0 }
  ];

  // Behavior Categories depending on score
  const getBehaviorStatus = (score: number) => {
    if (score >= 9.0) return { label: 'EXCELENTE', color: 'text-emerald-500 bg-emerald-50 border-emerald-100' };
    if (score >= 7.0) return { label: 'BOM', color: 'text-blue-500 bg-blue-50 border-blue-100' };
    if (score >= 5.0) return { label: 'REGULAR', color: 'text-amber-500 bg-amber-50 border-amber-100' };
    return { label: 'INSUFICIENTE', color: 'text-red-500 bg-red-50 border-red-100' };
  };

  // 3. Actions
  const handleAddInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInspection.studentId) return;

    const studentObj = INITIAL_STUDENTS.find(s => s.CodigoAluno === newInspection.studentId);
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

    // Find points of category
    let points = 0.2;
    if (newOccurrence.type === 'MERIT') {
      const merit = meritOptions.find(o => o.category === newOccurrence.category);
      points = merit ? merit.points : 0.2;
    } else {
      const dem = demeritOptions.find(o => o.category === newOccurrence.category);
      points = dem ? dem.points : 0.2;
    }

    const occurrence: BehaviorOccurrence = {
      id: `occ-${Date.now()}`,
      type: newOccurrence.type,
      category: newOccurrence.category,
      points,
      date: newOccurrence.date,
      observations: newOccurrence.observations,
      responsible: user.name || 'Gestor'
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
      category: 'Conversa paralela em forma',
      date: new Date().toISOString().split('T')[0],
      observations: ''
    });
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

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden font-sans">
      {/* Sidebar do Módulo */}
      <aside className="w-80 bg-slate-950 flex flex-col no-print border-r border-slate-800 shadow-2xl relative z-10">
        <div className="p-8 bg-slate-900/40 border-b border-slate-800/80">
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
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-900">
        {/* Header */}
        <header className="h-24 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {activeTab === 'dashboard' && <ClipboardList size={22} />}
              {activeTab === 'rotina' && <Flag size={22} />}
              {activeTab === 'inspecao' && <UserCheck size={22} />}
              {activeTab === 'comportamento' && <TrendingUp size={22} />}
              {activeTab === 'honra' && <Award size={22} />}
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                {activeTab === 'dashboard' && 'Painel Geral Disciplinar'}
                {activeTab === 'rotina' && 'Rotina Cívico-Militar Diária'}
                {activeTab === 'inspecao' && 'Inspeção de Uniformes e Padrões'}
                {activeTab === 'comportamento' && 'Gestão de Conduta e Atitude'}
                {activeTab === 'honra' && 'Quadro de Honra e Destaques'}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {activeTab === 'dashboard' && 'Indicadores e Resumos Escolares'}
                {activeTab === 'rotina' && 'Controle de Formatura, Hasteamento e Hinos'}
                {activeTab === 'inspecao' && 'Apresentação Pessoal e Fardamento'}
                {activeTab === 'comportamento' && 'Histórico de Méritos e Deméritos'}
                {activeTab === 'honra' && 'Líderes de Turma e Destaques de Atitude'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
              <Shield size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Rotina Ativa</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-600/10">CM</div>
          </div>
        </header>

        {/* Área com Scroll */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              {/* Grid de Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Conduta Média</span>
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl"><TrendingUp size={16} /></div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white">{stats.averageScore}</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Escala de 0.0 a 10.0</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Alunos Exemplares</span>
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl"><Award size={16} /></div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white">{stats.perfectScoreCount}</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Nota Atitude 10.0</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Desconformidades (7d)</span>
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl"><AlertTriangle size={16} /></div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white">{stats.recentInspectionsCount}</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Apresentação Pessoal</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Rotina Cívica</span>
                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl"><Flag size={16} /></div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white">{stats.complianceRate}%</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Taxa de Conformidade</p>
                  </div>
                </div>
              </div>

              {/* Centro de Operações Rápidas e Recentes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Inspeções Recentes */}
                <div className="lg:col-span-2 bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800 shadow-lg space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-3">
                      <UserCheck size={18} className="text-blue-500" /> Últimas Ocorrências de Fardamento
                    </h3>
                    <button onClick={() => setActiveTab('inspecao')} className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors">Ver todas</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase font-black tracking-widest text-[9px] pb-3">
                          <th className="pb-3">Aluno</th>
                          <th className="pb-3">Turma</th>
                          <th className="pb-3">Item Incorreto</th>
                          <th className="pb-3">Data</th>
                          <th className="pb-3">Responsável</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspections.slice(0, 5).map(insp => (
                          <tr key={insp.id} className="border-b border-slate-800/50 hover:bg-slate-900/40 transition-colors">
                            <td className="py-4 font-bold uppercase text-white truncate max-w-[200px]">{insp.studentName}</td>
                            <td className="py-4 text-slate-300 font-bold">{insp.className}</td>
                            <td className="py-4"><span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">{insp.item}</span></td>
                            <td className="py-4 text-slate-400 font-medium">{new Date(insp.date).toLocaleDateString('pt-BR')}</td>
                            <td className="py-4 text-slate-400 uppercase font-medium">{insp.responsible.split(' ')[0]}</td>
                          </tr>
                        ))}
                        {inspections.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold uppercase text-[10px]">Nenhuma desconformidade de fardamento registrada</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Status Recente da Rotina Cívica */}
                <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800 shadow-lg space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-3">
                      <Flag size={18} className="text-blue-500" /> Rotinas Recentes
                    </h3>
                    <button onClick={() => setActiveTab('rotina')} className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors">Registrar</button>
                  </div>

                  <div className="space-y-4">
                    {routines.slice(0, 4).map(rot => {
                      // calculate percent compliance
                      let steps = 0;
                      if (rot.formationOk) steps++;
                      if (rot.commandersPresent) steps++;
                      if (rot.flagsRaised.national && rot.flagsRaised.state && rot.flagsRaised.municipal) steps++;
                      if (rot.anthemsSung.national && rot.anthemsSung.state) steps++;
                      if (rot.marchingOk) steps++;
                      if (rot.bulletinRead) steps++;
                      const percent = Math.round((steps / 6) * 100);

                      return (
                        <div key={rot.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                          <div>
                            <div className="text-xs font-black text-white uppercase">{new Date(rot.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{rot.shift} • Resp: {rot.responsible.split(' ')[0]}</div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-[10px] font-black ${percent === 100 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                              {percent}% OK
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {routines.length === 0 && (
                      <p className="text-center py-8 text-slate-500 text-[10px] font-semibold uppercase">Nenhum registro de formatura cívica recente</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: ROTINA CÍVICA */}
          {activeTab === 'rotina' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Form de Lançamento */}
              <div className="lg:col-span-1 bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800 shadow-lg space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Plus size={18} className="text-blue-500" /> Registrar Formatura Geral
                  </h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Checklist de Cerimonial Cívico</p>
                </div>

                <form onSubmit={handleSaveRoutine} className="space-y-6">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Data de Referência</label>
                    <input
                      type="date"
                      value={routineForm.date}
                      onChange={e => setRoutineForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Turno</label>
                    <select
                      value={routineForm.shift}
                      onChange={e => setRoutineForm(prev => ({ ...prev, shift: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    >
                      <option value="MATUTINO">MATUTINO</option>
                      <option value="VESPERTINO">VESPERTINO</option>
                      <option value="NOTURNO">NOTURNO</option>
                    </select>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Rotina Executada</label>
                    
                    <label className="flex items-center gap-3 p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={routineForm.formationOk}
                        onChange={e => setRoutineForm(prev => ({ ...prev, formationOk: e.target.checked }))}
                        className="rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-200">Formação e Alinhamento das Turmas</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={routineForm.commandersPresent}
                        onChange={e => setRoutineForm(prev => ({ ...prev, commandersPresent: e.target.checked }))}
                        className="rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-200">Apresentação dos Chefes de Turma</span>
                    </label>

                    <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Bandeiras Hasteadas</span>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="flex flex-col items-center p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer text-center">
                          <input
                            type="checkbox"
                            checked={routineForm.flagNational}
                            onChange={e => setRoutineForm(prev => ({ ...prev, flagNational: e.target.checked }))}
                            className="rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950 mb-2 w-3.5 h-3.5"
                          />
                          <span className="text-[9px] font-bold text-slate-300 uppercase">Nacional</span>
                        </label>
                        <label className="flex flex-col items-center p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer text-center">
                          <input
                            type="checkbox"
                            checked={routineForm.flagState}
                            onChange={e => setRoutineForm(prev => ({ ...prev, flagState: e.target.checked }))}
                            className="rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950 mb-2 w-3.5 h-3.5"
                          />
                          <span className="text-[9px] font-bold text-slate-300 uppercase">Estadual</span>
                        </label>
                        <label className="flex flex-col items-center p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer text-center">
                          <input
                            type="checkbox"
                            checked={routineForm.flagMunicipal}
                            onChange={e => setRoutineForm(prev => ({ ...prev, flagMunicipal: e.target.checked }))}
                            className="rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950 mb-2 w-3.5 h-3.5"
                          />
                          <span className="text-[9px] font-bold text-slate-300 uppercase">Municipal</span>
                        </label>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Canto dos Hinos</span>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="flex flex-col items-center p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer text-center">
                          <input
                            type="checkbox"
                            checked={routineForm.anthemNational}
                            onChange={e => setRoutineForm(prev => ({ ...prev, anthemNational: e.target.checked }))}
                            className="rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950 mb-2 w-3.5 h-3.5"
                          />
                          <span className="text-[9px] font-bold text-slate-300 uppercase">Nacional</span>
                        </label>
                        <label className="flex flex-col items-center p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer text-center">
                          <input
                            type="checkbox"
                            checked={routineForm.anthemState}
                            onChange={e => setRoutineForm(prev => ({ ...prev, anthemState: e.target.checked }))}
                            className="rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950 mb-2 w-3.5 h-3.5"
                          />
                          <span className="text-[9px] font-bold text-slate-300 uppercase">Estadual</span>
                        </label>
                        <label className="flex flex-col items-center p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer text-center">
                          <input
                            type="checkbox"
                            checked={routineForm.anthemSchool}
                            onChange={e => setRoutineForm(prev => ({ ...prev, anthemSchool: e.target.checked }))}
                            className="rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950 mb-2 w-3.5 h-3.5"
                          />
                          <span className="text-[9px] font-bold text-slate-300 uppercase">Escola</span>
                        </label>
                      </div>
                    </div>

                    <label className="flex items-center gap-3 p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={routineForm.marchingOk}
                        onChange={e => setRoutineForm(prev => ({ ...prev, marchingOk: e.target.checked }))}
                        className="rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-200">Desfile das Turmas / Ordem Unida</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={routineForm.bulletinRead}
                        onChange={e => setRoutineForm(prev => ({ ...prev, bulletinRead: e.target.checked }))}
                        className="rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-200">Leitura do Boletim Interno / Avisos</span>
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
              <div className="lg:col-span-2 bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800 shadow-lg space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Flag size={18} className="text-blue-500" /> Histórico Geral de Formaturas Cívicas
                  </h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Registros de Conformidade e Hinos</p>
                </div>

                <div className="space-y-6">
                  {routines.map(rot => (
                    <div key={rot.id} className="p-6 bg-slate-900/40 border border-slate-800 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-black text-white uppercase">{new Date(rot.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
                          <span className="px-2 py-0.5 text-[8px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded uppercase">{rot.shift}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Responsável: {rot.responsible}</p>
                        
                        {/* Grid de Checks */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[9px] font-black uppercase text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span className={rot.formationOk ? 'text-emerald-500' : 'text-slate-600'}>●</span> Alinhamento
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={rot.commandersPresent ? 'text-emerald-500' : 'text-slate-600'}>●</span> Comandantes
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={rot.marchingOk ? 'text-emerald-500' : 'text-slate-600'}>●</span> Ordem Unida
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={rot.bulletinRead ? 'text-emerald-500' : 'text-slate-600'}>●</span> Boletim Interno
                          </div>
                        </div>

                        {/* Hasteamento e Hino Details */}
                        <div className="flex flex-wrap gap-4 pt-2 text-[9px] font-black uppercase text-slate-500">
                          <div>
                            Bandeiras: 
                            <span className={`ml-1 font-bold ${rot.flagsRaised.national ? 'text-white' : 'text-slate-600'}`}>BR</span>
                            <span className={`ml-1 font-bold ${rot.flagsRaised.state ? 'text-blue-400' : 'text-slate-600'}`}>MT</span>
                            <span className={`ml-1 font-bold ${rot.flagsRaised.municipal ? 'text-yellow-500' : 'text-slate-600'}`}>MUN</span>
                          </div>
                          <div>
                            Hinos: 
                            <span className={`ml-1 font-bold ${rot.anthemsSung.national ? 'text-white' : 'text-slate-600'}`}>NAC</span>
                            <span className={`ml-1 font-bold ${rot.anthemsSung.state ? 'text-blue-400' : 'text-slate-600'}`}>EST</span>
                            <span className={`ml-1 font-bold ${rot.anthemsSung.school ? 'text-yellow-500' : 'text-slate-600'}`}>ESC</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-800 justify-end">
                        <button
                          onClick={() => handleDeleteRoutine(rot.id)}
                          className="p-3 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 rounded-xl transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {routines.length === 0 && (
                    <div className="py-12 text-center text-slate-500 uppercase font-semibold text-xs border-2 border-dashed border-slate-800 rounded-[2.5rem]">
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
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar aluno..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-12 pr-6 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 w-full transition-all text-white placeholder-slate-500"
                  />
                </div>

                <div className="flex gap-4">
                  <select
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-xs font-black uppercase text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <div key={insp.id} className="bg-slate-950 p-6 rounded-[2.5rem] border border-slate-800 hover:border-blue-500/50 shadow-md hover:shadow-2xl transition-all group flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center font-black text-base shadow-inner">
                            {insp.studentName.charAt(0)}
                          </div>
                          <span className="px-2 py-0.5 text-[8px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded uppercase">
                            {insp.className}
                          </span>
                        </div>

                        <h3 className="font-black text-white uppercase text-xs mb-1 line-clamp-1 tracking-tight">{insp.studentName}</h3>
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-4">Ref: {insp.shift}</p>

                        <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl text-[10px] font-semibold text-slate-300 mb-4">
                          <span className="text-[8px] text-amber-400 font-black uppercase block mb-1">Item Identificado:</span>
                          {insp.item}
                        </div>

                        {insp.observations && (
                          <div className="p-3 bg-slate-900/50 rounded-xl text-[9px] text-slate-400 leading-relaxed mb-4 italic">
                            "{insp.observations}"
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-[9px] font-black uppercase text-slate-500">
                        <span>{new Date(insp.date).toLocaleDateString('pt-BR')}</span>
                        <button
                          onClick={() => handleDeleteInspection(insp.id)}
                          className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          title="Excluir Registro"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                {inspections.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-500 uppercase font-semibold text-xs border-2 border-dashed border-slate-800 rounded-[3rem]">
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
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar aluno por nome..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-12 pr-6 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 w-full transition-all text-white placeholder-slate-500"
                  />
                </div>

                <div className="flex gap-4">
                  <select
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-xs font-black uppercase text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Todas as Turmas</option>
                    {classesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabela de Alunos e Comportamentos */}
              <div className="bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 uppercase font-black tracking-widest text-[9px] pb-3">
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
                          <tr key={student.studentId} className="border-b border-slate-800/40 hover:bg-slate-900/30 transition-colors">
                            <td className="py-4 pl-2 font-mono text-slate-500 text-[10px]">{student.studentId}</td>
                            <td className="py-4 font-bold uppercase text-white truncate max-w-[280px]">{student.studentName}</td>
                            <td className="py-4 text-slate-300 font-bold">{student.className}</td>
                            <td className="py-4 text-center">
                              <button
                                onClick={() => handleToggleLeader(student.studentId)}
                                className={`p-1.5 rounded-lg border transition-all ${student.isClassLeader 
                                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' 
                                  : 'text-slate-600 border-slate-850 hover:border-slate-700'}`}
                                title={student.isClassLeader ? "Revogar Líder de Turma" : "Nomear Líder de Turma"}
                              >
                                <Star size={14} className={student.isClassLeader ? 'fill-blue-400' : ''} />
                              </button>
                            </td>
                            <td className="py-4 text-center">
                              <button
                                onClick={() => handleToggleHighlight(student.studentId)}
                                className={`p-1.5 rounded-lg border transition-all ${student.isCivicHighlight 
                                  ? 'bg-amber-600/20 text-amber-400 border-amber-500/30' 
                                  : 'text-slate-600 border-slate-850 hover:border-slate-700'}`}
                                title={student.isCivicHighlight ? "Remover Destaque Cívico" : "Nomear Destaque Cívico"}
                              >
                                <Sparkles size={14} className={student.isCivicHighlight ? 'fill-amber-400' : ''} />
                              </button>
                            </td>
                            <td className="py-4 text-center font-bold text-slate-400">
                              {student.occurrences.length}
                            </td>
                            <td className="py-4 text-center font-black text-white text-sm">
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
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                              >
                                Detalhes
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-500 uppercase font-semibold text-xs">
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
                  <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <Award size={22} className="text-amber-500" /> Galeria dos Alunos Destaques
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Liderança, Disciplina e Atitude Cívica Exemplar</p>
                </div>

                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-xs font-black uppercase text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div key={student.studentId} className="bg-slate-950 p-6 rounded-[2.5rem] border border-amber-500/20 hover:border-amber-500/50 shadow-md hover:shadow-2xl transition-all relative overflow-hidden flex flex-col justify-between text-center">
                    
                    {/* Efeitos de Fundo para Alamar de Honra */}
                    {student.score >= 10 && (
                      <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-500/20 to-transparent w-24 h-24 rounded-bl-[5rem] pointer-events-none flex items-start justify-end p-4">
                        <Award size={24} className="text-amber-500 animate-pulse" />
                      </div>
                    )}

                    <div className="flex flex-col items-center pt-4">
                      {/* Distintivo / Avatar */}
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl mb-4 border-2 shadow-xl ${
                        student.score >= 10 
                          ? 'bg-gradient-to-br from-amber-500/20 to-yellow-600/30 border-amber-400 text-amber-400' 
                          : 'bg-slate-900 border-slate-800 text-blue-400'
                      }`}>
                        {student.studentName.charAt(0)}
                      </div>

                      <h4 className="font-black text-white uppercase text-xs mb-1 line-clamp-1 max-w-[200px]">{student.studentName}</h4>
                      <span className="px-2.5 py-0.5 text-[8px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded uppercase mb-4">
                        {student.className}
                      </span>

                      {/* Nota de Atitude */}
                      <div className="p-4 bg-slate-900/80 border border-slate-850 rounded-2xl w-full mb-4">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block mb-0.5">Nota de Atitude</span>
                        <span className="text-2xl font-black text-white">{student.score.toFixed(1)}</span>
                      </div>

                      {/* Distintivos Virtuais */}
                      <div className="flex flex-wrap gap-2 justify-center">
                        {student.score >= 10 && (
                          <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Shield size={10} className="fill-amber-400/20" /> Alamar de Honra
                          </span>
                        )}
                        {student.isClassLeader && (
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Star size={10} className="fill-blue-400/20" /> Líder de Turma
                          </span>
                        )}
                        {student.isCivicHighlight && (
                          <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-xl text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={10} /> Destaque Cívico
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-900 flex justify-between items-center text-[8px] font-black uppercase text-slate-500">
                      <span>Comportamento</span>
                      <span className={student.score >= 9.0 ? 'text-emerald-400' : 'text-blue-400'}>
                        {getBehaviorStatus(student.score).label}
                      </span>
                    </div>

                  </div>
                ))}

                {honorRollStudents.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-500 uppercase font-semibold text-xs border-2 border-dashed border-slate-800 rounded-[3rem]">
                    Nenhum aluno no Quadro de Honra.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL 1: LANÇAR INSPEÇÃO */}
      {isInspectionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <UserCheck size={18} className="text-blue-500" /> Registrar Ocorrência de Fardamento
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Apresentação Pessoal do Aluno</p>
              </div>
              <button onClick={() => setIsInspectionModalOpen(false)} className="text-slate-500 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleAddInspection} className="space-y-5">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Aluno</label>
                <select
                  value={newInspection.studentId}
                  onChange={e => setNewInspection(prev => ({ ...prev, studentId: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-blue-500 text-white"
                  required
                >
                  <option value="">Selecionar Aluno...</option>
                  {INITIAL_STUDENTS.map(s => (
                    <option key={s.CodigoAluno} value={s.CodigoAluno}>
                      {s.Nome} ({s.Turma})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Item Identificado</label>
                <select
                  value={newInspection.item}
                  onChange={e => setNewInspection(prev => ({ ...prev, item: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-blue-500 text-white"
                >
                  <option value="Farda incompleta">Farda incompleta</option>
                  <option value="Farda suja / amarrotada">Farda suja / amarrotada</option>
                  <option value="Cabelo fora do padrão (corte/penteado)">Cabelo fora do padrão (corte/penteado)</option>
                  <option value="Calçado fora da norma (cor/limpeza)">Calçado fora da norma (cor/limpeza)</option>
                  <option value="Adornos proibidos (brincos, colares, anéis)">Adornos proibidos (brincos, colares, anéis)</option>
                  <option value="Unhas sem corte / esmalte inadequado">Unhas sem corte / esmalte inadequado</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Data da Ocorrência</label>
                <input
                  type="date"
                  value={newInspection.date}
                  onChange={e => setNewInspection(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-blue-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Observações Detalhadas</label>
                <textarea
                  value={newInspection.observations}
                  onChange={e => setNewInspection(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Descreva detalhes específicos da inconformidade..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-blue-500 text-white min-h-[80px]"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsInspectionModalOpen(false)}
                  className="flex-1 py-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest"
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
          <div className="bg-slate-950 border border-slate-800 rounded-[3rem] p-8 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Esquerda: Informações Gerais e Formulário de Lançamento */}
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[280px]">
                    {selectedStudentState.studentName}
                  </h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    Turma: {selectedStudentState.className} • Código: {selectedStudentState.studentId}
                  </p>
                </div>
              </div>

              {/* Placa de Nota de Atitude */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl flex justify-between items-center">
                <div>
                  <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block mb-0.5">Nota de Atitude</span>
                  <span className="text-3xl font-black text-white">{selectedStudentState.score.toFixed(1)}</span>
                </div>
                <span className={`px-3 py-1 rounded-xl text-[10px] font-black border uppercase ${getBehaviorStatus(selectedStudentState.score).color}`}>
                  {getBehaviorStatus(selectedStudentState.score).label}
                </span>
              </div>

              {/* Form Lançamento de Méritos / Deméritos */}
              <form onSubmit={handleAddOccurrence} className="space-y-4 pt-2 border-t border-slate-900">
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Lançar Ação / Incidente</h4>
                
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
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'text-slate-500 border-slate-850 hover:border-slate-800'
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
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'text-slate-500 border-slate-850 hover:border-slate-800'
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-blue-500 text-white"
                  >
                    {newOccurrence.type === 'MERIT' ? (
                      meritOptions.map(m => (
                        <option key={m.category} value={m.category}>
                          {m.category} (+{m.points.toFixed(1)})
                        </option>
                      ))
                    ) : (
                      demeritOptions.map(d => (
                        <option key={d.category} value={d.category}>
                          [{d.severity}] {d.category} (-{d.points.toFixed(1)})
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-blue-500 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Detalhes / Observações</label>
                  <textarea
                    value={newOccurrence.observations}
                    onChange={e => setNewOccurrence(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Descreva detalhes específicos do fato gerador..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-blue-500 text-white min-h-[60px]"
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
            <div className="flex flex-col h-full border-t md:border-t-0 md:border-l border-slate-900 pt-6 md:pt-0 md:pl-8 justify-between">
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[420px] pr-2 custom-scrollbar">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2">Histórico de Atitude</h4>
                
                <div className="space-y-3">
                  {selectedStudentState.occurrences.map(occ => (
                    <div key={occ.id} className={`p-4 rounded-2xl border ${
                      occ.type === 'MERIT'
                        ? 'bg-emerald-500/5 border-emerald-500/10'
                        : 'bg-red-500/5 border-red-500/10'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase ${
                          occ.type === 'MERIT' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {occ.type === 'MERIT' ? `MÉRITO (+${occ.points})` : `DEMÉRITO (-${occ.points})`}
                        </span>
                        <span className="text-[8px] font-bold text-slate-500">{new Date(occ.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <h5 className="text-[10px] font-black text-white uppercase">{occ.category}</h5>
                      <p className="text-[9px] text-slate-400 mt-1 italic">"{occ.observations}"</p>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-900 text-[8px] font-bold text-slate-500 uppercase">
                        <span>Monitor: {occ.responsible.split(' ')[0]}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteOccurrence(selectedStudentState.studentId, occ.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}

                  {selectedStudentState.occurrences.length === 0 && (
                    <p className="text-center text-slate-500 py-16 text-[9px] font-black uppercase">Excelente conduta. Nenhuma ocorrência registrada.</p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    setIsBehaviorModalOpen(false);
                    setSelectedStudentState(null);
                  }}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest"
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
