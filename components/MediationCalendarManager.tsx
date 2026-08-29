import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Users, 
  FileText, 
  Award, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Pencil, 
  Trash2, 
  X, 
  Save, 
  Share2, 
  HeartHandshake, 
  Megaphone, 
  AlertCircle, 
  Check, 
  Eye,
  GraduationCap,
  Scale,
  Building2,
  BookmarkCheck,
  Flame,
  FileCheck
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { MediationCalendarAction, MediationCalendarMonth, MediationActionType } from '../types';

// ESTRUTURA OFICIAL DO CALENDÁRIO NÚCLEO DE MEDIAÇÃO ESCOLAR 2026 (SEDUC/MT)
export interface OfficialMonthData {
  id: MediationCalendarMonth;
  monthName: string;
  orientativo: string;
  theme: string;
  color: string;
  bgLight: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  legislations: string[];
  description: string;
  highlights?: string[];
  importantDates: { date: string; title: string }[];
}

export const OFFICIAL_CALENDAR_2026: OfficialMonthData[] = [
  {
    id: 'FEVEREIRO',
    monthName: 'Fevereiro',
    orientativo: 'Orientativo 001/2026',
    theme: 'Paz em Ação na Escola: Garantia dos direitos humanos e a promoção da saúde mental',
    color: 'from-sky-600 to-indigo-700',
    bgLight: 'bg-sky-50/70',
    borderColor: 'border-sky-200',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    legislations: ['Lei nº 11.867/2022', 'Lei nº 13.840/2019', 'Lei nº 13.798/2019'],
    description: 'Acolhimento ao início do ano letivo, promoção da cultura de paz, fortalecimento da saúde mental e prevenção da gravidez na adolescência.',
    highlights: [
      '02/02 - Início do ano letivo 2026',
      'Semana Nacional de Prevenção da Gravidez na Adolescência',
      'Atividades de acolhimento ao início do ano letivo',
      'Campanha: Violência na Escola NÃO É BRINCADEIRA!'
    ],
    importantDates: [
      { date: '02/02', title: 'Início do Ano Letivo 2026' },
      { date: '07/02', title: 'Dia Internacional dos Povos Indígenas' },
      { date: '24/02', title: 'Aniversário da conquista do voto feminino no Brasil' }
    ]
  },
  {
    id: 'MARÇO',
    monthName: 'Março',
    orientativo: 'Orientativo 002/2026',
    theme: 'Semana Escolar de Combate à Violência Contra a Mulher',
    color: 'from-purple-600 to-pink-700',
    bgLight: 'bg-purple-50/70',
    borderColor: 'border-purple-200',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    legislations: ['Lei nº 14.164/2021', 'Lei nº 14.899/2024', 'Lei nº 11.340/2006 (Lei Maria da Penha)'],
    description: 'Mobilizar a comunidade escolar sobre as diversas formas de violência contra a mulher, desconstruir normas sociais de gênero e promover o respeito à diversidade e à igualdade.',
    highlights: [
      'Semana Escolar de Combate à Violência Contra a Mulher',
      'Debates sobre a Lei Maria da Penha nas turmas',
      'Desconstrução de estereótipos e estímulo à equidade'
    ],
    importantDates: [
      { date: '08/03', title: 'Dia Internacional da Luta das Mulheres' },
      { date: '21/03', title: 'Dia Internacional de Luta Contra a Discriminação Racial' },
      { date: '30/03', title: 'Dia Mundial da Juventude' }
    ]
  },
  {
    id: 'ABRIL',
    monthName: 'Abril',
    orientativo: 'Orientativo 003/2026',
    theme: 'Semana Nacional da Convivência Escolar e a Prevenção e Combate ao Bullying e Cyberbullying',
    color: 'from-amber-600 to-orange-700',
    bgLight: 'bg-amber-50/70',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    legislations: [
      'Lei nº 10.760/2018',
      'Lei nº 8.069/1990 (ECA)',
      'Lei nº 10.792/2018',
      'Lei nº 13.277/2016',
      'Lei nº 13.185/2015',
      'Lei nº 14.811/2024'
    ],
    description: 'Fortalecer o diálogo sobre as diversas violências no contexto escolar, promovendo ambientes acolhedores, de pertencimento e democraticamente participativos, mobilizando a comunidade escolar para a prevenção e enfrentamento do Bullying e do Cyberbullying.',
    highlights: [
      'Semana Nacional da Convivência Escolar',
      'Prevenção e Enfrentamento ao Bullying e Cyberbullying',
      'Círculos de Diálogo sobre Uso Ético da Internet e Redes Sociais'
    ],
    importantDates: [
      { date: '24/04', title: 'Dia da Família na Escola' },
      { date: '28/04', title: 'Dia Mundial da Educação' }
    ]
  },
  {
    id: 'MAIO',
    monthName: 'Maio',
    orientativo: 'Orientativo 004/2026',
    theme: 'MAIO LARANJA: Mês de prevenção e combate ao abuso e à exploração sexual de crianças e adolescentes',
    color: 'from-orange-500 to-amber-600',
    bgLight: 'bg-orange-50/70',
    borderColor: 'border-orange-200',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900',
    legislations: ['Lei nº 9.970/2000', 'Lei nº 14.432/2022', 'Lei nº 11.691/2022', 'Lei nº 14.811/2024'],
    description: 'Informar e capacitar toda a comunidade escolar para a proteção integral de crianças e adolescentes, atuando na prevenção, identificação e notificação de casos de abuso e exploração sexual. Fortalecimento de parcerias com o Sistema de Garantia de Direitos.',
    highlights: [
      'Campanha Oficial Faça Bonito / Maio Laranja',
      'Identificação de sinais de violência e canais de denúncia (Disque 100)',
      'Fortalecimento de parcerias com Conselho Tutelar, CRAS e CREAS'
    ],
    importantDates: [
      { date: '18/05', title: 'Dia Nacional de Enfrentamento ao Abuso e Exploração Sexual Infanto-Juvenil e Luta Antimanicomial' }
    ]
  },
  {
    id: 'JUNHO',
    monthName: 'Junho',
    orientativo: 'Orientativo 005/2026',
    theme: 'Mês de Prevenção e Erradicação do Trabalho Infantil e Proteção ao Adolescente Trabalhador',
    color: 'from-rose-600 to-red-700',
    bgLight: 'bg-rose-50/70',
    borderColor: 'border-rose-200',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    legislations: ['Lei nº 11.542/2007', 'Lei nº 8.069/1990', 'Lei nº 13.344/2016', 'Lei nº 11.577/2007'],
    description: 'Sensibilizar e mobilizar a comunidade escolar para a promoção dos direitos humanos, com foco na prevenção e erradicação do trabalho infantil, no enfrentamento à tortura, ao abuso e ao tráfico ilícito de drogas, assegurando a proteção integral.',
    highlights: [
      'Conscientização contra a exploração do trabalho infantil',
      'Orientações sobre o Programa Jovem Aprendiz Legal',
      'Prevenção contra o abuso e o tráfico de substâncias'
    ],
    importantDates: [
      { date: '12/06', title: 'Dia Mundial de Enfrentamento ao Trabalho Infantil' },
      { date: '26/06', title: 'Dia Internacional de Luta Contra a Tortura' },
      { date: '26/06', title: 'Dia Internacional sobre o Abuso e o Tráfico Ilícito de Drogas' }
    ]
  },
  {
    id: 'JULHO',
    monthName: 'Julho',
    orientativo: 'Orientativo 006/2026',
    theme: 'Educação para os Direitos Humanos, Ambientais e Climáticos',
    color: 'from-emerald-600 to-teal-700',
    bgLight: 'bg-emerald-50/70',
    borderColor: 'border-emerald-200',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    legislations: [
      'Lei nº 8.069/1990',
      'Lei nº 13.344/2016',
      'Lei nº 11.577/2007',
      'Lei nº 13.010/2014',
      'Resolução nº 273/2025'
    ],
    description: 'Sensibilizar sobre a educação para os direitos humanos, emergência climática, prevenção e redução de riscos de desastres, cidadania socioambiental, justiça climática, racismo ambiental, ciência cidadã, agroecologia e consumo sustentável.',
    highlights: [
      '06/07 a 20/07: Férias Escolares',
      'Sugestão: Campanha Nacional "Pule, Brinque e Cuide – Unidos pela proteção de crianças e adolescentes"',
      'Ações socioambientais e sustentabilidade no entorno escolar'
    ],
    importantDates: [
      { date: '13/07', title: 'Aniversário do Estatuto da Criança e do Adolescente - ECA (1990)' },
      { date: '30/07', title: 'Dia Mundial Contra o Tráfico de Pessoas' }
    ]
  },
  {
    id: 'AGOSTO',
    monthName: 'Agosto',
    orientativo: 'Orientativo 007/2026',
    theme: 'AGOSTO LILÁS: Mobilização para o fim da violência contra a mulher',
    color: 'from-fuchsia-600 to-purple-800',
    bgLight: 'bg-fuchsia-50/70',
    borderColor: 'border-fuchsia-200',
    badgeBg: 'bg-fuchsia-100',
    badgeText: 'text-fuchsia-900',
    legislations: [
      'Lei nº 12.262/2023',
      'Lei nº 14.344/2022',
      'Lei nº 11.340/2006',
      'Lei nº 14.899/2024',
      'Lei nº 14.643/2023',
      'Decreto nº 12.006/2024'
    ],
    description: 'Mobilizar sobre a Lei Maria da Penha e os mecanismos de denúncia e proteção, fortalecendo o compromisso da escola na criação de um ambiente seguro e de igualdade de oportunidades para todos os gêneros.',
    highlights: [
      'Campanha Agosto Lilás nas salas de aula',
      'Palestra e rodas de conversa com a Rede de Apoio à Mulher',
      'Celebração do protagonismo e Dia do Estudante'
    ],
    importantDates: [
      { date: '07/08', title: 'Aniversário da Lei Maria da Penha (Lei nº 11.340/06)' },
      { date: '11/08', title: 'Dia do Estudante' }
    ]
  },
  {
    id: 'SETEMBRO',
    monthName: 'Setembro',
    orientativo: 'Orientativo 008/2026',
    theme: 'SETEMBRO AMARELO: Setembro da Paz e o debate sobre uso indevido de substâncias psicoativas e telas',
    color: 'from-yellow-500 to-amber-600',
    bgLight: 'bg-yellow-50/70',
    borderColor: 'border-yellow-200',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-900',
    legislations: ['Lei nº 13.819/2019'],
    description: 'Promover a valorização da vida e o cuidado integral da saúde mental, estimulando a cultura de paz e debatendo o uso indevido e o impacto negativo de telas, álcool, tabaco e outras substâncias.',
    highlights: [
      'Valorização da Vida e Cuidado Emocional',
      'Oficinas sobre Equilíbrio Digital e Uso Consciente de Telas e Celular',
      'Círculos de Escuta e Fortalecimento dos Vínculos de Amizade'
    ],
    importantDates: [
      { date: '06/09', title: 'Dia Internacional de Luta pela Igualdade das Mulheres' },
      { date: '21/09', title: 'Dia Nacional de Luta das Pessoas com Deficiência' },
      { date: '23/09', title: 'Dia Internacional Contra a Exploração Sexual e Tráfico de Mulheres e Crianças' }
    ]
  },
  {
    id: 'OUTUBRO',
    monthName: 'Outubro',
    orientativo: 'Orientativo 009/2026',
    theme: 'OUTUBRO ROSA / Outubrinho Rosa: A Escola como Espaço de Informação, Cuidado e Prevenção',
    color: 'from-pink-500 to-rose-600',
    bgLight: 'bg-pink-50/70',
    borderColor: 'border-pink-200',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-900',
    legislations: ['Lei nº 15.009/2024'],
    description: 'Promover a conscientização sobre a saúde e direitos reprodutivos e não-reprodutivos da mulher, autocuidado, prevenção e valorização da comunidade escolar.',
    highlights: [
      'Ações do Outubrinho Rosa com foco em autocuidado e saúde',
      'Círculos de Diálogo sobre Empatia e Cuidado com a Família',
      'Valorização do papel do educador na construção da paz'
    ],
    importantDates: [
      { date: '10/10', title: 'Dia Nacional de Luta Contra a Violência à Mulher e Dia Mundial da Saúde Mental' },
      { date: '11/10', title: 'Dia Internacional da Menina' },
      { date: '15/10', title: 'Dia da Professora e do Professor' }
    ]
  },
  {
    id: 'NOVEMBRO',
    monthName: 'Novembro',
    orientativo: 'Orientativo 010/2026',
    theme: 'NOVEMBRO AZUL: Semana Restaurativa no Ambiente Escolar e a Luta Antirracista',
    color: 'from-blue-600 to-indigo-800',
    bgLight: 'bg-blue-50/70',
    borderColor: 'border-blue-200',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
    legislations: [
      'Lei nº 10.760/2018',
      'Lei nº 8.069/1990',
      'Lei nº 10.792/2018',
      'Lei nº 12.656/2024',
      'Resolução nº 225/2015 - CNJ'
    ],
    description: 'Consolidar as Práticas Restaurativas como metodologia de gestão de conflitos. Promover a conscientização e cuidado com a saúde integral masculina e o combate a todas as formas de racismo.',
    highlights: [
      'Semana da Justiça Restaurativa no Ambiente Escolar',
      'Ações e Círculos Temáticos de Consciência Negra e Luta Antirracista',
      'Cuidado com a Saúde Integral (Física e Mental) Masculina'
    ],
    importantDates: [
      { date: '20/11', title: 'Dia da Consciência Negra e Dia Nacional de Zumbi dos Palmares' },
      { date: '25/11', title: 'Dia Internacional de Luta Contra a Violência Contra a Mulher' }
    ]
  }
];

