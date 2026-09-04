
import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  CookingPot,
  Brush,
  Landmark,
  HeartHandshake,
  PartyPopper,
  Users,
  ShieldCheck,
  Star,
  Sparkles,
  Trophy,
  Book,
  Bus,
  ClipboardList,
  Monitor,
  Briefcase,
  Calculator,
  Compass,
  Palette,
  Atom,
  Globe,
  Dumbbell,
  Search,
  Calendar,
  Languages,
  Brain,
  Award,
  Share2,
  Copy,
  Check,
  Filter,
  Flame
} from 'lucide-react';
import { SchoolCelebration } from '../types';

const CELEBRATIONS: SchoolCelebration[] = [
  // --- JANEIRO ---
  {
    id: 'c-jan-07',
    title: 'Dia do Leitor & Letras',
    day: 7,
    month: 1,
    category: 'Linguagens & Letras',
    subjectArea: 'Língua Portuguesa & Literatura',
    targetGroup: 'DOCENTES',
    iconType: 'LETRAS',
    tributeMessage: 'Homenagem aos docentes que inspiram o amor pela leitura, pelas histórias e pela literatura!'
  },

  // --- MARÇO ---
  {
    id: 'c-mar-15',
    title: 'Dia da Escola',
    day: 15,
    month: 3,
    category: 'Institucional',
    targetGroup: 'COMUNIDADE',
    iconType: 'GERAL',
    tributeMessage: 'Celebrando o templo do saber, convivência e transformação cidadã da nossa comunidade!'
  },
  {
    id: 'c-mar-21',
    title: 'Dia Internacional da Poesia',
    day: 21,
    month: 3,
    category: 'Linguagens & Literatura',
    subjectArea: 'Língua Portuguesa & Literatura',
    targetGroup: 'DOCENTES',
    iconType: 'LETRAS',
    tributeMessage: 'Reconhecimento aos professores que despertam a sensibilidade poética e a arte das palavras em nossos alunos.'
  },

  // --- ABRIL ---
  {
    id: 'c-abr-09',
    title: 'Dia do Bibliotecário & Mediadores de Leitura',
    day: 9,
    month: 4,
    category: 'Biblioteca Escolar',
    targetGroup: 'SERVIDORES',
    iconType: 'BIBLIOTECA',
    tributeMessage: 'Gratidão a quem cuida do acervo de conhecimento e orienta as pesquisas de nossa escola!'
  },
  {
    id: 'c-abr-22',
    title: 'Dia do Planeta Terra & Meio Ambiente',
    day: 22,
    month: 4,
    category: 'Ciências Humanas & da Natureza',
    subjectArea: 'Geografia & Ciências',
    targetGroup: 'DOCENTES',
    iconType: 'GEOGRAFIA',
    tributeMessage: 'Homenagem aos professores que ensinam a sustentabilidade, a preservação do planeta e o respeito aos ecossistemas.'
  },

  // --- MAIO (Mês das Exatas, Pedagogia e Geografia) ---
  {
    id: 'c-mai-06',
    title: 'Dia Nacional da Matemática',
    day: 6,
    month: 5,
    category: 'Ciências Exatas',
    subjectArea: 'Matemática',
    targetGroup: 'DOCENTES',
    iconType: 'MATEMATICA',
    tributeMessage: 'Nossa vibrante homenagem aos mestres do raciocínio lógico, das fórmulas e da geometria que desvendam a magia dos números!'
  },
  {
    id: 'c-mai-16',
    title: 'Dia do Zelador / AAE',
    day: 16,
    month: 5,
    category: 'Apoio Administrativo',
    targetGroup: 'SERVIDORES',
    iconType: 'ZELADOR',
    tributeMessage: 'Reconhecimento fundamental aos profissionais que mantêm nossa escola limpa, acolhedora e segura!'
  },
  {
    id: 'c-mai-19',
    title: 'Dia do Físico & Ciências Físicas',
    day: 19,
    month: 5,
    category: 'Ciências da Natureza',
    subjectArea: 'Física',
    targetGroup: 'DOCENTES',
    iconType: 'FISICA',
    tributeMessage: 'Parabéns aos professores que explicam as leis do universo, a energia, a gravidade e o movimento da matéria!'
  },
  {
    id: 'c-mai-20',
    title: 'Dia Nacional do Pedagogo',
    day: 20,
    month: 5,
    category: 'Pedagogia & Educação Básica',
    subjectArea: 'Pedagogia & Anos Iniciais',
    targetGroup: 'DOCENTES',
    iconType: 'PEDAGOGIA',
    tributeMessage: 'Homenagem aos pedagogos que constroem as sólidas bases do aprendizado, da alfabetização e da metodologia humanizada!'
  },
  {
    id: 'c-mai-24',
    title: 'Dia do Teatrólogo & Artes Cênicas',
    day: 24,
    month: 5,
    category: 'Linguagens & Artes',
    subjectArea: 'Artes',
    targetGroup: 'DOCENTES',
    iconType: 'ARTES',
    tributeMessage: 'Parabéns aos professores de artes e teatro que estimulam a expressão corporal, criatividade e desenvoltura cênica!'
  },
  {
    id: 'c-mai-29',
    title: 'Dia do Geógrafo',
    day: 29,
    month: 5,
    category: 'Ciências Humanas',
    subjectArea: 'Geografia',
    targetGroup: 'DOCENTES',
    iconType: 'GEOGRAFIA',
    tributeMessage: 'Reconhecimento aos professores de Geografia que expandem os horizontes do espaço geográfico, geopolítica e relevo!'
  },

  // --- JUNHO ---
  {
    id: 'c-jun-18',
    title: 'Dia do Químico',
    day: 18,
    month: 6,
    category: 'Ciências da Natureza',
    subjectArea: 'Química',
    targetGroup: 'DOCENTES',
    iconType: 'QUIMICA',
    tributeMessage: 'Homenagem aos docentes que desvendam as reações, as moléculas e as fascinantes transformações da matéria!'
  },
  {
    id: 'c-jun-20',
    title: 'Dia do Vigilante Escolar',
    day: 20,
    month: 6,
    category: 'Segurança Escolar',
    targetGroup: 'SERVIDORES',
    iconType: 'VIGILANTE',
    tributeMessage: 'Gratidão aos vigilantes que zelam pela integridade e segurança de todos os estudantes e servidores.'
  },

  // --- JULHO ---
  {
    id: 'c-jul-09',
    title: 'Dia dos Docentes de Artes Visuais',
    day: 9,
    month: 7,
    category: 'Linguagens & Artes',
    subjectArea: 'Artes',
    targetGroup: 'DOCENTES',
    iconType: 'ARTES',
    tributeMessage: 'Nossos aplausos aos professores de artes visuais que colorem o aprendizado com cultura, estética e imaginação!'
  },
  {
    id: 'c-jul-25',
    title: 'Dia do Motorista Escolar',
    day: 25,
    month: 7,
    category: 'Transporte Escolar',
    targetGroup: 'SERVIDORES',
    iconType: 'MOTORISTA',
    tributeMessage: 'Homenagem aos motoristas que garantem o transporte diário e seguro de nossos alunos até os portões da escola!'
  },

  // --- AGOSTO (Mês das Humanidades e Ed. Física) ---
  {
    id: 'c-ago-06',
    title: 'Dia Nacional dos Profissionais da Educação',
    day: 6,
    month: 8,
    category: 'Todos os Profissionais',
    targetGroup: 'COMUNIDADE',
    iconType: 'GERAL',
    tributeMessage: 'Celebração coletiva a cada servidor, docente e técnico que dedica seus dias à educação pública mato-grossense!'
  },
  {
    id: 'c-ago-11',
    title: 'Dia do Estudante & do Magistério',
    day: 11,
    month: 8,
    category: 'Comunidade Escolar',
    targetGroup: 'COMUNIDADE',
    iconType: 'GERAL',
    tributeMessage: 'Parabéns a todos os estudantes e mestres que mantêm viva a chama do conhecimento e do futuro!'
  },
  {
    id: 'c-ago-16',
    title: 'Dia do Filósofo & Sociólogo',
    day: 16,
    month: 8,
    category: 'Ciências Humanas',
    subjectArea: 'Filosofia & Sociologia',
    targetGroup: 'DOCENTES',
    iconType: 'FILOSOFIA',
    tributeMessage: 'Nossa honra aos professores de Filosofia e Sociologia que estimulam a reflexão crítica, a ética, a razão e a cidadania!'
  },
  {
    id: 'c-ago-19',
    title: 'Dia do Historiador',
    day: 19,
    month: 8,
    category: 'Ciências Humanas',
    subjectArea: 'História',
    targetGroup: 'DOCENTES',
    iconType: 'HISTORIA',
    tributeMessage: 'Homenagem aos professores de História que preservam a memória, interpretam os fatos e ensinam as raízes de nossa civilização!'
  },
  {
    id: 'c-ago-22',
    title: 'Dia do Coordenador Pedagógico',
    day: 22,
    month: 8,
    category: 'Coordenação Pedagógica',
    targetGroup: 'SERVIDORES',
    iconType: 'COORDENADOR',
    tributeMessage: 'Aos coordenadores pedagógicos que articulam o planejamento, o apoio aos docentes e o sucesso de cada turma!'
  },
  {
    id: 'c-ago-25',
    title: 'Dia do Soldado & Monitores Cívico-Militares',
    day: 25,
    month: 8,
    category: 'Cívico-Militar',
    targetGroup: 'SERVIDORES',
    iconType: 'SOLDADO',
    tributeMessage: 'Reconhecimento à equipe cívico-militar pela disciplina, formação de valores cívicos e civismo!'
  },
  {
    id: 'c-ago-27',
    title: 'Dia do Psicólogo Escolar',
    day: 27,
    month: 8,
    category: 'Equipe Psicossocial',
    targetGroup: 'SERVIDORES',
    iconType: 'PSICOSSOCIAL',
    tributeMessage: 'Gratidão à equipe psicossocial pela escuta atenta, mediação humanizada e acolhimento emocional da comunidade escolar!'
  },

  // --- SETEMBRO (Mês da Biologia, Ed. Física e Alfabetização) ---
  {
    id: 'c-set-01',
    title: 'Dia do Profissional de Educação Física',
    day: 1,
    month: 9,
    category: 'Linguagens & Saúde',
    subjectArea: 'Educação Física',
    targetGroup: 'DOCENTES',
    iconType: 'ED_FISICA',
    tributeMessage: 'Parabéns aos professores de Educação Física que promovem a saúde, a motricidade, o desporto e o espírito de equipe!'
  },
  {
    id: 'c-set-03',
    title: 'Dia do Biólogo & Ciências da Natureza',
    day: 3,
    month: 9,
    category: 'Ciências da Natureza',
    subjectArea: 'Ciências da Natureza & Biologia',
    targetGroup: 'DOCENTES',
    iconType: 'BIOLOGIA',
    tributeMessage: 'Homenagem aos professores de Biologia e Ciências que ensinam a beleza da vida, da biodiversidade e do ecossistema mato-grossense!'
  },
  {
    id: 'c-set-08',
    title: 'Dia Mundial da Alfabetização',
    day: 8,
    month: 9,
    category: 'Linguagens & Alfabetização',
    subjectArea: 'Língua Portuguesa & Pedagogia',
    targetGroup: 'DOCENTES',
    iconType: 'LETRAS',
    tributeMessage: 'Nossa profunda reverência aos alfabetizadores que abrem as portas do mundo letrado para cada cidadão!'
  },
  {
    id: 'c-set-21',
    title: 'Dia da Árvore & Botânica',
    day: 21,
    month: 9,
    category: 'Ciências da Natureza',
    subjectArea: 'Ciências da Natureza & Biologia',
    targetGroup: 'DOCENTES',
    iconType: 'BIOLOGIA',
    tributeMessage: 'Homenagem aos docentes que inspiram o cuidado com o Cerrado, as florestas e a sustentabilidade ambiental.'
  },
  {
    id: 'c-set-30',
    title: 'Dia do Secretário Escolar',
    day: 30,
    month: 9,
    category: 'Secretaria Escolar',
    targetGroup: 'SERVIDORES',
    iconType: 'SECRETARIA',
    tributeMessage: 'Aos guardiões da documentação, registros acadêmicos e vida escolar de toda a comunidade!'
  },

  // --- OUTUBRO (Mês Geral dos Professores e Servidores) ---
  {
    id: 'c-out-05',
    title: 'Dia Mundial dos Professores (UNESCO)',
    day: 5,
    month: 10,
    category: 'Docência Global',
    subjectArea: 'Todas as Formações',
    targetGroup: 'DOCENTES',
    iconType: 'PROFESSOR',
    tributeMessage: 'Celebrando a nobreza e o impacto transformador da profissão docente em todas as nações!'
  },
  {
    id: 'c-out-15',
    title: 'Dia do Professor',
    day: 15,
    month: 10,
    category: 'Grande Celebração Docente',
    subjectArea: 'Todas as Formações',
    targetGroup: 'DOCENTES',
    iconType: 'PROFESSOR',
    tributeMessage: 'Nossa mais sincera e afetuosa homenagem a todos os professores da EE André Maggi que dedicam a vida a iluminar caminhos!'
  },
  {
    id: 'c-out-19',
    title: 'Dia do Técnico em Informática & Robótica',
    day: 19,
    month: 10,
    category: 'Tecnologia Educacional',
    subjectArea: 'Tecnologia & Robótica',
    targetGroup: 'SERVIDORES',
    iconType: 'TI',
    tributeMessage: 'Homenagem aos profissionais que mantêm nossa infraestrutura digital e laboratórios em pleno funcionamento!'
  },
  {
    id: 'c-out-20',
    title: 'Dia do Poeta & Literatura',
    day: 20,
    month: 10,
    category: 'Linguagens & Literatura',
    subjectArea: 'Língua Portuguesa & Literatura',
    targetGroup: 'DOCENTES',
    iconType: 'LETRAS',
    tributeMessage: 'Reconhecimento aos professores de Literatura que ensinam a contemplar a arte, a metáfora e a riqueza lírica.'
  },
  {
    id: 'c-out-28',
    title: 'Dia do Servidor Público',
    day: 28,
    month: 10,
    category: 'Todos os Servidores',
    targetGroup: 'SERVIDORES',
    iconType: 'GERAL',
    tributeMessage: 'Parabéns a todos os servidores públicos dedicados que fazem o serviço público acontecer com excelência!'
  },
  {
    id: 'c-out-29',
    title: 'Dia Nacional do Livro',
    day: 29,
    month: 10,
    category: 'Linguagens & Cultura',
    subjectArea: 'Língua Portuguesa & Literatura',
    targetGroup: 'DOCENTES',
    iconType: 'LETRAS',
    tributeMessage: 'Homenagem aos docentes que cultivam o hábito da leitura e a paixão pelas grandes obras brasileiras e universais.'
  },
  {
    id: 'c-out-30',
    title: 'Dia da Merendeira Escolar',
    day: 30,
    month: 10,
    category: 'Nutrição Escolar',
    targetGroup: 'SERVIDORES',
    iconType: 'MERENDEIRA',
    tributeMessage: 'Nosso carinho e gratidão às merendeiras que preparam a alimentação diária com tanto amor e dedicação para nossos estudantes!'
  },

  // --- NOVEMBRO (Mês da Língua Portuguesa e Gestão) ---
  {
    id: 'c-nov-05',
    title: 'Dia Nacional da Língua Portuguesa',
    day: 5,
    month: 11,
    category: 'Linguagens',
    subjectArea: 'Língua Portuguesa & Literatura',
    targetGroup: 'DOCENTES',
    iconType: 'LETRAS',
    tributeMessage: 'Homenagem aos professores de Língua Portuguesa que ensinam a riqueza de nosso idioma, a gramática, redação e oratória!'
  },
  {
    id: 'c-nov-12',
    title: 'Dia do Diretor Escolar',
    day: 12,
    month: 11,
    category: 'Gestão Escolar',
    targetGroup: 'SERVIDORES',
    iconType: 'GESTAO',
    tributeMessage: 'Parabéns à direção escolar pela liderança firme, visão estratégica e dedicação contínua ao crescimento da unidade!'
  },
  {
    id: 'c-nov-17',
    title: 'Dia da Criatividade & Inovação',
    day: 17,
    month: 11,
    category: 'Tecnologias & Metodologias',
    subjectArea: 'Robótica & Projetos Integradores',
    targetGroup: 'DOCENTES',
    iconType: 'TI',
    tributeMessage: 'Homenagem aos professores de robótica e inovação que estimulam a cultura maker e a solução criativa de problemas!'
  },
  {
    id: 'c-nov-20',
    title: 'Dia Nacional da Consciência Negra',
    day: 20,
    month: 11,
    category: 'Ciências Humanas & Diversidade',
    subjectArea: 'História & Humanidades',
    targetGroup: 'DOCENTES',
    iconType: 'HISTORIA',
    tributeMessage: 'Reconhecimento aos professores de História e Humanidades que promovem a igualdade, o respeito à diversidade e a ancestralidade.'
  },

  // --- DEZEMBRO (Mês das Línguas Estrangeiras, Artes e Direitos Humanos) ---
  {
    id: 'c-dez-04',
    title: 'Dia do Orientador Educacional',
    day: 4,
    month: 12,
    category: 'Equipe Multidisciplinar',
    targetGroup: 'SERVIDORES',
    iconType: 'ORIENTADOR',
    tributeMessage: 'Aos orientadores educacionais que guiam os projetos de vida, a mediação e a conduta ética dos jovens!'
  },
  {
    id: 'c-dez-08',
    title: 'Dia do Artista & Cultura Escolar',
    day: 8,
    month: 12,
    category: 'Linguagens & Artes',
    subjectArea: 'Artes',
    targetGroup: 'DOCENTES',
    iconType: 'ARTES',
    tributeMessage: 'Parabéns aos professores de Artes que despertam o talento, o desenho, a música e as tradições culturais!'
  },
  {
    id: 'c-dez-10',
    title: 'Dia Internacional dos Direitos Humanos',
    day: 10,
    month: 12,
    category: 'Cidadania & Humanidades',
    subjectArea: 'Filosofia, Sociologia & Projeto de Vida',
    targetGroup: 'DOCENTES',
    iconType: 'FILOSOFIA',
    tributeMessage: 'Homenagem aos docentes que constroem a cultura de paz, justiça social e respeito universal aos direitos humanos.'
  },
  {
    id: 'c-dez-15',
    title: 'Dia das Línguas Estrangeiras (Inglês / Espanhol)',
    day: 15,
    month: 12,
    category: 'Linguagens & Idiomas',
    subjectArea: 'Línguas Estrangeiras (Inglês / Espanhol)',
    targetGroup: 'DOCENTES',
    iconType: 'IDIOMAS',
    tributeMessage: 'Homenagem aos professores de Língua Inglesa e Espanhola que abrem as fronteiras do mundo e conectam culturas globais!'
  }
];

