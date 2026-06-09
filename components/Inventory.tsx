
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Package,
  ClipboardCheck,
  User,
  Clock,
  Calendar,
  RotateCcw,
  ArrowRightLeft,
  Download,
  Loader2,
  CheckCircle2,
  Info,
  History,
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  X,
  Save,
  ChevronDown,
  ShoppingCart,
  Search,
  Edit3
} from 'lucide-react';
import { OFFICIAL_MENUS } from '../constants/menus';
import { INITIAL_CONTRACTS } from '../constants/initialData';
import { SCHOOL_CALENDAR_2026 } from '../constants/schoolCalendar2026';
import { supabase } from '../supabaseClient';
import { StaffMember } from '../types';

const ENTRADA_KEYWORDS = [
  'ABACAXI', 'BANANA', 'MAMÃO', 'MELÃO', 'MELANCIA', 'LARANJA', 'PONCÃ', 'MAÇÃ',
  'PÃO', 'BOLO', 'LEITE', 'BEBIDA LÁCTEA', 'QUEIJO', 'REQUEIJÃO', 'CAFÉ',
  'BOLACHA', 'BISCOITO', 'IOGURTE', 'MANTEIGA', 'FRUTA', 'SUCO', 'MARACUJÁ', 'ACEROLA'
];

interface SeducInventoryItem {
  id: string;
  name: string;
  unit: string;
  previousBalance: number;
  entries: number;
  outputs: number;
  min: number;
}

interface InventorySnapshot {
  id: string;
  date: string;
  turno: string;
  responsavel: string;
  items: SeducInventoryItem[];
  timestamp: number;
}

