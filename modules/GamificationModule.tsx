import React, { useState } from 'react';
import { User } from '../types';
import { ArrowLeft, Trophy, Medal, Star, Filter } from 'lucide-react';

interface GamificationModuleProps {
  user: User;
  onExit: () => void;
}

const GamificationModule: React.FC<GamificationModuleProps> = ({ user, onExit }) => {
  const [activeTab, setActiveTab] = useState<'ranking' | 'regras' | 'pontos_manuais'>('ranking');
  const [bimestreFiltro, setBimestreFiltro] = useState<string>('1º BIMESTRE');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="text-amber-500" size={28} />
              Liga Maggi - Gamificação
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Ranking de Turmas, Disciplina e Engajamento
            </p>
          </div>
        </div>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'ranking' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Ranking Escolar
          </button>
          <button
            onClick={() => setActiveTab('pontos_manuais')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'pontos_manuais' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Pontuação Manual
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'ranking' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Cabecalho de Filtros */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex gap-2">
                {['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'].map(b => (
                  <button
                    key={b}
                    onClick={() => setBimestreFiltro(b)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                      bimestreFiltro === b ? 'bg-amber-100 text-amber-800' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Area do Podio */}
            <div className="bg-gradient-to-b from-indigo-900 to-indigo-950 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Trophy size={200} />
              </div>
              <h2 className="text-3xl font-black mb-8 text-center text-amber-400">Pódio do {bimestreFiltro}</h2>
              <div className="flex justify-center items-end gap-4 h-64">
                {/* 2o Lugar */}
                <div className="w-1/4 flex flex-col items-center">
                  <div className="text-xl font-bold mb-2">8º Ano B</div>
                  <div className="text-sm text-indigo-200 mb-4">1.250 pts</div>
                  <div className="w-full h-32 bg-slate-300 rounded-t-lg flex justify-center items-start pt-4 border-t-4 border-slate-400">
                    <span className="text-3xl font-black text-slate-500">2</span>
                  </div>
                </div>
                {/* 1o Lugar */}
                <div className="w-1/3 flex flex-col items-center z-10">
                  <div className="text-2xl font-black text-amber-400 mb-2">9º Ano A</div>
                  <div className="text-md text-amber-200 mb-4 font-bold flex items-center gap-1"><Star size={16}/> 1.480 pts</div>
                  <div className="w-full h-48 bg-amber-500 rounded-t-lg flex justify-center items-start pt-4 border-t-4 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                    <span className="text-4xl font-black text-amber-100">1</span>
                  </div>
                </div>
                {/* 3o Lugar */}
                <div className="w-1/4 flex flex-col items-center">
                  <div className="text-xl font-bold mb-2">7º Ano C</div>
                  <div className="text-sm text-indigo-200 mb-4">1.100 pts</div>
                  <div className="w-full h-24 bg-amber-700/60 rounded-t-lg flex justify-center items-start pt-4 border-t-4 border-amber-600/60">
                    <span className="text-3xl font-black text-amber-900/40">3</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Restante do Ranking */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Classificação Geral</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {[4, 5, 6, 7].map((pos) => (
                  <div key={pos} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                        {pos}º
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Turma Exemplo {pos}</div>
                        <div className="text-xs text-slate-500 flex gap-2 mt-1">
                          <span className="flex items-center gap-1"><Medal size={12}/> Selo Limpeza</span>
                        </div>
                      </div>
                    </div>
                    <div className="font-black text-indigo-600">
                      {1000 - pos * 50} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pontos_manuais' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center animate-in fade-in">
             <Trophy size={48} className="mx-auto text-slate-300 mb-4" />
             <h2 className="text-xl font-bold text-slate-700">Lançamento Manual de Pontos</h2>
             <p className="text-slate-500 mt-2">Em breve: Tela para coordenadores lançarem pontos de gincanas e feiras.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default GamificationModule;
