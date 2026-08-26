import React, { useState, useMemo } from 'react';
import {
  Heart,
  UserCheck,
  Calendar,
  Sparkles,
  PartyPopper,
  Flag,
  Palette,
  FlaskConical,
  Smile,
  GraduationCap,
  Award,
  Sun,
  Flame
} from 'lucide-react';

export interface SchoolFestiveDate {
  id: string;
  title: string;
  day: number;
  month: number;
  category: 'FAMÍLIA' | 'CÍVICO' | 'CULTURAL' | 'PEDAGÓGICO' | 'FESTIVO';
  description: string;
  iconType: 'MAES' | 'PAIS' | 'AVOS' | 'FESTA_JUNINA' | 'ESTUDANTE' | 'SOLDADO' | 'PATRIA' | 'CIENCIAS' | 'CRIANCAS' | 'CONSCIENCIA' | 'FORMATURA';
}

const FESTIVE_DATES: SchoolFestiveDate[] = [
  { id: '1', title: 'Dia das Mães', day: 10, month: 5, category: 'FAMÍLIA', description: 'Homenagem especial às mães e famílias da comunidade escolar', iconType: 'MAES' },
  { id: '2', title: 'Festa Junina / Arraiá Escolar', day: 20, month: 6, category: 'CULTURAL', description: 'Tradicional celebração folclórica e integração da comunidade', iconType: 'FESTA_JUNINA' },
  { id: '3', title: 'Dia dos Avós', day: 26, month: 7, category: 'FAMÍLIA', description: 'Celebração da sabedoria e carinho dos avós dos estudantes', iconType: 'AVOS' },
  { id: '4', title: 'Dia do Estudante', day: 11, month: 8, category: 'FESTIVO', description: 'Dia de reconhecer e valorizar o protagonismo dos nossos alunos', iconType: 'ESTUDANTE' },
  { id: '5', title: 'Dia dos Pais', day: 9, month: 8, category: 'FAMÍLIA', description: 'Homenagem especial aos pais e responsáveis', iconType: 'PAIS' },
  { id: '6', title: 'Dia do Soldado', day: 25, month: 8, category: 'CÍVICO', description: 'Reconhecimento ao civismo, disciplina e patrono do Exército', iconType: 'SOLDADO' },
  { id: '7', title: 'Independência do Brasil', day: 7, month: 9, category: 'CÍVICO', description: 'Desfile cívico e exaltação dos símbolos pátrios nacionais', iconType: 'PATRIA' },
  { id: '8', title: 'Feira de Ciências & Inovação', day: 25, month: 9, category: 'PEDAGÓGICO', description: 'Exposição dos projetos científicos e tecnológicos dos alunos', iconType: 'CIENCIAS' },
  { id: '9', title: 'Dia das Crianças', day: 12, month: 10, category: 'FESTIVO', description: 'Semana recreativa com jogos, brincadeiras e lanches especiais', iconType: 'CRIANCAS' },
  { id: '10', title: 'Proclamação da República', day: 15, month: 11, category: 'CÍVICO', description: 'Atividades históricas sobre a democracia brasileira', iconType: 'PATRIA' },
  { id: '11', title: 'Dia da Consciência Negra', day: 20, month: 11, category: 'CULTURAL', description: 'Valorização da história, cultura e igualdade afro-brasileira', iconType: 'CONSCIENCIA' },
  { id: '12', title: 'Formatura & Encerramento Letivo', day: 15, month: 12, category: 'FESTIVO', description: 'Solene encerramento do ano letivo e formatura dos concluintes', iconType: 'FORMATURA' }
];

const MonthNamesMap: Record<number, string> = {
  1: 'JAN', 2: 'FEV', 3: 'MAR', 4: 'ABR', 5: 'MAI', 6: 'JUN',
  7: 'JUL', 8: 'AGO', 9: 'SET', 10: 'OUT', 11: 'NOV', 12: 'DEZ'
};

