import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CleaningEmployee, SchoolEnvironment } from '../types';
import { AlertTriangle, Plus, Search, Trash2, CheckCircle2, Clock, X, Loader2, Printer, History, Edit2, Sparkles, CheckSquare, ListTodo, Target } from 'lucide-react';
import { generateMaintenanceActionPlan } from '../geminiService';

interface Occurrence {
  id: string;
  reported_by: string;
  location: string;
  description: string;
  category: string;
  status: 'PENDENTE' | 'AGENDADA' | 'EM_ANDAMENTO' | 'RESOLVIDO';
  reported_at: string;
  resolved_at?: string;
}

interface CleaningOccurrencesProps {
  employees: CleaningEmployee[];
  environments: SchoolEnvironment[];
}

const CleaningOccurrences: React.FC<CleaningOccurrencesProps> = ({ employees, environments }) => {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'ATIVAS' | 'HISTORICO'>('ATIVAS');

  const [newOcc, setNewOcc] = useState({
    reported_by: '',
    location: '',
    description: '',
    category: 'OUTROS',
    status: 'PENDENTE' as 'PENDENTE' | 'AGENDADA' | 'EM_ANDAMENTO' | 'RESOLVIDO',
    reported_at: new Date().toLocaleDateString('sv-SE')
  });
  const [editingOcc, setEditingOcc] = useState<Occurrence | null>(null);
  const [resolvedAtInput, setResolvedAtInput] = useState<string>('');

  // Estados para o Plano de Ação de Melhorias (IA)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [actionPlan, setActionPlan] = useState<{
    diagnosis: string;
    actions: { action: string; category: string; responsible: string; priority: string }[];
    preventiveSchedule: { task: string; frequency: string }[];
    goals: { description: string; target: string }[];
  } | null>(null);

  const handleGeneratePlan = async () => {
    if (occurrences.length === 0) {
      alert("Não há ocorrências registradas para gerar um plano de ação de melhorias.");
      return;
    }
    setPlanLoading(true);
    setIsPlanModalOpen(true);
    try {
      const plan = await generateMaintenanceActionPlan(occurrences);
      if (plan) {
        setActionPlan(plan);
      } else {
        alert("Não foi possível gerar o plano de ação no momento.");
        setIsPlanModalOpen(false);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao processar plano de ação.");
      setIsPlanModalOpen(false);
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    fetchOccurrences();
    fetchLocations();
    
    const channels = supabase.channel('occurrences_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cleaning_occurrences' }, fetchOccurrences)
      .subscribe();

    return () => {
      channels.unsubscribe();
    };
  }, [environments]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select('area_name');
        
      if (error) throw error;
      
      const uniqueAreas = Array.from(new Set(data?.map(t => t.area_name))).filter(Boolean);
      
      // Merge with environments prop if any, add COZINHA/REFEITÓRIO, and sort
      const allLocations = Array.from(new Set([
        ...uniqueAreas,
        ...environments.map(e => e.name),
        'COZINHA/REFEITÓRIO'
      ])).sort();
      
      setLocations(allLocations);
    } catch (err) {
      console.error("Erro ao buscar locais:", err);
      // Fallback to environments prop
      setLocations(Array.from(new Set([...environments.map(e => e.name), 'COZINHA/REFEITÓRIO'])).sort());
    }
  };

  const fetchOccurrences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cleaning_occurrences')
        .select('*')
        .order('reported_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          console.warn("Tabela cleaning_occurrences não existe ainda.");
        } else {
          throw error;
        }
      }

      if (data) {
        setOccurrences(data as Occurrence[]);
      }
    } catch (error) {
      console.error("Erro ao buscar ocorrências:", error);
    } finally {
      setLoading(false);
    }
  };

