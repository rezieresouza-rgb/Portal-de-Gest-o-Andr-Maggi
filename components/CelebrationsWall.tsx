
import React, { useMemo } from 'react';
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
  Briefcase
} from 'lucide-react';
import { SchoolCelebration } from '../types';

const CELEBRATIONS: SchoolCelebration[] = [
  { id: '1', title: 'Dia do Servidor Público', day: 28, month: 10, category: 'Todos os Servidores', iconType: 'GERAL' },
  { id: '2', title: 'Dia do Professor', day: 15, month: 10, category: 'Docentes', iconType: 'PROFESSOR' },
  { id: '3', title: 'Dia da Merendeira', day: 30, month: 10, category: 'Nutrição Escolar', iconType: 'MERENDEIRA' },
  { id: '4', title: 'Dia do Zelador / AAE', day: 16, month: 5, category: 'Apoio Administrativo', iconType: 'ZELADOR' },
  { id: '5', title: 'Dia do Diretor Escolar', day: 12, month: 11, category: 'Gestão', iconType: 'GESTAO' },
  { id: '6', title: 'Dia do Secretário Escolar', day: 30, month: 9, category: 'Secretaria', iconType: 'SECRETARIA' },
  { id: '7', title: 'Dia do Psicólogo', day: 27, month: 8, category: 'Equipe Multi', iconType: 'PSICOSSOCIAL' },
  { id: '8', title: 'Dia do Coordenador Pedagógico', day: 22, month: 8, category: 'Coordenação', iconType: 'COORDENADOR' },
  { id: '9', title: 'Dia Nacional dos Profissionais da Educação', day: 6, month: 8, category: 'Todos os Profissionais', iconType: 'GERAL' },
  { id: '10', title: 'Dia do Bibliotecário', day: 9, month: 4, category: 'Biblioteca', iconType: 'BIBLIOTECA' },
  { id: '11', title: 'Dia do Motorista Escolar', day: 25, month: 7, category: 'Transporte', iconType: 'MOTORISTA' },
  { id: '12', title: 'Dia do Técnico em Informática', day: 19, month: 10, category: 'Tecnologia', iconType: 'TI' },
  { id: '13', title: 'Dia do Vigilante', day: 20, month: 6, category: 'Segurança', iconType: 'VIGILANTE' },
  { id: '14', title: 'Dia do Orientador Educacional', day: 4, month: 12, category: 'Equipe Multi', iconType: 'ORIENTADOR' },
  { id: '15', title: 'Dia da Escola', day: 15, month: 3, category: 'Institucional', iconType: 'GERAL' },
  { id: '16', title: 'Dia do Estudante', day: 11, month: 8, category: 'Comunidade Escolar', iconType: 'GERAL' },
];

const CelebrationIcon = ({ type, size = 20 }: { type: string, size?: number }) => {
  switch (type) {
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
    default: return <Briefcase size={size} />;
  }
};

const CelebrationsWall: React.FC = () => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;

  const monthCelebrations = useMemo(() => {
    return CELEBRATIONS.filter(c => {
      if (c.month > currentMonth) return true;
      if (c.month === currentMonth && c.day >= currentDay) return true;
      return false;
    }).sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });
  }, [currentMonth, currentDay]);

  const isCelebrationToday = useMemo(() => {
    return CELEBRATIONS.find(c => c.day === currentDay && c.month === currentMonth);
  }, [currentDay, currentMonth]);

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 relative overflow-hidden h-full flex flex-col transition-all hover:shadow-md">
      <div className="absolute -top-4 -right-4 p-8 opacity-5">
        <PartyPopper size={120} className="text-slate-400" />
      </div>

      <div className="flex items-center justify-between border-b border-slate-100 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100 shadow-sm">
            <Trophy size={20} />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            Mural de Honra
          </h3>
        </div>
        <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest border border-amber-100 shadow-sm">Reconhecimento</span>
      </div>

      {isCelebrationToday && (
        <div className="p-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2.5rem] text-white shadow-md animate-in zoom-in-95 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20 animate-pulse"><Sparkles size={80} /></div>
          <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Destaque do Dia</p>
          <h4 className="text-2xl font-black leading-tight uppercase">Hoje celebramos o {isCelebrationToday.title}!</h4>
          <p className="text-xs font-medium opacity-90 mt-3 italic">"Obrigado por transformar nossa escola todos os dias."</p>
        </div>
      )}

      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {monthCelebrations.length > 0 ? monthCelebrations.map(c => (
          <div key={c.id} className={`p-5 rounded-[1.5rem] border transition-all flex items-center justify-between ${c.day === currentDay && c.month === currentMonth
            ? 'bg-amber-50/80 border-amber-100 shadow-sm shadow-amber-100/10'
            : 'bg-slate-50/50 border-transparent hover:bg-slate-100/80 hover:border-slate-200/60'
            }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${c.day === currentDay && c.month === currentMonth ? 'bg-amber-550 text-white animate-bounce shadow-lg shadow-amber-500/40' : 'bg-slate-100 text-slate-500 border border-slate-200/50'
                }`}>
                <CelebrationIcon type={c.iconType} size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-black uppercase leading-none truncate ${c.day === currentDay && c.month === currentMonth ? 'text-amber-700' : 'text-slate-800'}`}>{c.title}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 truncate">{c.category}</p>
              </div>
            </div>
            <div className="text-right pl-3">
              <p className={`text-2xl font-black ${c.day === currentDay && c.month === currentMonth ? 'text-amber-600' : 'text-slate-300'}`}>{c.day}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                {new Date(new Date().getFullYear(), c.month - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
              </p>
            </div>
          </div>
        )) : (
          <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed opacity-50">Nenhuma data prevista<br />para este ano</p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-indigo-600" />
          <p className="text-[8px] font-bold text-slate-450 uppercase tracking-tight">Gestão Humanizada André Maggi</p>
        </div>
        <span className="text-[8px] font-black text-slate-305 uppercase">2026</span>
      </div>
    </div>
  );
};

export default CelebrationsWall;
