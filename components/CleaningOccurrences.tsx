import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CleaningEmployee, SchoolEnvironment } from '../types';
import { AlertTriangle, Plus, Search, Trash2, CheckCircle2, Clock, X, Loader2, Printer, History } from 'lucide-react';

interface Occurrence {
  id: string;
  reported_by: string;
  location: string;
  description: string;
  category: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'RESOLVIDO';
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
    reported_at: new Date().toLocaleDateString('sv-SE')
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOcc.reported_by || !newOcc.location || !newOcc.description || !newOcc.reported_at) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const { error } = await supabase.from('cleaning_occurrences').insert([{
        reported_by: newOcc.reported_by,
        location: newOcc.location,
        description: newOcc.description,
        category: newOcc.category,
        status: 'PENDENTE',
        reported_at: new Date(newOcc.reported_at + 'T12:00:00').toISOString()
      }]);

      if (error) throw error;
      
      setNewOcc({ 
        reported_by: '', 
        location: '', 
        description: '', 
        category: 'OUTROS',
        reported_at: new Date().toLocaleDateString('sv-SE')
      });
      setIsModalOpen(false);
      fetchOccurrences();
    } catch (error) {
      console.error("Erro ao registrar ocorrência:", error);
      alert("Erro ao registrar. Verifique se a tabela foi criada no banco de dados.");
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

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'PENDENTE' ? 'EM_ANDAMENTO' : currentStatus === 'EM_ANDAMENTO' ? 'RESOLVIDO' : 'PENDENTE';
      const resolvedAt = nextStatus === 'RESOLVIDO' ? new Date().toISOString() : null;

      const { error } = await supabase.from('cleaning_occurrences').update({
        status: nextStatus,
        resolved_at: resolvedAt
      }).eq('id', id);

      if (error) throw error;
      fetchOccurrences();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
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
              Escola Estadual André Antônio Maggi - {viewMode === 'HISTORICO' ? 'Histórico de Resolvidos' : 'Ocorrências Ativas'}
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
            onClick={() => setIsModalOpen(true)}
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
            <div key={occ.id} className={`p-6 rounded-[2rem] border transition-all ${occ.status === 'RESOLVIDO' ? 'bg-gray-50 border-gray-200 opacity-70' : occ.status === 'EM_ANDAMENTO' ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-red-100 shadow-md'}`}>
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
                  <button onClick={() => toggleStatus(occ.id, occ.status)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    occ.status === 'RESOLVIDO' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                    occ.status === 'EM_ANDAMENTO' ? 'bg-amber-200 text-amber-800 hover:bg-amber-300' :
                    'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}>
                    {occ.status === 'RESOLVIDO' ? <CheckCircle2 size={14} /> : occ.status === 'EM_ANDAMENTO' ? <Clock size={14} /> : <AlertTriangle size={14} />}
                    {occ.status}
                  </button>
                  <button onClick={() => deleteOccurrence(occ.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors no-print">
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
          <p className="text-base font-bold uppercase">Escola Estadual André Antônio Maggi</p>
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
                  {occ.status === 'RESOLVIDO' ? 'RESOLVIDO' : occ.status === 'EM_ANDAMENTO' ? 'EM ANDAMENTO' : 'PENDENTE'}
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
              <h3 className="text-xl font-black text-gray-900 uppercase">Nova Ocorrência</h3>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-black transition-all shadow-xl">
                Registrar Ocorrência
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningOccurrences;
