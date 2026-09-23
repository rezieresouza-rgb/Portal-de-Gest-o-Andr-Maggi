const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'modules', 'GamificationModule.tsx');
let content = fs.readFileSync(filepath, 'utf8');

const ui_ranking_alunos = `          {activeTab === 'ranking_alunos' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 gap-4 print:hidden">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center">
                  {['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'].map(b => (
                    <button
                      key={b}
                      onClick={() => setBimestreFiltro(b)}
                      className={\`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors \${
                        bimestreFiltro === b ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }\`}
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
                    Imprimir Ranking
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
                  <p className="text-slate-500 font-medium">Calculando ranking individual...</p>
                </div>
              ) : studentRankingData.length >= 3 ? (
                <>
                  {/* Pódio Alunos */}
                  <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-4 sm:p-8 shadow-xl text-white relative overflow-hidden print:shadow-none print:border-2 print:border-slate-900 print:text-slate-900 print:bg-none print:bg-white print:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center text-amber-400 print:text-slate-900 print:text-4xl">Pódio Alunos - Top 3</h2>
                    <div className="flex justify-center items-end gap-2 sm:gap-4 h-64 sm:h-72 print:h-80">
                      {/* 2o Lugar */}
                      <div className="w-1/3 sm:w-1/4 flex flex-col items-center">
                        <div className="text-xs sm:text-lg font-bold mb-1 sm:mb-1 print:text-xl print:text-slate-800 text-center">{studentRankingData[1].studentName.split(' ').slice(0,2).join(' ')}</div>
                        <div className="text-[10px] text-slate-400 mb-2">{studentRankingData[1].className}</div>
                        <div className="text-xs sm:text-sm text-indigo-200 mb-2 sm:mb-4 print:text-indigo-600 print:font-bold print:text-lg">{studentRankingData[1].totalPoints} pts</div>
                        <div className="w-full h-32 sm:h-40 bg-slate-300 rounded-t-lg flex justify-center items-start pt-2 sm:pt-4 border-t-4 border-slate-400 shadow-inner print:bg-slate-200 print:shadow-none">
                          <span className="text-2xl sm:text-4xl font-black text-slate-500">2º</span>
                        </div>
                      </div>
                      {/* 1o Lugar */}
                      <div className="w-1/3 sm:w-1/3 flex flex-col items-center z-10">
                        <div className="text-sm sm:text-2xl font-black text-amber-400 mb-1 sm:mb-1 print:text-2xl print:text-amber-500 text-center">{studentRankingData[0].studentName.split(' ').slice(0,2).join(' ')}</div>
                        <div className="text-[10px] text-amber-200/50 mb-2">{studentRankingData[0].className}</div>
                        <div className="text-sm sm:text-lg text-amber-200 mb-2 sm:mb-4 font-bold flex items-center gap-1 print:text-amber-600 print:text-2xl"><Star size={20}/> {studentRankingData[0].totalPoints} pts</div>
                        <div className="w-full h-44 sm:h-56 bg-amber-500 rounded-t-lg flex justify-center items-start pt-2 sm:pt-4 border-t-4 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)] print:bg-amber-400 print:shadow-none">
                          <span className="text-3xl sm:text-5xl font-black text-amber-100 print:text-white">1º</span>
                        </div>
                      </div>
                      {/* 3o Lugar */}
                      <div className="w-1/3 sm:w-1/4 flex flex-col items-center">
                        <div className="text-xs sm:text-lg font-bold mb-1 sm:mb-1 print:text-xl print:text-slate-800 text-center">{studentRankingData[2].studentName.split(' ').slice(0,2).join(' ')}</div>
                        <div className="text-[10px] text-slate-400 mb-2">{studentRankingData[2].className}</div>
                        <div className="text-xs sm:text-sm text-indigo-200 mb-2 sm:mb-4 print:text-indigo-600 print:font-bold print:text-lg">{studentRankingData[2].totalPoints} pts</div>
                        <div className="w-full h-24 sm:h-28 bg-amber-700/80 rounded-t-lg flex justify-center items-start pt-2 sm:pt-4 border-t-4 border-amber-600/60 shadow-inner print:bg-amber-100 print:border-amber-200 print:shadow-none">
                          <span className="text-2xl sm:text-4xl font-black text-amber-900/40 print:text-amber-700">3º</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Restante do Ranking Alunos */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:border-2 print:border-slate-800 print:shadow-none">
                    <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center print:bg-slate-800 print:text-white">
                      <h3 className="font-bold text-slate-700 print:text-white print:text-xl">Classificação Geral (Alunos)</h3>
                    </div>
                    <div className="divide-y divide-slate-50 print:divide-slate-200">
                      {studentRankingData.slice(3, 50).map((student, idx) => (
                        <div key={student.studentName+student.className} className="px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group print:py-2">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors print:bg-slate-200 print:text-slate-800 shrink-0">
                              {idx + 4}º
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 print:text-xl">{student.studentName}</div>
                              <div className="text-[10px] text-slate-400 mb-1">{student.className}</div>
                              <div className="text-[10px] sm:text-xs text-slate-500 flex flex-wrap gap-2 print:text-sm">
                                {student.badges.includes('Selo Paz') && <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded print:border print:border-emerald-200"><HeartHandshake size={12}/> Paz</span>}
                                {student.badges.includes('Selo Leitura') && <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded print:border print:border-blue-200"><BookOpen size={12}/> Leitor</span>}
                                {student.badges.includes('Selo Coruja') && <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded print:border print:border-amber-200"><Star size={12}/> Destaque</span>}
                                {student.badges.includes('Selo Cívico') && <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded print:border print:border-indigo-200"><ShieldCheck size={12}/> Cívico</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="font-black text-indigo-600 sm:text-lg print:text-2xl print:text-slate-900">
                              {student.totalPoints} <span className="text-xs text-indigo-400 font-bold uppercase print:text-slate-500">pts</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 print:hidden">
                  <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="font-bold text-slate-700">Ainda não há dados suficientes</h3>
                  <p className="text-slate-500 text-sm mt-2">Nenhum aluno atingiu pontuação mínima para o ranking.</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'auditoria' && (`;

content = content.replace("          {activeTab === 'auditoria' && (", ui_ranking_alunos);

fs.writeFileSync(filepath, content, 'utf8');
console.log('Inserted UI content');
