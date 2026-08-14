import React from 'react';
import {
  ExternalLink,
  BarChart3,
  ShieldCheck,
  Globe,
  Sparkles,
  FileSpreadsheet,
  Users,
  AlertTriangle,
  FileText,
  TrendingUp,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const BuscaAtivaDataStudioPanel: React.FC = () => {
  const directUrl = "https://datastudio.google.com/u/0/reporting/69029f48-46b1-4455-8e48-a4da2c834f74/page/p_xjvkf08ykd";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full min-w-0 font-sans pb-16 text-slate-800">
      
      {/* CARD CENTRAL DE COMANDO E INTELIGÊNCIA */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 p-8 sm:p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-emerald-700/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          
          <div className="inline-flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
            <Sparkles size={14} /> Relatório Oficial COGER / DRE-SINOP / SEDUC-MT
          </div>

          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            Painel de Inteligência da Busca Ativa Escolar
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 font-medium leading-relaxed max-w-2xl mx-auto">
            Acesse a central consolidada no <b>Google Data Studio / Looker Studio</b> com os indicadores oficiais de infrequência, resgate de alunos, registros de FICAI e gráficos de prevenção ao abandono escolar da <b>E.E. André Maggi</b>.
          </p>

          {/* BOTÃO PRINCIPAL DE DESTAQUE */}
          <div className="pt-4 pb-2">
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded-3xl text-sm sm:text-base font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/30 transition-all transform hover:scale-105 active:scale-95 group"
            >
              <BarChart3 size={24} className="group-hover:rotate-12 transition-transform" />
              <span>Abrir Painel Interativo no Data Studio</span>
              <ExternalLink size={20} />
            </a>
            <p className="text-[11px] font-bold text-emerald-300/80 uppercase tracking-wider mt-3">
              ✦ Abre instantaneamente em tela cheia com todos os filtros por escola, turma e aluno liberados
            </p>
          </div>

        </div>

        {/* CARDS DE DESTAQUE DE RECURSOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 pt-8 border-t border-emerald-800/60 relative z-10">
          <div className="bg-emerald-900/40 p-5 rounded-2xl border border-emerald-700/40 flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl shrink-0">
              <Globe size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase">Dados Oficiais da DRE-SINOP</p>
              <p className="text-[11px] text-emerald-200/80 font-medium mt-0.5">Alimentado continuamente com os lançamentos dos sistemas SEDUC-MT.</p>
            </div>
          </div>

          <div className="bg-emerald-900/40 p-5 rounded-2xl border border-emerald-700/40 flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase">Sincronização em Tempo Real</p>
              <p className="text-[11px] text-emerald-200/80 font-medium mt-0.5">As atualizações da COGER são refletidas imediatamente ao abrir o painel.</p>
            </div>
          </div>

          <div className="bg-emerald-900/40 p-5 rounded-2xl border border-emerald-700/40 flex items-start gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl shrink-0">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase">Filtros Dinâmicos</p>
              <p className="text-[11px] text-emerald-200/80 font-medium mt-0.5">Consulte por Aluno, Turma, Matriz, FICAIs e programas Bolsa Família / Pé de Meia.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE MÓDULOS DE MONITORAMENTO DISPONÍVEIS NO DATA STUDIO */}
      <div className="bg-white p-8 sm:p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <FileText size={20} className="text-emerald-600" /> Relatórios Disponíveis no Painel Oficial
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              Navegue pelas abas laterais ao abrir o Data Studio
            </p>
          </div>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase">
            COGER • DRE-SINOP
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-emerald-300 transition-all">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl w-fit">
              <TrendingUp size={20} />
            </div>
            <h4 className="font-black text-slate-900 text-xs uppercase">Relatório de Monitoramento</h4>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Visão geral dos percentuais de infrequência por ano escolar, modalidade e turno.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-emerald-300 transition-all">
            <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl w-fit">
              <Users size={20} />
            </div>
            <h4 className="font-black text-slate-900 text-xs uppercase">Detalhamento Por Estudante</h4>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Consulta nominal com código do aluno, quantidade de faltas registradas e percentual geral.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-emerald-300 transition-all">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl w-fit">
              <AlertTriangle size={20} />
            </div>
            <h4 className="font-black text-slate-900 text-xs uppercase">Plataforma FICAI</h4>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Fichas de Infrequência e Indisciplina abertas e acompanhadas junto ao Ministério Público.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-emerald-300 transition-all">
            <div className="p-2.5 bg-red-100 text-red-800 rounded-xl w-fit">
              <CheckCircle2 size={20} />
            </div>
            <h4 className="font-black text-slate-900 text-xs uppercase">Relatório de Evasão</h4>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Monitoramento preventivo e ações de busca ativa para resgate imediato de estudantes.
            </p>
          </div>

        </div>

        {/* ORIENTAÇÃO RÁPIDA DE FILTRO */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl font-black">
              💡
            </div>
            <div>
              <p className="font-black text-emerald-950 uppercase text-[11px]">Dica para Consulta Rápida na Tela do Data Studio:</p>
              <p className="text-[11px] text-emerald-900 font-bold">
                Ao abrir o painel, selecione o filtro <b>Escola: EE ANDRÉ ANTONIO MAGGI</b> no topo da página para filtrar os alunos da nossa unidade.
              </p>
            </div>
          </div>
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 shadow-md"
          >
            Acessar Agora <ArrowRight size={14} />
          </a>
        </div>
      </div>

    </div>
  );
};

export default BuscaAtivaDataStudioPanel;