const EventIcon = ({ type, size = 22 }: { type: string; size?: number }) => {
  switch (type) {
    case 'MAES': return <Heart size={size} className="text-rose-500 fill-rose-100" />;
    case 'PAIS': return <UserCheck size={size} className="text-blue-600" />;
    case 'AVOS': return <Sun size={size} className="text-amber-500" />;
    case 'FESTA_JUNINA': return <Flame size={size} className="text-orange-500 fill-orange-100" />;
    case 'ESTUDANTE': return <GraduationCap size={size} className="text-indigo-600" />;
    case 'SOLDADO': return <Award size={size} className="text-emerald-600" />;
    case 'PATRIA': return <Flag size={size} className="text-emerald-500 fill-emerald-100" />;
    case 'CIENCIAS': return <FlaskConical size={size} className="text-cyan-600" />;
    case 'CRIANCAS': return <Smile size={size} className="text-pink-500" />;
    case 'CONSCIENCIA': return <Palette size={size} className="text-amber-700" />;
    case 'FORMATURA': return <PartyPopper size={size} className="text-purple-600" />;
    default: return <Calendar size={size} className="text-slate-500" />;
  }
};

const SchoolEventsWall: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('TODAS');

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;

  const filteredDates = useMemo(() => {
    let list = FESTIVE_DATES;
    if (activeCategory !== 'TODAS') {
      list = list.filter(d => d.category === activeCategory);
    }
    // Sort chronologically starting from current month
    return [...list].sort((a, b) => {
      const monthDiffA = (a.month - currentMonth + 12) % 12;
      const monthDiffB = (b.month - currentMonth + 12) % 12;
      if (monthDiffA !== monthDiffB) return monthDiffA - monthDiffB;
      return a.day - b.day;
    });
  }, [activeCategory, currentMonth]);

  const todayEvent = useMemo(() => {
    return FESTIVE_DATES.find(d => d.day === currentDay && d.month === currentMonth);
  }, [currentDay, currentMonth]);

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 relative overflow-hidden h-full flex flex-col transition-all hover:shadow-md">
      {/* Background Subtle Decors */}
      <div className="absolute -top-6 -right-6 p-8 opacity-5 pointer-events-none">
        <PartyPopper size={140} className="text-slate-400" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-2xl text-rose-600 border border-rose-100 shadow-sm">
            <Heart size={22} className="fill-rose-100" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">
              Mural de Datas Festivas & Escolares
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Eventos Comemorativos e Datas Especiais da Comunidade</p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['TODAS', 'FAMÍLIA', 'CÍVICO', 'CULTURAL', 'PEDAGÓGICO'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase transition-all ${
                activeCategory === cat
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 scale-105'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Today Highlight Banner */}
      {todayEvent && (
        <div className="p-6 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 rounded-[2.5rem] text-white shadow-lg animate-in zoom-in-95 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-25 animate-pulse"><Sparkles size={90} /></div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/20 backdrop-blur-md text-white border border-white/30">
              Hoje na Escola 🎉
            </span>
          </div>
          <h4 className="text-2xl font-black uppercase tracking-tight leading-tight">{todayEvent.title}</h4>
          <p className="text-xs font-medium text-white/90 mt-1">{todayEvent.description}</p>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {filteredDates.length > 0 ? (
          filteredDates.map(event => {
            const isToday = event.day === currentDay && event.month === currentMonth;
            return (
              <div
                key={event.id}
                className={`p-4 rounded-[1.8rem] border transition-all flex items-center justify-between gap-4 ${
                  isToday
                    ? 'bg-rose-50/90 border-rose-200 shadow-md shadow-rose-100'
                    : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100/70 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${
                      isToday
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-bounce border-rose-500'
                        : 'bg-white text-slate-600 border-slate-200/80 shadow-sm'
                    }`}
                  >
                    <EventIcon type={event.iconType} size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-black uppercase leading-tight truncate ${isToday ? 'text-rose-900' : 'text-slate-800'}`}>
                        {event.title}
                      </p>
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">{event.description}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`px-3 py-1.5 rounded-2xl font-mono font-black text-xs block text-center border ${
                      isToday
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200/80'
                    }`}
                  >
                    {String(event.day).padStart(2, '0')} {MonthNamesMap[event.month]}
                  </span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mt-1">
                    {event.category}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-xs font-bold uppercase text-slate-400">Nenhum evento festivo para esta categoria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolEventsWall;
