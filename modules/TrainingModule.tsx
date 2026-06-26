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
  Users
} from 'lucide-react';
import { useToast } from '../components/Toast';

interface TrainingModuleProps {
  user: any;
  onExit: () => void;
}

type TabType = 'dashboard' | 'my_courses' | 'catalog' | 'certificates' | 'admin_reports';

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
    enrollmentDate: '2026-05-10'
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
    completionDate: '2026-06-20'
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
    enrollmentDate: '2026-06-01'
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
    completed: false
  },
  {
    id: 'c5',
    title: 'Primeiros Socorros na Escola (Lei Lucas)',
    category: 'Saúde',
    hours: 10,
    description: 'Capacitação teórica e prática sobre primeiros socorros em ambiente escolar, conforme exigências da Lei 13.722/18.',
    progress: 0,
    lessons: ['Conceitos Básicos de Socorro', 'Engasgos e Desobstrução de Vias Aéreas', 'Desmaios e Convulsões', 'Fraturas e Pequenos Traumas', 'Simulado e Certificado'],
    completed: false
  },
  {
    id: 'c6',
    title: 'Tecnologia e Ambientes Virtuais de Aprendizagem',
    category: 'Tecnologia',
    hours: 20,
    description: 'Domine plataformas de ensino virtual (Google Classroom, MS Teams) e ferramentas colaborativas para o engajamento dos estudantes.',
    progress: 0,
    lessons: ['Configurando a Sala Virtual', 'Criação de Atividades Interativas', 'Rubricas e Avaliação Digital', 'Comunicação com Pais e Alunos', 'Prova do Módulo'],
    completed: false
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
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState<Course | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Load courses
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
  }, [user.id]);

  const saveCourses = (updatedCourses: Course[]) => {
    localStorage.setItem(`portal_training_courses_${user.id}`, JSON.stringify(updatedCourses));
    setMyCourses(updatedCourses);
  };

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
  const filteredCatalog = CATALOG_COURSES.filter(c => {
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
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative w-full">
      {/* Sidebar - Violet Theme */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-violet-950 text-white flex flex-col no-print transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
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
      <main className="flex-1 flex flex-col overflow-hidden">
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
                            <p className="text-xs text-slate-400 leading-normal line-clamp-2">{c.description}</p>
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
                          <p className="text-xs text-slate-400 line-clamp-3 leading-normal">{c.description}</p>
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
                          <p className="text-xs text-slate-400 leading-normal line-clamp-3">{c.description}</p>
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

            </div>
          )}
        </div>
      </main>

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
              <div className="space-y-2">
                <span className="text-4xl">🎓</span>
                <h1 className="text-xl font-bold uppercase tracking-[0.2em] text-violet-800">Certificado de Conclusão</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escola Estadual André Maggi</p>
              </div>

              <div className="space-y-4 py-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider text-center">Certificamos que o(a) docente/servidor(a)</p>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight text-center">{user.name || 'Servidor André Maggi'}</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl mx-auto font-medium text-center">
                  concluiu com êxito o programa de formação continuada em <strong>{showCertificateModal.title}</strong>, correspondente a uma carga horária total de <strong>{showCertificateModal.hours} horas</strong> de estudo teórico e atividades práticas.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100 max-w-md mx-auto text-center">
                <div className="space-y-1">
                  <div className="h-px bg-slate-300 max-w-[120px] mx-auto"></div>
                  <p className="text-[9px] font-black text-slate-700 uppercase leading-none">Diretoria Pedagógica</p>
                  <p className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">EE André Maggi</p>
                </div>
                <div className="space-y-1">
                  <div className="h-px bg-slate-300 max-w-[120px] mx-auto"></div>
                  <p className="text-[9px] font-black text-slate-700 uppercase leading-none">Secretaria Escolar</p>
                  <p className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">Seduc GS</p>
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
