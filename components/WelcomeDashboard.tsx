
import React, { useState, useEffect, useMemo } from 'react';
import {
   Cake,
   Calendar,
   Megaphone,
   Sparkles,
   ChevronRight,
   Bell,
   TrendingUp,
   Users,
   Scale,
   Download,
   Printer,
   Settings2,
   FileText,
   Clock,
   ExternalLink,
   ShieldCheck,
   Zap,
   ArrowRight,
   Plus,
   ShieldAlert,
   CalendarDays,
   LayoutDashboard,
   Landmark,
   LogOut
} from 'lucide-react';
import { BirthdayPerson, SchoolAnnouncement, SchoolEvent, User } from '../types';
import { SCHOOL_CALENDAR_2026 } from '../constants/schoolCalendar2026';
import CelebrationsWall from './CelebrationsWall';

interface ModuleConfig {
   id: string;
   title: string;
   status: string;
   statusColor: string;
   icon: React.ReactNode;
}

interface WelcomeDashboardProps {
   user: User;
   onLogout: () => void;
   onModuleSelect: (module: string) => void;
   onProfileOpen: () => void;
   modules: ModuleConfig[];
}

const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({ user, onLogout, onModuleSelect, modules, onProfileOpen }) => {
   const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>(() => {
      try {
         const saved = localStorage.getItem('school_announcements_v1');
         if (saved) return JSON.parse(saved);
      } catch (e) {
         console.error("Error parsing announcements:", e);
      }
      return [
         { id: '1', title: 'Entrega de Diários', message: 'Lembramos a todos os docentes que o prazo para fechamento do 1º bimestre encerra na próxima sexta-feira.', date: '2026-03-10', author: 'DIREÇÃO', priority: 'ALTA' },
         { id: '2', title: 'Reunião Pedagógica', message: 'Convocamos a equipe técnica para alinhamento sobre o projeto "Escola da Família".', date: '2026-03-12', author: 'COORDENAÇÃO', priority: 'NORMAL' }
      ];
   });

   const [birthdays] = useState<BirthdayPerson[]>([
      { id: 'b1', name: 'ANA PAULA SILVA', role: 'PROFESSORA', day: new Date().getDate(), month: new Date().getMonth() + 1 },
      { id: 'b2', name: 'CARLOS LIMA', role: 'ALMOXARIFE', day: (new Date().getDate() + 2), month: new Date().getMonth() + 1 },
      { id: 'b3', name: 'BEATRIZ SOUZA', role: 'PSICÓLOGA', day: 15, month: new Date().getMonth() + 1 },
   ]);

   const currentMonthIdx = new Date().getMonth();
   const currentMonthData = SCHOOL_CALENDAR_2026.meses[currentMonthIdx];

   const [visibleBlocks, setVisibleBlocks] = useState({
      modules: true,
      birthdays: true,
      celebrations: true,
      announcements: true,
      agenda: true,
      campaigns: true
   });

   const [isSettingsOpen, setIsSettingsOpen] = useState(false);



   const today = new Date().getDate();
   const currentMonth = new Date().getMonth() + 1;

   const exportAgendaPDF = async () => {
      const element = document.getElementById('weekly-agenda-block');
      if (!element) return;

      const opt = {
         margin: 10,
         filename: `Agenda_Semanal_AndreMaggi.pdf`,
         image: { type: 'jpeg', quality: 0.98 },
         html2canvas: {
            scale: 2,
            onclone: (clonedDoc: Document) => {
               const header = clonedDoc.getElementById('pdf-header');
               if (header) {
                  header.style.display = 'flex';
               }
               // Esconder botões de ação no PDF
               const noPrint = clonedDoc.getElementsByClassName('no-print');
               Array.from(noPrint).forEach((el: any) => el.style.display = 'none');
            }
         },
         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore
      await window.html2pdf().set(opt).from(element).save();
   };

   return (
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-10 md:pb-20 max-w-7xl mx-auto">

         {/* HEADER DE BOAS-VINDAS */}
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 border-b border-white/10 pb-6 md:pb-8">
            <div className="flex items-center gap-4 md:gap-6 w-full">
               <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg shrink-0">
                  <img src="/logo-escola.png" alt="Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
               </div>
               <div className="space-y-0.5 md:space-y-1 flex-1">
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
                     Olá, <button onClick={onProfileOpen} className="text-indigo-400 hover:underline">{(user.name || 'Usuário').split(' ')[0]}</button>.
                  </h1>
                  <p className="text-white/60 font-bold uppercase text-[9px] md:text-xs tracking-[0.15em]">Portal de Gestão André Maggi</p>
               </div>

               <div className="md:hidden no-print">
                  <button
                     onClick={onLogout}
                     className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl"
                  >
                     <LogOut size={20} />
                  </button>
               </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto no-print">
               <div className="flex-1 md:flex-none bg-white/5 backdrop-blur-md p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-white/10 shadow-sm flex items-center gap-3 md:gap-4 px-4 md:px-5 h-14 md:h-16">
                  <Calendar className="text-indigo-400" size={20} />
                  <div className="text-left">
                     <p className="text-[8px] font-black text-white/40 uppercase leading-none">Hoje</p>
                     <p className="text-[10px] md:text-sm font-black text-white mt-1 uppercase">
                        {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                     </p>
                  </div>
               </div>
               <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="p-4 md:p-5 bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 rounded-xl md:rounded-2xl shadow-sm transition-all"
               >
                  <Settings2 size={24} className="md:w-7 md:h-7" />
               </button>
            </div>
         </header>

         {/* PAINEL DE CONFIGURAÇÃO DE BLOCOS (OVERLAY) */}
         {isSettingsOpen && (
            <div className="p-8 bg-indigo-900/90 backdrop-blur-xl rounded-[3rem] border border-white/10 grid grid-cols-2 md:grid-cols-6 gap-4 animate-in slide-in-from-top-4 no-print shadow-2xl">
               {Object.keys(visibleBlocks).map(block => (
                  <button
                     key={block}
                     onClick={() => setVisibleBlocks(prev => ({ ...prev, [block]: !prev[block as keyof typeof visibleBlocks] }))}
                     className={`p-4 rounded-2xl font-black uppercase text-[9px] tracking-widest border transition-all ${visibleBlocks[block as keyof typeof visibleBlocks]
                        ? 'bg-white/10 border-indigo-400 text-white shadow-lg'
                        : 'bg-white/5 border-transparent text-white/30'
                        }`}
                  >
                     {block.replace('birthdays', 'Aniversários').replace('celebrations', 'Mural Datas').replace('announcements', 'Recados').replace('agenda', 'Agenda').replace('campaigns', 'Campanhas').replace('modules', 'Módulos')}
                  </button>
               ))}
            </div>
         )}

         <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* ESQUERDA: SIDEBAR MÓDULOS (LARGURA 3/12) */}
            {visibleBlocks.modules && (
               <aside className="w-full lg:w-1/4 shrink-0 space-y-6">
                  <div className="flex items-center gap-3 mb-2 px-2">
                     <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg backdrop-blur-sm">
                        <LayoutDashboard size={20} />
                     </div>
                     <h3 className="text-lg font-black text-white uppercase tracking-tight">Módulos</h3>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 md:grid-cols-3 lg:gap-3">
                     {modules.map((module) => (
                        <button
                           key={module.id}
                           onClick={() => onModuleSelect(module.id)}
                           className="w-full bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 shadow-lg hover:bg-white/10 hover:border-white/20 transition-all flex flex-col lg:flex-row items-center lg:items-center lg:gap-4 group backdrop-blur-sm text-center lg:text-left"
                        >
                           <div className={`p-2.5 md:p-3 rounded-xl bg-${module.statusColor}-500/20 text-${module.statusColor}-400 group-hover:bg-${module.statusColor}-500 group-hover:text-white transition-all mb-2 lg:mb-0`}>
                              {module.icon}
                           </div>

                           <div className="flex-1">
                              <h3 className="text-[10px] md:text-sm font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                                 {module.title}
                              </h3>
                              <p className="hidden md:block text-[9px] text-white/60 font-bold uppercase mt-1">
                                 {module.status}
                              </p>
                           </div>

                           <div className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">
                              <ChevronRight size={20} />
                           </div>
                        </button>
                     ))}

                     {modules.length === 0 && (
                        <div className="py-8 text-center bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10">
                           <ShieldAlert size={24} className="mx-auto text-white/20 mb-2" />
                           <p className="text-white/30 font-bold uppercase text-xs">Nenhum módulo</p>
                        </div>
                     )}
                  </div>
               </aside>
            )}

            {/* DIREITA: CONTEÚDO PRINCIPAL (LARGURA 9/12) */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">

               {/* COLUNA ESQUERDA: RECADOS E INDICADORES (LARGURA 8) */}
               <div className="lg:col-span-8 space-y-8">



                  {/* RECADOS DA GESTÃO */}
                  {visibleBlocks.announcements && (
                     <div className="bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/10 shadow-lg space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                           <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                              <Megaphone size={20} className="text-indigo-400" /> Mural da Gestão
                           </h3>
                           <button className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">Ver todos</button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                           {announcements.map(notif => (
                              <div key={notif.id} className={`p-6 rounded-[2rem] border transition-all ${notif.priority === 'ALTA' ? 'bg-red-500/10 border-red-500/20 shadow-lg shadow-red-900/20' : 'bg-white/5 border-transparent'
                                 }`}>
                                 <div className="flex justify-between items-start mb-3">
                                    <span className={`px-3 py-1 rounded text-[9px] font-black uppercase ${notif.priority === 'ALTA' ? 'bg-red-500 text-white shadow-sm' : 'bg-white/10 text-white/50'
                                       }`}>{notif.priority === 'ALTA' ? 'Urgente' : 'Informativo'}</span>
                                    <span className="text-[10px] font-bold text-white/50">{new Date(notif.date).toLocaleDateString('pt-BR')}</span>
                                 </div>
                                 <h4 className="text-sm font-black text-white uppercase mb-2">{notif.title}</h4>
                                 <p className="text-xs text-white/70 font-medium leading-relaxed line-clamp-2">{notif.message}</p>
                                 <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-[9px] font-black text-white/40 uppercase">
                                    <ShieldCheck size={12} className="text-indigo-400" /> Resp: {notif.author}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* MURAL DE DATAS COMEMORATIVAS */}
                  {visibleBlocks.celebrations && <CelebrationsWall />}

                  {/* WIDGET CALENDÁRIO 2026 UNIFICADO */}
                  <div className="bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/10 shadow-lg space-y-6">
                     <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                           <CalendarDays size={20} className="text-indigo-400" /> Calendário 2026
                        </h3>
                        <span className="text-[9px] font-black text-indigo-200 bg-indigo-500/20 px-2 py-1 rounded-full uppercase border border-indigo-500/30">Seduc GS</span>
                     </div>
                     <div className="flex flex-col gap-6 items-center text-center">
                        <div className="w-full p-4 bg-indigo-500/10 rounded-[2rem] border border-indigo-500/20 shadow-inner">
                           <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest leading-none">Referência</p>
                           <p className="text-2xl font-black text-indigo-400 uppercase mt-1 drop-shadow-sm">{currentMonthData.mes}</p>
                        </div>
                        <div className="w-full grid grid-cols-1 gap-3">
                           {currentMonthData.eventos.slice(0, 3).map((evt, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-transparent hover:border-white/10 hover:bg-white/10 transition-all text-left">
                                 <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center font-black text-[10px] text-indigo-300 shadow-sm border border-white/5">{evt.dia}</div>
                                 <div className="flex-1 truncate">
                                    <p className="text-[9px] font-black text-white uppercase truncate leading-tight">{evt.tipo}</p>
                                    <p className="text-[7px] font-bold text-white/40 uppercase tracking-widest">{evt.categoria || 'Evento'}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                        <button
                           onClick={() => onModuleSelect('secretariat')}
                           className="w-full p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 group flex justify-center items-center gap-2 text-xs uppercase font-bold border border-white/10"
                        >
                           Acessar Calendário <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                     </div>
                  </div>
               </div>

               {/* COLUNA DIREITA: AGENDA, ANIVERSARIANTES (LARGURA 4) */}
               <div className="lg:col-span-4 space-y-8">

                  {/* AGENDA COMPACTA */}
                  {visibleBlocks.agenda && (
                     <div id="weekly-agenda-block" className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 shadow-lg space-y-6">

                        {/* CABEÇALHO APENAS PARA PDF (Escondido na tela) */}
                        <div id="pdf-header" className="hidden flex-row items-center gap-4 border-b border-gray-200 pb-4 mb-4">
                           {/* LOGO PLACEHOLDER */}
                           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                              <Landmark size={32} />
                           </div>
                           <div>
                              <h1 className="text-xl font-bold text-gray-900 uppercase">Escola Estadual André Maggi</h1>
                              <p className="text-xs text-gray-500 uppercase">Portal de Gestão Escolar - Agenda Semanal</p>
                           </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                           <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                              <Calendar size={18} className="text-indigo-400" /> Agenda
                           </h3>
                           <button onClick={exportAgendaPDF} className="p-1.5 bg-white/5 text-white/40 hover:text-white rounded-lg transition-all hover:bg-white/10"><Download size={14} /></button>
                        </div>
                        <div className="space-y-4">
                           {currentMonthData.eventos.slice(0, 5).map((event, i) => (
                              <div key={i} className="flex gap-3 group">
                                 <div className="flex flex-col items-center w-8 shrink-0">
                                    <div className="text-[8px] font-black text-white/30 uppercase leading-none">{currentMonthData.mes.substring(0, 3)}</div>
                                    <div className="text-sm font-black text-white mt-0.5">{event.dia}</div>
                                    <div className="w-px h-full bg-white/5 mt-1"></div>
                                 </div>
                                 <div className="flex-1 pb-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-transparent group-hover:border-white/10 group-hover:bg-white/10 transition-all shadow-sm">
                                       <span className="text-[8px] font-black uppercase px-2 py-1 rounded mb-2 inline-block border bg-white/5 border-white/10 text-white/50">{event.categoria || 'GERAL'}</span>
                                       <h4 className="text-xs font-black text-white uppercase leading-snug">{event.tipo}</h4>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* ANIVERSARIANTES DO MÊS */}
                  {visibleBlocks.birthdays && (
                     <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 shadow-lg space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shadow-sm border border-amber-500/10"><Cake size={16} /></div>
                           <h3 className="text-sm font-black text-white uppercase tracking-tight leading-tight">Aniversariantes</h3>
                        </div>

                        <div className="space-y-2">
                           {birthdays.map(b => (
                              <div key={b.id} className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${b.day === today ? 'bg-indigo-500/20 border-indigo-500/30 shadow-lg ring-1 ring-indigo-400/20' : 'bg-white/5 border-transparent hover:bg-white/10'
                                 }`}>
                                 <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${b.day === today ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/10 text-white/50'
                                       }`}>
                                       {b.name[0]}
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-black text-white uppercase leading-none truncate w-20">{b.name.split(' ')[0]}</p>
                                       <p className="text-[7px] text-white/40 font-bold uppercase mt-0.5">{b.role}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className={`text-sm font-black ${b.day === today ? 'text-indigo-400' : 'text-white/30'}`}>{b.day}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

               </div>
            </main>
         </div>

         <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-container { width: 100%; border: none !important; }
        }
      `}</style>
      </div>
   );
};

export default WelcomeDashboard;
