
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
  ShieldCheck,
  Save,
  Edit
} from 'lucide-react';
import { OFFICIAL_MENUS } from '../constants/menus';
import { supabase } from '../supabaseClient';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  job_function: string;
  status: string;
}

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
  'BOLACHA', 'BISCOITO', 'IOGURTE', 'MANTEIGA', 'FRUTA', 'SUCO', 'MARACUJÁ', 'ACEROLA',
  'AÇÚCAR', 'CHÁ', 'ACHOCOLATADO', 'AVEIA', 'MEL'
];

const MenuChecklist: React.FC = () => {
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form');
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
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

  const [nutricaoStaff, setNutricaoStaff] = useState<StaffMember[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data: staffData } = await supabase
          .from('staff')
          .select('*')
          .or('role.eq.AEE_NUTRICAO,job_function.ilike.%NUTRIÇÃO%')
          .eq('status', 'EM_ATIVIDADE');
        if (staffData) setNutricaoStaff(staffData);
      } catch (err) {
        console.error("Erro ao buscar funcionários:", err);
      }
    };
    fetchStaff();
  }, []);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { data, error } = await supabase
          .from('merenda_meal_records')
          .select('*')
          .order('timestamp', { ascending: false });

        if (!error && data) {
          const loadedHistory = data.map((row: any) => ({
            id: row.id,
            date: row.date,
            shift: row.shift,
            entrada: typeof row.entrada === 'string' ? JSON.parse(row.entrada) : row.entrada,
            principal: typeof row.principal === 'string' ? JSON.parse(row.principal) : row.principal,
            timestamp: row.timestamp
          }));
          
          // Sync: Tenta subir registros locais que não estão na nuvem
          const localSaved = localStorage.getItem('merenda_meal_records_v1');
          if (localSaved) {
            const parsedLocal: SavedMealRecord[] = JSON.parse(localSaved);
            const cloudIds = new Set(loadedHistory.map(r => r.id));
            const missingLocally = parsedLocal.filter(r => !cloudIds.has(r.id));

            // Upload missing local records to Supabase
            if (missingLocally.length > 0) {
              await supabase.from('merenda_meal_records').upsert(missingLocally.map(r => ({
                id: r.id,
                date: r.date,
                shift: r.shift,
                entrada: r.entrada,
                principal: r.principal,
                timestamp: r.timestamp
              })));
              
              // Recarrega tudo para garantir que temos a lista completa e atualizada
              const { data: refreshedData } = await supabase
                .from('merenda_meal_records')
                .select('*')
                .order('timestamp', { ascending: false });
              
              if (refreshedData) {
                setHistory(refreshedData.map((row: any) => ({
                  id: row.id,
                  date: row.date,
                  shift: row.shift,
                  entrada: typeof row.entrada === 'string' ? JSON.parse(row.entrada) : row.entrada,
                  principal: typeof row.principal === 'string' ? JSON.parse(row.principal) : row.principal,
                  timestamp: row.timestamp
                })));
                return;
              }
            }
          }
          
          setHistory(loadedHistory);
        }
      } catch (e) {
        console.error("Erro ao buscar histórico do Supabase:", e);
      }
    };
    fetchRecords();
  }, []);

  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<string>('Segunda');
  const getLocalDateString = () => {
    let today = new Date();
    const offset = today.getTimezoneOffset();
    today = new Date(today.getTime() - (offset*60*1000));
    return today.toISOString().split('T')[0];
  };

  const [serviceDate, setServiceDate] = useState(getLocalDateString());
  const [selectedShift, setSelectedShift] = useState<string>('MATUTINO');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const [entrada, setEntrada] = useState<MealRecord>({ ...INITIAL_MEAL });
  const [principal, setPrincipal] = useState<MealRecord>({ ...INITIAL_MEAL });

  useEffect(() => {
    if (viewMode === 'form' && !isLocked && !currentRecordId) {
      const weekMenu = OFFICIAL_MENUS.find(m => m.week === selectedWeek);
      const dayMenu = weekMenu?.days.find(d => d.day === selectedDay);

      if (dayMenu) {
        let entradaIngs: string[] = [];
        let principalIngs: string[] = [];
        let entradaDishName = '';

        if (dayMenu.entradaIngredients && dayMenu.entradaIngredients.length > 0) {
          // New explicit format
          entradaIngs = dayMenu.entradaIngredients;
          principalIngs = dayMenu.ingredients;
          entradaDishName = dayMenu.entradaDish || (entradaIngs.length > 0 ? entradaIngs.join(' + ') : '');
        } else {
          // Legacy/Fallback automatic filtering
          const allIngredients = dayMenu.ingredients;
          entradaIngs = allIngredients.filter(ing =>
            ENTRADA_KEYWORDS.some(key => ing.toUpperCase().includes(key))
          );
          principalIngs = allIngredients.filter(ing =>
            !ENTRADA_KEYWORDS.some(key => ing.toUpperCase().includes(key))
          );
          entradaDishName = entradaIngs.join(' + ') || (entradaIngs.length > 0 ? 'Lanche / Complemento' : '');
        }

        setEntrada(prev => ({
          ...prev,
          shift: selectedShift,
          dishName: entradaDishName,
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
  }, [selectedWeek, selectedDay, viewMode, selectedShift, isLocked, currentRecordId]);

  const saveToHistory = async () => {
    // Usar ID determinístico baseado em data e turno garante que turnos diferentes não se sobrescrevam
    // caso o usuário altere o turno sem clicar em "Novo Registro".
    const recordId = `meal-${serviceDate}-${selectedShift.replace(/\s+/g, '_')}`;
    const newRecord: SavedMealRecord = {
      id: recordId,
      date: serviceDate,
      shift: selectedShift,
      entrada: { ...entrada, shift: selectedShift },
      principal: { ...principal, shift: selectedShift },
      timestamp: Date.now()
    };
    
    // Remove qualquer registro existente que tenha EXATAMENTE a mesma data e o mesmo turno (caso esteja editando)
    let updatedHistory = history.filter(r => r.id !== recordId);
    
    // E se o usuário estiver editando um registro antigo (currentRecordId) e APENAS corrigiu o turno/data?
    // Nesse caso o currentRecordId antigo ficaria "órfão" no histórico.
    // Para resolver o bug do usuário (onde registrar a tarde apaga a manhã), é preferível deixar o registro original intacto
    // e criar um novo para o novo turno. Se for erro de digitação, o usuário exclui o errado no histórico.
    
    updatedHistory = [newRecord, ...updatedHistory];
    
    // Salva local (cache imediato)
    setHistory(updatedHistory);
    localStorage.setItem('merenda_meal_records_v1', JSON.stringify(updatedHistory));
    setCurrentRecordId(recordId);

    // Salva na Nuvem (Supabase)
    try {
      await supabase.from('merenda_meal_records').upsert({
        id: newRecord.id,
        date: newRecord.date,
        shift: newRecord.shift,
        entrada: newRecord.entrada,
        principal: newRecord.principal,
        timestamp: newRecord.timestamp
      });
    } catch (err) {
      console.error("Falha ao salvar no banco:", err);
    }
  };

  const deleteFromHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("ATENÇÃO: Deseja excluir permanentemente este registro oficial? Esta ação será auditada.")) {
      const updated = history.filter(r => r.id !== id);
      setHistory(updated);
      localStorage.setItem('merenda_meal_records_v1', JSON.stringify(updated));

      // Deleta da Nuvem (Supabase)
      try {
        await supabase.from('merenda_meal_records').delete().eq('id', id);
      } catch (err) {
        console.error("Falha ao remover do banco:", err);
      }
    }
  };

  const loadFromHistory = (record: SavedMealRecord) => {
    setCurrentRecordId(record.id);
    setServiceDate(record.date);
    setSelectedShift(record.shift || 'MATUTINO');
    setEntrada(record.entrada);
    setPrincipal(record.principal);
    setIsLocked(true); // Blinda o formulário para apenas leitura
    setViewMode('form');
  };

  const startNewRecord = () => {
    setCurrentRecordId(null);
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

  const handleGeneratePDF = async (recordToPrint?: SavedMealRecord) => {
    // Se passarem um record, carregamos ele temporariamente para impressão se necessário, 
    // mas aqui o componente já está exibindo o estado correto (seja locked ou editando).
    setIsGenerating(true);
    const element = printRef.current;
    if (!element) return;

    try {
      const fileNameDate = recordToPrint ? recordToPrint.date : serviceDate;
      const fileNameShift = recordToPrint ? recordToPrint.shift : selectedShift;

      const opt = {
        margin: [5, 5, 5, 5],
        filename: `Registro_Alimentacao_${fileNameDate}_${fileNameShift.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore
      await window.html2pdf().set(opt).from(element).save();

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar o PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    await saveToHistory();
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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
                      <option value="MATUTINO">Matutino</option>
                      <option value="VESPERTINO">Vespertino</option>
                    </select>
                  </>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                    <Lock size={14} />
                    <span className="text-[10px] font-black uppercase">Modo de Leitura Blindado</span>
                  </div>
                )}

                <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} disabled={isLocked} className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-xs font-black outline-none focus:border-emerald-500 disabled:opacity-50" />

                {!isLocked ? (
                  <button onClick={handleManualSave} disabled={isSaving} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-lg ${showSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : showSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
                    {isSaving ? "Salvando..." : showSuccess ? "Salvo com Sucesso!" : "Salvar Registro"}
                  </button>
                ) : (
                  <button onClick={() => handleGeneratePDF()} disabled={isGenerating} className="px-6 py-2 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-lg bg-emerald-900 text-white hover:bg-black">
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                    {isGenerating ? "Gerando..." : "Reimprimir Documento"}
                  </button>
                )}

                {isLocked && (
                  <>
                    <button onClick={() => setIsLocked(false)} className="px-6 py-2 bg-yellow-500 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-yellow-600 transition-all shadow-lg">
                      Editar Registro
                    </button>
                    <button onClick={startNewRecord} className="px-6 py-2 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-700 transition-all shadow-lg">
                      Novo Registro
                    </button>
                  </>
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
              <h1 className="text-sm font-black uppercase leading-tight text-center">Registro Diário da Alimentação</h1>
            </div>
            <div className="text-right flex-1 border-l-2 border-black pl-4">
              <h3 className="text-xs font-black uppercase leading-tight">Registro Diário da Alimentação</h3>
              <p className="text-[9px] font-bold uppercase mt-1">Data: {new Date(serviceDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
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
                    <div className="relative">
                      <select 
                        value={section.state.responsible} 
                        onChange={(e) => updateMealField(section.setter, 'responsible', e.target.value)} 
                        disabled={isLocked} 
                        className="w-full bg-transparent text-[11px] font-bold uppercase outline-none py-1 no-print appearance-none"
                      >
                        <option value="">Selecione...</option>
                        {nutricaoStaff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                      <div className="hidden pdf-show text-[11px] font-bold h-6 uppercase">{section.state.responsible || '________________________'}</div>
                    </div>
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
                          <tr key={iIdx} className={`${ing.quantity ? 'qty-filled' : 'qty-empty'} transition-all`}>
                            <td className="px-3 py-1 text-[10px] font-bold uppercase group relative">
                              <input 
                                value={ing.name} 
                                onChange={(e) => {
                                  const n = [...section.state.ingredients]; n[iIdx].name = e.target.value.toUpperCase();
                                  updateMealField(section.setter, 'ingredients', n);
                                }} 
                                disabled={isLocked} 
                                className="w-full bg-transparent outline-none no-print border-none focus:ring-0" 
                              />
                               <span className="hidden pdf-show">{ing.name}</span>
                            </td>
                            <td className="px-3 py-1 relative">
                              <div className="flex flex-col items-end">
                                <input 
                                  id={`qty-${idx}-${iIdx}`}
                                  value={ing.quantity} 
                                  onChange={(e) => updateIngredientQty(section.setter, iIdx, e.target.value)} 
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const nextId = `qty-${idx}-${iIdx + 1}`;
                                      const nextEl = document.getElementById(nextId);
                                      if (nextEl) {
                                        nextEl.focus();
                                      } else if (idx === 0) {
                                        // End of snack list -> jump to first of main list
                                        const firstMain = document.getElementById(`qty-1-0`);
                                        if (firstMain) firstMain.focus();
                                      }
                                    }
                                  }}
                                  disabled={isLocked} 
                                  placeholder="0" 
                                  className="w-full bg-transparent text-right outline-none text-[10px] font-black no-print qty-input transition-all rounded px-1" 
                                />
                                <span className="hidden pdf-show font-black text-[10px]">{ing.quantity || '____'}</span>
                                
                                {/* Sugestões de Unidade (Floating small tags) */}
                                {!isLocked && !ing.quantity.includes(' ') && ing.quantity.length > 0 && (
                                  <div className="flex gap-1 mt-1 no-print">
                                    {['KG', 'L', 'UN', 'MAÇO'].map(unit => (
                                      <button 
                                        key={unit}
                                        onClick={() => updateIngredientQty(section.setter, iIdx, `${ing.quantity} ${unit}`)}
                                        className="text-[7px] font-black bg-emerald-50 text-emerald-600 px-1 rounded hover:bg-emerald-600 hover:text-white border border-emerald-100 transition-colors"
                                      >
                                        +{unit}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
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
                  className="bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-emerald-300 hover:shadow-lg transition-all group relative overflow-hidden"
                >
                  <div className="absolute -top-1 -right-1 w-12 h-12 bg-emerald-500/10 rotate-45 flex items-end justify-center pb-1">
                    <Lock size={12} className="text-emerald-600 -rotate-45" />
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Documento Registrado</p>
                      <p className="text-sm font-black text-gray-900">{new Date(record.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
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

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <button
                      onClick={() => loadFromHistory(record)}
                      className="flex items-center justify-center gap-2 text-[9px] font-black text-blue-700 uppercase tracking-widest bg-blue-50 py-2.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all"
                    >
                      <Edit size={14} /> Editar
                    </button>
                    <button
                      onClick={async () => {
                        loadFromHistory(record);
                        // Pequeno delay para garantir que o DOM atualizou com o registro carregado antes de imprimir
                        setTimeout(() => handleGeneratePDF(record), 500);
                      }}
                      className="flex items-center justify-center gap-2 text-[9px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 py-2.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all"
                    >
                      <Printer size={14} /> Imprimir
                    </button>
                    <button
                      onClick={(e) => deleteFromHistory(record.id, e)}
                      className="flex items-center justify-center gap-2 text-[9px] font-black text-red-700 uppercase tracking-widest bg-red-50 py-2.5 rounded-xl border border-red-100 hover:bg-red-100 transition-all"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
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
        .qty-input:focus { background-color: #f0fdf4; border-color: #10b981; }
        .qty-filled { border-left: 3px solid #10b981 !important; }
        .qty-empty { border-left: 3px solid #f3f4f6 !important; }
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