const CelebrationIcon = ({ type, size = 20 }: { type: string; size?: number }) => {
  switch (type) {
    case 'MATEMATICA': return <Calculator size={size} />;
    case 'LETRAS': return <Book size={size} />;
    case 'BIOLOGIA': return <Compass size={size} />;
    case 'HISTORIA': return <Landmark size={size} />;
    case 'GEOGRAFIA': return <Globe size={size} />;
    case 'ED_FISICA': return <Dumbbell size={size} />;
    case 'ARTES': return <Palette size={size} />;
    case 'FISICA': return <Atom size={size} />;
    case 'QUIMICA': return <Atom size={size} />;
    case 'FILOSOFIA': return <Brain size={size} />;
    case 'PEDAGOGIA': return <GraduationCap size={size} />;
    case 'IDIOMAS': return <Languages size={size} />;
    case 'PROFESSOR': return <GraduationCap size={size} />;
    case 'MERENDEIRA': return <CookingPot size={size} />;
    case 'ZELADOR': return <Brush size={size} />;
    case 'SECRETARIA': return <Landmark size={size} />;
    case 'GESTAO': return <ShieldCheck size={size} />;
    case 'PSICOSSOCIAL': return <HeartHandshake size={size} />;
    case 'COORDENADOR': return <ClipboardList size={size} />;
    case 'BIBLIOTECA': return <Book size={size} />;
    case 'MOTORISTA': return <Bus size={size} />;
    case 'TI': return <Monitor size={size} />;
    case 'VIGILANTE': return <ShieldCheck size={size} />;
    case 'ORIENTADOR': return <Users size={size} />;
    case 'SOLDADO': return <ShieldCheck size={size} />;
    default: return <Briefcase size={size} />;
  }
};

