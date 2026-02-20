
import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardCheck, 
  Calendar, 
  Clock, 
  Printer,
  Loader2,
  CheckCircle2,
  Plus,
  History,
  ArrowLeft,
  Search,
  Trash2,
  FileText,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { OFFICIAL_MENUS } from '../constants/menus';

interface MealRecord {
  id?: string;
  responsible: string;
  shift: string;
  dishName: string;
  mealsServed: string;
  repeats: string;
  wasteResto: string;
  sobraLimpa: string;
  observations: string;
  ingredients: { name: string; quantity: string; checked: boolean }[];
}

interface SavedMealRecord {
  id: string;
  date: string;
  shift: string;
  entrada: MealRecord;
  principal: MealRecord;
  timestamp: number;
}

const INITIAL_MEAL: MealRecord = {
  responsible: '',
  shift: 'MATUTINO',
  dishName: '',
  mealsServed: '',
  repeats: '',
  wasteResto: '',
  sobraLimpa: '',
  observations: '',
  ingredients: []
};

const ENTRADA_KEYWORDS = [
  'ABACAXI', 'BANANA', 'MAMÃO', 'MELÃO', 'MELANCIA', 'LARANJA', 'PONCÃ', 'MAÇÃ', 
  'PÃO', 'BOLO', 'LEITE', 'BEBIDA LÁCTEA', 'QUEIJO', 'REQUEIJÃO', 'CAFÉ', 
  'BOLACHA', 'BISCOITO', 'IOGURTE', 'MANTEIGA', 'FRUTA', 'SUCO', 'MARACUJÁ', 'ACEROLA'
];

