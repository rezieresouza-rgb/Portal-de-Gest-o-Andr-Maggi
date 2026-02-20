
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  BookOpen, 
  ShieldCheck, 
  MessageSquare, 
  Camera, 
  FileText, 
  Save, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  History
} from 'lucide-react';

interface CalendarMonth {
  mes: string;
  orientativo: string;
  legislacoes: string[];
  datas_comemorativas: string[];
  atividades: string[];
  campanha_realizada?: string;
  campanha_a_realizar?: string;
  observacoes?: string;
}

const MEDIATION_DATA: CalendarMonth[] = [
  {
    mes: "Fevereiro",
    orientativo: "001/2026 - Paz em Ação na Escola",
    legislacoes: ["Lei nº 11.867/2022", "Lei nº 13.840/2019", "Lei nº 13.798/2019"],
    datas_comemorativas: ["02/02 - Início do ano letivo", "07/02 - Dia Internacional dos Povos Indígenas", "24/02 - Voto feminino no Brasil"],
    atividades: ["Acolhimento ao início do ano letivo", "Semana Nacional de Prevenção da Gravidez na Adolescência", "Campanha Nacional 'Pule, Brinque e Cuide'"],
  },
  {
    mes: "Março",
    orientativo: "002/2026 - Semana Escolar de Combate à Violência Contra a Mulher",
    legislacoes: ["Lei nº 14.164/2021", "Lei nº 14.899/2024", "Lei nº 11.340/2006"],
    datas_comemorativas: ["08/03 - Dia Internacional da Mulher", "21/03 - Dia contra discriminação racial", "30/03 - Dia Mundial da Juventude"],
    atividades: ["Mobilizar comunidade escolar contra violência", "Desconstruir normas sociais de gênero", "Promover respeito à diversidade"],
  },
  {
    mes: "Abril",
    orientativo: "003/2026 - Semana Nacional da Convivência Escolar e Prevenção ao Bullying",
    legislacoes: ["Lei nº 10.760/2018", "Lei nº 8.069/1990", "Lei nº 10.792/2018", "Lei nº 13.277/2016", "Lei nº 13.185/2015", "Lei nº 14.811/2024"],
    datas_comemorativas: ["24/04 - Dia da Família na Escola", "28/04 - Dia Mundial da Educação"],
    atividades: ["Fortalecer diálogo sobre violências escolares", "Prevenção e enfrentamento do Bullying e Cyberbullying"],
  },
  {
    mes: "Maio",
    orientativo: "004/2026 - Maio Laranja",
    legislacoes: ["Lei nº 9.970/2000", "Lei nº 14.432/2022", "Lei nº 11.691/2022", "Lei nº 14.811/2024"],
    datas_comemorativas: ["18/05 - Dia Nacional de Enfrentamento ao Abuso Sexual Infanto-Juvenil", "18/05 - Dia Internacional da Luta Antimanicomial"],
    atividades: ["Capacitar comunidade escolar para proteção integral", "Fortalecer parcerias com Sistema de Garantia de Direitos"],
  },
  {
    mes: "Junho",
    orientativo: "005/2026 - Prevenção e Erradicação do Trabalho Infantil",
    legislacoes: ["Lei nº 11.542/2007", "Lei nº 8.069/1990", "Lei nº 13.344/2016", "Lei nº 11.577/2007"],
    datas_comemorativas: ["12/06 - Dia Mundial contra Trabalho Infantil", "26/06 - Dia Internacional contra Tortura", "26/06 - Dia Internacional contra Abuso e Tráfico de Drogas"],
    atividades: ["Sensibilizar comunidade escolar sobre direitos humanos", "Prevenção do trabalho infantil", "Enfrentamento à tortura e tráfico ilícito"],
  },
  {
    mes: "Julho",
    orientativo: "006/2026 - Educação para Direitos Humanos, Ambientais e Climáticos",
    legislacoes: ["Lei nº 8.069/1990", "Lei nº 13.344/2016", "Lei nº 11.577/2007", "Lei nº 13.010/2014", "Resolução nº 273/2025"],
    datas_comemorativas: ["13/07 - Aniversário do ECA", "30/07 - Dia Mundial contra Tráfico de Pessoas", "06/07 a 20/07 - Férias Escolares"],
    atividades: ["Educação para direitos humanos e emergência climática", "Justiça climática e cidadania socioambiental"],
  },
  {
    mes: "Agosto",
    orientativo: "007/2026 - Agosto Lilás",
    legislacoes: ["Lei nº 12.262/2023", "Lei nº 14.344/2022", "Lei nº 11.340/2006", "Lei nº 14.899/2024", "Lei nº 14.643/2023", "Dec. nº 12.006/2024"],
    datas_comemorativas: ["07/08 - Aniversário da Lei Maria da Penha", "11/08 - Dia do Estudante"],
    atividades: ["Mobilizar sobre mecanismos de denúncia e proteção", "Fortalecer compromisso da escola com ambiente seguro"],
  },
  {
    mes: "Setembro",
    orientativo: "008/2026 - Setembro Amarelo",
    legislacoes: ["Lei nº 13.819/2019"],
    datas_comemorativas: ["06/09 - Igualdade das mulheres", "21/09 - Dia Nacional de Luta das Pessoas com Deficiência", "23/09 - Dia Internacional contra Exploração Sexual e Tráfico"],
    atividades: ["Valorização da vida e saúde mental", "Debate sobre impacto de telas, álcool e drogas"],
  },
  {
    mes: "Outubro",
    orientativo: "009/2026 - Outubro Rosa",
    legislacoes: ["Lei nº 15.009/2024"],
    datas_comemorativas: ["10/10 - Dia Nacional contra Violência à Mulher e Saúde Mental", "11/10 - Dia Internacional da Menina", "15/10 - Dia da Professora e do Professor"],
    atividades: ["Conscientização sobre saúde e direitos reprodutivos da mulher"],
  },
  {
    mes: "Novembro",
    orientativo: "010/2026 - Novembro Azul",
    legislacoes: ["Lei nº 10.760/2018", "Lei nº 8.069/1990", "Lei nº 10.792/2018", "Lei nº 12.656/2024", "Resolução 225/2015 - CNJ"],
    datas_comemorativas: ["20/11 - Dia da Consciência Negra", "25/11 - Dia Internacional contra Violência à Mulher"],
    atividades: ["Consolidar práticas restaurativas", "Promover saúde integral masculina", "Fortalecer luta antirracista"],
  }
];

