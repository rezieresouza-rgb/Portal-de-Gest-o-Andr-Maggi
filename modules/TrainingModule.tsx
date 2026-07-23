import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ArrowLeft,
  BookOpen,
  Award,
  Clock,
  Search,
  CheckCircle2,
  ChevronRight,
  Play,
  Download,
  AlertCircle,
  Menu,
  X,
  BookOpenCheck,
  Plus,
  Users,
  FileText,
  Edit
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { supabase } from '../supabaseClient';

interface TrainingModuleProps {
  user: any;
  onExit: () => void;
}

type TabType = 'dashboard' | 'my_courses' | 'catalog' | 'certificates' | 'admin_reports' | 'manage_courses';

interface Course {
  id: string;
  title: string;
  category: 'Pedagógico' | 'Tecnologia' | 'Gestão' | 'Inclusão' | 'Saúde';
  hours: number;
  description: string;
  progress: number; // 0 to 100
  lessons: string[];
  completed: boolean;
  enrollmentDate?: string;
  completionDate?: string;
  type?: 'curso' | 'reuniao' | 'protocolo';
  instructor?: string;
  instructorDegree?: string;
  instructorCouncil?: string;
  instructorCouncilNumber?: string;
  date?: string;
  location?: string;
  scheduleTime?: string;
}

const INITIAL_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Novas Diretrizes Curriculares e BNCC',
    category: 'Pedagógico',
    hours: 40,
    description: 'Estudo aprofundado sobre as competências e diretrizes da Base Nacional Comum Curricular (BNCC) no Ensino Fundamental.',
    progress: 80,
    lessons: ['Introdução à BNCC', 'As Dez Competências Gerais', 'Metodologias Ativas na BNCC', 'Avaliação Formativa e Competências', 'Avaliação Final'],
    completed: false,
    enrollmentDate: '2026-05-10',
    instructor: 'Prof. Dr. Ricardo Silva',
    instructorDegree: 'Doutor em Educação pela USP'
  },
  {
    id: 'c2',
    title: 'Inteligência Artificial na Educação Básica',
    category: 'Tecnologia',
    hours: 20,
    description: 'Como utilizar ferramentas de IA generativa para preparar aulas, criar materiais didáticos e otimizar o tempo de planejamento.',
    progress: 100,
    lessons: ['O que é IA Generativa?', 'Engenharia de Prompt para Professores', 'Criando Planos de Aula com IA', 'Ética e Plágio no uso de IAs', 'Quiz de Certificação'],
    completed: true,
    enrollmentDate: '2026-05-15',
    completionDate: '2026-06-20',
    instructor: 'Esp. Mariana Costa',
    instructorDegree: 'Especialista em Tecnologias Educacionais'
  },
  {
    id: 'c3',
    title: 'Inclusão Escolar na Prática: Adaptações Curriculares',
    category: 'Inclusão',
    hours: 30,
    description: 'Metodologias e práticas para a inclusão de alunos com deficiência, Transtorno do Espectro Autista (TEA) e altas habilidades.',
    progress: 30,
    lessons: ['Introdução à Educação Especial', 'O Plano de Desenvolvimento Individual (PDI)', 'Adaptação de Atividades Pedagógicas', 'Comunicação Alternativa na Sala de Aula', 'Estudos de Caso e Avaliação'],
    completed: false,
    enrollmentDate: '2026-06-01',
    instructor: 'Dra. Patrícia Santos',
    instructorDegree: 'Doutora em Psicopedagogia Clínica'
  }
];

const CATALOG_COURSES: Course[] = [
  {
    id: 'c4',
    title: 'Gestão Escolar Eficiente e Liderança',
    category: 'Gestão',
    hours: 30,
    description: 'Gestão administrativa, de pessoas e pedagógica para diretores, coordenadores e futuros gestores escolares.',
    progress: 0,
    lessons: ['Fundamentos de Gestão Escolar', 'Gestão Democrática e Colegiados', 'Liderança e Clima Organizacional', 'Planejamento Estratégico', 'Avaliação Final'],
    completed: false,
    instructor: 'Prof. Alexandre Rodrigues',
    instructorDegree: 'Mestre em Administração Escolar'
  },
  {
    id: 'c5',
    title: 'Primeiros Socorros na Escola (Lei Lucas)',
    category: 'Saúde',
    hours: 10,
    description: 'Capacitação teórica e prática sobre primeiros socorros em ambiente escolar, conforme exigências da Lei 13.722/18.',
    progress: 0,
    lessons: ['Conceitos Básicos de Socorro', 'Engasgos e Desobstrução de Vias Aéreas', 'Desmaios e Convulsões', 'Fraturas e Pequenos Traumas', 'Simulado e Certificado'],
    completed: false,
    instructor: 'Bombeiro Civil Marcos Souza',
    instructorDegree: 'Socorrista Técnico e Instrutor Credenciado'
  },
  {
    id: 'c6',
    title: 'Tecnologia e Ambientes Virtuais de Aprendizagem',
    category: 'Tecnologia',
    hours: 20,
    description: 'Domine plataformas de ensino virtual (Google Classroom, MS Teams) e ferramentas colaborativas para o engajamento dos estudantes.',
    progress: 0,
    lessons: ['Configurando a Sala Virtual', 'Criação de Atividades Interativas', 'Rubricas e Avaliação Digital', 'Comunicação com Pais e Alunos', 'Prova do Módulo'],
    completed: false,
    instructor: 'Téc. Luciana Dias',
    instructorDegree: 'Graduada em Análise de Sistemas e TI'
  }
];

const MOCK_STAFF_TRAINING = [
  { name: 'Maria da Silva', role: 'PROFESSOR', completedHours: 40, coursesCompleted: 2 },
  { name: 'João de Souza', role: 'PROFESSOR', completedHours: 20, coursesCompleted: 1 },
  { name: 'Ana Oliveira', role: 'SECRETARIA', completedHours: 50, coursesCompleted: 3 },
  { name: 'Carlos Santos', role: 'TAE', completedHours: 10, coursesCompleted: 1 },
  { name: 'Luzia de Souza', role: 'PROFESSOR', completedHours: 30, coursesCompleted: 2 },
];