const parseSafeIsoDate = (dateStr?: string | null): string => {
  if (!dateStr || !dateStr.trim()) {
    return new Date().toISOString();
  }
  const cleanStr = dateStr.trim();

  // YYYY-MM-DD format (standard html date input)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const d = new Date(`${cleanStr}T12:00:00`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) {
    const [day, month, year] = cleanStr.split('/');
    const d = new Date(`${year}-${month}-${day}T12:00:00`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  const fallback = new Date(cleanStr);
  if (!isNaN(fallback.getTime())) {
    return fallback.toISOString();
  }

  return new Date().toISOString();
};

const getTodayYmd = () => {
  try {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOcc.reported_by || !newOcc.location || !newOcc.description) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const safeReportedAt = parseSafeIsoDate(newOcc.reported_at);
      const safeResolvedAt = newOcc.status === 'RESOLVIDO' 
        ? parseSafeIsoDate(resolvedAtInput || new Date().toISOString())
        : null;

      const payload: any = {
        reported_by: newOcc.reported_by,
        location: newOcc.location,
        description: newOcc.description,
        category: newOcc.category || 'OUTROS',
        status: newOcc.status || 'PENDENTE',
        reported_at: safeReportedAt,
        resolved_at: safeResolvedAt
      };

      if (editingOcc) {
        // Atualiza a ocorrência existente
        const { error } = await supabase
          .from('cleaning_occurrences')
          .update(payload)
          .eq('id', editingOcc.id);

        if (error) {
          if (error.code === '23514') {
            alert("Aviso: O status 'AGENDADA' não está habilitado no banco de dados. Altere para PENDENTE ou EM ANDAMENTO.");
            return;
          }
          throw error;
        }
      } else {
        // Insere nova ocorrência
        const { error } = await supabase.from('cleaning_occurrences').insert([payload]);

        if (error) {
          if (error.code === '23514') {
            alert("Aviso: O status 'AGENDADA' não está habilitado no banco de dados. Altere para PENDENTE ou EM ANDAMENTO.");
            return;
          }
          throw error;
        }
      }
      
      setNewOcc({ 
        reported_by: '', 
        location: '', 
        description: '', 
        category: 'OUTROS',
        status: 'PENDENTE',
        reported_at: getTodayYmd()
      });
      setResolvedAtInput('');
      setEditingOcc(null);
      setIsModalOpen(false);
      fetchOccurrences();
    } catch (error: any) {
      console.error("Erro ao registrar ocorrência:", error);
      alert("Erro ao registrar ocorrência: " + (error?.message || "Verifique os dados informados e a conexão."));
    }
  };

  const deleteOccurrence = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta ocorrência?")) return;
    try {
      const { error } = await supabase.from('cleaning_occurrences').delete().eq('id', id);
      if (error) throw error;
      fetchOccurrences();
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'PENDENTE' | 'AGENDADA' | 'EM_ANDAMENTO' | 'RESOLVIDO') => {
    try {
      let resolvedAt = null;
      if (newStatus === 'RESOLVIDO') {
        const todayBr = new Date().toLocaleDateString('pt-BR');
        const inputDate = window.prompt(
          "Para marcar como CONCLUÍDA, informe a data de resolução (DD/MM/AAAA):", 
          todayBr
        );
        if (inputDate === null) return; // Cancela a alteração
        
        if (inputDate) {
          const parts = inputDate.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const d = new Date(year, month, day, 12, 0, 0);
            if (!isNaN(d.getTime())) {
              resolvedAt = d.toISOString();
            } else {
              resolvedAt = new Date().toISOString();
            }
          } else {
            resolvedAt = new Date().toISOString();
          }
        } else {
          resolvedAt = new Date().toISOString();
        }
      }

      const { error } = await supabase.from('cleaning_occurrences').update({
        status: newStatus,
        resolved_at: resolvedAt
      }).eq('id', id);

      if (error) {
        if (error.code === '23514') {
          alert("Aviso: O status 'AGENDADA' não está habilitado no banco de dados do seu Supabase. Entre em contato com o suporte ou execute o script SQL correspondente.");
          return;
        }
        throw error;
      }
      fetchOccurrences();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar o status da ocorrência.");
    }
  };

  const handleEdit = (occ: Occurrence) => {
    setEditingOcc(occ);
    setNewOcc({
      reported_by: occ.reported_by,
      location: occ.location,
      description: occ.description,
      category: occ.category,
      status: occ.status,
      reported_at: occ.reported_at ? new Date(occ.reported_at).toLocaleDateString('sv-SE') : new Date().toLocaleDateString('sv-SE')
    });
    setResolvedAtInput(occ.resolved_at ? new Date(occ.resolved_at).toLocaleDateString('sv-SE') : '');
    setIsModalOpen(true);
  };

  const filteredData = occurrences.filter(o => {
    const matchesSearch = o.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.reported_by.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMode = viewMode === 'HISTORICO' ? o.status === 'RESOLVIDO' : o.status !== 'RESOLVIDO';
    
    return matchesSearch && matchesMode;
  });

  return (
    <div className="space-y-6 animate-in fade-in w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-inner">
            <AlertTriangle size={28} />
          </div>
          <div className="no-print">
            <h2 className="text-xl font-black text-gray-900 uppercase">Registro de Ocorrências</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Lâmpadas queimadas, vazamentos, reparos rápidos</p>
          </div>
          <div className="hidden print:block">
            <h2 className="text-xl font-black text-gray-900 uppercase">Relatório de Ocorrências de Manutenção</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              Escola Estadual Cívico-Militar André Antônio Maggi - {viewMode === 'HISTORICO' ? 'Histórico de Resolvidos' : 'Ocorrências Ativas'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto no-print">
          <div className="flex bg-gray-100 p-1 rounded-2xl w-full sm:w-auto">
            <button 
              onClick={() => setViewMode('ATIVAS')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'ATIVAS' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <AlertTriangle size={14} /> Ativas
            </button>
            <button 
              onClick={() => setViewMode('HISTORICO')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'HISTORICO' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <History size={14} /> Histórico
            </button>
          </div>
          
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="PESQUISAR..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>
          <button 
            onClick={async () => {
              const element = document.getElementById('occurrences-report');
              if (!element) return;
              
              // Remove hidden class temporarily for html2canvas to work properly
              element.classList.remove('hidden');
              element.classList.add('block');
              
              try {
                // @ts-ignore
                await window.html2pdf().set({
                  margin: 10,
                  filename: `Relatorio_Ocorrencias_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2 },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
                }).from(element).save();
              } catch (err) {
                console.error("Erro ao gerar PDF:", err);
              } finally {
                element.classList.remove('block');
                element.classList.add('hidden');
              }
            }}
            className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center"
            title="Baixar Relatório em PDF"
          >
            <Printer size={18} />
          </button>
          <button 
            onClick={handleGeneratePlan}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            title="Gerar Plano de Ação de Melhorias via IA"
          >
            <Sparkles size={16} /> Plano de Ação (IA)
          </button>
          <button 
            onClick={() => {
              setEditingOcc(null);
              setNewOcc({
                reported_by: '',
                location: '',
                description: '',
                category: 'OUTROS',
                reported_at: new Date().toLocaleDateString('sv-SE')
              });
              setResolvedAtInput('');
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Nova</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print:hidden">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="animate-spin text-red-500" size={40} />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <AlertTriangle size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest">Nenhuma ocorrência registrada.</p>
          </div>
        ) : (
          filteredData.map(occ => (
            <div key={occ.id} className={`p-6 rounded-[2rem] border transition-all ${
              occ.status === 'RESOLVIDO' ? 'bg-gray-50 border-gray-200 opacity-70' :
              occ.status === 'EM_ANDAMENTO' ? 'bg-amber-50 border-amber-200 shadow-sm' :
              occ.status === 'AGENDADA' ? 'bg-blue-50 border-blue-100 shadow-sm' :
              'bg-white border-red-100 shadow-md'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                  occ.category === 'ELETRICA' ? 'bg-yellow-100 text-yellow-800' :
                  occ.category === 'HIDRAULICA' ? 'bg-blue-100 text-blue-800' :
                  occ.category === 'ESTRUTURAL' ? 'bg-orange-100 text-orange-800' :
                  occ.category === 'EQUIPAMENTOS' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {occ.category}
                </span>
                
                <div className="flex items-center gap-2">
                  <select 
                    value={occ.status}
                    onChange={(e) => handleStatusChange(occ.id, e.target.value as any)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border cursor-pointer transition-all focus:ring-2 focus:ring-offset-1 ${
                      occ.status === 'RESOLVIDO' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' :
                      occ.status === 'EM_ANDAMENTO' ? 'bg-amber-200 text-amber-800 border-amber-300 hover:bg-amber-300' :
                      occ.status === 'AGENDADA' ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' :
                      'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                    }`}
                  >
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="AGENDADA">AGENDADA</option>
                    <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                    <option value="RESOLVIDO">CONCLUÍDA</option>
                  </select>
                  <button 
                    onClick={() => handleEdit(occ)} 
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors no-print"
                    title="Editar ocorrência"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteOccurrence(occ.id)} 
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors no-print"
                    title="Excluir ocorrência"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-black text-gray-900 mb-2">{occ.location}</h3>
              <p className="text-sm font-medium text-gray-600 mb-4">{occ.description}</p>
              
              <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reportado por</p>
                  <p className="text-xs font-bold text-gray-800">{occ.reported_by}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    {occ.status === 'RESOLVIDO' ? 'Resolvido em' : 'Data'}
                  </p>
                  <p className="text-[10px] font-bold text-gray-600">
                    {new Date(occ.status === 'RESOLVIDO' && occ.resolved_at ? occ.resolved_at : occ.reported_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div id="occurrences-report" className="hidden w-full bg-white p-8">
        <div className="text-center border-b-2 border-black pb-6 mb-8">
          <h1 className="text-2xl font-black uppercase mb-2">Relatório de Ocorrências de Manutenção</h1>
          <p className="text-base font-bold uppercase">Escola Estadual Cívico-Militar André Antônio Maggi</p>
          <p className="text-xs uppercase text-gray-600 mt-2">
            Status: {viewMode === 'HISTORICO' ? 'HISTÓRICO DE RESOLVIDOS' : 'OCORRÊNCIAS ATIVAS'}
          </p>
        </div>

        <table className="w-full text-left border-collapse border border-gray-300 text-sm font-sans mt-4">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="p-3 border border-gray-300 font-black uppercase text-xs">Data</th>
              <th className="p-3 border border-gray-300 font-black uppercase text-xs">Local</th>
              <th className="p-3 border border-gray-300 font-black uppercase text-xs">Categoria</th>
              <th className="p-3 border border-gray-300 font-black uppercase text-xs">Descrição</th>
              <th className="p-3 border border-gray-300 font-black uppercase text-xs">Reportado por</th>
              <th className="p-3 border border-gray-300 font-black uppercase text-xs">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(occ => (
              <tr key={occ.id} className="border-b border-gray-300">
                <td className="p-3 border border-gray-300">
                  {new Date(occ.status === 'RESOLVIDO' && occ.resolved_at ? occ.resolved_at : occ.reported_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-3 border border-gray-300 font-bold uppercase">{occ.location}</td>
                <td className="p-3 border border-gray-300 uppercase text-xs">{occ.category}</td>
                <td className="p-3 border border-gray-300">{occ.description}</td>
                <td className="p-3 border border-gray-300 uppercase text-xs">{occ.reported_by}</td>
                <td className="p-3 border border-gray-300 font-bold uppercase text-xs">
                  {occ.status === 'RESOLVIDO' ? 'RESOLVIDO' : occ.status === 'EM_ANDAMENTO' ? 'EM ANDAMENTO' : occ.status === 'AGENDADA' ? 'AGENDADA' : 'PENDENTE'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-12 text-center text-xs uppercase text-gray-500 font-bold">
          Gerado pelo Portal de Gestão André Antônio Maggi em {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-red-50 border-b border-red-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900 uppercase">{editingOcc ? 'Editar Ocorrência' : 'Nova Ocorrência'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 rounded-xl transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Profissional Reportando</label>
                <select 
                  required
                  value={newOcc.reported_by}
                  onChange={e => setNewOcc({...newOcc, reported_by: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">SELECIONE O PROFISSIONAL...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Local</label>
                <select 
                  required
                  value={newOcc.location}
                  onChange={e => setNewOcc({...newOcc, location: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">SELECIONE O AMBIENTE...</option>
                  {locations.map((loc, idx) => (
                    <option key={idx} value={loc as string}>{loc as string}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Categoria</label>
                  <select 
                    value={newOcc.category}
                    onChange={e => setNewOcc({...newOcc, category: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    <option value="ELETRICA">ELÉTRICA (Lâmpada...)</option>
                    <option value="HIDRAULICA">HIDRÁULICA (Torneira...)</option>
                    <option value="ESTRUTURAL">ESTRUTURAL (Piso...)</option>
                    <option value="EQUIPAMENTOS">EQUIPAMENTOS (Máquinas...)</option>
                    <option value="OUTROS">OUTROS</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Status</label>
                  <select 
                    value={newOcc.status}
                    onChange={e => setNewOcc({...newOcc, status: e.target.value as any})}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="AGENDADA">AGENDADA</option>
                    <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                    <option value="RESOLVIDO">CONCLUÍDA</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Data da Ocorrência</label>
                  <input 
                    type="date"
                    required
                    value={newOcc.reported_at}
                    onChange={e => setNewOcc({...newOcc, reported_at: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Descrição do Problema</label>
                <textarea 
                  required
                  placeholder="Descreva o que está quebrado ou precisa de reparo..."
                  value={newOcc.description}
                  onChange={e => setNewOcc({...newOcc, description: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-sm outline-none focus:ring-2 focus:ring-red-500/20 resize-none h-32"
                />
              </div>

              {newOcc.status === 'RESOLVIDO' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Data de Resolução</label>
                  <input 
                    type="date"
                    required
                    value={resolvedAtInput}
                    onChange={e => setResolvedAtInput(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              )}

              <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-black transition-all shadow-xl">
                {editingOcc ? 'Salvar Alterações' : 'Registrar Ocorrência'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PLANO DE AÇÃO (IA) */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase">Plano de Ação de Melhorias (IA)</h3>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none mt-1">Gerado a partir das ocorrências de manutenção</p>
                </div>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-xl transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {planLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="animate-spin text-indigo-600" size={48} />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Analisando ocorrências e traçando estratégias...</p>
                </div>
              ) : actionPlan ? (
                <div className="space-y-8">
                  {/* DIAGNÓSTICO */}
                  <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 space-y-2">
                    <h4 className="text-[11px] font-black text-indigo-700 uppercase tracking-widest">Diagnóstico Geral</h4>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">{actionPlan.diagnosis}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* AÇÕES RECOMENDADAS */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                        <CheckSquare className="text-indigo-600" size={18} />
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Ações Corretivas e Preventivas</h4>
                      </div>
                      <div className="space-y-3">
                        {actionPlan.actions.map((act, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                            <div className="flex justify-between items-start gap-2">
                              <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                                act.priority === 'ALTA' ? 'bg-red-100 text-red-800' :
                                act.priority === 'MEDIA' ? 'bg-amber-100 text-amber-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {act.priority}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{act.category}</span>
                            </div>
                            <p className="text-xs font-bold text-gray-800">{act.action}</p>
                            <p className="text-[9px] font-medium text-gray-500 uppercase">Responsável sugerido: {act.responsible}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* CRONOGRAMA PREVENTIVO */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                          <ListTodo className="text-indigo-600" size={18} />
                          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Cronograma Preventivo Recomendado</h4>
                        </div>
                        <div className="space-y-2">
                          {actionPlan.preventiveSchedule.map((sched, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center gap-4">
                              <span className="text-xs font-semibold text-gray-700">{sched.task}</span>
                              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase rounded-lg shrink-0">{sched.frequency}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* METAS */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                          <Target className="text-indigo-600" size={18} />
                          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Metas para o Próximo Período</h4>
                        </div>
                        <div className="space-y-2">
                          {actionPlan.goals.map((goal, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center gap-4">
                              <span className="text-xs font-semibold text-gray-700">{goal.description}</span>
                              <span className="text-xs font-black text-indigo-600 uppercase shrink-0">{goal.target}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsPlanModalOpen(false)}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all"
              >
                Fechar
              </button>
              {actionPlan && (
                <button 
                  onClick={async () => {
                    const printPlanWindow = window.open('', '_blank');
                    if (printPlanWindow) {
                      printPlanWindow.document.write(`
                        <html>
                          <head>
                            <title>Plano de Ação de Melhorias - Manutenção</title>
                            <style>
                              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; line-height: 1.6; }
                              h1 { text-transform: uppercase; font-size: 20px; border-b: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
                              h2 { font-size: 14px; text-transform: uppercase; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #4f46e5; }
                              p { font-size: 12px; }
                              .meta-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                              table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
                              th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
                              th { background: #f3f4f6; text-transform: uppercase; }
                              .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
                              .badge-alta { background: #fee2e2; color: #991b1b; }
                              .badge-media { background: #fef3c7; color: #92400e; }
                              .badge-baixa { background: #d1fae5; color: #065f46; }
                              .footer { margin-top: 40px; text-align: center; font-size: 9px; color: #9ca3af; text-transform: uppercase; font-weight: bold; }
                            </style>
                          </head>
                          <body>
                            <h1>Plano de Ação de Melhorias de Manutenção</h1>
                            <p><strong>Gerado em:</strong> \${new Date().toLocaleDateString('pt-BR')}</p>
                            
                            <h2>1. Diagnóstico Geral</h2>
                            <div class="meta-box">
                              <p>\${actionPlan.diagnosis}</p>
                            </div>
                            
                            <h2>2. Ações Corretivas e Preventivas Recomendadas</h2>
                            <table>
                              <thead>
                                <tr>
                                  <th>Ação</th>
                                  <th>Categoria</th>
                                  <th>Responsável</th>
                                  <th>Prioridade</th>
                                </tr>
                              </thead>
                              <tbody>
                                \${actionPlan.actions.map(a => \`
                                  <tr>
                                    <td><strong>\${a.action}</strong></td>
                                    <td>\${a.category}</td>
                                    <td>\${a.responsible}</td>
                                    <td><span class="badge \${a.priority === 'ALTA' ? 'badge-alta' : a.priority === 'MEDIA' ? 'badge-media' : 'badge-baixa'}">\${a.priority}</span></td>
                                  </tr>
                                \`).join('')}
                              </tbody>
                            </table>

                            <h2>3. Cronograma Preventivo Sugerido</h2>
                            <table>
                              <thead>
                                <tr>
                                  <th>Tarefa Preventiva</th>
                                  <th>Frequência Recomendada</th>
                                </tr>
                              </thead>
                              <tbody>
                                \${actionPlan.preventiveSchedule.map(s => \`
                                  <tr>
                                    <td>\${s.task}</td>
                                    <td><strong>\${s.frequency}</strong></td>
                                  </tr>
                                \`).join('')}
                              </tbody>
                            </table>

                            <h2>4. Metas de Melhoria para o Próximo Período</h2>
                            <table>
                              <thead>
                                <tr>
                                  <th>Descrição da Meta</th>
                                  <th>Indicador de Sucesso</th>
                                </tr>
                              </thead>
                              <tbody>
                                \${actionPlan.goals.map(g => \`
                                  <tr>
                                    <td>\${g.description}</td>
                                    <td><strong>\${g.target}</strong></td>
                                  </tr>
                                \`).join('')}
                              </tbody>
                            </table>
                            
                            <div class="footer">
                              Gerado automaticamente com IA pelo Portal de Gestão André Antônio Maggi
                            </div>
                            <script>
                              window.onload = function() {
                                window.print();
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      printPlanWindow.document.close();
                    }
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Printer size={14} /> Imprimir Plano
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningOccurrences;