const MediationCalendar: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(1); // Março como padrão (index 1)
  const [localData, setLocalData] = useState<Record<string, Partial<CalendarMonth>>>(() => {
    const saved = localStorage.getItem('mediation_calendar_responses_v1');
    return saved ? JSON.parse(saved) : {};
  });

  const month = MEDIATION_DATA[currentIdx];
  const activeLocal = localData[month.mes] || {};

  useEffect(() => {
    localStorage.setItem('mediation_calendar_responses_v1', JSON.stringify(localData));
  }, [localData]);

  const updateField = (field: keyof CalendarMonth, value: string) => {
    setLocalData(prev => ({
      ...prev,
      [month.mes]: { ...prev[month.mes], [field]: value }
    }));
  };

  const handleSave = () => {
    alert(`Ações de ${month.mes} salvas com sucesso no banco de dados escolar.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 max-w-6xl mx-auto">
      
      {/* SELETOR DE MÊS */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between no-print">
         <button 
           onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
           disabled={currentIdx === 0}
           className="p-3 bg-gray-50 text-gray-400 hover:text-rose-600 disabled:opacity-30 rounded-2xl transition-all"
         >
            <ChevronLeft size={24} />
         </button>
         <div className="text-center">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">{month.mes} 2026</h2>
            <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest mt-1">Núcleo de Mediação Escolar</p>
         </div>
         <button 
           onClick={() => setCurrentIdx(prev => Math.min(MEDIATION_DATA.length - 1, prev + 1))}
           disabled={currentIdx === MEDIATION_DATA.length - 1}
           className="p-3 bg-gray-50 text-gray-400 hover:text-rose-600 disabled:opacity-30 rounded-2xl transition-all"
         >
            <ChevronRight size={24} />
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* COLUNA ESQUERDA: ORIENTAÇÕES E DATAS */}
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-rose-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Calendar size={120} /></div>
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                        <FileText size={20} className="text-rose-300" />
                     </div>
                     <h3 className="text-lg font-black uppercase tracking-widest">Orientativo</h3>
                  </div>
                  <p className="text-xl font-black leading-tight uppercase">{month.orientativo}</p>
                  
                  <div className="space-y-4 pt-4 border-t border-white/10">
                     <p className="text-[10px] font-black uppercase tracking-widest text-rose-300">Base Legal Ativa</p>
                     <div className="flex flex-wrap gap-2">
                        {month.legislacoes.map(leg => (
                          <span key={leg} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold uppercase">{leg}</span>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Clock size={14} className="text-rose-600" /> Datas de Destaque
               </h4>
               <div className="space-y-4">
                  {month.datas_comemorativas.map(data => (
                    <div key={data} className="flex gap-4 items-center group">
                       <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
                       <p className="text-xs font-black text-gray-700 uppercase leading-none group-hover:text-rose-600 transition-colors">{data}</p>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* COLUNA CENTRAL/DIREITA: ATIVIDADES E REGISTROS */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
               <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                     <ShieldCheck size={24} className="text-rose-600" /> Atividades Previstas
                  </h3>
                  <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-3 py-1 rounded-full uppercase">Seduc GS/MT</span>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {month.atividades.map(act => (
                    <div key={act} className="p-5 bg-gray-50 rounded-[2rem] border-2 border-transparent hover:border-rose-100 transition-all flex items-start gap-4">
                       <div className="mt-1 p-1 bg-white rounded-lg shadow-sm">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                       </div>
                       <p className="text-xs font-black text-gray-700 uppercase leading-relaxed">{act}</p>
                    </div>
                  ))}
               </div>

               {/* FORMULÁRIO DE ACOMPANHAMENTO LOCAL */}
               <div className="pt-8 border-t border-gray-50 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Campanha a Realizar na Escola</label>
                        <textarea 
                           value={activeLocal.campanha_a_realizar || ''}
                           onChange={e => updateField('campanha_a_realizar', e.target.value)}
                           placeholder="Ex: Roda de conversa com o Grêmio..."
                           className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium h-24 outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/5 transition-all"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observações do Mês</label>
                        <textarea 
                           value={activeLocal.observacoes || ''}
                           onChange={e => updateField('observacoes', e.target.value)}
                           placeholder="Relate desafios ou conquistas do mês..."
                           className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium h-24 outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/5 transition-all"
                        />
                     </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 no-print">
                     <button className="flex-1 px-8 py-4 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center gap-2">
                        <Camera size={18} /> Anexar Fotos Evidência
                     </button>
                     <button className="flex-1 px-8 py-4 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center gap-2">
                        <History size={18} /> Subir Relatório PDF
                     </button>
                     <button 
                        onClick={handleSave}
                        className="flex-1 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                     >
                        <Save size={18} /> Salvar Execução
                     </button>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-gray-900 rounded-[3rem] text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={80}/></div>
               <div className="flex items-center gap-6 relative z-10">
                  <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                     <Info size={32} className="text-rose-400" />
                  </div>
                  <div>
                     <p className="text-rose-300 text-[10px] font-black uppercase tracking-widest mb-1">Atenção Coordenador</p>
                     <h4 className="text-sm font-black uppercase">Consolidação SEDUC v2026</h4>
                     <p className="text-white/50 text-[10px] font-medium leading-relaxed mt-1">Este calendário segue as diretrizes nacionais para ambientes escolares seguros e pacíficos.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default MediationCalendar;