const TrainingModule: React.FC<TrainingModuleProps> = ({ user, onExit }) => {
  const { addToast } = useToast();
  const showToast = (_title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    addToast(message, type);
  };
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [catalogCourses, setCatalogCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState<Course | null>(null);
  const [showRecordModal, setShowRecordModal] = useState<Course | null>(null);
  const [showAdminCertificateModal, setShowAdminCertificateModal] = useState<Course | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffForCert, setSelectedStaffForCert] = useState<any>(null);
  const [selectedStaffIdsForRecord, setSelectedStaffIdsForRecord] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    if (showRecordModal) {
      setSelectedStaffIdsForRecord(new Set(staffList.map(s => s.id)));
    }
  }, [showRecordModal, staffList]);
  const [filterCategory, setFilterCategory] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Course creation form states
  const [newCourseType, setNewCourseType] = useState<'curso' | 'reuniao' | 'protocolo'>('curso');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState<'Pedagógico' | 'Tecnologia' | 'Gestão' | 'Inclusão' | 'Saúde'>('Pedagógico');
  const [newCourseHours, setNewCourseHours] = useState(20);
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [recordStaffSearchTerm, setRecordStaffSearchTerm] = useState('');
  const [newCourseInstructor, setNewCourseInstructor] = useState('');
  const [newCourseInstructorDegree, setNewCourseInstructorDegree] = useState('');
  const [newCourseInstructorCouncil, setNewCourseInstructorCouncil] = useState('');
  const [newCourseInstructorCouncilNumber, setNewCourseInstructorCouncilNumber] = useState('');
  const [newCourseDate, setNewCourseDate] = useState('');
  const [newCourseLocation, setNewCourseLocation] = useState('');
  const [newCourseScheduleTime, setNewCourseScheduleTime] = useState('');
  const [newCourseLessons, setNewCourseLessons] = useState<string[]>(['']);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const handleEditCourseClick = (course: Course) => {
    setEditingCourseId(course.id);
    setNewCourseType(course.type || 'curso');
    setNewCourseTitle(course.title);
    setNewCourseCategory(course.category as any);
    setNewCourseHours(course.hours);
    setNewCourseDescription(course.description);
    setNewCourseInstructor(course.instructor || '');
    setNewCourseInstructorDegree(course.instructorDegree || '');
    setNewCourseInstructorCouncil(course.instructorCouncil || '');
    setNewCourseInstructorCouncilNumber(course.instructorCouncilNumber || '');
    setNewCourseDate(course.date || '');
    setNewCourseLocation(course.location || '');
    setNewCourseScheduleTime(course.scheduleTime || '');
    setNewCourseLessons(course.lessons.length > 0 && course.lessons[0] !== 'Palestra / Treinamento Único' ? course.lessons : ['']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddLessonInput = () => {
    setNewCourseLessons([...newCourseLessons, '']);
  };

  const handleLessonInputChange = (index: number, value: string) => {
    const updated = [...newCourseLessons];
    updated[index] = value;
    setNewCourseLessons(updated);
  };

  const handleRemoveLessonInput = (index: number) => {
    if (newCourseLessons.length > 1) {
      const updated = newCourseLessons.filter((_, i) => i !== index);
      setNewCourseLessons(updated);
    }
  };

  // Create course
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (newCourseType === 'curso' && (!newCourseTitle.trim() || !newCourseDescription.trim())) {
        showToast('Aviso', 'Preencha o título e a descrição do curso!', 'warning');
        return;
      }
      if (newCourseType !== 'curso' && !newCourseTitle.trim()) {
        showToast('Aviso', 'Preencha o nome do registro!', 'warning');
        return;
      }
      
      let filteredLessons = newCourseLessons.filter(l => l.trim() !== '');
      if (filteredLessons.length === 0) {
        filteredLessons = ['Palestra / Treinamento Único'];
      }

      const newCourse: Course = {
        id: editingCourseId || `c${Date.now()}`,
        type: newCourseType,
        title: newCourseTitle.trim(),
        category: newCourseCategory,
        hours: Number(newCourseHours) || 10,
        description: newCourseDescription.trim(),
        progress: 0,
        lessons: filteredLessons,
        completed: false,
        instructor: newCourseInstructor.trim() || 'EE André Maggi',
        instructorDegree: newCourseInstructorDegree.trim() || 'Instrutor',
        instructorCouncil: newCourseInstructorCouncil.trim() || undefined,
        instructorCouncilNumber: newCourseInstructorCouncilNumber.trim() || undefined,
        date: newCourseDate || undefined,
        location: newCourseLocation.trim() || undefined,
        scheduleTime: newCourseScheduleTime.trim() || undefined
      };

      let updatedCatalog;
      if (editingCourseId) {
        updatedCatalog = catalogCourses.map(c => c.id === editingCourseId ? newCourse : c);
        showToast('Sucesso', 'Curso atualizado com sucesso!', 'success');
        setEditingCourseId(null);
      } else {
        updatedCatalog = [...catalogCourses, newCourse];
        showToast('Sucesso', 'Novo registro criado e publicado no catálogo!', 'success');
      }

      localStorage.setItem('portal_training_catalog_v1', JSON.stringify(updatedCatalog));
      setCatalogCourses(updatedCatalog);

      // Reset form
      setNewCourseType('curso');
      setNewCourseTitle('');
      setNewCourseCategory('Pedagógico');
      setNewCourseHours(20);
      setNewCourseDescription('');
      setNewCourseInstructor('');
      setNewCourseInstructorDegree('');
      setNewCourseInstructorCouncil('');
      setNewCourseInstructorCouncilNumber('');
      setNewCourseDate('');
      setNewCourseLocation('');
      setNewCourseScheduleTime('');
      setNewCourseLessons(['']);
      
    } catch (error: any) {
      console.error("Erro ao salvar curso:", error);
      alert("Ocorreu um erro ao tentar salvar: " + error.message);
      showToast('Erro', 'Ocorreu um erro ao salvar o registro.', 'error');
    }
  };

  // Delete course
  const handleDeleteCourse = (courseId: string) => {
    const updatedCatalog = catalogCourses.filter(c => c.id !== courseId);
    localStorage.setItem('portal_training_catalog_v1', JSON.stringify(updatedCatalog));
    setCatalogCourses(updatedCatalog);
    showToast('Removido', 'Curso removido do catálogo com sucesso.', 'success');
  };

  // Load courses and catalog
  useEffect(() => {
    const saved = localStorage.getItem(`portal_training_courses_${user.id}`);
    if (saved) {
      try {
        setMyCourses(JSON.parse(saved));
      } catch (e) {
        setMyCourses(INITIAL_COURSES);
      }
    } else {
      localStorage.setItem(`portal_training_courses_${user.id}`, JSON.stringify(INITIAL_COURSES));
      setMyCourses(INITIAL_COURSES);
    }

    const savedCatalog = localStorage.getItem('portal_training_catalog_v1');
    if (savedCatalog) {
      try {
        setCatalogCourses(JSON.parse(savedCatalog));
      } catch (e) {
        setCatalogCourses(CATALOG_COURSES);
      }
    } else {
      localStorage.setItem('portal_training_catalog_v1', JSON.stringify(CATALOG_COURSES));
      setCatalogCourses(CATALOG_COURSES);
    }
  }, [user.id]);

  const saveCourses = (updatedCourses: Course[]) => {
    localStorage.setItem(`portal_training_courses_${user.id}`, JSON.stringify(updatedCourses));
    setMyCourses(updatedCourses);
  };

  useEffect(() => {
    if (user.role === 'GESTAO' || user.role === 'ADMINISTRADOR') {
      const fetchStaff = async () => {
        try {
          const { data } = await supabase.from('staff').select('id, name, cpf, registration').in('status', ['ATIVO', 'EM_ATIVIDADE']).order('name');
          if (data) setStaffList(data);
        } catch (e) {
          console.error(e);
        }
      };
      fetchStaff();
    }
  }, [user.role]);

  // Enroll in a new course
  const handleEnroll = (course: Course) => {
    const isEnrolled = myCourses.some(c => c.id === course.id);
    if (isEnrolled) {
      showToast('Aviso', 'Você já está matriculado neste curso!', 'warning');
      return;
    }

    const newCourse: Course = {
      ...course,
      progress: 0,
      completed: false,
      enrollmentDate: new Date().toISOString().split('T')[0]
    };

    const updated = [...myCourses, newCourse];
    saveCourses(updated);
    showToast('Matrícula Realizada!', `Você se matriculou em: ${course.title}`, 'success');
    setActiveTab('my_courses');
  };

  // Access a course to study
  const handleAccessCourse = (course: Course) => {
    setActiveCourse(course);
    // Find first incomplete lesson index
    const totalLessons = course.lessons.length;
    const currentProgress = course.progress;
    const incompleteLesson = Math.min(
      Math.floor((currentProgress / 100) * totalLessons),
      totalLessons - 1
    );
    setActiveLessonIndex(incompleteLesson);
    setSelectedAnswer(null);
  };

  // Answer quiz and proceed
  const handleNextLesson = () => {
    if (!activeCourse) return;

    // Check if it's the last lesson (the exam) and we haven't selected an answer
    const isLastLesson = activeLessonIndex === activeCourse.lessons.length - 1;
    if (isLastLesson && selectedAnswer === null) {
      showToast('Atenção', 'Selecione uma resposta para concluir o curso!', 'error');
      return;
    }

    const totalLessons = activeCourse.lessons.length;
    const nextIndex = activeLessonIndex + 1;

    if (nextIndex < totalLessons) {
      // Advance to next lesson
      const newProgress = Math.min(100, Math.round((nextIndex / totalLessons) * 100));
      const updatedCourses = myCourses.map(c => {
        if (c.id === activeCourse.id) {
          return { ...c, progress: newProgress };
        }
        return c;
      });
      saveCourses(updatedCourses);
      setActiveCourse({ ...activeCourse, progress: newProgress });
      setActiveLessonIndex(nextIndex);
      setSelectedAnswer(null);
      showToast('Progresso Atualizado!', 'Parabéns por concluir esta aula. Avançando...', 'success');
    } else {
      // Complete the course!
      const updatedCourses = myCourses.map(c => {
        if (c.id === activeCourse.id) {
          return {
            ...c,
            progress: 100,
            completed: true,
            completionDate: new Date().toISOString().split('T')[0]
          };
        }
        return c;
      });
      saveCourses(updatedCourses);
      showToast('Parabéns!', `Você concluiu o curso ${activeCourse.title} com sucesso!`, 'success');
      setShowCertificateModal({
        ...activeCourse,
        completed: true,
        completionDate: new Date().toISOString().split('T')[0]
      });
      setActiveCourse(null);
      setActiveTab('certificates');
    }
  };

  // Calculate statistics
  const completedCourses = myCourses.filter(c => c.completed);
  const totalCompletedHours = completedCourses.reduce((sum, c) => sum + c.hours, 0);
  const pendingCourses = myCourses.filter(c => !c.completed);
  const totalHoursGoal = 60; // 60h annual goal
  const progressPercent = Math.min(100, Math.round((totalCompletedHours / totalHoursGoal) * 100));

  // Filter Catalog Courses
  const filteredCatalog = catalogCourses.filter(c => {
    const matchesCategory = filterCategory === 'Todos' || c.category === filterCategory;
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const isEnrolled = myCourses.some(my => my.id === c.id);
    return matchesCategory && matchesSearch && !isEnrolled;
  });

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: GraduationCap },
    { id: 'my_courses', label: 'Minhas Formações', icon: BookOpenCheck },
    { id: 'catalog', label: 'Catálogo de Cursos', icon: BookOpen },
    { id: 'certificates', label: 'Certificados', icon: Award },
  ];

  const isAdmin = user.role === 'GESTAO' || user.role === 'ADMINISTRADOR';
  if (isAdmin) {
    menuItems.push({ id: 'admin_reports', label: 'Relatórios de Equipe', icon: Users });
    menuItems.push({ id: 'manage_courses', label: 'Gerenciar Cursos', icon: Plus });
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative w-full print:h-auto print:overflow-visible">
      {/* Sidebar - Violet Theme */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-violet-950 text-white flex flex-col print:hidden transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-violet-600 p-1.5 rounded-lg shadow-lg">🎓</span>
            Formação Docente
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as TabType);
                setActiveCourse(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === item.id && !activeCourse
                ? 'bg-violet-800 text-white shadow-lg'
                : 'text-violet-100/50 hover:bg-violet-900/30'
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                {item.label}
              </div>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-violet-900 space-y-3">
          <button
            onClick={onExit}
            className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            <ArrowLeft size={16} /> Voltar ao Hub
          </button>

          <div className="bg-violet-900/50 p-4 rounded-2xl border border-violet-800/50">
            <p className="text-[10px] text-violet-300 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Award size={10} /> Meta de Cursos
            </p>
            <div className="text-xs font-black uppercase tracking-tight text-violet-400">Escola André Maggi</div>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col overflow-hidden ${showRecordModal ? 'print:hidden' : ''}`}>
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-10 shrink-0">
          <div className="flex items-center gap-3 lg:gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 bg-violet-50 text-violet-600 rounded-xl"
            >
              <Menu size={20} />
            </button>
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg hidden sm:block">
              <GraduationCap size={20} />
            </div>
            <div>
              <h2 className="text-xs lg:text-sm font-black text-gray-900 uppercase tracking-tight leading-none text-left">
                {activeCourse ? `Estudando: ${activeCourse.title}` : menuItems.find(i => i.id === activeTab)?.label}
              </h2>
              <span className="text-[8px] font-black text-violet-600 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1">
                Capacitação Profissional Continuada
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-black text-gray-900">{user?.name || 'Professor'}</p>
                <p className="text-[9px] text-violet-600 font-black uppercase tracking-widest">{user?.jobFunction || user?.role || 'Docente'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-white font-black text-sm">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'FD'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          
          {/* Active Course View (Interactive Lesson) */}
          {activeCourse ? (
            <div className="max-w-5xl mx-auto space-y-6">
              <button
                onClick={() => setActiveCourse(null)}
                className="flex items-center gap-2 text-xs font-black text-violet-600 hover:text-violet-800 uppercase tracking-widest transition-colors mb-4"
              >
                <ArrowLeft size={14} /> Voltar para Minhas Formações
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Lessons List */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 h-fit">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Grade Curricular</h3>
                  <div className="space-y-2">
                    {activeCourse.lessons.map((lesson, idx) => {
                      const isCompleted = idx < Math.floor((activeCourse.progress / 100) * activeCourse.lessons.length);
                      const isActive = idx === activeLessonIndex;
                      
                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                            isActive 
                              ? 'bg-violet-50 border-violet-200 text-violet-800 shadow-sm'
                              : isCompleted
                                ? 'bg-slate-50/50 border-transparent text-slate-500'
                                : 'border-transparent text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isActive ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold truncate w-40">{lesson}</span>
                          </div>
                          {isCompleted && <CheckCircle2 size={16} className="text-emerald-500" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Lesson content view */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded text-[9px] font-black uppercase">
                        Módulo {activeLessonIndex + 1} de {activeCourse.lessons.length}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">Progresso: {activeCourse.progress}%</span>
                    </div>

                    <h2 className="text-xl font-black text-slate-800 uppercase text-left">{activeCourse.lessons[activeLessonIndex]}</h2>

                    {activeLessonIndex === activeCourse.lessons.length - 1 ? (
                      // Quiz/Final Exam
                      <div className="space-y-6">
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-800">
                          <AlertCircle className="shrink-0" size={18} />
                          <div className="text-xs font-semibold leading-relaxed text-left">
                            Esta é a avaliação final do módulo. Responda à questão abaixo corretamente para liberar seu certificado.
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-sm font-bold text-slate-700 text-left">
                            Qual das seguintes abordagens é considerada melhor prática para o planejamento de aulas considerando as diretrizes atuais?
                          </p>

                          <div className="space-y-2">
                            {[
                              'Centralizar o processo de ensino inteiramente no professor, com foco exclusivo na memorização.',
                              'Integrar metodologias ativas que incentivem o protagonismo estudantil e a construção colaborativa de projetos.',
                              'Ignorar o uso de tecnologias e focá-las exclusivamente em momentos extracurriculares.',
                              'Adotar provas dissertativas puramente teóricas como único instrumento de avaliação formativa.'
                            ].map((answer, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedAnswer(index)}
                                className={`w-full p-4 rounded-xl border text-left text-xs font-semibold transition-all ${
                                  selectedAnswer === index
                                    ? 'bg-violet-50 border-violet-500 text-violet-700 shadow-sm'
                                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                }`}
                              >
                                {answer}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleNextLesson}
                          className="w-full py-4 bg-violet-600 text-white rounded-2xl hover:bg-violet-700 font-black uppercase tracking-wider text-xs shadow-lg shadow-violet-600/10 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                          Concluir e Emitir Certificado <Award size={16} />
                        </button>
                      </div>
                    ) : (
                      // Normal Lesson Content
                      <div className="space-y-6">
                        <div className="w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden flex items-center justify-center text-white relative group">
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-8">
                            <span className="text-[10px] text-violet-400 font-black uppercase tracking-widest text-left">Videoaula explicativa</span>
                            <h3 className="text-lg font-bold mt-1 text-left">Conceitos fundamentais da formação</h3>
                          </div>
                          <button className="w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-xl transition-all scale-100 hover:scale-105">
                            <Play fill="white" size={24} className="ml-1" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-600 font-medium leading-relaxed text-left">
                          Nesta aula, abordaremos as melhores práticas para a aplicação prática dos conceitos do módulo no ambiente escolar. É fundamental focar no desenvolvimento das competências socioemocionais dos alunos, criando um ambiente dinâmico, colaborativo e alinhado com as competências gerais estabelecidas pela escola.
                        </p>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={handleNextLesson}
                            className="px-6 py-3 bg-violet-600 text-white rounded-2xl hover:bg-violet-700 font-black uppercase tracking-wider text-xs shadow-lg shadow-violet-600/10 transition-all flex items-center justify-center gap-2"
                          >
                            Concluir Aula e Avançar <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Tab contents
            <div className="max-w-7xl mx-auto">
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  {/* Overview Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stat Card 1: Completed Hours */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horas Concluídas</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-2">{totalCompletedHours}h</h3>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Meta anual: {totalHoursGoal}h</p>
                      </div>
                      <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl">
                        <Clock size={28} />
                      </div>
                    </div>

                    {/* Stat Card 2: Completed Courses */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cursos Finalizados</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-2">{completedCourses.length}</h3>
                        <p className="text-[10px] text-violet-500 font-bold uppercase mt-1">De {myCourses.length} matriculados</p>
                      </div>
                      <div className="p-4 bg-violet-50 text-violet-600 rounded-3xl">
                        <Award size={28} />
                      </div>
                    </div>

                    {/* Stat Card 3: Annual Goal Ring */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                      <div className="relative w-20 h-20 shrink-0">
                        {/* Circle Ring Progress */}
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r="32" stroke="#e2e8f0" strokeWidth="8" fill="transparent" />
                          <circle cx="40" cy="40" r="32" stroke="#7c3aed" strokeWidth="8" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 32}
                            strokeDashoffset={2 * Math.PI * 32 * (1 - progressPercent / 100)}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-black text-xs text-violet-700">{progressPercent}%</span>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso da Meta</p>
                        <h3 className="text-base font-black text-slate-800 mt-1">Capacitação Anual</h3>
                        <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">Faltam {Math.max(0, totalHoursGoal - totalCompletedHours)} horas</p>
                      </div>
                    </div>
                  </div>

                  {/* Continuing studies row */}
                  {pendingCourses.length > 0 && (
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-600/10">
                      <div className="space-y-2 text-center md:text-left">
                        <span className="px-3 py-1 bg-white/20 rounded text-[9px] font-black uppercase">Acesso Rápido</span>
                        <h3 className="text-xl font-bold uppercase tracking-tight">Continue seus estudos</h3>
                        <p className="text-xs text-violet-100 max-w-md">Retome as aulas de <strong>{pendingCourses[0].title}</strong> exatamente onde parou ({pendingCourses[0].progress}% concluído).</p>
                      </div>
                      <button
                        onClick={() => handleAccessCourse(pendingCourses[0])}
                        className="px-6 py-4 bg-white text-violet-600 hover:bg-violet-50 font-black uppercase tracking-wider text-xs rounded-2xl transition-all flex items-center gap-2"
                      >
                        Continuar Agora <Play size={14} fill="currentColor" />
                      </button>
                    </div>
                  )}

                  {/* My ongoing courses */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      <BookOpenCheck size={20} className="text-violet-600" /> Minhas Formações Ativas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {myCourses.map((c) => (
                        <div key={c.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between gap-4">
                          <div className="space-y-2 text-left">
                            <div className="flex justify-between items-start">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[8px] font-black uppercase">{c.category}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{c.hours} horas</span>
                            </div>
                            <h4 className="text-sm font-black text-slate-800 uppercase">{c.title}</h4>
                            {c.instructor && (
                              <p className="text-[10px] text-violet-600 font-bold uppercase mt-1 text-left">
                                Palestrante: {c.instructor} {c.instructorDegree ? `(${c.instructorDegree})` : ''}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 leading-normal line-clamp-2 mt-1">{c.description}</p>
                          </div>

                          <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                              <span>Progresso</span>
                              <span>{c.progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-600" style={{ width: `${c.progress}%` }}></div>
                            </div>
                            
                            <div className="flex gap-2 mt-2">
                              {c.completed ? (
                                <button
                                  onClick={() => setShowCertificateModal(c)}
                                  className="flex-1 py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/50 rounded-xl font-bold uppercase text-[10px] transition-all flex items-center justify-center gap-1.5 border border-emerald-100"
                                >
                                  <Award size={14} /> Certificado
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAccessCourse(c)}
                                  className="flex-1 py-3 bg-violet-600 text-white hover:bg-violet-700 rounded-xl font-bold uppercase text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/5"
                                >
                                  <Play size={12} fill="currentColor" /> Acessar Aulas
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'my_courses' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Meus Cursos Cadastrados</h3>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="px-4 py-2.5 bg-violet-50 text-violet-700 rounded-xl hover:bg-violet-100 border border-violet-100 text-xs font-bold uppercase flex items-center gap-1"
                    >
                      <Plus size={14} /> Novo Curso
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myCourses.map((c) => (
                      <div key={c.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="space-y-3 text-left">
                          <div className="flex justify-between items-center">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase">{c.category}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{c.hours}h</span>
                          </div>
                          <h4 className="text-sm font-black text-slate-800 uppercase leading-snug">{c.title}</h4>
                          {c.instructor && (
                            <p className="text-[10px] text-violet-600 font-bold uppercase mt-1 text-left">
                              Palestrante: {c.instructor} {c.instructorDegree ? `(${c.instructorDegree})` : ''}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 line-clamp-3 leading-normal mt-1">{c.description}</p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                            <span>Progresso</span>
                            <span>{c.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-600" style={{ width: `${c.progress}%` }}></div>
                          </div>

                          <div className="flex gap-2">
                            {c.completed ? (
                              <button
                                onClick={() => setShowCertificateModal(c)}
                                className="flex-1 py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/50 border border-emerald-100 rounded-xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-1"
                              >
                                <Award size={14} /> Certificado
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAccessCourse(c)}
                                className="flex-1 py-3 bg-violet-600 text-white hover:bg-violet-700 rounded-xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-1 shadow-md shadow-violet-600/5"
                              >
                                <Play size={12} fill="currentColor" /> Estudar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'catalog' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="text-left">
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Catálogo de Capacitação</h3>
                      <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Cursos de formação disponíveis para inscrição</p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          placeholder="Buscar cursos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-500 w-full md:w-60"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filter chips */}
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {['Todos', 'Pedagógico', 'Tecnologia', 'Gestão', 'Inclusão', 'Saúde'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shrink-0 ${
                          filterCategory === cat
                            ? 'bg-violet-600 border-violet-600 text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Catalog list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCatalog.map((c) => (
                      <div key={c.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-200/80 transition-all duration-300">
                        <div className="space-y-3 text-left">
                          <div className="flex justify-between items-center">
                            <span className="px-2.5 py-1 bg-violet-50 text-violet-600 border border-violet-100/50 rounded text-[8px] font-black uppercase">{c.category}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{c.hours}h</span>
                          </div>
                          <h4 className="text-sm font-black text-slate-800 uppercase leading-snug">{c.title}</h4>
                          {c.instructor && (
                            <p className="text-[10px] text-violet-600 font-bold uppercase mt-1 text-left">
                              Palestrante: {c.instructor} {c.instructorDegree ? `(${c.instructorDegree})` : ''}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 leading-normal line-clamp-3 mt-1">{c.description}</p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{c.lessons.length} Aulas</span>
                          <button
                            onClick={() => handleEnroll(c)}
                            className="px-4 py-2.5 bg-violet-600 text-white hover:bg-violet-700 rounded-xl font-bold uppercase text-[9px] tracking-wider transition-all shadow-md shadow-violet-600/5 flex items-center gap-1.5"
                          >
                            <Plus size={14} /> Matricular-se
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredCatalog.length === 0 && (
                      <div className="col-span-full py-16 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                        <AlertCircle size={36} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 font-black uppercase text-xs">Nenhum curso disponível neste filtro</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'certificates' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="text-left">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Meus Certificados</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Certificados digitais emitidos após conclusão das formações</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedCourses.map((c) => (
                      <div key={c.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
                        
                        <div className="space-y-4 text-left">
                          <div className="flex justify-between items-center">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase border border-emerald-100/50">CONCLUÍDO</span>
                            <span className="text-[10px] text-slate-400 font-bold">{c.hours}h</span>
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-slate-800 uppercase">{c.title}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Concluído em: {c.completionDate ? new Date(c.completionDate).toLocaleDateString('pt-BR') : ''}</p>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => setShowCertificateModal(c)}
                            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold uppercase text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/5"
                          >
                            <Award size={14} /> Visualizar Certificado
                          </button>
                        </div>
                      </div>
                    ))}

                    {completedCourses.length === 0 && (
                      <div className="col-span-full py-16 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                        <Award size={36} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 font-black uppercase text-xs">Conclua cursos para desbloquear seus certificados</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'admin_reports' && isAdmin && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="text-left">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Monitoramento da Equipe</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Acompanhamento de horas de formação concluídas pelos servidores</p>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Relatório Consolidado</h4>
                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">Atualizado</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <th className="py-4 px-6">Nome do Servidor</th>
                            <th className="py-4 px-6">Cargo/Função</th>
                            <th className="py-4 px-6 text-center">Cursos Concluídos</th>
                            <th className="py-4 px-6 text-center">Horas Concluídas</th>
                            <th className="py-4 px-6 text-center">Status Meta (60h)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MOCK_STAFF_TRAINING.map((staff, idx) => {
                            const isMetaMet = staff.completedHours >= 60;
                            const percent = Math.min(100, Math.round((staff.completedHours / 60) * 100));

                            return (
                              <tr key={idx} className="border-b border-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-6 font-bold uppercase">{staff.name}</td>
                                <td className="py-4 px-6 text-slate-400 uppercase text-[10px] font-bold">{staff.role}</td>
                                <td className="py-4 px-6 text-center font-bold">{staff.coursesCompleted}</td>
                                <td className="py-4 px-6 text-center font-black text-slate-800">{staff.completedHours}h</td>
                                <td className="py-4 px-6 text-center">
                                  <div className="flex items-center gap-3 justify-center">
                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                      <div className={`h-full ${isMetaMet ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                      isMetaMet ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {percent}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'manage_courses' && isAdmin && (
                <div className="space-y-8 animate-in fade-in duration-500 text-left">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Gerenciamento de Cursos</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Crie novos cursos e gerencie o catálogo da escola</p>
                  </div>

                  <div className={`bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 transition-all ${editingCourseId ? 'ring-2 ring-violet-500' : ''}`}>
                    <h4 className="text-sm font-black text-slate-800 uppercase border-b border-slate-100 pb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {editingCourseId ? <Edit size={18} className="text-violet-600" /> : <Plus size={18} className="text-violet-600" />} 
                        {editingCourseId ? 'Editar Curso' : 'Criar Novo Curso'}
                      </div>
                      {editingCourseId && (
                        <button type="button" onClick={() => {
                          setEditingCourseId(null);
                          setNewCourseTitle('');
                          setNewCourseCategory('Pedagógico');
                          setNewCourseHours(20);
                          setNewCourseDescription('');
                          setNewCourseInstructor('');
                          setNewCourseInstructorDegree('');
                          setNewCourseInstructorCouncil('');
                          setNewCourseInstructorCouncilNumber('');
                          setNewCourseDate('');
                          setNewCourseLocation('');
                          setNewCourseScheduleTime('');
                          setNewCourseLessons(['']);
                        }} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase transition-colors">Cancelar Edição</button>
                      )}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nome do Registro</label>
                        <input
                          type="text"
                          value={newCourseTitle}
                          onChange={(e) => setNewCourseTitle(e.target.value)}
                          placeholder={newCourseType === 'protocolo' ? "Ex: Entrega de Protocolos Covid" : newCourseType === 'reuniao' ? "Ex: Reunião de Alinhamento" : "Ex: Metodologias Ativas na Prática"}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tipo de Registro</label>
                        <select
                          value={newCourseType}
                          onChange={(e) => setNewCourseType(e.target.value as any)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-violet-500 focus:bg-white transition-all text-slate-700"
                        >
                          <option value="curso">Curso / Treinamento</option>
                          <option value="reuniao">Reunião Interna</option>
                          <option value="protocolo">Entrega de Protocolos</option>
                        </select>
                      </div>

                      {newCourseType === 'curso' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Categoria</label>
                            <select
                              value={newCourseCategory}
                              onChange={(e) => setNewCourseCategory(e.target.value as any)}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-violet-500 focus:bg-white transition-all text-slate-700"
                            >
                              <option value="Pedagógico">Pedagógico</option>
                              <option value="Tecnologia">Tecnologia</option>
                              <option value="Gestão">Gestão</option>
                              <option value="Inclusão">Inclusão</option>
                              <option value="Saúde">Saúde</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Carga Horária (Horas)</label>
                            <input
                              type="number"
                              min="1"
                              max="200"
                              value={newCourseHours}
                              onChange={(e) => setNewCourseHours(Number(e.target.value))}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                            />
                          </div>
                        </>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Data de Realização (Opcional)</label>
                        <input
                          type="date"
                          value={newCourseDate}
                          onChange={(e) => setNewCourseDate(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-500 focus:bg-white transition-all text-slate-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Horário (Opcional)</label>
                        <input
                          type="text"
                          value={newCourseScheduleTime}
                          onChange={(e) => setNewCourseScheduleTime(e.target.value)}
                          placeholder="Ex: 08:00 às 12:00"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-500 focus:bg-white transition-all text-slate-700"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Local de Realização (Opcional)</label>
                        <input
                          type="text"
                          value={newCourseLocation}
                          onChange={(e) => setNewCourseLocation(e.target.value)}
                          placeholder="Ex: Auditório Principal da Escola"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-500 focus:bg-white transition-all text-slate-700"
                        />
                      </div>

                      {newCourseType === 'curso' && (
                        <>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Palestrante / Instrutor</label>
                            <input
                              type="text"
                              value={newCourseInstructor}
                              onChange={(e) => setNewCourseInstructor(e.target.value)}
                              placeholder="Ex: Prof. Dr. Ricardo Silva"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                            />
                          </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Formação / Titulação do Palestrante</label>
                        <input
                          type="text"
                          value={newCourseInstructorDegree}
                          onChange={(e) => setNewCourseInstructorDegree(e.target.value)}
                          placeholder="Ex: Doutor em Educação pela USP"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Conselho (Opcional)</label>
                        <select
                          value={newCourseInstructorCouncil}
                          onChange={(e) => setNewCourseInstructorCouncil(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                        >
                          <option value="">Nenhum / Não aplicável</option>
                          <option value="CRM">CRM (Medicina)</option>
                          <option value="CRP">CRP (Psicologia)</option>
                          <option value="COREN">COREN (Enfermagem)</option>
                          <option value="CREA">CREA (Engenharia/Agronomia)</option>
                          <option value="TST/MTE">TST/MTE (Seg. do Trabalho)</option>
                          <option value="OAB">OAB (Direito)</option>
                          <option value="CREF">CREF (Educação Física)</option>
                          <option value="CRESS">CRESS (Serviço Social)</option>
                          <option value="CRAS">CRAS / Assistência</option>
                          <option value="CRB">CRB (Biblioteconomia)</option>
                          <option value="CRA">CRA (Administração)</option>
                          <option value="CRC">CRC (Contabilidade)</option>
                        </select>
                      </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nº do Conselho (Opcional)</label>
                          <input
                            type="text"
                            value={newCourseInstructorCouncilNumber}
                            onChange={(e) => setNewCourseInstructorCouncilNumber(e.target.value)}
                            placeholder="Ex: 12345/MT"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                          />
                        </div>
                      </>
                    )}
                  </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {newCourseType === 'curso' ? 'Descrição do Curso' : newCourseType === 'reuniao' ? 'Pauta / Assunto' : 'Observações'}
                      </label>
                      <textarea
                        rows={3}
                        value={newCourseDescription}
                        onChange={(e) => setNewCourseDescription(e.target.value)}
                        placeholder={newCourseType === 'curso' ? "Descreva brevemente o conteúdo programático e os objetivos do curso..." : "Detalhes adicionais..."}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-500 focus:bg-white transition-all resize-none"
                      />
                    </div>

                    {newCourseType === 'curso' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Aulas / Módulos do Curso</label>
                          <button
                            type="button"
                            onClick={handleAddLessonInput}
                            className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                          >
                            <Plus size={12} /> Adicionar Aula
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {newCourseLessons.map((lesson, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <span className="text-[10px] font-black text-slate-400 w-5">{idx + 1}.</span>
                              <input
                                type="text"
                                value={lesson}
                                onChange={(e) => handleLessonInputChange(idx, e.target.value)}
                                placeholder={`Nome da Aula ${idx + 1} (opcional)`}
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveLessonInput(idx)}
                                className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleCreateCourse}
                      className="w-full py-4 bg-violet-600 text-white rounded-2xl hover:bg-violet-700 font-black uppercase tracking-wider text-xs shadow-lg shadow-violet-600/10 transition-all"
                    >
                      {editingCourseId ? 'Salvar Alterações do Curso' : 'Salvar e Publicar Curso no Catálogo'}
                    </button>
                  </div>

                  {/* Catalog Management List */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Cursos Disponíveis no Catálogo</h4>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {catalogCourses.map((c) => (
                        <div key={c.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100/50 rounded text-[8px] font-black uppercase">{c.category}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{c.hours} horas • {c.lessons.length} aulas</span>
                            </div>
                            <h5 className="text-sm font-black text-slate-800 uppercase">{c.title}</h5>
                            <p className="text-xs text-slate-400 max-w-2xl line-clamp-2 leading-relaxed">{c.description}</p>
                          </div>

                          <div className="flex gap-2 self-end md:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditCourseClick(c)}
                              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl font-bold uppercase text-[9px] tracking-wider transition-all flex items-center gap-1"
                            >
                              <Edit size={12} /> Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAdminCertificateModal(c)}
                              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-bold uppercase text-[9px] tracking-wider transition-all flex items-center gap-1"
                            >
                              <Award size={12} /> Certificados
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowRecordModal(c)}
                              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold uppercase text-[9px] tracking-wider transition-all flex items-center gap-1"
                            >
                              <FileText size={12} /> Imprimir Ficha
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCourse(c.id)}
                              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold uppercase text-[9px] tracking-wider transition-all flex items-center gap-1"
                            >
                              <X size={12} /> Remover
                            </button>
                          </div>
                        </div>
                      ))}

                      {catalogCourses.length === 0 && (
                        <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase">
                          Nenhum curso cadastrado no catálogo.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* Record Form Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 print:static print:block print:bg-white print:p-0">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col print:shadow-none print:border-none print:overflow-visible print:max-h-none print:rounded-none print:max-w-none print:w-full print:block">
            <button
              onClick={() => setShowRecordModal(null)}
              className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors z-10 print:hidden"
            >
              <X size={20} />
            </button>

            {/* Participants Selection (Print Hidden) */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 print:hidden shrink-0 max-h-64 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Selecione os Convocados</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Apenas os selecionados aparecerão na lista impressa</p>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
                    <input
                      type="text"
                      placeholder="Buscar servidor..."
                      value={recordStaffSearchTerm}
                      onChange={(e) => setRecordStaffSearchTerm(e.target.value)}
                      className="pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:border-violet-500 transition-all w-48"
                    />
                  </div>
                  <button onClick={() => {
                    const filtered = staffList.filter(s => s.name.toLowerCase().includes(recordStaffSearchTerm.toLowerCase()));
                    const newSet = new Set(selectedStaffIdsForRecord);
                    filtered.forEach(s => newSet.add(s.id));
                    setSelectedStaffIdsForRecord(newSet);
                  }} className="text-[10px] font-black text-violet-600 uppercase hover:underline whitespace-nowrap">{recordStaffSearchTerm ? 'Marcar Filtrados' : 'Marcar Todos'}</button>
                  <button onClick={() => {
                    const filtered = staffList.filter(s => s.name.toLowerCase().includes(recordStaffSearchTerm.toLowerCase()));
                    const newSet = new Set(selectedStaffIdsForRecord);
                    filtered.forEach(s => newSet.delete(s.id));
                    setSelectedStaffIdsForRecord(newSet);
                  }} className="text-[10px] font-black text-slate-400 uppercase hover:underline whitespace-nowrap">{recordStaffSearchTerm ? 'Limpar Filtrados' : 'Limpar Seleção'}</button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {staffList.filter(s => s.name.toLowerCase().includes(recordStaffSearchTerm.toLowerCase())).map(staff => (
                  <label key={staff.id} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-violet-300 transition-colors">
                    <input 
                      type="checkbox" 
                      className="rounded text-violet-600 focus:ring-violet-500 w-3 h-3"
                      checked={selectedStaffIdsForRecord.has(staff.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedStaffIdsForRecord);
                        if (e.target.checked) newSet.add(staff.id);
                        else newSet.delete(staff.id);
                        setSelectedStaffIdsForRecord(newSet);
                      }}
                    />
                    <span className="text-[9px] font-bold text-slate-700 uppercase truncate" title={staff.name}>{staff.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Record Form Printed Layout */}
            <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1 bg-white print:p-0 print:overflow-visible text-slate-800">
              <div className="flex items-center gap-4 border-b-2 border-slate-800 pb-4 mb-6">
                <img src="/logo-escola-oficial.png" alt="Brasão" className="w-16 h-16 object-contain" />
                <div>
                  <h1 className="text-xl font-bold uppercase tracking-widest text-slate-900">
                    {showRecordModal.type === 'reuniao' ? 'Ficha de Registro de Reunião' : showRecordModal.type === 'protocolo' ? 'Termo de Recebimento e Ciência' : 'Ficha de Registro de Treinamento'}
                  </h1>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Escola Estadual Cívico-Militar André Antônio Maggi</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-8 text-sm">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                    {showRecordModal.type === 'reuniao' ? 'Título da Reunião' : showRecordModal.type === 'protocolo' ? 'Documento / Protocolo Entregue' : 'Título do Curso / Treinamento'}
                  </span>
                  <span className="font-bold text-slate-800 uppercase">{showRecordModal.title}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                    {showRecordModal.type === 'reuniao' ? 'Responsável / Mediador' : showRecordModal.type === 'protocolo' ? 'Entregue por' : 'Instrutor / Palestrante'}
                  </span>
                  <span className="font-bold text-slate-800 uppercase">
                    {showRecordModal.instructor} {showRecordModal.instructorDegree ? `(${showRecordModal.instructorDegree})` : ''}
                    {showRecordModal.instructorCouncil && showRecordModal.instructorCouncilNumber ? ` - ${showRecordModal.instructorCouncil}: ${showRecordModal.instructorCouncilNumber}` : ''}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Data</span>
                    <span className={`font-bold uppercase ${showRecordModal.date ? 'text-slate-800' : 'text-slate-300'}`}>
                      {showRecordModal.date ? new Date(showRecordModal.date + 'T12:00:00').toLocaleDateString('pt-BR') : '____/____/______'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Horário</span>
                    <span className={`font-bold uppercase ${showRecordModal.scheduleTime ? 'text-slate-800' : 'text-slate-300'}`}>
                      {showRecordModal.scheduleTime || '___:___ às ___:___'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Local</span>
                    <span className={`font-bold uppercase ${showRecordModal.location ? 'text-slate-800' : 'text-slate-300'}`}>
                      {showRecordModal.location || '_________________'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Carga Horária</span>
                    <span className="font-bold text-slate-800 uppercase">{showRecordModal.hours} Horas</span>
                  </div>
                </div>
                {showRecordModal.description && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mt-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Conteúdo Programático / Descrição</span>
                    <span className="font-bold text-slate-800 text-xs">{showRecordModal.description}</span>
                  </div>
                )}
              </div>

              <div className="mb-4 text-xs text-justify text-slate-600 font-medium border-l-4 border-slate-300 pl-4">
                {showRecordModal.type === 'protocolo' 
                  ? 'Declaro, pela minha assinatura, ter recebido os protocolos, documentos, equipamentos ou orientações referentes ao item especificado acima, estando ciente de minhas responsabilidades e das normas adotadas.'
                  : showRecordModal.type === 'reuniao'
                    ? 'Declaro, pela minha assinatura, ter participado da reunião especificada acima, tendo ciência das pautas, informes e orientações abordadas, estando ciente das práticas e procedimentos definidos.'
                    : 'Declaro, pela minha assinatura, ter participado do treinamento especificado acima, tendo recebido as instruções, conteúdos programáticos e avaliações pertinentes, estando ciente das práticas e procedimentos abordados.'}
              </div>

              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-2 text-center w-12 font-bold">Nº</th>
                    <th className="border border-slate-300 p-2 text-left font-bold">NOME DO PARTICIPANTE</th>
                    <th className="border border-slate-300 p-2 text-center font-bold w-40">CPF / MATRÍCULA</th>
                    <th className="border border-slate-300 p-2 text-left font-bold w-48">ASSINATURA</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.filter(s => selectedStaffIdsForRecord.has(s.id)).map((staff, i) => (
                    <tr key={staff.id}>
                      <td className="border border-slate-300 p-2 text-center text-slate-400">{i + 1}</td>
                      <td className="border border-slate-300 p-2 uppercase text-[10px] font-semibold text-slate-700">{staff.name}</td>
                      <td className="border border-slate-300 p-2 text-center text-[10px] text-slate-600">{staff.cpf || staff.registration || ''}</td>
                      <td className="border border-slate-300 p-2"></td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(5, 20 - staffList.filter(s => selectedStaffIdsForRecord.has(s.id)).length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td className="border border-slate-300 p-2 text-center text-slate-400">{staffList.filter(s => selectedStaffIdsForRecord.has(s.id)).length + i + 1}</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-12 text-center space-y-2">
                <div className="h-px w-64 bg-slate-400 mx-auto"></div>
                <p className="text-[10px] font-black uppercase text-slate-600">Assinatura do Instrutor / Responsável</p>
              </div>
            </div>

            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end gap-3 print:hidden shrink-0">
              <button
                onClick={() => window.print()}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase text-[10px] shadow-md shadow-blue-600/10 transition-all flex items-center gap-1.5"
              >
                <Download size={14} /> Imprimir Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Certificate Issue Modal */}
      {showAdminCertificateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => { setShowAdminCertificateModal(null); setSelectedStaffForCert(null); }}
              className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors z-10 print:hidden"
            >
              <X size={20} />
            </button>

            <div className="p-8 border-b border-slate-100 print:hidden shrink-0">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Emitir Certificado Avulso</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Selecione um participante para gerar o certificado do curso</p>
              
              <div className="mt-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Selecione o Participante (Base de Servidores)</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-violet-500"
                    onChange={(e) => {
                      const st = staffList.find(s => s.id === e.target.value);
                      setSelectedStaffForCert(st || null);
                    }}
                    value={selectedStaffForCert?.id || ''}
                  >
                    <option value="">-- Selecione ou digite manualmente --</option>
                    {staffList.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Ou Digite Manualmente</label>
                  <input
                    type="text"
                    placeholder="Nome do Participante"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-violet-500"
                    value={selectedStaffForCert?.name || ''}
                    onChange={(e) => setSelectedStaffForCert({ id: 'manual', name: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Certificate Printed Layout */}
            <div className="p-8 md:p-12 border-[16px] border-double border-violet-100 m-2 rounded-[2.5rem] bg-amber-50/5 relative text-center space-y-6 overflow-y-auto print:border-none print:m-0 print:overflow-visible flex-1">
              
              {/* Decorative elements */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-violet-300"></div>
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-violet-300"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-violet-300"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-violet-300"></div>

              {/* Certificate content */}
              <div className="space-y-2 flex flex-col items-center">
                <img src="/logo-escola-oficial.png" alt="Brasão" className="w-20 h-20 object-contain mb-3" />
                <h1 className="text-xl font-bold uppercase tracking-[0.2em] text-violet-800">Certificado de Conclusão</h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Escola Estadual Cívico-Militar André Antônio Maggi</p>
              </div>

              <div className="space-y-4 py-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider text-center">Certificamos que o(a) docente/servidor(a)</p>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight text-center">{selectedStaffForCert?.name || 'NOME DO PARTICIPANTE'}</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl mx-auto font-medium text-center">
                  concluiu com êxito o programa de formação continuada em <strong>{showAdminCertificateModal.title}</strong>, {showAdminCertificateModal.instructor ? `ministrado por ${showAdminCertificateModal.instructor}${showAdminCertificateModal.instructorDegree ? ` (${showAdminCertificateModal.instructorDegree})` : ''},` : ''} correspondente a uma carga horária total de <strong>{showAdminCertificateModal.hours} horas</strong> de estudo teórico e atividades práticas{showAdminCertificateModal.date ? `, realizado em ${new Date(showAdminCertificateModal.date + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-100 max-w-3xl mx-auto text-center">
                <div className="space-y-1">
                  <div className="h-px bg-slate-300 max-w-[120px] mx-auto"></div>
                  <p className="text-[9px] font-black text-slate-700 uppercase leading-none">Diretor Escolar</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Reziere de Souza</p>
                  <p className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">EE Cívico-Militar André Antônio Maggi</p>
                </div>
                <div className="space-y-1">
                  <div className="h-px bg-slate-300 max-w-[120px] mx-auto"></div>
                  <p className="text-[9px] font-black text-slate-700 uppercase leading-none">Secretaria Escolar</p>
                  <p className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">Seduc GS</p>
                </div>
                <div className="space-y-1">
                  <div className="h-px bg-slate-300 max-w-[120px] mx-auto"></div>
                  <p className="text-[9px] font-black text-slate-700 uppercase leading-none">Instrutor(a)</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5 truncate max-w-[150px] mx-auto" title={showAdminCertificateModal.instructor}>
                    {showAdminCertificateModal.instructor || 'Do Curso'}
                  </p>
                  {showAdminCertificateModal.instructorCouncil && showAdminCertificateModal.instructorCouncilNumber && (
                    <p className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">
                      {showAdminCertificateModal.instructorCouncil} {showAdminCertificateModal.instructorCouncilNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="h-px bg-slate-300 max-w-[120px] mx-auto"></div>
                  <p className="text-[9px] font-black text-slate-700 uppercase leading-none">Participante</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5 truncate max-w-[150px] mx-auto" title={selectedStaffForCert?.name}>
                    {selectedStaffForCert?.name || 'Servidor(a)'}
                  </p>
                </div>
              </div>

              <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest pt-4 text-center">
                Registrado sob o código de validação institucional nº {showAdminCertificateModal.id.toUpperCase()}-{(selectedStaffForCert?.id || 'MNUL').substring(0, 4).toUpperCase()}-{Date.now().toString().substring(8)}
              </div>
            </div>

            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end gap-3 print:hidden shrink-0">
              <button
                disabled={!selectedStaffForCert?.name}
                onClick={() => window.print()}
                className="px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold uppercase text-[10px] shadow-md shadow-violet-600/10 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download size={14} /> Imprimir Certificado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden relative">
            <button
              onClick={() => setShowCertificateModal(null)}
              className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors z-10 print:hidden"
            >
              <X size={20} />
            </button>

            {/* Certificate Printed Layout */}
            <div className="p-8 md:p-12 border-[16px] border-double border-violet-100 m-2 rounded-[2.5rem] bg-amber-50/5 relative text-center space-y-6">
              
              {/* Decorative elements */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-violet-300"></div>
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-violet-300"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-violet-300"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-violet-300"></div>

              {/* Certificate content */}
              <div className="space-y-2 flex flex-col items-center">
                <img src="/logo-escola-oficial.png" alt="Brasão" className="w-20 h-20 object-contain mb-3" />
                <h1 className="text-xl font-bold uppercase tracking-[0.2em] text-violet-800">Certificado de Conclusão</h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Escola Estadual Cívico-Militar André Antônio Maggi</p>
              </div>

              <div className="space-y-4 py-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider text-center">Certificamos que o(a) docente/servidor(a)</p>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight text-center">{user.name || 'Servidor André Maggi'}</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl mx-auto font-medium text-center">
                  concluiu com êxito o programa de formação continuada em <strong>{showCertificateModal.title}</strong>, {showCertificateModal.instructor ? `ministrado por ${showCertificateModal.instructor}${showCertificateModal.instructorDegree ? ` (${showCertificateModal.instructorDegree})` : ''},` : ''} correspondente a uma carga horária total de <strong>{showCertificateModal.hours} horas</strong> de estudo teórico e atividades práticas{showCertificateModal.date ? `, realizado em ${new Date(showCertificateModal.date + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-100 max-w-3xl mx-auto text-center">
                <div className="space-y-1">
                  <div className="h-px bg-slate-300 max-w-[120px] mx-auto"></div>
                  <p className="text-[9px] font-black text-slate-700 uppercase leading-none">Diretor Escolar</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Reziere de Souza</p>
                  <p className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">EE Cívico-Militar André Antônio Maggi</p>
                </div>
                <div className="space-y-1">
                  <div className="h-px bg-slate-300 max-w-[120px] mx-auto"></div>
                  <p className="text-[9px] font-black text-slate-700 uppercase leading-none">Secretaria Escolar</p>
                  <p className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">Seduc GS</p>
                </div>
                <div className="space-y-1">
                  <div className="h-px bg-slate-300 max-w-[120px] mx-auto"></div>
                  <p className="text-[9px] font-black text-slate-700 uppercase leading-none">Instrutor(a)</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5 truncate max-w-[150px] mx-auto" title={showCertificateModal.instructor}>
                    {showCertificateModal.instructor || 'Do Curso'}
                  </p>
                  {showCertificateModal.instructorCouncil && showCertificateModal.instructorCouncilNumber && (
                    <p className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">
                      {showCertificateModal.instructorCouncil} {showCertificateModal.instructorCouncilNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="h-px bg-slate-300 max-w-[120px] mx-auto"></div>
                  <p className="text-[9px] font-black text-slate-700 uppercase leading-none">Participante</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5 truncate max-w-[150px] mx-auto" title={user.name}>
                    {user.name || 'Servidor(a)'}
                  </p>
                </div>
              </div>

              <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest pt-4 text-center">
                Registrado sob o código de validação institucional nº {showCertificateModal.id.toUpperCase()}-{user.id.substring(0, 4).toUpperCase()}-{Date.now().toString().substring(8)}
              </div>
            </div>

            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold uppercase text-[10px] shadow-md shadow-violet-600/10 transition-all flex items-center gap-1.5"
              >
                <Download size={14} /> Imprimir / PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(124, 58, 237, 0.2); }
      `}</style>
    </div>
  );
};

export default TrainingModule;