const Inventory: React.FC = () => {
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [items, setItems] = useState<SeducInventoryItem[]>(() => {
    const saved = localStorage.getItem('seduc_inventory_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState<InventorySnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('merenda_inventory_history_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Erro ao carregar histórico local", e);
      return [];
    }
  });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: dbHistory, error } = await supabase
          .from('merenda_inventory_history')
          .select('*')
          .order('timestamp', { ascending: false });

        if (!error && dbHistory) {
          const formattedHistory = dbHistory.map((row: any) => ({
            id: row.id,
            date: row.date,
            turno: row.turno,
            responsavel: row.responsavel,
            items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
            timestamp: row.timestamp
          }));

          // Sync: Tenta subir registros locais que não estão na nuvem
          const localSaved = localStorage.getItem('merenda_inventory_history_v1');
          if (localSaved) {
            const parsedLocal: InventorySnapshot[] = JSON.parse(localSaved);
            const cloudIds = new Set(formattedHistory.map(r => r.id));
            const missingLocally = parsedLocal.filter(r => !cloudIds.has(r.id));

            if (missingLocally.length > 0) {
              await supabase.from('merenda_inventory_history').upsert(missingLocally.map(r => ({
                id: r.id,
                date: r.date,
                turno: r.turno,
                responsavel: r.responsavel,
                items: r.items,
                timestamp: r.timestamp
              })));

              // Recarrega tudo para garantir que o estado reflete a nuvem completa
              const { data: refreshedData } = await supabase
                .from('merenda_inventory_history')
                .select('*')
                .order('timestamp', { ascending: false });
              
              if (refreshedData) {
                setHistory(refreshedData.map((row: any) => ({
                  id: row.id,
                  date: row.date,
                  turno: row.turno,
                  responsavel: row.responsavel,
                  items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
                  timestamp: row.timestamp
                })));
                return;
              }
            }
          }
          setHistory(formattedHistory);
        }
      } catch (e) {
        console.error("Erro ao buscar histórico do Supabase:", e);
      }
    };
    fetchHistory();
  }, []);

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentItems, setAdjustmentItems] = useState<{id: string, name: string, newBalance: number}[]>([]);
  const [newItem, setNewItem] = useState({ name: '', unit: 'Kg', min: 0 });

  const [turno, setTurno] = useState('Matutino');
  const [responsavel, setResponsavel] = useState('');
  const [data, setData] = useState(new Date().toLocaleDateString('sv-SE'));
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<string>('Segunda');
  const [nutricaoStaff, setNutricaoStaff] = useState<StaffMember[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyTurnFilter, setHistoryTurnFilter] = useState('TODOS');

  useEffect(() => {
    const fetchStaff = async () => {
      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .or('role.eq.AEE_NUTRICAO,job_function.ilike.%NUTRIÇÃO%');
      if (staffData) setNutricaoStaff(staffData);
    };
    fetchStaff();
  }, []);

  // Sync week/day based on date
  useEffect(() => {
    const d = new Date(data);
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayName = days[d.getUTCDay()];
    if (dayName !== 'Domingo' && dayName !== 'Sábado') {
      setSelectedDay(dayName);
    }
  }, [data]);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('seduc_inventory_v3', JSON.stringify(items));
  }, [items]);

  // Carregamento automático do Registro Diário (Consumo) ao alterar data/turno
  useEffect(() => {
    if (viewMode !== 'active') return;

    const autoImportDailyRegister = async () => {
      try {
        const selectedDate = data;
        const selectedShift = turno.toUpperCase();
        
        // Se já houver um fechamento salvo no histórico para esta data/turno, não fazemos o auto-preenchimento
        // para não sobrescrever o histórico consolidado.
        const hasClosedHistory = history.some(h => h.date === selectedDate && h.turno === turno);
        if (hasClosedHistory) return;

        const { data: mealRecordData, error } = await supabase
          .from('merenda_meal_records')
          .select('*')
          .eq('date', selectedDate)
          .eq('shift', selectedShift)
          .maybeSingle();

        if (error) throw error;

        // Se não houver registro diário, resetamos as saídas para 0 para esta nova data
        if (!mealRecordData) {
          setItems(prev => prev.map(item => ({ ...item, outputs: 0 })));
          return;
        }

        const entrada = typeof mealRecordData.entrada === 'string' ? JSON.parse(mealRecordData.entrada) : mealRecordData.entrada;
        const principal = typeof mealRecordData.principal === 'string' ? JSON.parse(mealRecordData.principal) : mealRecordData.principal;

        const mealIngredients: { name: string; quantity: number }[] = [];
        
        [entrada, principal].forEach((meal) => {
          if (meal && Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach((ing: any) => {
              const qty = parseFloat(ing.quantity);
              if (ing.name && !isNaN(qty) && qty > 0) {
                mealIngredients.push({
                  name: ing.name.toUpperCase(),
                  quantity: qty
                });
              }
            });
          }
        });

        // Atualiza as saídas nos itens ativos do estoque, zerando os que não estão no registro diário
        setItems(prev => prev.map(invItem => {
          const matches = mealIngredients.filter(ing => 
            invItem.name === ing.name || 
            invItem.name.includes(ing.name) || 
            ing.name.includes(invItem.name)
          );

          if (matches.length > 0) {
            const totalQty = matches.reduce((sum, m) => sum + m.quantity, 0);
            return {
              ...invItem,
              outputs: totalQty
            };
          }
          return {
            ...invItem,
            outputs: 0
          };
        }));
      } catch (err) {
        console.error("Erro no carregamento automático de consumo:", err);
      }
    };

    autoImportDailyRegister();
  }, [data, turno, viewMode, history]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const item: SeducInventoryItem = {
      id: `item-${Date.now()}`,
      ...newItem,
      previousBalance: 0,
      entries: 0,
      outputs: 0
    };
    setItems([...items, item]);
    setIsAddItemModalOpen(false);
    setNewItem({ name: '', unit: 'Kg', min: 0 });
  };

  const deleteItem = (id: string) => {
    if (window.confirm("Deseja remover este item do controle de estoque?")) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleUpdateItem = (id: string, field: 'entries' | 'outputs', value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: numValue } : item
    ));
  };

  const syncWithMenu = () => {
    const allIngredients = new Set<string>();
    OFFICIAL_MENUS.forEach(week => {
      week.days.forEach(day => {
        day.ingredients.forEach(ing => allIngredients.add(ing.toUpperCase()));
      });
    });

    const newItemsFound: SeducInventoryItem[] = [];
    allIngredients.forEach(upperName => {
      const exists = items.some(i => i.name === upperName);
      if (!exists) {
        newItemsFound.push({
          id: `item-${Date.now()}-${Math.random()}`,
          name: upperName,
          unit: ENTRADA_KEYWORDS.some(key => upperName.includes(key)) ? 'Un' : 'Kg',
          previousBalance: 0,
          entries: 0,
          outputs: 0,
          min: 1
        });
      }
    });

    if (newItemsFound.length > 0) {
      setItems(prev => [...prev, ...newItemsFound]);
      alert(`${newItemsFound.length} novos ingredientes carregados de todo o cardápio (5 semanas)!`);
    } else {
      alert("Todos os ingredientes do cardápio completo já estão na lista.");
    }
  };

  const syncWithContracts = () => {
    const allContractProducts = new Set<string>();
    INITIAL_CONTRACTS.forEach(contract => {
      contract.items.forEach(item => {
        allContractProducts.add(item.description.toUpperCase());
      });
    });

    const newItemsFound: SeducInventoryItem[] = [];
    allContractProducts.forEach(upperName => {
      const exists = items.some(i => i.name === upperName);
      if (!exists) {
        newItemsFound.push({
          id: `item-${Date.now()}-${Math.random()}`,
          name: upperName,
          unit: ENTRADA_KEYWORDS.some(key => upperName.includes(key)) ? 'Un' : 'Kg',
          previousBalance: 0,
          entries: 0,
          outputs: 0,
          min: 1
        });
      }
    });

    if (newItemsFound.length > 0) {
      setItems(prev => [...prev, ...newItemsFound]);
      alert(`${newItemsFound.length} novos produtos carregados dos 12 contratos ativos!`);
    } else {
      alert("Todos os produtos dos contratos já estão na lista de estoque.");
    }
  };

  const handleResetDaily = () => {
    if (items.length === 0) return alert("Cadastre itens antes de fechar o turno.");
    if (window.confirm(`Deseja fechar o turno ${turno}? Os saldos serão consolidados no histórico.`)) {
      const snapshot: InventorySnapshot = {
        id: `inv-${Date.now()}`,
        date: data,
        turno: turno,
        responsavel: responsavel,
        items: items.map(i => ({ ...i })),
        timestamp: Date.now()
      };

      const updatedHistory = [snapshot, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('merenda_inventory_history_v1', JSON.stringify(updatedHistory));

      // Salva no Supabase
      const saveSnapshot = async () => {
        try {
          await supabase.from('merenda_inventory_history').upsert({
            id: snapshot.id,
            date: snapshot.date,
            turno: snapshot.turno,
            responsavel: snapshot.responsavel,
            items: snapshot.items,
            timestamp: snapshot.timestamp
          });
        } catch (err) {
          console.error("Erro ao salvar fechamento no banco:", err);
        }
      };
      saveSnapshot();

      // Update balances for the NEXT shift
      setItems(prev => prev.map(item => ({
        ...item,
        previousBalance: item.previousBalance + item.entries - item.outputs,
        entries: 0,
        outputs: 0
      })));

      // Auto-advance Shift
      const shifts = ['Matutino', 'Vespertino'];
      const currentIndex = shifts.indexOf(turno);
      if (currentIndex < shifts.length - 1) {
        setTurno(shifts[currentIndex + 1]);
      } else {
        // End of day, advance date and reset shift to first
        setTurno(shifts[0]);
        const nextDate = new Date(data);
        nextDate.setDate(nextDate.getDate() + 1);
        setData(nextDate.toLocaleDateString('sv-SE'));
      }

      alert("Fechamento de turno realizado! Avançando o turno/dia.");
    }
  };

  const handleGenerateRetroactiveHistory = async () => {
    if (!window.confirm("ATENÇÃO: Esta ação irá apagar o histórico de simulações passadas (preservando o dia de hoje em diante) e gerar uma simulação retroativa desde 02/Fevereiro até ontem. Deseja continuar?")) return;
    
    // Configurar data final para Ontem (protegendo o dia atual)
    const activeDate = new Date(data + 'T12:00:00');
    const endDate = new Date(activeDate.getTime() - 24 * 60 * 60 * 1000); // Ontem
    endDate.setHours(12, 0, 0, 0);

    const startDate = new Date('2026-02-02T12:00:00');
    if (endDate < startDate) {
      alert("A simulação só pode ser gerada a partir de datas futuras ao início das aulas (03/Fevereiro).");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Apagar histórico atual no Supabase para datas anteriores à data ativa (preservando hoje)
      await supabase.from('merenda_inventory_history').delete().lt('date', data);
      
      // Preservar o histórico local do dia ativo em diante
      const preservedHistory = history.filter(h => h.date >= data);

      // 2. Buscar todas as guias de entrada, itens do contrato e registros diários de refeição
      const { data: guidesData } = await supabase.from('payment_guides').select('*');
      const { data: guideItemsData } = await supabase.from('payment_guide_items').select('*, item:contract_items(*)');
      const { data: contractItemsData } = await supabase.from('contract_items').select('*');
      const { data: mealRecordsData } = await supabase.from('merenda_meal_records').select('*');
      
      const guides = guidesData || [];
      const guideItems = guideItemsData || [];
      const contractItemsList = contractItemsData || [];
      const mealRecords = mealRecordsData || [];

      // Fazer parse seguro dos registros reais de refeições (Registro Diário)
      const parsedMealRecords = mealRecords.map((row: any) => {
        try {
          return {
            date: row.date,
            shift: row.shift ? row.shift.toUpperCase() : '',
            entrada: typeof row.entrada === 'string' ? JSON.parse(row.entrada) : row.entrada,
            principal: typeof row.principal === 'string' ? JSON.parse(row.principal) : row.principal
          };
        } catch (err) {
          console.error("Erro ao fazer parse de meal record:", err);
          return null;
        }
      }).filter(Boolean);

      // Inicializar saldo do contrato restante para cada item na simulação
      const contractBalances: Record<string, number> = {};
      
      items.forEach(item => {
        let totalQty = 0;
        const dbItems = contractItemsList.filter(ci => ci.description?.toUpperCase() === item.name.toUpperCase());
        if (dbItems.length > 0) {
          dbItems.forEach(ci => {
            totalQty += ci.contracted_quantity || 0;
          });
        } else {
          INITIAL_CONTRACTS.forEach(contract => {
            contract.items.forEach(ci => {
              if (ci.description?.toUpperCase() === item.name.toUpperCase()) {
                totalQty += ci.contractedQuantity || 0;
              }
            });
          });
        }
        contractBalances[item.name.toUpperCase()] = totalQty;
      });

      // Função auxiliar para calcular o saldo inicial baseado em 20% do volume total do contrato (Opção 2)
      const getInitialBalance = (itemName: string): number => {
        const totalQty = contractBalances[itemName.toUpperCase()] || 0;
        return parseFloat((totalQty * 0.2).toFixed(2));
      };

      // 3. Montar inventário inicial com saldo proporcional (20% do contrato)
      // Pega todos os itens cadastrados no estado atual
      let currentInventory = items.map(i => ({
        ...i,
        previousBalance: getInitialBalance(i.name),
        entries: 0,
        outputs: 0
      }));

      // Garante que os itens de contrato estejam na lista se não estiverem
      guideItems.forEach((gi: any) => {
        if (gi.item) {
          const uName = gi.item.description.toUpperCase();
          if (!(uName in contractBalances)) {
            let totalQty = 0;
            const dbItems = contractItemsList.filter(ci => ci.description?.toUpperCase() === uName);
            if (dbItems.length > 0) {
              dbItems.forEach(ci => {
                totalQty += ci.contracted_quantity || 0;
              });
            } else {
              INITIAL_CONTRACTS.forEach(contract => {
                contract.items.forEach(ci => {
                  if (ci.description?.toUpperCase() === uName) {
                    totalQty += ci.contractedQuantity || 0;
                  }
                });
              });
            }
            contractBalances[uName] = totalQty;
          }

          if (!currentInventory.some(i => i.name === uName)) {
             currentInventory.push({
               id: `item-gen-${gi.item.id}`,
               name: uName,
               unit: gi.item.unit,
               previousBalance: getInitialBalance(uName),
               entries: 0,
               outputs: 0,
               min: 1
             });
          }
        }
      });

      // 4. Configurar loop do tempo
      const generatedSnapshots: InventorySnapshot[] = [];
      let currentDate = startDate;
      let weekCounter = 0; // Para rodar as 5 semanas de cardápio

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay(); // 0 = Domingo, 1 = Segunda, 2 = Terça...
        
        // Pula fins de semana
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            if (dayOfWeek === 6) weekCounter++; // Avança semana no sábado
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
        }

        const dateStr = currentDate.toISOString().split('T')[0];
        const monthIndex = currentDate.getMonth();
        const dia = currentDate.getDate();

        // Checar calendário (Feriados e Férias)
        const monthData = SCHOOL_CALENDAR_2026.meses[monthIndex];
        const event = monthData?.eventos?.find(e => e.dia === dia);
        if (event && (event.categoria === 'FERIADO' || event.categoria === 'FERIAS')) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
        }

        // Dias Letivos da Semana (Segunda = 1 -> 'Segunda')
        const diasSemanaMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayName = diasSemanaMap[dayOfWeek];

        const menuWeekIndex = weekCounter % 5;
        const currentMenuDay = OFFICIAL_MENUS[menuWeekIndex]?.days.find(d => d.dayName === dayName);

        // Turnos: Matutino e Vespertino
        const turnos = ['Matutino', 'Vespertino'];
        
        for (const turno of turnos) {
           // Zera entradas e saídas do turno
           currentInventory = currentInventory.map(i => ({ ...i, entries: 0, outputs: 0 }));

           // Se for Matutino, adiciona entradas das Guias daquele dia
           if (turno === 'Matutino') {
             const guidesToday = guides.filter(g => g.issue_date === dateStr);
             guidesToday.forEach(g => {
                const gItems = guideItems.filter(gi => gi.guide_id === g.id);
                gItems.forEach(gi => {
                   if (gi.item) {
                     const uName = gi.item.description.toUpperCase();
                     const invItem = currentInventory.find(i => i.name === uName);
                     if (invItem) {
                        invItem.entries += gi.quantity;
                        // Abate do saldo contratual disponível
                        if (contractBalances[uName] !== undefined) {
                          contractBalances[uName] = Math.max(0, contractBalances[uName] - gi.quantity);
                        }
                     }
                   }
                });
             });
           }

           // Consumo: Verificar se existe um registro real no Registro Diário para esta data/turno (Prioritário)
           const matchingMealRecord = parsedMealRecords.find(
             (r: any) => r.date === dateStr && r.shift === turno.toUpperCase()
           );

           if (matchingMealRecord) {
             // Agrega todos os ingredientes consumidos lançados
             const mealIngredients: { name: string; quantity: number }[] = [];
             ['entrada', 'principal'].forEach((key) => {
               const meal = matchingMealRecord[key];
               if (meal && Array.isArray(meal.ingredients)) {
                 meal.ingredients.forEach((ing: any) => {
                   const qty = parseFloat(ing.quantity);
                   if (ing.name && !isNaN(qty) && qty > 0) {
                     mealIngredients.push({
                       name: ing.name.toUpperCase(),
                       quantity: qty
                     });
                   }
                 });
               }
             });

             // Preenche as saídas reais no inventário
             currentInventory.forEach(invItem => {
               const matches = mealIngredients.filter(ing => 
                 invItem.name === ing.name || 
                 invItem.name.includes(ing.name) || 
                 ing.name.includes(invItem.name)
               );
               if (matches.length > 0) {
                 const totalConsumption = matches.reduce((sum, m) => sum + m.quantity, 0);
                 const uName = invItem.name.toUpperCase();
                 
                 // Injeção contratual se o saldo físico for insuficiente
                 let available = invItem.previousBalance + invItem.entries;
                 if (available < totalConsumption) {
                   const deficit = totalConsumption - available;
                   const remainingContract = contractBalances[uName] || 0;
                   if (remainingContract > 0) {
                     const pullQty = Math.min(deficit, remainingContract);
                     invItem.entries += pullQty;
                     contractBalances[uName] = Math.max(0, remainingContract - pullQty);
                     available += pullQty;
                   }
                 }

                 // Limita o consumo ao disponível (para estoque não ficar negativo)
                 invItem.outputs = Math.min(totalConsumption, available > 0 ? available : totalConsumption);
               }
             });
           } else if (currentMenuDay) {
              // Fallback: Consumo Aleatório (Saídas) baseado no cardápio letivo
              currentMenuDay.ingredients.forEach(ing => {
                 const invItem = currentInventory.find(i => i.name === ing.toUpperCase() || i.name.includes(ing.toUpperCase()) || ing.toUpperCase().includes(i.name));
                 if (invItem) {
                    const uName = invItem.name.toUpperCase();
                    const rawConsumption = Math.floor(Math.random() * (5 - 2 + 1)) + 2; 
                    
                    // Injeção contratual se o saldo físico for insuficiente
                    let available = invItem.previousBalance + invItem.entries;
                    if (available < rawConsumption) {
                      const deficit = rawConsumption - available;
                      const remainingContract = contractBalances[uName] || 0;
                      if (remainingContract > 0) {
                        const pullQty = Math.min(deficit, remainingContract);
                        invItem.entries += pullQty;
                        contractBalances[uName] = Math.max(0, remainingContract - pullQty);
                        available += pullQty;
                      }
                    }

                    const finalConsumption = Math.min(rawConsumption, available > 0 ? available : rawConsumption);
                    invItem.outputs += finalConsumption;
                 }
              });
           }

           // Gerar Snapshot do Turno
           const snapshot: InventorySnapshot = {
             id: `gen-${dateStr}-${turno}`,
             date: dateStr,
             turno: turno,
             responsavel: matchingMealRecord ? 'Consumo Real Integrado' : 'Motor Retroativo IA',
             items: currentInventory.map(i => ({ ...i })),
             timestamp: currentDate.getTime() + (turno === 'Matutino' ? 0 : 43200000)
           };
           generatedSnapshots.unshift(snapshot); // unshift para ficar do mais recente pro mais antigo

           // Atualiza Saldo Anterior para o próximo turno
           currentInventory = currentInventory.map(i => ({
             ...i,
             previousBalance: i.previousBalance + i.entries - i.outputs,
             entries: 0,
             outputs: 0
           }));
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 5. Salvar na Nuvem (Em lotes de 50)
      for (let i = 0; i < generatedSnapshots.length; i += 50) {
        const batch = generatedSnapshots.slice(i, i + 50);
        await supabase.from('merenda_inventory_history').insert(
          batch.map(s => ({
            id: s.id,
            date: s.date,
            turno: s.turno,
            responsavel: s.responsavel,
            items: s.items,
            timestamp: s.timestamp
          }))
        );
      }

      // 6. Atualizar Estados Locais (Unindo simulação ao histórico preservado de hoje em diante)
      const combinedHistory = [...generatedSnapshots, ...preservedHistory];
      setHistory(combinedHistory);
      localStorage.setItem('merenda_inventory_history_v1', JSON.stringify(combinedHistory));
      setItems(currentInventory);
      alert("✅ Histórico Retroativo recalculado até ontem! Os consumos foram abatidos prioritariamente do Registro Diário (com fallback do cardápio letivo). Os déficits foram supridos pelo saldo dos contratos ativos e o dia de hoje permaneceu protegido.");
      
    } catch (e: any) {
      console.error(e);
      alert("Erro ao gerar simulação: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportFromDailyRegister = async () => {
    setIsSaving(true);
    try {
      const selectedDate = data; // A data selecionada no input de tipo date
      const selectedShift = turno.toUpperCase(); // 'MATUTINO' ou 'VESPERTINO'
      
      const { data: mealRecordData, error } = await supabase
        .from('merenda_meal_records')
        .select('*')
        .eq('date', selectedDate)
        .eq('shift', selectedShift)
        .maybeSingle();

      if (error) throw error;

      if (!mealRecordData) {
        alert(`Nenhum registro diário de merenda foi encontrado para a data ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')} e turno ${turno}.`);
        return;
      }

      // Parse dos dados do registro
      const entrada = typeof mealRecordData.entrada === 'string' ? JSON.parse(mealRecordData.entrada) : mealRecordData.entrada;
      const principal = typeof mealRecordData.principal === 'string' ? JSON.parse(mealRecordData.principal) : mealRecordData.principal;

      // Agrega todos os ingredientes e quantidades do registro
      const mealIngredients: { name: string; quantity: number }[] = [];
      
      [entrada, principal].forEach((meal) => {
        if (meal && Array.isArray(meal.ingredients)) {
          meal.ingredients.forEach((ing: any) => {
            const qty = parseFloat(ing.quantity);
            if (ing.name && !isNaN(qty) && qty > 0) {
              mealIngredients.push({
                name: ing.name.toUpperCase(),
                quantity: qty
              });
            }
          });
        }
      });

      if (mealIngredients.length === 0) {
        alert("O registro diário foi encontrado, mas não contém nenhum ingrediente com quantidade válida informada.");
        return;
      }

      // Atualiza as saídas nos itens ativos do estoque
      let updatedCount = 0;
      setItems(prev => prev.map(invItem => {
        // Encontra correspondência no registro
        const matches = mealIngredients.filter(ing => 
          invItem.name === ing.name || 
          invItem.name.includes(ing.name) || 
          ing.name.includes(invItem.name)
        );

        if (matches.length > 0) {
          const totalQty = matches.reduce((sum, m) => sum + m.quantity, 0);
          updatedCount++;
          return {
            ...invItem,
            outputs: totalQty
          };
        }
        return invItem;
      }));

      alert(`✅ Sucesso! Importamos as quantidades consumidas de ${updatedCount} ingrediente(s) do Registro Diário.`);
    } catch (err: any) {
      console.error("Erro ao importar consumo do registro diário:", err);
      alert("Erro ao importar dados: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const loadFromHistory = (snapshot: InventorySnapshot) => {
    setItems(snapshot.items.map(i => ({ ...i })));
    setData(snapshot.date);
    setTurno(snapshot.turno);
    setResponsavel(snapshot.responsavel);
    setViewMode('active');
  };


  const handleDownloadPDF = async () => {
    setIsSaving(true);
    const element = printRef.current;
    if (!element) return;
    try {
      // @ts-ignore
      await window.html2pdf().set({
        margin: 10,
        filename: `Estoque_Real_${data}.pdf`,
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      }).from(element).save();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      const formattedDate = new Date(h.date + 'T12:00:00').toLocaleDateString('pt-BR');
      const matchesSearch = 
        h.responsavel.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        formattedDate.includes(historySearchTerm) ||
        h.date.includes(historySearchTerm);
        
      const matchesTurn = historyTurnFilter === 'TODOS' || h.turno === historyTurnFilter;
      
      return matchesSearch && matchesTurn;
    });
  }, [history, historySearchTerm, historyTurnFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-gray-50">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-900 text-white rounded-3xl"><ClipboardCheck size={32} /></div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Estoque Real da Unidade</h2>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest leading-none mt-1">Gestão de Alimentação Escolar</p>
            </div>
          </div>
          <div className="flex gap-3">
            {viewMode === 'active' && (
              <>
                <button onClick={() => setIsAddItemModalOpen(true)} className="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2"><Plus size={14} /> Novo Produto</button>
                <button onClick={() => {
                  setAdjustmentItems(items.map(i => ({ id: i.id, name: i.name, newBalance: i.previousBalance })));
                  setIsAdjustmentModalOpen(true);
                }} className="px-5 py-3 bg-amber-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-600 transition-all flex items-center gap-2"><Edit3 size={14} /> Ajuste Físico</button>
              </>
            )}
            <button onClick={() => setViewMode(viewMode === 'active' ? 'history' : 'active')} className="px-5 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
              <History size={14} /> Histórico
            </button>
            {viewMode === 'active' && (
              <div className="flex flex-wrap gap-2">
                <button onClick={syncWithMenu} className="px-4 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2">
                  <Search size={14} /> Sincronizar Cardápio (5 Semanas)
                </button>
                <button onClick={syncWithContracts} className="px-4 py-3 bg-blue-50 text-blue-700 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-blue-100 hover:bg-blue-100 transition-all flex items-center gap-2">
                  <ShoppingCart size={14} /> Sincronizar Contratos (12 Ativos)
                </button>
                <button onClick={handleGenerateRetroactiveHistory} className="px-4 py-3 bg-purple-50 text-purple-700 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-purple-100 hover:bg-purple-100 transition-all flex items-center gap-2">
                  <History size={14} /> Simular Histórico Letivo
                </button>
                <button onClick={handleResetDaily} className="px-4 py-3 bg-emerald-100 text-emerald-700 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-200 transition-all">
                  Fechar Turno
                </button>
              </div>
            )}
            <button onClick={handleDownloadPDF} disabled={isSaving} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">{isSaving ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}</button>
          </div>
        </div>

        {viewMode === 'active' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Turno</label><select value={turno} onChange={(e) => setTurno(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-emerald-500/20">{['Matutino', 'Vespertino'].map(t => <option key={t}>{t}</option>)}</select></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsável (AAE Nutrição)</label>
                <div className="relative">
                  <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none appearance-none focus:ring-2 focus:ring-emerald-500/20">
                    <option value="">Selecione...</option>
                    {nutricaoStaff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data do Lançamento</label><input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações Rápidas</label>
                <div className="flex flex-col gap-2">
                  <button onClick={handleImportFromDailyRegister} className="w-full p-3 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center justify-center gap-2">
                    <ClipboardCheck size={14} /> Importar do Registro Diário
                  </button>
                  <button onClick={syncWithMenu} className="w-full p-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                    <RotateCcw size={14} /> Ingredientes do Mês
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 print:hidden">
              <Info size={16} className="text-emerald-600" />
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-tight">O sistema carregará automaticamente todos os ingredientes únicos das 5 semanas do cardápio oficial.</p>
            </div>
          </div>
        )}
        {viewMode === 'history' && (
          <div className="space-y-6">
            {/* Barra de Filtros de Histórico */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-2">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-gray-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtrar Lançamentos</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <input 
                  type="text"
                  placeholder="Buscar Data (Ex: 05/06) ou Responsável..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                
                <select
                  value={historyTurnFilter}
                  onChange={(e) => setHistoryTurnFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="TODOS">Todos os Turnos</option>
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                </select>
                
                {(historySearchTerm || historyTurnFilter !== 'TODOS') && (
                  <button 
                    onClick={() => { setHistorySearchTerm(''); setHistoryTurnFilter('TODOS'); }}
                    className="text-[10px] font-black text-red-500 uppercase hover:underline whitespace-nowrap"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-300">
              {filteredHistory.length > 0 ? filteredHistory.map((h) => (
                <div 
                  key={h.id} 
                  onClick={() => loadFromHistory(h)}
                  className="bg-gray-50 p-6 rounded-3xl border border-gray-100 hover:border-emerald-200 transition-all cursor-pointer group relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Calendar size={20} /></div>
                      <div>
                        <p className="font-black text-gray-900 uppercase text-xs">{new Date(h.date + 'T12:00:00').toLocaleDateString('pt-BR')} - {h.turno}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h.responsavel}</p>
                      </div>
                    </div>
                    <button onClick={async (e) => {
                      e.stopPropagation();
                      if(window.confirm("Excluir este fechamento de histórico?")) {
                        const updated = history.filter(item => item.id !== h.id);
                        setHistory(updated);
                        localStorage.setItem('merenda_inventory_history_v1', JSON.stringify(updated));
                        await supabase.from('merenda_inventory_history').delete().eq('id', h.id);
                      }
                    }} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                  </div>
                  
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-2">
                     <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase border-b pb-1">
                       <span>Produto</span>
                       <span>Final</span>
                     </div>
                     {h.items.filter(i => i.entries > 0 || i.outputs > 0 || i.previousBalance > 0).slice(0, 5).map(item => (
                       <div key={item.id} className="flex justify-between text-[10px] items-center">
                         <span className="font-bold text-gray-700 truncate w-32">{item.name}</span>
                         <span className="font-black text-emerald-700">{(item.previousBalance + item.entries - item.outputs).toLocaleString('pt-BR')} {item.unit}</span>
                       </div>
                     ))}
                     {h.items.length > 5 && <p className="text-[8px] text-center text-gray-400 font-bold uppercase mt-2">... e mais {h.items.length - 5} itens</p>}
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center text-gray-300 font-black uppercase text-xs tracking-widest border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                  Nenhum fechamento histórico encontrado.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div ref={printRef} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="text-white">
              <th className="sticky top-0 z-20 bg-gray-900 px-8 py-5 text-[10px] font-black uppercase tracking-widest w-[35%] rounded-tl-[2rem]">Produto</th>
              <th className="sticky top-0 z-20 bg-gray-900 px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center w-[15%]">Saldo Inicial</th>
              <th className="sticky top-0 z-20 bg-emerald-800/95 px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center w-[15%]">Entradas</th>
              <th className="sticky top-0 z-20 bg-red-800/95 px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center w-[15%]">Saídas</th>
              <th className="sticky top-0 z-20 bg-gray-900 px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center w-[15%]">Saldo Final</th>
              {viewMode === 'active' && <th className="sticky top-0 z-20 bg-gray-900 px-4 py-5 w-[5%] print:hidden rounded-tr-[2rem]"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedItems.map((item, index) => {
              const currentBalance = item.previousBalance + item.entries - item.outputs;
              const isCritical = currentBalance < item.min;
              const hasEntries = item.entries > 0;
              const hasOutputs = item.outputs > 0;
              
              return (
                <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors group ${isCritical ? 'bg-red-50/20' : ''}`}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${isCritical ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-gray-50 text-gray-400'}`}>
                        <Package size={20} />
                      </div>
                      <div>
                        <p className={`font-black uppercase text-xs ${isCritical ? 'text-red-700' : 'text-gray-900'}`}>{item.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">UN: {item.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center text-sm font-bold text-gray-400">{item.previousBalance.toLocaleString('pt-BR')}</td>
                  <td className={`px-4 py-4 text-center transition-all ${hasEntries ? 'bg-emerald-50' : 'bg-emerald-50/10'}`}>
                    <input 
                      id={`entry-${index}`}
                      type="number" 
                      step="0.01" 
                      value={item.entries || ""} 
                      onChange={(e) => handleUpdateItem(item.id, 'entries', e.target.value)} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById(`output-${index}`)?.focus();
                        }
                      }}
                      className={`w-full bg-transparent text-center font-black outline-none print:hidden transition-all ${hasEntries ? 'text-emerald-700 scale-110' : 'text-emerald-600'}`} 
                    />
                    <span className="hidden pdf-show">{item.entries || '0'}</span>
                  </td>
                  <td className={`px-4 py-4 text-center transition-all ${hasOutputs ? 'bg-red-50' : 'bg-red-50/10'}`}>
                    <input 
                      id={`output-${index}`}
                      type="number" 
                      step="0.01" 
                      value={item.outputs || ""} 
                      onChange={(e) => handleUpdateItem(item.id, 'outputs', e.target.value)} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById(`entry-${index + 1}`)?.focus();
                        }
                      }}
                      className={`w-full bg-transparent text-center font-black outline-none print:hidden transition-all ${hasOutputs ? 'text-red-700 scale-110' : 'text-red-600'}`} 
                    />
                    <span className="hidden pdf-show">{item.outputs || '0'}</span>
                  </td>
                  <td className={`px-6 py-6 text-center text-sm font-black ${isCritical ? 'text-red-700 bg-red-100/40 shadow-inner' : 'text-gray-900'}`}>
                    {currentBalance.toLocaleString('pt-BR')}
                    {isCritical && <span className="block text-[8px] mt-1 text-red-500 animate-bounce">ABAIXO DO MÍNIMO ({item.min})</span>}
                  </td>
                  {viewMode === 'active' && <td className="px-4 py-6 print:hidden text-right"><button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button></td>}
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={6} className="py-24 text-center text-gray-300 font-black uppercase text-xs tracking-widest">Sem itens cadastrados no inventário.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Adicionar Item */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-8 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900 uppercase">Novo Item de Estoque</h3>
              <button onClick={() => setIsAddItemModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddItem} className="p-10 space-y-6">
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição do Alimento</label><input required value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value.toUpperCase() })} placeholder="EX: ARROZ AGULHINHA" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:bg-white transition-all" /></div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unidade</label><select value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs uppercase outline-none"><option>Kg</option><option>Un</option><option>Litro</option><option>Pct</option><option>Dz</option></select></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estoque Mínimo</label><input required type="number" step="0.01" value={newItem.min} onChange={e => setNewItem({ ...newItem, min: parseFloat(e.target.value) || 0 })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:bg-white transition-all" /></div>
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"><Save size={20} /> Cadastrar Alimento</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuste de Estoque Físico */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-amber-50 border-b border-amber-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase">Ajuste de Estoque Físico</h3>
                <p className="text-amber-700 font-bold text-xs mt-1">Atualize o saldo real encontrado na despensa.</p>
              </div>
              <button onClick={() => setIsAdjustmentModalOpen(false)}><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr>
                     <th className="pb-4 text-xs font-black uppercase tracking-widest text-gray-400">Produto</th>
                     <th className="pb-4 text-xs font-black uppercase tracking-widest text-gray-400 w-48 text-center">Saldo Real Correto</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {adjustmentItems.map((adj, index) => (
                     <tr key={adj.id}>
                       <td className="py-4 text-sm font-bold text-gray-700 uppercase">{adj.name}</td>
                       <td className="py-4">
                         <input 
                           type="number" 
                           step="0.01"
                           value={adj.newBalance === 0 ? '' : adj.newBalance} 
                           onChange={(e) => {
                             const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                             setAdjustmentItems(prev => prev.map(p => p.id === adj.id ? { ...p, newBalance: val } : p));
                           }}
                           className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-black text-center outline-none focus:ring-2 focus:ring-amber-500/20"
                         />
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
            <div className="p-8 bg-gray-50 border-t border-gray-100 shrink-0">
               <button 
                 onClick={() => {
                   if (window.confirm("Isso irá sobrescrever o Saldo Inicial de todos os produtos editados. Confirmar?")) {
                     setItems(prev => prev.map(item => {
                       const adj = adjustmentItems.find(a => a.id === item.id);
                       if (adj) {
                         return { ...item, previousBalance: adj.newBalance };
                       }
                       return item;
                     }));
                     setIsAdjustmentModalOpen(false);
                   }
                 }}
                 className="w-full py-5 bg-amber-500 text-white rounded-3xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-amber-600 transition-all flex items-center justify-center gap-3"
               >
                 <CheckCircle2 size={20} /> Salvar Estoque Físico Real
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
