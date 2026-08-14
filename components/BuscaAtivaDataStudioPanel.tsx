import React, { useState } from 'react';
import {
  ExternalLink,
  RefreshCw,
  Maximize2,
  Minimize2,
  BarChart3,
  ShieldCheck,
  Globe,
  Sparkles,
  Info,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export const BuscaAtivaDataStudioPanel: React.FC = () => {
  const embedUrl = "https://lookerstudio.google.com/embed/reporting/69029f48-46b1-4455-8e48-a4da2c834f74/page/p_xjvkf08ykd";
  const directUrl = "https://datastudio.google.com/u/0/reporting/69029f48-46b1-4455-8e48-a4da2c834f74/page/p_xjvkf08ykd";

  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className={`space-y-6 animate-in fade-in duration-500 w-full min-w-0 font-sans ${isFullscreen ? 'fixed inset-0 z-[9999] bg-slate-950 p-6 overflow-y-auto' : ''}`}>
      
      {/* BANNER PRINCIPAL DO PAINEL GOOGLE DATA STUDIO */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 p-6 sm:p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-emerald-800/40">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 w-fit">
              <Sparkles size={12} /> Inteligência Territorial SEDUC / DRE-SINOP
            </div>
            <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              <BarChart3 size={32} className="text-emerald-400" /> Painel Geral de Busca Ativa (Data Studio)
            </h2>
            <p className="text-xs text-emerald-100/90 font-medium leading-relaxed">
              Integração direta com o relatório oficial da COGER / DRE-SINOP no Google Data Studio para acompanhamento consolidado de indicadores de frequência, infrequência e ações territoriais.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleRefresh}
              className="px-4 py-3 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-emerald-700 flex items-center gap-2"
              title="Recarregar dados do relatório"
            >
              <RefreshCw size={16} /> Recarregar
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-4 py-3 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-emerald-700 flex items-center gap-2"
            >
              {isFullscreen ? <><Minimize2 size={16} /> Sair Tela Cheia</> : <><Maximize2 size={16} /> Tela Cheia</>}
            </button>

            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <ExternalLink size={18} /> Abrir no Google Data Studio
            </a>
          </div>
        </div>

        {/* CARDS DE RESUMO RÁPIDO DO PAINEL */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-emerald-900/80 relative z-10 text-xs">
          <div className="bg-emerald-900/40 p-4 rounded-2xl border border-emerald-800/50 flex items-center gap-3">
            <Globe className="text-emerald-400 shrink-0" size={20} />
            <div>
              <p className="text-[10px] font-black text-emerald-300 uppercase">Origem dos Dados</p>
              <p className="font-bold text-white uppercase">Sistemas SEDUC • COGER / DRE-SINOP</p>
            </div>
          </div>

          <div className="bg-emerald-900/40 p-4 rounded-2xl border border-emerald-800/50 flex items-center gap-3">
            <ShieldCheck className="text-amber-400 shrink-0" size={20} />
            <div>
              <p className="text-[10px] font-black text-emerald-300 uppercase">Status de Sincronização</p>
              <p className="font-bold text-white uppercase">Atualização Contínua em Tempo Real</p>
            </div>
          </div>

          <div className="bg-emerald-900/40 p-4 rounded-2xl border border-emerald-800/50 flex items-center gap-3">
            <FileSpreadsheet className="text-blue-400 shrink-0" size={20} />
            <div>
              <p className="text-[10px] font-black text-emerald-300 uppercase">Filtros Avançados</p>
              <p className="font-bold text-white uppercase">Interatividade com Busca por Aluno/Turma</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTAINER DO IFRAME / VISUALIZADOR */}
      <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-xl overflow-hidden relative flex flex-col">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between px-6 border-b border-slate-800 text-xs font-black uppercase">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="ml-2 text-slate-300 font-mono text-[10px]">COGER / DRE-SINOP • PAINEL DE RELATÓRIO OFICIAL</span>
          </div>

          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline text-[10px] font-bold uppercase flex items-center gap-1"
          >
            Abrir Relatório Completo <ExternalLink size={12} />
          </a>
        </div>

        {/* CONTAINER DO IFRAME E AVISO EXPLICATIVO */}
        <div className="relative w-full min-h-[70vh] bg-slate-50 flex flex-col">
          <iframe
            key={iframeKey}
            src={embedUrl}
            title="Painel de Busca Ativa Google Data Studio"
            className="w-full h-[65vh] border-0"
            allowFullScreen
          />

          {/* CARD EXPLICATIVO DA MENSAGEM DO GOOGLE */}
          <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border-t-2 border-amber-400 text-amber-950 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500 text-white rounded-2xl shrink-0 shadow-lg shadow-amber-500/20">
                <Info size={24} />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="font-black text-amber-900 uppercase text-sm tracking-tight">
                  Por que aparece "A visualização em outros sites foi desativada pelo proprietário"?
                </h4>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  O Google Data Studio possui uma trava nativa de privacidade. Por padrão, ele exige que a <b>COGER / DRE-SINOP</b> (criadores do painel) ativem a opção de incorporação externa.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-amber-200/80">
              {/* SOLUÇÃO 1: BOTÃO DIRETO */}
              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between space-y-3">
                <div>
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Opção 1 (Imediata): Acessar Agora</p>
                  <p className="text-xs text-slate-700 font-medium mt-1">
                    Clique no botão abaixo para abrir o painel completo do Data Studio em tela cheia com todos os filtros da DRE-SINOP ativados.
                  </p>
                </div>
                <a
                  href={directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest text-center shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} /> Abrir Relatório no Google Data Studio
                </a>
              </div>

              {/* SOLUÇÃO 2: COMO HABILITAR NO DATA STUDIO */}
              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm space-y-2">
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Opção 2 (Para exibir 100% dentro desta caixa):</p>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Basta solicitar à equipe da <b>COGER / DRE-SINOP</b> para realizar a liberação no painel deles seguindo estes 3 passos rápidos:
                </p>
                <ol className="text-[10px] text-slate-800 font-bold uppercase space-y-1 pl-4 list-decimal">
                  <li>No Data Studio, clicar em <b>Arquivo ➔ Incorporar relatório</b>.</li>
                  <li>Marcar a opção <b>"Habilitar incorporação"</b>.</li>
                  <li>Em Compartilhamento, definir visibilidade como <b>"Qualquer pessoa com o link pode visualizar"</b>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default BuscaAtivaDataStudioPanel;