const SCHOOL_CLASSES = [
  '6º ANO A', '6º ANO B', '6º ANO C', '6º ANO D',
  '7º ANO A', '7º ANO B', '7º ANO C',
  '8º ANO A', '8º ANO B', '8º ANO C',
  '9º ANO A', '9º ANO B', '9º ANO C', '9º ANO D',
  'TODAS AS TURMAS (GERAL)'
];

const ACTION_TYPE_OPTIONS: { id: MediationActionType; label: string; icon: string }[] = [
  { id: 'PALESTRA', label: 'Palestra / Ação Coletiva', icon: '📢' },
  { id: 'CÍRCULO_DE_PAZ', label: 'Círculo de Construção de Paz', icon: '⭕' },
  { id: 'OFICINA', label: 'Oficina Prática / Dinâmica', icon: '🛠️' },
  { id: 'CAMPANHA', label: 'Campanha de Conscientização', icon: '🚩' },
  { id: 'REUNIÃO_FAMILIAR', label: 'Atendimento / Reunião com Pais', icon: '👥' },
  { id: 'CAPACITAÇÃO', label: 'Capacitação Docente / Equipe', icon: '🎓' },
  { id: 'AÇÃO_COLETIVA', label: 'Ação Intersetorial (Rede de Apoio)', icon: '🤝' },
  { id: 'OUTRO', label: 'Outra Ação Restaurativa', icon: '✨' }
];

