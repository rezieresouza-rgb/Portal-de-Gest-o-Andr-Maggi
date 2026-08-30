import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  UserCheck,
  GraduationCap,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Shield,
  FileText,
  AlertTriangle,
  TrendingUp,
  Package,
  CalendarDays,
  Bell,
  HeartHandshake
} from 'lucide-react';
import { User as UserType } from '../types';
import { SCHOOL_CLASSES } from '../constants/initialData';
import { supabase } from '../supabaseClient';

interface TeacherDashboardHomeProps {
  user: UserType;
  onNavigate: (tabId: string) => void;
}

const TeacherDashboardHome: React.FC<TeacherDashboardHomeProps> = ({ user, onNavigate }) => {
  const [todayDate, setTodayDate] = useState('');
  const [greeting, setGreeting] = useState('Olá');
  const [recentOccurrencesCount, setRecentOccurrencesCount] = useState(0);
  const [recentAttendanceCount, setRecentAttendanceCount] = useState(0);
  const [pendingPlansCount, setPendingPlansCount] = useState(0);
  const [riskStudents, setRiskStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) setGreeting('Bom dia');
    else if (hour >= 12 && hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setTodayDate(now.toLocaleDateString('pt-BR', options));

    fetchDashboardMetrics();
  }, [user]);

  const fetchDashboardMetrics = async () => {
    setLoading(false);
    try {
      const todayIso = new Date().toISOString().split('T')[0];

      // Occurrences
      const { count: occCount } = await supabase
        .from('occurrences')
        .select('*', { count: 'exact', head: true })
        .eq('responsible_name', user.name);

      if (occCount !== null) setRecentOccurrencesCount(occCount);

      // Attendance today
      const { count: attCount } = await supabase
        .from('class_attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_name', user.name)
        .eq('date', todayIso);

      if (attCount !== null) setRecentAttendanceCount(attCount);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* BANNER PRINCIPAL COM SAUDAÇÃO E ATALHOS RÁPIDOS */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-8 md:p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <GraduationCap size={240} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={12} /> Painel Docente 2026
              </span>
              <span className="text-white/40 text-xs">•</span>
              <span className="text-blue-200 text-xs font-bold capitalize">{todayDate}</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
              {greeting}, Prof. {user.name ? user.name.split(' ')[0] : 'Docente'}! 👋
            </h1>

            <p className="text-blue-100/70 text-xs md:text-sm font-medium max-w-2xl leading-relaxed">
              Bem-vindo ao seu ambiente pedagógico digital da <strong>E.E. André Antônio Maggi</strong>. Tenha controle completo de presenças, avaliações, planos de aula e acompanhamento dos estudantes.
            </p>
          </div>

          {/* ATALHO RÁPIDO: CHAMADA DO DIA */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => onNavigate('attendance')}
              className="px-8 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 flex-1 lg:flex-none border border-white/20"
            >
              <UserCheck size={20} strokeWidth={2.5} />
              Fazer Chamada de Hoje
            </button>
            
            <button
              onClick={() => onNavigate('grades')}
              className="px-6 py-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-xs tracking-widest backdrop-blur-md transition-all flex items-center justify-center gap-2.5 flex-1 lg:flex-none border border-white/10"
            >
              <GraduationCap size={18} />
              Lançar Notas
            </button>
          </div>
        </div>

        {/* STATS RÁPIDOS NO BANNER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Chamadas Hoje</p>
            <p className="text-2xl font-black text-white mt-1">{recentAttendanceCount} aula(s)</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">Ocorrências Ativas</p>
            <p className="text-2xl font-black text-white mt-1">{recentOccurrencesCount} registro(s)</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Bimestre Ativo</p>
            <p className="text-2xl font-black text-white mt-1">3º Bimestre</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest">DRE Responsável</p>
            <p className="text-2xl font-black text-white mt-1">DRE Sinop</p>
          </div>
        </div>
      </div>

      {/* GRADE DE ACESSO RÁPIDO AOS RECURSOS DOCENTES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Recursos Pedagógicos</h2>
            <p className="text-xs text-gray-500 font-medium">Acesso direto a todas as ferramentas do seu diário escolar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* CARD 1: DIÁRIO DE PRESENÇA */}
          <div 
            onClick={() => onNavigate('attendance')}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <UserCheck size={26} />
              </div>
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                Diário de Presença
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Chamada rápida em 1 clique, cálculo de frequência e alerta de faltas SEDUC.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-black text-blue-600 uppercase tracking-wider">
              <span>Abrir Diário</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 2: LANÇADOR DE NOTAS */}
          <div 
            onClick={() => onNavigate('grades')}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                <GraduationCap size={26} />
              </div>
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight group-hover:text-amber-600 transition-colors">
                Lançar Notas
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Lançamento bimestral com semáforo de notas, recuperação e média da turma.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-black text-amber-600 uppercase tracking-wider">
              <span>Lançar Avaliações</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 3: OCORRÊNCIAS & ENCAMINHAMENTOS */}
          <div 
            onClick={() => onNavigate('occurrences')}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                <AlertCircle size={26} />
              </div>
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                Ocorrências & Mediação
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Triagem inteligente para Coordenação, Cívico-Militar ou Mediação Escolar.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-black text-emerald-600 uppercase tracking-wider">
              <span>Registrar Fato</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 4: ROTEIRO PEDAGÓGICO */}
          <div 
            onClick={() => onNavigate('lesson_plan')}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                <BookOpen size={26} />
              </div>
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight group-hover:text-purple-600 transition-colors">
                Roteiro Pedagógico
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Planos de aula alinhados à BNCC/DCRC com parecer da Coordenação.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-black text-purple-600 uppercase tracking-wider">
              <span>Criar Roteiro</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>

      {/* SEÇÃO INFERIOR: MURAL DE INFORMATIVOS & CALENDÁRIO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MURAL DE AVISOS */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Mural & Avisos da Escola</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Informes da Coordenação e Direção</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase">
              Atualizado
            </span>
          </div>

          <div className="space-y-3.5">
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-4">
              <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
                <CalendarDays size={16} />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-blue-900 uppercase">Fechamento do 3º Bimestre</h4>
                  <span className="text-[10px] font-bold text-blue-600 uppercase">Em breve</span>
                </div>
                <p className="text-xs text-blue-800/80 font-medium">
                  Lembramos a todos os docentes que as notas das avaliações e recuperações paralelas devem ser lançadas no sistema até o encerramento do bimestre.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-start gap-4">
              <div className="p-2 bg-amber-600 text-white rounded-xl shrink-0 mt-0.5">
                <AlertTriangle size={16} />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-amber-900 uppercase">Busca Ativa Escolar & Infrequência</h4>
                  <span className="text-[10px] font-bold text-amber-600 uppercase">Atenção</span>
                </div>
                <p className="text-xs text-amber-800/80 font-medium">
                  Alunos com 5 faltas consecutivas ou 25% de faltas na disciplina devem ser reportados imediatamente via Ocorrências para acionamento da equipe de Busca Ativa.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CARD LATERAL: DIRETRIZES DOCENTES */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-between space-y-6 border border-white/10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <Shield size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-black text-base uppercase tracking-tight">Diretrizes SEDUC/MT</h3>
                <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">Padrão André Maggi</p>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-blue-100/80 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Chamada diária por período letivo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Planos de aula com habilidades BNCC</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Encaminhamentos rápidos para Mediação</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Recuperação paralela contínua</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-center">
            <p className="text-[9px] font-black uppercase text-amber-300 tracking-widest">Suporte Pedagógico</p>
            <p className="text-xs font-bold text-white mt-0.5">Coordenação E.E. André Maggi</p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default TeacherDashboardHome;