const CelebrationsWall: React.FC = () => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'DOCENTES' | 'SERVIDORES'>('ALL');
  const [selectedSubjectArea, setSelectedSubjectArea] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCelebrationForDetail, setSelectedCelebrationForDetail] = useState<SchoolCelebration | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lista única de áreas de formação docente disponíveis
  const subjectAreasList = useMemo(() => {
    const set = new Set<string>();
    CELEBRATIONS.forEach(c => {
      if (c.subjectArea) set.add(c.subjectArea);
    });
    return Array.from(set).sort();
  }, []);

  // Celebrações filtradas
  const filteredCelebrations = useMemo(() => {
    return CELEBRATIONS.filter(c => {
      // Filtro de Grupo
      if (selectedFilter === 'DOCENTES' && c.targetGroup !== 'DOCENTES') return false;
      if (selectedFilter === 'SERVIDORES' && c.targetGroup !== 'SERVIDORES') return false;

      // Filtro de Área de Formação
      if (selectedSubjectArea !== 'ALL' && c.subjectArea !== selectedSubjectArea) return false;

      // Filtro de Busca
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesCategory = c.category.toLowerCase().includes(q);
        const matchesSubject = (c.subjectArea || '').toLowerCase().includes(q);
        const matchesMsg = (c.tributeMessage || '').toLowerCase().includes(q);
        return matchesTitle || matchesCategory || matchesSubject || matchesMsg;
      }

      return true;
    }).sort((a, b) => {
      // Ordena a partir do mês e dia atual
      const monthDiffA = (a.month - currentMonth + 12) % 12;
      const monthDiffB = (b.month - currentMonth + 12) % 12;

      if (monthDiffA !== monthDiffB) return monthDiffA - monthDiffB;
      return a.day - b.day;
    });
  }, [selectedFilter, selectedSubjectArea, searchTerm, currentMonth]);

  const isCelebrationToday = useMemo(() => {
    return CELEBRATIONS.find(c => c.day === currentDay && c.month === currentMonth);
  }, [currentDay, currentMonth]);

  const handleCopyTribute = (c: SchoolCelebration) => {
    const textToCopy = `🏆 *Mural de Honra - E.E. André Maggi*\n🎉 *${c.title}* (${c.day.toString().padStart(2, '0')}/${c.month.toString().padStart(2, '0')})\n${c.subjectArea ? `🎓 *Área de Formação:* ${c.subjectArea}\n` : ''}\n"${c.tributeMessage || 'Parabéns pelo trabalho transformador!'}"\n\n_Gestão Humanizada 2026_ ✨`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 relative overflow-hidden h-full flex flex-col transition-all hover:shadow-md">
      
      {/* Background Decorativo */}
      <div className="absolute -top-4 -right-4 p-8 opacity-5 pointer-events-none">
        <PartyPopper size={140} className="text-amber-500" />
      </div>

      {/* CABEÇALHO DO MURAL DE HONRA */}
      <div className="border-b border-slate-100 pb-4 relative z-10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl text-white shadow-md shadow-amber-500/20">
              <Trophy size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                Mural de Honra
                <span className="text-[10px] font-black text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase">
                  Docentes & Servidores
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Calendário de Homenagem aos Professores por Formação e Profissionais da Educação
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                setSelectedFilter('ALL');
                setSelectedSubjectArea('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedFilter === 'ALL' && selectedSubjectArea === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedFilter('DOCENTES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                selectedFilter === 'DOCENTES'
                  ? 'bg-amber-500 text-white shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap size={14} /> Formação Docente
            </button>
            <button
              onClick={() => {
                setSelectedFilter('SERVIDORES');
                setSelectedSubjectArea('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedFilter === 'SERVIDORES'
                  ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Servidores
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS POR FORMAÇÃO & BUSCA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por disciplina, formação (Matemática, História...), data ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Limpar
              </button>
            )}
          </div>

          {selectedFilter === 'DOCENTES' && (
            <div className="w-full sm:w-64 shrink-0">
              <select
                value={selectedSubjectArea}
                onChange={(e) => setSelectedSubjectArea(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-amber-400"
              >
                <option value="ALL">🎓 Todas as Disciplinas / Áreas</option>
                {subjectAreasList.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* DESTAQUE DO DIA (SE HOJE FOR DIA DE HOMENAGEM) */}
      {isCelebrationToday && (
        <div className="p-6 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-[2.5rem] text-white shadow-xl shadow-amber-500/20 animate-in zoom-in-95 duration-500 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-4 opacity-20 animate-pulse pointer-events-none">
            <Sparkles size={100} />
          </div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
              <Flame size={13} className="text-yellow-200 animate-bounce" /> Homenagem do Dia
            </span>
            <button
              onClick={() => handleCopyTribute(isCelebrationToday)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="Copiar mensagem de homenagem"
            >
              {copiedId === isCelebrationToday.id ? <Check size={13} /> : <Share2 size={13} />}
              <span>{copiedId === isCelebrationToday.id ? 'Copiado!' : 'Compartilhar'}</span>
            </button>
          </div>

          <h4 className="text-xl sm:text-2xl font-black leading-tight uppercase mt-1">
            Hoje celebramos o {isCelebrationToday.title}! 🎉
          </h4>
          {isCelebrationToday.subjectArea && (
            <p className="text-xs font-bold text-amber-100 uppercase tracking-wider mt-0.5 flex items-center gap-1">
              <GraduationCap size={14} /> Especialidade: {isCelebrationToday.subjectArea}
            </p>
          )}
          <p className="text-xs font-medium text-white/95 mt-3 italic bg-black/10 p-3 rounded-2xl border border-white/10 leading-relaxed">
            "{isCelebrationToday.tributeMessage || 'Obrigado por transformar nossa escola e inspirar vidas todos os dias!'}"
          </p>
        </div>
      )}

      {/* LISTA DINÂMICA DO CALENDÁRIO DE HOMENAGENS */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1.5 custom-scrollbar min-h-0">
        {filteredCelebrations.length > 0 ? (
          filteredCelebrations.map(c => {
            const isToday = c.day === currentDay && c.month === currentMonth;
            const monthName = new Date(new Date().getFullYear(), c.month - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();

            return (
              <div 
                key={c.id} 
                onClick={() => setSelectedCelebrationForDetail(c)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                  isToday
                    ? 'bg-amber-50/90 border-amber-300 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/30'
                    : 'bg-slate-50/60 border-slate-200/70 hover:bg-white hover:border-amber-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-transform group-hover:scale-105 ${
                    isToday 
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 animate-bounce' 
                      : c.targetGroup === 'DOCENTES'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                        : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                  }`}>
                    <CelebrationIcon type={c.iconType} size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-xs sm:text-sm font-black uppercase leading-tight truncate ${
                        isToday ? 'text-amber-900 font-extrabold' : 'text-slate-800'
                      }`}>
                        {c.title}
                      </p>
                      {c.targetGroup === 'DOCENTES' && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-indigo-100/80 text-indigo-800 border border-indigo-200/60">
                          Docência
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold mt-1 flex-wrap">
                      {c.subjectArea && (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70 truncate">
                          🎓 {c.subjectArea}
                        </span>
                      )}
                      <span className="truncate">{c.category}</span>
                    </div>

                    {c.tributeMessage && (
                      <p className="text-[11px] text-slate-600 italic line-clamp-1 mt-1 font-normal">
                        "{c.tributeMessage}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right pl-2">
                    <p className={`text-xl sm:text-2xl font-black font-mono leading-none ${
                      isToday ? 'text-amber-600 font-extrabold' : 'text-slate-800'
                    }`}>
                      {c.day.toString().padStart(2, '0')}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5">
                      {monthName}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyTribute(c);
                    }}
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                    title="Copiar Homenagem"
                  >
                    {copiedId === c.id ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 space-y-2">
            <Users size={36} className="mx-auto text-slate-300" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-600">
              Nenhuma homenagem encontrada
            </p>
            <p className="text-[11px] text-slate-400">
              Tente alterar os termos de busca ou o filtro de formação selecionado.
            </p>
          </div>
        )}
      </div>

      {/* RODAPÉ DO MURAL */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-indigo-600" />
          <span>Gestão Humanizada • E.E. André Maggi</span>
        </div>
        <span className="font-mono font-black text-indigo-600">Ano Letivo 2026</span>
      </div>

      {/* MODAL DE DETALHES DA HOMENAGEM */}
      {selectedCelebrationForDetail && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200">
                  <CelebrationIcon type={selectedCelebrationForDetail.iconType} size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {selectedCelebrationForDetail.day.toString().padStart(2, '0')}/{selectedCelebrationForDetail.month.toString().padStart(2, '0')} • {selectedCelebrationForDetail.category}
                  </span>
                  <h4 className="text-lg font-black text-slate-900 uppercase mt-1">
                    {selectedCelebrationForDetail.title}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setSelectedCelebrationForDetail(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            {selectedCelebrationForDetail.subjectArea && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1">
                <p className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">
                  🎓 Formação & Área Docente
                </p>
                <p className="text-sm font-bold text-indigo-950">
                  {selectedCelebrationForDetail.subjectArea}
                </p>
              </div>
            )}

            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl space-y-2">
              <p className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1">
                <Sparkles size={14} className="text-amber-600" /> Mensagem de Reconhecimento Institucional
              </p>
              <p className="text-xs text-slate-800 leading-relaxed font-medium italic">
                "{selectedCelebrationForDetail.tributeMessage || 'Parabéns a todos os profissionais que transformam nossa escola diariamente!'}"
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleCopyTribute(selectedCelebrationForDetail)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md active:scale-95"
              >
                {copiedId === selectedCelebrationForDetail.id ? <Check size={15} /> : <Share2 size={15} />}
                <span>{copiedId === selectedCelebrationForDetail.id ? 'Copiado p/ WhatsApp!' : 'Copiar Homenagem'}</span>
              </button>
              <button
                onClick={() => setSelectedCelebrationForDetail(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CelebrationsWall;
