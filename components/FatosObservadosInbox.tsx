import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Search, FileText, CheckCircle, Clock, AlertTriangle, ArrowRight, MessageSquare } from 'lucide-react';

interface FatosObservadosInboxProps {
  onPreencherDocumento: (occ: any) => void;
}

const FatosObservadosInbox: React.FC<FatosObservadosInboxProps> = ({ onPreencherDocumento }) => {
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  
  // Modal State
  const [selectedOcc, setSelectedOcc] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOccurrences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .eq('category', 'FATO OBSERVADO')
        .order('date', { ascending: false });
        
      if (!error && data) {
        setOccurrences(data);
      }
    } catch (err) {
      console.error('Erro ao buscar ocorrências:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOccurrences();
    
    // Subscribe to changes
    const subscription = supabase
      .channel('occurrences_inbox_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences', filter: "category=eq.'FATO OBSERVADO'" }, () => {
        fetchOccurrences();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredOccurrences = occurrences.filter(occ => {
    const matchesSearch = occ.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          occ.responsible_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'TODOS' || occ.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedOcc) return;
    setIsUpdating(true);
    try {
      // Append feedback to description if there's any
      let finalDescription = selectedOcc.description;
      if (feedback.trim()) {
        finalDescription = `${selectedOcc.description}\n\n[PARECER DA GESTÃO: ${feedback}]`;
      }

      const { error } = await supabase
        .from('occurrences')
        .update({ 
          status: newStatus,
          description: finalDescription
        })
        .eq('id', selectedOcc.id);

      if (error) throw error;
      
      alert('Status atualizado com sucesso!');
      setSelectedOcc(null);
      setFeedback('');
      fetchOccurrences();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/80 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Fatos Observados</h1>
          <p className="text-slate-500 font-bold uppercase text-xs mt-1">Caixa de entrada de relatos docentes</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por aluno ou professor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 font-bold text-sm uppercase outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-48 px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm uppercase outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none bg-white"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="REGISTRADO">Registrado (Novos)</option>
            <option value="EM ANÁLISE">Em Análise</option>
            <option value="CONCLUÍDO">Concluídos</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
             <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : filteredOccurrences.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredOccurrences.map(occ => (
              <div key={occ.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-xl flex-shrink-0 ${occ.status === 'CONCLUÍDO' ? 'bg-green-50 text-green-600' : occ.status === 'EM ANÁLISE' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    {occ.status === 'CONCLUÍDO' ? <CheckCircle size={24} /> : occ.status === 'EM ANÁLISE' ? <Clock size={24} /> : <AlertTriangle size={24} />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase">{occ.student_name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-bold uppercase text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{occ.classroom_name}</span>
                      <span>{new Date(occ.date).toLocaleDateString('pt-BR')}</span>
                      <span>Prof: {occ.responsible_name}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 font-medium line-clamp-2">
                      {occ.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0 lg:ml-4 flex-shrink-0">
                  <button
                    onClick={() => onPreencherDocumento(occ)}
                    className="px-4 py-2 bg-blue-50 text-blue-700 font-bold uppercase text-xs rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText size={16} /> Documento
                  </button>
                  <button
                    onClick={() => setSelectedOcc(occ)}
                    className="px-4 py-2 bg-slate-900 text-white font-bold uppercase text-xs rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                  >
                    Analisar <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold uppercase text-sm">Nenhum fato observado encontrado</p>
          </div>
        )}
      </div>

      {/* Modal de Análise */}
      {selectedOcc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedOcc(null)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900 uppercase">Análise de Ocorrência</h2>
              <p className="text-xs font-bold uppercase text-slate-500 mt-1">{selectedOcc.student_name} • {selectedOcc.classroom_name}</p>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-black uppercase text-slate-400 mb-2">Relato do Professor ({selectedOcc.responsible_name})</h4>
                <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{selectedOcc.description}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">Adicionar Parecer / Devolutiva (Opcional)</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Escreva um parecer ou feedback para o professor..."
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium h-32 resize-none outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-[2rem] flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => handleStatusUpdate('EM ANÁLISE')} 
                disabled={isUpdating}
                className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-black uppercase text-xs hover:bg-amber-600 transition-colors"
              >
                Marcar "Em Análise"
              </button>
              <button 
                onClick={() => handleStatusUpdate('CONCLUÍDO')} 
                disabled={isUpdating}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-black uppercase text-xs hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
              >
                Concluir Tratativa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FatosObservadosInbox;