interface MediationCalendarManagerProps {
  user?: any;
  role?: string;
  onOpenNewCase?: () => void;
}

const MediationCalendarManager: React.FC<MediationCalendarManagerProps> = ({ user, role, onOpenNewCase }) => {
  const [actions, setActions] = useState<MediationCalendarAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'roadmap' | 'actions' | 'stats'>('roadmap');

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<MediationCalendarAction>>({
    month: 'FEVEREIRO',
    orientativoNumber: 'Orientativo 001/2026',
    theme: 'Paz em Ação na Escola: Garantia dos direitos humanos e a promoção da saúde mental',
    title: '',
    actionType: 'PALESTRA',
    targetAudience: '',
    classes: [],
    participantCount: 0,
    executionDate: new Date().toISOString().split('T')[0],
    responsibleMediator: user?.name ? `${user.name} (Mediador)` : 'Professor Mediador',
    partnerships: '',
    description: '',
    outcomes: '',
    status: 'CONCLUÍDA'
  });

  // Carregar Ações do Supabase / LocalStorage
  const fetchActions = async () => {
    setIsLoading(true);
    let localActions: MediationCalendarAction[] = [];
    try {
      const saved = localStorage.getItem('mediation_calendar_actions_2026');
      if (saved) {
        localActions = JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const { data, error } = await supabase
        .from('civic_documents')
        .select('*')
        .eq('template', 'mediation_calendar_action')
        .order('date', { ascending: false });

      if (data && Array.isArray(data)) {
        const dbActions: MediationCalendarAction[] = data.map((d: any) => {
          const c = typeof d.content === 'object' && d.content !== null ? d.content : {};
          return {
            id: d.id,
            month: c.month || 'FEVEREIRO',
            orientativoNumber: c.orientativoNumber || 'Orientativo 2026',
            theme: c.theme || '',
            title: c.title || d.student_name || 'Ação do Calendário',
            actionType: c.actionType || 'PALESTRA',
            targetAudience: c.targetAudience || '',
            classes: c.classes || (d.student_class ? [d.student_class] : []),
            participantCount: Number(c.participantCount || 0),
            executionDate: d.date || c.executionDate || new Date().toISOString().split('T')[0],
            responsibleMediator: c.responsibleMediator || 'Mediação Escolar',
            partnerships: c.partnerships || '',
            description: c.description || '',
            outcomes: c.outcomes || '',
            status: c.status || 'CONCLUÍDA',
            createdAt: d.created_at
          };
        });

        // Mesclar dados locais e remotos
        const mergedMap = new Map<string, MediationCalendarAction>();
        localActions.forEach(a => mergedMap.set(a.id, a));
        dbActions.forEach(a => mergedMap.set(a.id, a));
        const finalActions = Array.from(mergedMap.values()).sort((a, b) => 
          new Date(b.executionDate).getTime() - new Date(a.executionDate).getTime()
        );
        setActions(finalActions);
        localStorage.setItem('mediation_calendar_actions_2026', JSON.stringify(finalActions));
      } else {
        setActions(localActions);
      }
    } catch (err) {
      console.error('Erro ao buscar ações do calendário:', err);
      setActions(localActions);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  // Abrir Modal para Criar Nova Ação
  const handleOpenNewAction = (monthId?: MediationCalendarMonth) => {
    const targetMonth = monthId || 'FEVEREIRO';
    const monthData = OFFICIAL_CALENDAR_2026.find(m => m.id === targetMonth) || OFFICIAL_CALENDAR_2026[0];

    setEditingActionId(null);
    setFormData({
      month: targetMonth,
      orientativoNumber: monthData.orientativo,
      theme: monthData.theme,
      title: '',
      actionType: 'PALESTRA',
      targetAudience: '',
      classes: [],
      participantCount: 0,
      executionDate: new Date().toISOString().split('T')[0],
      responsibleMediator: user?.name ? `${user.name} (Mediador)` : 'Professor Mediador',
      partnerships: '',
      description: '',
      outcomes: '',
      status: 'CONCLUÍDA'
    });
    setIsModalOpen(true);
  };

  // Abrir Modal para Editar Ação Existente
  const handleOpenEditAction = (action: MediationCalendarAction) => {
    setEditingActionId(action.id);
    setFormData({ ...action });
    setIsModalOpen(true);
  };

  // Salvar Ação (Supabase + LocalStorage)
  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert("Por favor, preencha o título da ação.");
      return;
    }

    const actionId = editingActionId || `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const actionPayload: MediationCalendarAction = {
      id: actionId,
      month: (formData.month || 'FEVEREIRO') as MediationCalendarMonth,
      orientativoNumber: formData.orientativoNumber || 'Orientativo 2026',
      theme: formData.theme || '',
      title: formData.title.trim(),
      actionType: (formData.actionType || 'PALESTRA') as MediationActionType,
      targetAudience: formData.targetAudience?.trim() || '',
      classes: formData.classes || [],
      participantCount: Number(formData.participantCount || 0),
      executionDate: formData.executionDate || new Date().toISOString().split('T')[0],
      responsibleMediator: formData.responsibleMediator?.trim() || 'Professor Mediador',
      partnerships: formData.partnerships?.trim() || '',
      description: formData.description?.trim() || '',
      outcomes: formData.outcomes?.trim() || '',
      status: (formData.status || 'CONCLUÍDA') as any,
      createdAt: new Date().toISOString()
    };

    // Salvar Local
    const updatedLocal = editingActionId 
      ? actions.map(a => a.id === editingActionId ? actionPayload : a)
      : [actionPayload, ...actions];
    
    setActions(updatedLocal);
    localStorage.setItem('mediation_calendar_actions_2026', JSON.stringify(updatedLocal));
    setIsModalOpen(false);

    // Salvar no Banco
    try {
      const dbPayload = {
        id: actionId,
        template: 'mediation_calendar_action',
        date: actionPayload.executionDate,
        student_name: actionPayload.title,
        student_class: actionPayload.classes.join(', '),
        content: actionPayload,
        timestamp: Date.now()
      };

      await supabase.from('civic_documents').upsert([dbPayload]);
    } catch (err) {
      console.error('Erro ao sincronizar com banco:', err);
    }
  };

  // Excluir Ação
  const handleDeleteAction = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir o registro desta ação?")) return;

    const filtered = actions.filter(a => a.id !== id);
    setActions(filtered);
    localStorage.setItem('mediation_calendar_actions_2026', JSON.stringify(filtered));

    try {
      await supabase.from('civic_documents').delete().eq('id', id);
    } catch (err) {
      console.error('Erro ao excluir no banco:', err);
    }
  };

  // Quando o usuário muda o mês no form, preencher automaticamente o Orientativo e Tema
  const handleMonthChangeInForm = (monthId: MediationCalendarMonth) => {
    const monthData = OFFICIAL_CALENDAR_2026.find(m => m.id === monthId);
    if (monthData) {
      setFormData(prev => ({
        ...prev,
        month: monthId,
        orientativoNumber: monthData.orientativo,
        theme: monthData.theme
      }));
    }
  };

  // Toggle de Turma
  const toggleClassSelection = (cls: string) => {
    const current = formData.classes || [];
    if (cls === 'TODAS AS TURMAS (GERAL)') {
      if (current.includes('TODAS AS TURMAS (GERAL)')) {
        setFormData({ ...formData, classes: [] });
      } else {
        setFormData({ ...formData, classes: ['TODAS AS TURMAS (GERAL)'] });
      }
      return;
    }

    const withoutAll = current.filter(c => c !== 'TODAS AS TURMAS (GERAL)');
    if (withoutAll.includes(cls)) {
      setFormData({ ...formData, classes: withoutAll.filter(c => c !== cls) });
    } else {
      setFormData({ ...formData, classes: [...withoutAll, cls] });
    }
  };

  // Ações filtradas para exibição
  const filteredActions = useMemo(() => {
    return actions.filter(a => {
      const matchMonth = selectedMonthFilter === 'ALL' || a.month === selectedMonthFilter;
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      const matchSearch = !searchTerm.trim() || 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.orientativoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.responsibleMediator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.targetAudience.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.classes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchMonth && matchStatus && matchSearch;
    });
  }, [actions, selectedMonthFilter, statusFilter, searchTerm]);

  // Estatísticas Globais
  const stats = useMemo(() => {
    const totalActions = actions.length;
    const completedActions = actions.filter(a => a.status === 'CONCLUÍDA').length;
    const totalParticipants = actions.reduce((acc, a) => acc + (a.participantCount || 0), 0);
    
    // Contagem por Mês
    const actionsPerMonth: Record<string, number> = {};
    OFFICIAL_CALENDAR_2026.forEach(m => {
      actionsPerMonth[m.id] = actions.filter(a => a.month === m.id).length;
    });

    // Meses com pelo menos 1 ação
    const activeMonthsCount = Object.values(actionsPerMonth).filter(c => c > 0).length;
    const completionCoverage = Math.round((activeMonthsCount / 10) * 100);

    return {
      totalActions,
      completedActions,
      totalParticipants,
      actionsPerMonth,
      activeMonthsCount,
      completionCoverage
    };
  }, [actions]);

  return (
    <div className="space-y-6">
      
      {/* HEADER MASTER DO SUBMÓDULO DO CALENDÁRIO */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={13} />
            Documento Oficial SEDUC/MT • Ano Letivo 2026
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <CalendarDays className="text-amber-400" size={28} />
            Calendário do Núcleo de Mediação Escolar
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
            Planejamento pedagógico e restaurativo, orientativos oficiais, marcos legais e registro sistemático das ações, palestras e círculos de construção de paz executados na escola.
          </p>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-slate-100 font-black text-xs uppercase tracking-wider rounded-2xl border border-white/20 transition-all flex items-center gap-2 shadow-sm"
          >
            <Printer size={16} className="text-amber-400" />
            <span>Imprimir Relatório</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenNewAction()}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus size={18} />
            <span>Registrar Ação do Calendário</span>
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO & INDICADORES DO CALENDÁRIO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <CalendarDays size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total de Ações</p>
            <p className="text-2xl font-black text-slate-900">{stats.totalActions}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estudantes Alcançados</p>
            <p className="text-2xl font-black text-emerald-600">{stats.totalParticipants}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <BookmarkCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Orientativos com Ação</p>
            <p className="text-2xl font-black text-amber-600">{stats.activeMonthsCount} <span className="text-sm text-slate-400 font-semibold">/ 10</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Taxa de Cobertura</p>
            <p className="text-2xl font-black text-purple-600">{stats.completionCoverage}%</p>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO DE VISÕES (ROADMAP OFICIAL vs LISTA DE AÇÕES) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveView('roadmap')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'roadmap'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen size={15} />
            <span>Guia & Calendário Oficial 2026</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('actions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'actions'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCheck size={15} />
            <span>Ações Registradas ({actions.length})</span>
          </button>
        </div>

        {/* Filtros Rápidos */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar tema, turma, mediador..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 w-48 sm:w-60"
            />
          </div>

          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 font-bold text-slate-700 px-3 py-1.5 rounded-xl outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">Todos os Meses</option>
            {OFFICIAL_CALENDAR_2026.map(m => (
              <option key={m.id} value={m.id}>{m.monthName} ({m.orientativo.split(' ')[1]})</option>
            ))}
          </select>
        </div>
      </div>

      {/* VISÃO 1: ROADMAP & GUIA OFICIAL SEDUC 2026 */}
      {activeView === 'roadmap' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {OFFICIAL_CALENDAR_2026.map((monthData, idx) => {
              const monthActions = actions.filter(a => a.month === monthData.id);
              const isFiltered = selectedMonthFilter !== 'ALL' && selectedMonthFilter !== monthData.id;
              if (isFiltered) return null;

              return (
                <div 
                  key={monthData.id}
                  className={`bg-white rounded-3xl border ${monthData.borderColor} shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group`}
                >
                  {/* Topo do Card do Mês */}
                  <div>
                    <div className={`p-5 bg-gradient-to-r ${monthData.color} text-white flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-sm">
                          {String(idx + 2 > 11 ? idx + 2 : idx + 2).padStart(2, '0')}
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/80 block">
                            {monthData.orientativo}
                          </span>
                          <h3 className="text-lg font-black uppercase tracking-tight">
                            {monthData.monthName}
                          </h3>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-white">
                          {monthActions.length} {monthActions.length === 1 ? 'Ação' : 'Ações'}
                        </span>
                      </div>
                    </div>

                    {/* Conteúdo do Orientativo */}
                    <div className="p-6 space-y-4">
                      {/* Tema Central */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Tema Oficial SEDUC
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {monthData.theme}
                        </h4>
                        <p className="text-xs text-slate-600 font-normal leading-relaxed mt-2">
                          {monthData.description}
                        </p>
                      </div>

                      {/* Legislações Vigentes */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1.5">
                          <Scale size={13} className="text-indigo-600" />
                          Legislações & Embasamento Legal:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {monthData.legislations.map((leg, lIdx) => (
                            <span key={lIdx} className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200">
                              {leg}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Datas Comemorativas */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1.5">
                          <Calendar size={13} className="text-amber-600" />
                          Marcos & Datas Comemorativas do Mês:
                        </span>
                        <div className="space-y-1">
                          {monthData.importantDates.map((d, dIdx) => (
                            <div key={dIdx} className="flex items-baseline gap-2 text-xs text-slate-700">
                              <span className="font-black text-indigo-600 shrink-0">{d.date}:</span>
                              <span className="font-normal text-slate-600">{d.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ações Registradas neste Mês */}
                      {monthActions.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            Ações Executadas na Escola ({monthActions.length}):
                          </span>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                            {monthActions.map(act => (
                              <div key={act.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-bold text-slate-800">{act.title}</p>
                                  <p className="text-[10px] text-slate-500">
                                    {act.classes.join(', ') || 'Geral'} • {act.participantCount} participantes
                                  </p>
                                </div>
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[9px] font-black uppercase">
                                  {act.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé do Card: Botão de Ação */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {monthActions.length > 0 ? 'Orientativo em execução' : 'Nenhuma ação registrada'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenNewAction(monthData.id)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                    >
                      <Plus size={14} /> Registrar Ação em {monthData.monthName}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISÃO 2: TABELA & LISTA DE AÇÕES REGISTRADAS */}
      {activeView === 'actions' && (
        <div className="space-y-4">
          {filteredActions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredActions.map(action => {
                const monthInfo = OFFICIAL_CALENDAR_2026.find(m => m.id === action.month);

                return (
                  <div 
                    key={action.id}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                          monthInfo?.badgeBg || 'bg-slate-100'
                        } ${monthInfo?.badgeText || 'text-slate-800'}`}>
                          {action.month} • {action.orientativoNumber}
                        </span>

                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                          {ACTION_TYPE_OPTIONS.find(t => t.id === action.actionType)?.label || action.actionType}
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                          action.status === 'CONCLUÍDA' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {action.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                          <Calendar size={13} />
                          {new Date(action.executionDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>

                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditAction(action)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar ação"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAction(action.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir ação"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Título & Detalhes */}
                    <div className="space-y-2">
                      <h4 className="text-base font-black text-slate-900">{action.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">Tema: {action.theme}</p>
                      
                      {action.description && (
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-150 whitespace-pre-wrap">
                          {action.description}
                        </p>
                      )}

                      {action.outcomes && (
                        <div className="p-3 bg-emerald-50/60 border border-emerald-150 rounded-xl text-xs text-emerald-950">
                          <strong className="block text-emerald-800 font-bold mb-0.5">Resultados / Impactos / Combinados:</strong>
                          {action.outcomes}
                        </div>
                      )}
                    </div>

                    {/* Metadados: Turmas, Participantes, Mediador, Parceiros */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span>
                          Turmas: <strong className="text-slate-800">{action.classes.join(', ') || 'Geral'}</strong>
                        </span>
                        <span>
                          Participantes: <strong className="text-slate-800">{action.participantCount}</strong>
                        </span>
                        {action.partnerships && (
                          <span>
                            Parcerias: <strong className="text-slate-800">{action.partnerships}</strong>
                          </span>
                        )}
                      </div>

                      <div>
                        Registrado por: <strong className="text-slate-800">{action.responsibleMediator}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                <CalendarDays size={32} />
              </div>
              <h4 className="text-base font-bold text-slate-800">Nenhuma ação encontrada com os filtros selecionados</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Você pode registrar palestras, círculos restaurativos e campanhas associadas aos 10 orientativos do calendário oficial 2026.
              </p>
              <button
                type="button"
                onClick={() => handleOpenNewAction()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 active:scale-95"
              >
                <Plus size={16} /> Registrar Primeira Ação
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE AÇÃO DO CALENDÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">
                    {editingActionId ? 'Editar Ação do Calendário' : 'Registrar Ação do Calendário 2026'}
                  </h3>
                  <p className="text-xs text-slate-300">Núcleo de Mediação Escolar • SEDUC/MT</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAction} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              
              {/* Linha 1: Mês & Orientativo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Mês de Referência *
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => handleMonthChangeInForm(e.target.value as MediationCalendarMonth)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    required
                  >
                    {OFFICIAL_CALENDAR_2026.map(m => (
                      <option key={m.id} value={m.id}>{m.monthName} ({m.orientativo})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Tipo de Atividade *
                  </label>
                  <select
                    value={formData.actionType}
                    onChange={(e) => setFormData({ ...formData, actionType: e.target.value as any })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    required
                  >
                    {ACTION_TYPE_OPTIONS.map(t => (
                      <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tema Oficial (Informativo) */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs">
                <span className="text-[10px] font-extrabold uppercase text-indigo-700 block">Tema do Orientativo:</span>
                <p className="font-semibold text-indigo-950 mt-0.5">{formData.theme}</p>
              </div>

              {/* Título da Ação */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Título / Nome da Ação Realizada *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Círculo de Construção de Paz sobre Bullying no 9º Ano A"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 font-semibold"
                  required
                />
              </div>

              {/* Linha 2: Data, Participantes e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Data de Execução *
                  </label>
                  <input
                    type="date"
                    value={formData.executionDate}
                    onChange={(e) => setFormData({ ...formData, executionDate: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Nº de Participantes
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.participantCount}
                    onChange={(e) => setFormData({ ...formData, participantCount: Number(e.target.value) })}
                    placeholder="Ex: 35"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Status da Ação
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="CONCLUÍDA">Concluída</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="PLANEJADA">Planejada</option>
                  </select>
                </div>
              </div>

              {/* Seleção de Turmas Envolvidas */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Turmas / Público-Alvo Envolvido:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SCHOOL_CLASSES.map(cls => {
                    const isSelected = (formData.classes || []).includes(cls);
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => toggleClassSelection(cls)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cls}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mediador Responsável & Parcerias */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Mediador(a) / Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.responsibleMediator}
                    onChange={(e) => setFormData({ ...formData, responsibleMediator: e.target.value })}
                    placeholder="Nome do mediador(a)"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Parcerias / Rede de Apoio (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.partnerships}
                    onChange={(e) => setFormData({ ...formData, partnerships: e.target.value })}
                    placeholder="Ex: Conselho Tutelar, CRAS, Polícia Militar"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              {/* Descrição Detalhada da Ação */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Descrição / Metodologia da Atividade
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva como a atividade foi conduzida, temas debatidos, dinâmicas e reflexões propostas..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 min-h-[80px] resize-none leading-relaxed"
                />
              </div>

              {/* Resultados & Impactos */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  Resultados Alcançados / Combinados Restaurativos (Opcional)
                </label>
                <textarea
                  value={formData.outcomes}
                  onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
                  placeholder="Principais combinados dos estudantes, impactos observados na convivência escolar..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 min-h-[60px] resize-none leading-relaxed"
                />
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 active:scale-95"
                >
                  <Save size={15} />
                  <span>Salvar Registro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE IMPRESSÃO OFICIAL DO RELATÓRIO DO CALENDÁRIO 2026 */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in duration-200">
            {/* Barra de Ações Superior do Relatório (no-print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Visualização de Impressão • Relatório do Calendário de Mediação 2026
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Printer size={14} /> Imprimir / Salvar PDF
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Folha de Impressão A4 */}
            <div className="p-8 sm:p-12 space-y-6 text-slate-900 bg-white max-h-[85vh] overflow-y-auto custom-scrollbar printable-content">
              
              {/* Cabeçalho Oficial SEDUC */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <img src="/brasao_mt.png" alt="MT" className="h-14 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <div>
                    <h1 className="text-xs sm:text-sm font-black uppercase tracking-tight">
                      ESTADO DE MATO GROSSO • SECRETARIA DE ESTADO DE EDUCAÇÃO - SEDUC/MT
                    </h1>
                    <h2 className="text-xs font-bold uppercase text-slate-700">
                      DIRETORIA REGIONAL DE EDUCAÇÃO • DRE SINOP / DRE POLO
                    </h2>
                    <h3 className="text-xs font-extrabold uppercase text-slate-900">
                      ESCOLA ESTADUAL ANDRÉ ANTÔNIO MAGGI
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-600">
                      NÚCLEO DE MEDIAÇÃO ESCOLAR & JUSTIÇA RESTAURATIVA
                    </p>
                  </div>
                  <img src="/logo-escola-oficial.png" alt="Escola" className="h-14 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>

                <div className="bg-slate-100 py-1.5 rounded-lg border border-slate-300">
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    RELATÓRIO OFICIAL DE EXECUÇÃO DO CALENDÁRIO DE MEDIAÇÃO ESCOLAR 2026
                  </h4>
                </div>
              </div>

              {/* Resumo Estatístico */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-slate-500 block">Total de Ações Executadas</span>
                  <span className="text-base font-black text-slate-900">{stats.totalActions}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-slate-500 block">Público / Alunos Impactados</span>
                  <span className="text-base font-black text-slate-900">{stats.totalParticipants}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-slate-500 block">Cobertura dos Orientativos</span>
                  <span className="text-base font-black text-slate-900">{stats.activeMonthsCount} de 10 ({stats.completionCoverage}%)</span>
                </div>
              </div>

              {/* Tabela de Ações por Mês */}
              <div className="space-y-4">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                  1. Detalhamento Cronológico das Ações Executadas
                </h5>

                {actions.length > 0 ? (
                  <table className="w-full text-[11px] border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-left">
                        <th className="p-2 border-r border-slate-300">Data / Mês</th>
                        <th className="p-2 border-r border-slate-300">Orientativo & Tema</th>
                        <th className="p-2 border-r border-slate-300">Ação / Metodologia</th>
                        <th className="p-2 border-r border-slate-300">Público / Turmas</th>
                        <th className="p-2 border-r border-slate-300 text-center">Partic.</th>
                        <th className="p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actions.map((act, idx) => (
                        <tr key={act.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="p-2 border-t border-r border-slate-300 font-semibold whitespace-nowrap">
                            {new Date(act.executionDate + 'T12:00:00').toLocaleDateString('pt-BR')}<br />
                            <span className="text-[9px] text-slate-500 uppercase">{act.month}</span>
                          </td>
                          <td className="p-2 border-t border-r border-slate-300">
                            <strong className="text-slate-900 block">{act.orientativoNumber}</strong>
                            <span className="text-[10px] text-slate-600">{act.theme}</span>
                          </td>
                          <td className="p-2 border-t border-r border-slate-300">
                            <strong className="text-slate-900 block">{act.title}</strong>
                            <span className="text-[10px] text-slate-600">{act.description}</span>
                          </td>
                          <td className="p-2 border-t border-r border-slate-300">
                            {act.classes.join(', ') || act.targetAudience || 'Geral'}
                          </td>
                          <td className="p-2 border-t border-r border-slate-300 text-center font-bold">
                            {act.participantCount}
                          </td>
                          <td className="p-2 border-t border-slate-300 text-center font-bold uppercase text-[9px]">
                            {act.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-slate-500 italic text-center py-4">
                    Nenhuma ação registrada no calendário até o momento.
                  </p>
                )}
              </div>

              {/* Quadro Síntese dos Orientativos */}
              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                  2. Matriz dos Orientativos SEDUC/MT do Núcleo de Mediação 2026
                </h5>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {OFFICIAL_CALENDAR_2026.map(m => {
                    const count = actions.filter(a => a.month === m.id).length;
                    return (
                      <div key={m.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900 uppercase">{m.monthName} ({m.orientativo.split(' ')[1]}): </strong>
                          <span className="text-slate-600">{m.theme.substring(0, 45)}...</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded font-black text-[9px] shrink-0 ml-2 ${
                          count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {count} {count === 1 ? 'Ação' : 'Ações'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assinaturas Oficiais */}
              <div className="pt-10 grid grid-cols-2 gap-12 text-center text-xs text-slate-800">
                <div className="border-t border-slate-800 pt-2">
                  <p className="font-bold uppercase">{user?.name ? `${user.name}` : 'Professor(a) Mediador(a)'}</p>
                  <p className="text-[10px] text-slate-600 uppercase">Núcleo de Mediação Escolar • SEDUC/MT</p>
                </div>
                <div className="border-t border-slate-800 pt-2">
                  <p className="font-bold uppercase">Gestão Escolar / Coordenação Pedagógica</p>
                  <p className="text-[10px] text-slate-600 uppercase">EE André Antônio Maggi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MediationCalendarManager;