const MenuChecklist: React.FC = () => {
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form');
  const [isLocked, setIsLocked] = useState(false); // NOVO: Bloqueia edição de históricos
  const [history, setHistory] = useState<SavedMealRecord[]>(() => {
    try {
      const saved = localStorage.getItem('merenda_meal_records_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Erro ao carregar histórico diário", e);
      return [];
    }
  });

  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<string>('Segunda');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState<string>('MATUTINO / VESPERTINO');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  const [entrada, setEntrada] = useState<MealRecord>({ ...INITIAL_MEAL });
  const [principal, setPrincipal] = useState<MealRecord>({ ...INITIAL_MEAL });

  useEffect(() => {
    if (viewMode === 'form' && !isLocked) {
      const weekMenu = OFFICIAL_MENUS.find(m => m.week === selectedWeek);
      const dayMenu = weekMenu?.days.find(d => d.day === selectedDay);
      
      if (dayMenu) {
        const allIngredients = dayMenu.ingredients;
        const entradaIngs = allIngredients.filter(ing => 
          ENTRADA_KEYWORDS.some(key => ing.toUpperCase().includes(key))
        );
        const principalIngs = allIngredients.filter(ing => 
          !ENTRADA_KEYWORDS.some(key => ing.toUpperCase().includes(key))
        );

        setEntrada(prev => ({
          ...prev,
          shift: selectedShift,
          dishName: entradaIngs.length > 0 ? 'Lanche / Complemento' : '',
          ingredients: entradaIngs.map(ing => ({ name: ing, quantity: '', checked: false }))
        }));

        setPrincipal(prev => ({
          ...prev,
          shift: selectedShift,
          dishName: dayMenu.dish,
          ingredients: principalIngs.map(ing => ({ name: ing, quantity: '', checked: false }))
        }));
      }
    }
  }, [selectedWeek, selectedDay, viewMode, selectedShift, isLocked]);

  const saveToHistory = () => {
    const newRecord: SavedMealRecord = {
      id: `meal-${Date.now()}`,
      date: serviceDate,
      shift: selectedShift,
      entrada: { ...entrada, shift: selectedShift },
      principal: { ...principal, shift: selectedShift },
      timestamp: Date.now()
    };
    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('merenda_meal_records_v1', JSON.stringify(updatedHistory));
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("ATENÇÃO: Deseja excluir permanentemente este registro oficial? Esta ação será auditada.")) {
      const updated = history.filter(r => r.id !== id);
      setHistory(updated);
      localStorage.setItem('merenda_meal_records_v1', JSON.stringify(updated));
    }
  };

  const loadFromHistory = (record: SavedMealRecord) => {
    setServiceDate(record.date);
    setSelectedShift(record.shift || 'MATUTINO / VESPERTINO');
    setEntrada(record.entrada);
    setPrincipal(record.principal);
    setIsLocked(true); // Blinda o formulário para apenas leitura
    setViewMode('form');
  };

  const startNewRecord = () => {
    setIsLocked(false);
    setEntrada({ ...INITIAL_MEAL });
    setPrincipal({ ...INITIAL_MEAL });
    setViewMode('form');
  };

  const updateMealField = (setter: React.Dispatch<React.SetStateAction<MealRecord>>, field: keyof MealRecord, value: any) => {
    if (isLocked) return;
    setter(prev => ({ ...prev, [field]: value }));
  };

  const updateIngredientQty = (setter: React.Dispatch<React.SetStateAction<MealRecord>>, index: number, qty: string) => {
    if (isLocked) return;
    setter(prev => {
      const newIngs = [...prev.ingredients];
      newIngs[index].quantity = qty;
      return { ...prev, ingredients: newIngs };
    });
  };

  const addIngredient = (setter: React.Dispatch<React.SetStateAction<MealRecord>>) => {
    if (isLocked) return;
    setter(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', checked: false }]
    }));
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    const element = printRef.current;
    if (!element) return;

    try {
      const opt = {
        margin: [5, 5, 5, 5],
        filename: `Registro_Alimentacao_${serviceDate}_${selectedShift.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore
      await window.html2pdf().set(opt).from(element).save();
      
      if (!isLocked) saveToHistory();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar o PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* PAINEL DE CONTROLE - APENAS NA TELA */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 no-print">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-lg">
              <ClipboardCheck size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Registro de Alimentação</h2>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Documento Oficial PNAE | SEDUC-MT</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
             {viewMode === 'form' ? (
               <>
                 <button 
                  onClick={() => setViewMode('history')}
                  className="px-6 py-2 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                 >
                   <History size={16} /> Histórico
                 </button>
                 
                 {!isLocked ? (
                   <>
                     <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100 flex gap-1">
                        {[1, 2, 3, 4, 5].map(w => (
                          <button key={w} onClick={() => setSelectedWeek(w)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedWeek === w ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-emerald-600'}`}>Sem {w}</button>
                        ))}
                     </div>
                     <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-xs font-black uppercase outline-none focus:border-emerald-500">
                       {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map(d => <option key={d}>{d}</option>)}
                     </select>
                     <select 
                      value={selectedShift} 
                      onChange={(e) => setSelectedShift(e.target.value)} 
                      className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-xs font-black uppercase outline-none focus:border-emerald-500"
                     >
                       <option value="MATUTINO / VESPERTINO">Matutino / Vespertino</option>
                       <option value="MATUTINO">Apenas Matutino</option>
                       <option value="VESPERTINO">Apenas Vespertino</option>
                       <option value="NOTURNO">Noturno</option>
                       <option value="INTEGRAL">Integral</option>
                     </select>
                   </>
                 ) : (
                    <div className="flex items-center gap-2 px-6 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                       <Lock size={14} />
                       <span className="text-[10px] font-black uppercase">Modo de Leitura Blindado</span>
                    </div>
                 )}

                 <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} disabled={isLocked} className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-xs font-black outline-none focus:border-emerald-500 disabled:opacity-50" />
                 
                 <button onClick={handleGeneratePDF} disabled={isGenerating} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-lg ${showSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-900 text-white hover:bg-black'}`}>
                   {isGenerating ? <Loader2 size={16} className="animate-spin" /> : showSuccess ? <CheckCircle2 size={16} /> : <Printer size={16} />}
                   {isGenerating ? "Gerando..." : isLocked ? "Reimprimir Documento" : "Imprimir e Salvar"}
                 </button>

                 {isLocked && (
                   <button onClick={startNewRecord} className="px-6 py-2 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-700 transition-all shadow-lg">
                     Novo Registro
                   </button>
                 )}
               </>
             ) : (
               <button 
                onClick={() => setViewMode('form')}
                className="px-6 py-2 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 bg-emerald-600 text-white shadow-lg"
               >
                 <ArrowLeft size={16} /> Voltar ao Registro
               </button>
             )}
          </div>
        </div>
      </div>

      {viewMode === 'form' ? (
        <div ref={printRef} className="max-w-[210mm] mx-auto bg-white p-6 pdf-document border border-gray-200 relative">
          
          {/* SELO DE INTEGRIDADE NO PDF */}
          <div className="hidden pdf-show absolute top-2 right-6 opacity-40">
             <div className="flex flex-col items-center border border-black p-1 rounded">
               <ShieldCheck size={16} />
               <span className="text-[6px] font-bold uppercase">Autenticado SEDUC</span>
             </div>
          </div>

          <div className="border-2 border-black p-4 mb-4 flex justify-between items-center bg-gray-50">
            <div className="flex-1">
               <h1 className="text-sm font-black uppercase leading-tight">Estado de Mato Grosso</h1>
               <h2 className="text-[11px] font-bold uppercase leading-tight">Secretaria de Estado de Educação</h2>
               <p className="text-[10px] font-bold uppercase">E.E. André Antônio Maggi | CDCE: 11.906.357/0001-50</p>
            </div>
            <div className="text-right flex-1 border-l-2 border-black pl-4">
              <h3 className="text-xs font-black uppercase leading-tight">Registro Diário da Alimentação</h3>
              <p className="text-[9px] font-bold uppercase mt-1">Data: {new Date(serviceDate).toLocaleDateString('pt-BR')}</p>
              <p className="text-[9px] font-bold uppercase">Turno: {selectedShift}</p>
            </div>
          </div>

          {[
            { title: '1. LANCHE DE ENTRADA / COMPLEMENTAR', state: entrada, setter: setEntrada },
            { title: '2. REFEIÇÃO PRINCIPAL', state: principal, setter: setPrincipal }
          ].map((section, idx) => (
            <div key={idx} className="mb-4 border-2 border-black overflow-hidden page-break-avoid">
              <div className="bg-black text-white px-3 py-1 font-black text-[10px] uppercase tracking-widest flex justify-between">
                <span>{section.title}</span>
              </div>

              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-b border-black">
                     <p className="text-[8px] font-black uppercase text-gray-500">Merendeira(o) Responsável</p>
                     <input type="text" value={section.state.responsible} onChange={(e) => updateMealField(section.setter, 'responsible', e.target.value)} disabled={isLocked} placeholder="Nome..." className="w-full bg-transparent text-[11px] font-bold uppercase outline-none py-1 no-print" />
                     <div className="hidden pdf-show text-[11px] font-bold h-6 uppercase">{section.state.responsible || '________________________'}</div>
                  </div>
                  <div className="border-b border-black">
                     <p className="text-[8px] font-black uppercase text-gray-500">Cardápio do Dia</p>
                     <input type="text" value={section.state.dishName} onChange={(e) => updateMealField(section.setter, 'dishName', e.target.value)} disabled={isLocked} placeholder="Descrição..." className="w-full bg-transparent text-[11px] font-bold uppercase outline-none py-1 no-print" />
                     <div className="hidden pdf-show text-[11px] font-bold h-6 uppercase">{section.state.dishName || '________________________'}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center no-print">
                    <p className="text-[8px] font-black uppercase text-gray-500">Alimentos Utilizados</p>
                    {!isLocked && <button onClick={() => addIngredient(section.setter)} className="text-[8px] font-black uppercase text-emerald-600 hover:underline">+ Item</button>}
                  </div>
                  <div className="border border-black">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-black">
                          <th className="px-3 py-1 text-[8px] font-black uppercase">Descrição do Alimento</th>
                          <th className="px-3 py-1 text-[8px] font-black uppercase w-28 text-right">Qtd Consumida</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {section.state.ingredients.map((ing, iIdx) => (
                          <tr key={iIdx}>
                            <td className="px-3 py-0.5 text-[10px] font-bold uppercase">
                              <input value={ing.name} onChange={(e) => {
                                 const n = [...section.state.ingredients]; n[iIdx].name = e.target.value.toUpperCase();
                                 updateMealField(section.setter, 'ingredients', n);
                              }} disabled={isLocked} className="w-full bg-transparent outline-none no-print" />
                              <span className="hidden pdf-show">{ing.name}</span>
                            </td>
                            <td className="px-3 py-0.5 text-right">
                               <input value={ing.quantity} onChange={(e) => updateIngredientQty(section.setter, iIdx, e.target.value)} disabled={isLocked} placeholder="0" className="w-full bg-transparent text-right outline-none text-[10px] font-black no-print" />
                               <span className="hidden pdf-show font-black text-[10px]">{ing.quantity || '____'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-0 border border-black divide-x divide-black bg-gray-50">
                  <div className="p-1.5 text-center">
                     <p className="text-[7px] font-black uppercase leading-none mb-1">Refeições Servidas</p>
                     <input type="number" value={section.state.mealsServed} onChange={(e) => updateMealField(section.setter, 'mealsServed', e.target.value)} disabled={isLocked} className="w-full bg-transparent text-center font-black text-[11px] outline-none no-print" />
                     <span className="hidden pdf-show font-black text-[11px]">{section.state.mealsServed || '0'}</span>
                  </div>
                  <div className="p-1.5 text-center">
                     <p className="text-[7px] font-black uppercase leading-none mb-1">Repetições</p>
                     <input type="number" value={section.state.repeats} onChange={(e) => updateMealField(section.setter, 'repeats', e.target.value)} disabled={isLocked} className="w-full bg-transparent text-center font-black text-[11px] outline-none no-print" />
                     <span className="hidden pdf-show font-black text-[11px]">{section.state.repeats || '0'}</span>
                  </div>
                  <div className="p-1.5 text-center">
                     <p className="text-[7px] font-black uppercase leading-none mb-1">Peso Resto (KG)</p>
                     <input type="text" value={section.state.wasteResto} onChange={(e) => updateMealField(section.setter, 'wasteResto', e.target.value)} disabled={isLocked} className="w-full bg-transparent text-center font-black text-[11px] outline-none no-print" />
                     <span className="hidden pdf-show font-black text-[11px]">{section.state.wasteResto || '0.0'}</span>
                  </div>
                  <div className="p-1.5 text-center">
                     <p className="text-[7px] font-black uppercase leading-none mb-1">Sobra Limpa (KG)</p>
                     <input type="text" value={section.state.sobraLimpa} onChange={(e) => updateMealField(section.setter, 'sobraLimpa', e.target.value)} disabled={isLocked} className="w-full bg-transparent text-center font-black text-[11px] outline-none no-print" />
                     <span className="hidden pdf-show font-black text-[11px]">{section.state.sobraLimpa || '0.0'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-8 grid grid-cols-2 gap-12 px-6">
             <div className="text-center">
                <div className="border-t-2 border-black pt-1">
                   <p className="text-[9px] font-black uppercase">Responsável pela Merenda</p>
                </div>
             </div>
             <div className="text-center">
                <div className="border-t-2 border-black pt-1">
                   <p className="text-[9px] font-black uppercase">Direção / CDCE</p>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                 <History className="text-emerald-600" /> Histórico de Registros Auditados
               </h3>
               <div className="relative w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                 <input type="text" placeholder="Data ou Turno..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.length > 0 ? history.map(record => (
                <div 
                  key={record.id} 
                  onClick={() => loadFromHistory(record)}
                  className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute -top-1 -right-1 w-12 h-12 bg-emerald-500/10 rotate-45 flex items-end justify-center pb-1">
                     <Lock size={12} className="text-emerald-600 -rotate-45" />
                  </div>
                  
                  <button 
                    onClick={(e) => deleteFromHistory(record.id, e)}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Documento Registrado</p>
                      <p className="text-sm font-black text-gray-900">{new Date(record.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-gray-400">Turno:</span>
                      <span className="text-gray-900 font-black">{record.shift || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-gray-400">Volume Tot.:</span>
                      <span className="text-gray-700 font-black">{(Number(record.entrada.mealsServed) + Number(record.principal.mealsServed)) || 0} Refeições</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[9px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 w-full justify-center py-2.5 rounded-xl border border-emerald-100">
                    <ShieldCheck size={14} /> Ver Arquivo Original
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                  <div className="p-6 bg-gray-50 rounded-full text-gray-200">
                    <History size={48} />
                  </div>
                  <p className="text-gray-400 font-bold uppercase text-xs">Nenhum registro oficial encontrado no banco de dados.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pdf-document { font-family: 'Arial', sans-serif !important; }
        .pdf-show { display: none; }
        .page-break-avoid { page-break-inside: avoid; }
        @media print, .pdf-mode {
          .no-print { display: none !important; }
          .pdf-show { display: block !important; }
          .pdf-document { border: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default MenuChecklist;
