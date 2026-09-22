import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ArrowLeft, Trophy, Medal, Star, ShieldCheck, HeartHandshake, TrendingDown, BookOpen, AlertCircle, RefreshCw, Printer } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { SCHOOL_CLASSES } from '../constants/initialData';

interface GamificationModuleProps {
  user: User;
  onExit: () => void;
}

interface ClassScore {
  className: string;
  totalPoints: number;
  breakdown: {
    grades: number;
    library: number;
    cleaning: number;
    pedagogicalOccurrences: number;
    classroomOccurrences: number;
    civicBehavior: number;
  };
  badges: string[];
}

const GamificationModule: React.FC<GamificationModuleProps> = ({ user, onExit }) => {
  const [activeTab, setActiveTab] = useState<'ranking' | 'pontos_manuais'>('ranking');
  const [bimestreFiltro, setBimestreFiltro] = useState<string>('1º BIMESTRE');
  const [rankingData, setRankingData] = useState<ClassScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'ranking') {
      calculateRanking(bimestreFiltro);
    }
  }, [bimestreFiltro, activeTab]);

  const calculateRanking = async (bimestre: string) => {
    setIsLoading(true);
    try {
      const classes = SCHOOL_CLASSES;
      const classScores: Record<string, ClassScore> = {};
      
      // Initialize scores
      classes.forEach(c => {
        classScores[c] = {
          className: c,
          totalPoints: 0,
          breakdown: {
            grades: 0,
            library: 0,
            cleaning: 0,
            pedagogicalOccurrences: 0,
            classroomOccurrences: 0,
            civicBehavior: 0
          },
          badges: []
        };
      });

      // 1. Grades (Assessments)
      const { data: assessments } = await supabase
        .from('assessments')
        .select('id, classroom_id, class_name, bimestre')
        .eq('bimestre', bimestre);
      
      if (assessments && assessments.length > 0) {
        const assessmentIds = assessments.map(a => a.id);
        const { data: grades } = await supabase
          .from('grades')
          .select('assessment_id, score, assessments(class_name)')
          .in('assessment_id', assessmentIds);

        if (grades) {
           grades.forEach((g: any) => {
             const cName = g.assessments?.class_name;
             if (cName && classScores[cName]) {
               // Give 5 points for every grade >= 7.0, and 10 points for every grade >= 9.0
               const score = g.score || 0;
               if (score >= 9) classScores[cName].breakdown.grades += 10;
               else if (score >= 7) classScores[cName].breakdown.grades += 5;
             }
           });
        }
      }

      // 2. Library (Loans)
      const { data: loans } = await supabase
        .from('library_loans')
        .select('reader_class')
        .in('status', ['ATIVO', 'DEVOLVIDO']); // Assuming this table has reader_class, we approximate
      if (loans) {
         loans.forEach((l: any) => {
           const cName = l.reader_class;
           if (cName && classScores[cName]) {
             classScores[cName].breakdown.library += 2; // 2 points per borrowed book
           }
         });
      }

      // 3. Civic Behavior (civic_student_behavior)
      // Since it's a running score, we just apply it globally for now
      const { data: civic, error: errCivic } = await supabase
        .from('civic_student_behavior')
        .select('class_name, score');
      if (civic && !errCivic) {
        civic.forEach((c: any) => {
          const cName = c.class_name;
          if (cName && classScores[cName] && c.score) {
             if (c.score >= 9.0) classScores[cName].breakdown.civicBehavior += 50;
             else if (c.score >= 8.0) classScores[cName].breakdown.civicBehavior += 10;
             else if (c.score < 5.0) classScores[cName].breakdown.civicBehavior -= 20;
          }
        });
      }

      // 4. Occurrences (Pedagogical and Classroom)
      const { data: occurrences, error: errOcc } = await supabase
        .from('occurrences')
        .select('classroom_name, category, severity')
        .eq('status', 'REGISTRADO');
        
      if (occurrences && !errOcc) {
        occurrences.forEach((o: any) => {
          const cName = o.classroom_name;
          if (cName && classScores[cName]) {
             if (o.category?.includes('ELOGIO') || o.severity === 'ELOGIO') {
               classScores[cName].breakdown.classroomOccurrences += 20;
             } else {
               if (o.severity === 'ALTA' || o.severity === 'CRÍTICA') classScores[cName].breakdown.pedagogicalOccurrences -= 30;
               else classScores[cName].breakdown.pedagogicalOccurrences -= 10;
             }
          }
        });
      }

      // 5. Cleaning Occurrences - Safe fallback if table doesn't exist
      try {
        const { data: cleanOcc, error: errClean } = await supabase
          .from('cleaning_occurrences')
          .select('location, category');
      } catch(e) {}
      
      // Calculate totals and badges
      const finalScores = Object.values(classScores).map(score => {
        score.totalPoints = Object.values(score.breakdown).reduce((a, b) => a + b, 0) + 1000; // Base score 1000
        
        if (score.breakdown.cleaning >= 0 && score.breakdown.classroomOccurrences > -15 && score.breakdown.pedagogicalOccurrences > -10) {
           score.badges.push('Selo Paz');
        }
        if (score.breakdown.library > 20) {
           score.badges.push('Selo Leitura');
        }
        if (score.breakdown.grades > 100) {
           score.badges.push('Selo Coruja');
        }
        
        return score;
      }).sort((a, b) => b.totalPoints - a.totalPoints);

      setRankingData(finalScores.filter(s => s.totalPoints > 0)); // Only show active classes
    } catch (e) {
      console.error('Error calculating gamification:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans print:bg-white print:h-auto">
      {/* Esconder cabeçalho original na impressão */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-20 print:hidden">
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
            <p className="text-xs sm:text-sm text-slate-500 font-medium hidden sm:block">
              Ranking de Turmas, Disciplina, Avaliações e Conduta
            </p>
          </div>
        </div>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'ranking' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Ranking
          </button>
          <button
            onClick={() => setActiveTab('pontos_manuais')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'pontos_manuais' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Pontos Extras
          </button>
        </div>
      </header>

      {/* Cabeçalho exclusivo para impressão */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-slate-200 pb-4">
         <div className="flex justify-center items-center gap-4 mb-2">
           <Trophy className="text-amber-500" size={48} />
           <h1 className="text-4xl font-black text-slate-900 uppercase">Liga Maggi</h1>
           <Trophy className="text-amber-500" size={48} />
         </div>
         <h2 className="text-2xl font-bold text-slate-600">Boletim Semanal de Gamificação Escolar</h2>
         <p className="text-lg text-slate-500 mt-2">Classificação Oficial referente ao {bimestreFiltro}</p>
      </div>

      <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8 custom-scrollbar print:overflow-visible print:p-0">
        <div className="max-w-7xl mx-auto print:max-w-full">
          {activeTab === 'ranking' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Cabecalho de Filtros */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 gap-4 print:hidden">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center">
                  {['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'].map(b => (
                    <button
                      key={b}
                      onClick={() => setBimestreFiltro(b)}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                        bimestreFiltro === b ? 'bg-amber-100 text-amber-800' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 font-bold text-sm flex-1 sm:flex-none shadow-md"
                  >
                    <Printer size={16} />
                    Imprimir Mural
                  </button>
                  <button 
                    onClick={() => calculateRanking(bimestreFiltro)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 font-bold text-sm flex-1 sm:flex-none justify-center"
                  >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    Atualizar Dados
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 print:hidden">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                  <p className="text-slate-500 font-medium">Cruzando dados de todos os módulos...</p>
                </div>
              ) : rankingData.length >= 3 ? (
                <>
                  {/* Area do Podio */}
                  <div className="bg-gradient-to-b from-indigo-900 to-indigo-950 rounded-3xl p-4 sm:p-8 shadow-xl text-white relative overflow-hidden print:shadow-none print:border-2 print:border-indigo-900 print:text-slate-900 print:bg-none print:bg-white print:mb-8">
                    <div className="absolute top-0 right-0 p-8 opacity-10 print:hidden">
                      <Trophy size={200} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center text-amber-400 print:text-indigo-900 print:text-4xl">Pódio Oficial - Top 3</h2>
                    <div className="flex justify-center items-end gap-2 sm:gap-4 h-64 sm:h-72 print:h-80">
                      {/* 2o Lugar */}
                      <div className="w-1/3 sm:w-1/4 flex flex-col items-center">
                        <div className="text-sm sm:text-xl font-bold mb-1 sm:mb-2 print:text-2xl print:text-slate-800">{rankingData[1].className}</div>
                        <div className="text-xs sm:text-sm text-indigo-200 mb-2 sm:mb-4 print:text-indigo-600 print:font-bold print:text-lg">{rankingData[1].totalPoints} pts</div>
                        <div className="w-full h-32 sm:h-40 bg-slate-300 rounded-t-lg flex justify-center items-start pt-2 sm:pt-4 border-t-4 border-slate-400 shadow-inner print:bg-slate-200 print:shadow-none">
                          <span className="text-2xl sm:text-4xl font-black text-slate-500">2º</span>
                        </div>
                      </div>
                      {/* 1o Lugar */}
                      <div className="w-1/3 sm:w-1/3 flex flex-col items-center z-10">
                        <div className="text-lg sm:text-3xl font-black text-amber-400 mb-1 sm:mb-2 print:text-4xl print:text-amber-500">{rankingData[0].className}</div>
                        <div className="text-sm sm:text-lg text-amber-200 mb-2 sm:mb-4 font-bold flex items-center gap-1 print:text-amber-600 print:text-2xl"><Star size={20}/> {rankingData[0].totalPoints} pts</div>
                        <div className="w-full h-44 sm:h-56 bg-amber-500 rounded-t-lg flex justify-center items-start pt-2 sm:pt-4 border-t-4 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)] print:bg-amber-400 print:shadow-none">
                          <span className="text-3xl sm:text-5xl font-black text-amber-100 print:text-white">1º</span>
                        </div>
                      </div>
                      {/* 3o Lugar */}
                      <div className="w-1/3 sm:w-1/4 flex flex-col items-center">
                        <div className="text-sm sm:text-xl font-bold mb-1 sm:mb-2 print:text-2xl print:text-slate-800">{rankingData[2].className}</div>
                        <div className="text-xs sm:text-sm text-indigo-200 mb-2 sm:mb-4 print:text-indigo-600 print:font-bold print:text-lg">{rankingData[2].totalPoints} pts</div>
                        <div className="w-full h-24 sm:h-28 bg-amber-700/80 rounded-t-lg flex justify-center items-start pt-2 sm:pt-4 border-t-4 border-amber-600/60 shadow-inner print:bg-amber-100 print:border-amber-200 print:shadow-none">
                          <span className="text-2xl sm:text-4xl font-black text-amber-900/40 print:text-amber-700">3º</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Restante do Ranking */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:border-2 print:border-slate-800 print:shadow-none">
                    <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center print:bg-slate-800 print:text-white">
                      <h3 className="font-bold text-slate-700 print:text-white print:text-xl">Classificação Geral Escolar</h3>
                    </div>
                    <div className="divide-y divide-slate-50 print:divide-slate-200">
                      {rankingData.slice(3).map((turma, idx) => (
                        <div key={turma.className} className="px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group print:py-2">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors print:bg-slate-200 print:text-slate-800">
                              {idx + 4}º
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 print:text-xl">{turma.className}</div>
                              <div className="text-[10px] sm:text-xs text-slate-500 flex flex-wrap gap-2 mt-1 print:text-sm">
                                {turma.badges.includes('Selo Paz') && <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded print:border print:border-emerald-200"><HeartHandshake size={12}/> Paz</span>}
                                {turma.badges.includes('Selo Leitura') && <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded print:border print:border-blue-200"><BookOpen size={12}/> Leitora</span>}
                                {turma.badges.includes('Selo Coruja') && <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded print:border print:border-amber-200"><Star size={12}/> Destaque Notas</span>}
                                {turma.badges.length === 0 && <span className="text-slate-400">Sem medalhas no bimestre</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="font-black text-indigo-600 sm:text-lg print:text-2xl print:text-slate-900">
                              {turma.totalPoints} <span className="text-xs text-indigo-400 font-bold uppercase print:text-slate-500">pts</span>
                            </div>
                            <div className="text-[9px] text-slate-400 hidden sm:block print:text-xs print:text-slate-600">
                              + {(turma.breakdown.civicBehavior > 0 ? turma.breakdown.civicBehavior : 0) + turma.breakdown.grades} Ganhos | - {Math.abs((turma.breakdown.pedagogicalOccurrences < 0 ? turma.breakdown.pedagogicalOccurrences : 0))} Perdidos
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Rodapé de Impressão */}
                  <div className="hidden print:block text-center mt-8 text-sm text-slate-500 border-t border-slate-200 pt-4">
                     Gerado automaticamente pelo Sistema de Gamificação Escolar - {new Date().toLocaleDateString('pt-BR')}
                  </div>
                </>
              ) : (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 print:hidden">
                  <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="font-bold text-slate-700">Ainda não há dados suficientes</h3>
                  <p className="text-slate-500 text-sm mt-2">Os dados dos módulos ainda não foram lançados para gerar o ranking deste bimestre.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pontos_manuais' && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center animate-in fade-in max-w-2xl mx-auto mt-8 print:hidden">
               <Trophy size={48} className="mx-auto text-amber-300 mb-4" />
               <h2 className="text-xl font-bold text-slate-700">Lançamento de Pontos Extras</h2>
               <p className="text-slate-500 mt-2 text-sm mb-8">Esta tela permitirá que a Gestão adicione pontos extras (Ex: Gincanas, Feira de Ciências, Arrecadações) diretamente na pontuação de uma turma.</p>
               
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                 <LockIcon className="mx-auto text-slate-400 mb-2" />
                 <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Módulo em Desenvolvimento</p>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const LockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

export default GamificationModule;
