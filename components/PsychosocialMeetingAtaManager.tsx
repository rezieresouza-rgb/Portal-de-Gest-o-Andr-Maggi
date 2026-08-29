import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Printer, 
  X, 
  Save, 
  ArrowLeft,
  Users,
  Clock,
  Loader2,
  PlusCircle,
  ShieldCheck,
  Calendar,
  UserCheck,
  FileCheck
} from 'lucide-react';
import { PsychosocialMeetingAta, MediationCase } from '../types';
import { supabase } from '../supabaseClient';

interface PsychosocialMeetingAtaManagerProps {
  initialCase?: MediationCase | null;
  onBack?: () => void;
}

const PsychosocialMeetingAtaManager: React.FC<PsychosocialMeetingAtaManagerProps> = ({
  initialCase,
  onBack
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>(initialCase ? 'form' : 'list');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [atas, setAtas] = useState<PsychosocialMeetingAta[]>(() => {
    const saved = localStorage.getItem('psychosocial_atas_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [printingAta, setPrintingAta] = useState<PsychosocialMeetingAta | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [form, setForm] = useState<Omit<PsychosocialMeetingAta, 'id' | 'timestamp'>>({
    number: '',
    year: new Date().getFullYear().toString(),
    pauta: initialCase ? `SESSÃO DE MEDIAÇÃO ESCOLAR - ${initialCase.studentName}` : '',
    date: new Date().toISOString().split('T')[0],
    location: 'SALA DE MEDIAÇÃO - EE ANDRÉ ANTÔNIO MAGGI',
    participants: initialCase ? [initialCase.studentName, ...(initialCase.involvedParties || [])] : [''],
    objectives: initialCase ? `Acolhimento, escuta ativa e restauração do clima de convivência referente ao fato envolvendo ${initialCase.studentName}.` : '',
    definitions: [''],
    forwarding: [''],
    responsible: 'PROFESSOR MEDIADOR',
    responsavelMediacao: initialCase?.teacherName || 'PROFESSOR MEDIADOR',
    horarioInicio: '08:00',
    horarioTermino: '09:00',
    descricaoConflito: initialCase ? (initialCase.description?.replace(/\[[^\]]+\]/g, '').trim() || '') : '',
    dataOcorrido: initialCase?.openedAt || new Date().toISOString().split('T')[0],
    parte1Nome: initialCase?.studentName || '',
    interessesParte1: '',
    parte2Nome: initialCase?.involvedParties?.[0] || '',
    interessesParte2: '',
    desenvolvimentoSessao: '',
    compromissoParte1: '',
    compromissoParte2: '',
    compromissoMutuo: '',
    encerramentoEncaminhamentos: ''
  });

  const fetchCloudAtas = async () => {
    try {
      setLoading(true);
      let localAtas: PsychosocialMeetingAta[] = [];
      const saved = localStorage.getItem('psychosocial_atas_v2');
      if (saved) {
        try {
          localAtas = JSON.parse(saved);
        } catch (e) {}
      }

      const { data, error } = await supabase
        .from('civic_documents')
        .select('*')
        .eq('template', 'psychosocial_ata')
        .order('created_at', { ascending: false });

      let dbAtas: PsychosocialMeetingAta[] = [];
      if (data && Array.isArray(data)) {
        dbAtas = data.map((d: any) => {
          const content = typeof d.content === 'object' && d.content !== null ? d.content : {};
          return {
            id: d.id,
            number: content.number || d.student_name?.match(/ATA Nº (\d+)/)?.[1] || '01',
            year: content.year || (d.date ? d.date.split('-')[0] : new Date().getFullYear().toString()),
            pauta: content.pauta || d.student_name || 'Mediação Escolar',
            date: content.date || d.date || new Date().toISOString().split('T')[0],
            location: content.location || 'SALA DE MEDIAÇÃO - EE ANDRÉ ANTÔNIO MAGGI',
            participants: content.participants || [],
            objectives: content.objectives || '',
            definitions: content.definitions || [],
            forwarding: content.forwarding || [],
            responsible: content.responsible || 'PROFESSOR MEDIADOR',
            timestamp: d.timestamp || (d.created_at ? new Date(d.created_at).getTime() : Date.now()),
            responsavelMediacao: content.responsavelMediacao,
            horarioInicio: content.horarioInicio,
            horarioTermino: content.horarioTermino,
            descricaoConflito: content.descricaoConflito,
            dataOcorrido: content.dataOcorrido,
            parte1Nome: content.parte1Nome,
            interessesParte1: content.interessesParte1,
            parte2Nome: content.parte2Nome,
            interessesParte2: content.interessesParte2,
            desenvolvimentoSessao: content.desenvolvimentoSessao,
            compromissoParte1: content.compromissoParte1,
            compromissoParte2: content.compromissoParte2,
            compromissoMutuo: content.compromissoMutuo,
            encerramentoEncaminhamentos: content.encerramentoEncaminhamentos
          };
        });
      }

      const map = new Map<string, PsychosocialMeetingAta>();
      localAtas.forEach(a => {
        const key = a.id || `ata-${a.number}-${a.year}`;
        map.set(key, a);
      });
      dbAtas.forEach(a => {
        map.set(a.id, a);
      });

      const merged = Array.from(map.values()).sort((a, b) => {
        const yearDiff = (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
        if (yearDiff !== 0) return yearDiff;
        return (parseInt(b.number) || 0) - (parseInt(a.number) || 0);
      });

      setAtas(merged);
      localStorage.setItem('psychosocial_atas_v2', JSON.stringify(merged));
    } catch (err) {
      console.error('Erro ao carregar atas da mediação do Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudAtas();

    const channel = supabase
      .channel('civic_documents_mediation_atas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'civic_documents', filter: 'template=eq.psychosocial_ata' }, () => {
        fetchCloudAtas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Atualizar quando initialCase mudar
  useEffect(() => {
    if (initialCase) {
      setViewMode('form');
      setForm(prev => ({
        ...prev,
        pauta: `SESSÃO DE MEDIAÇÃO ESCOLAR - ${initialCase.studentName}`,
        parte1Nome: initialCase.studentName,
        parte2Nome: initialCase.involvedParties?.[0] || '',
        descricaoConflito: initialCase.description?.replace(/\[[^\]]+\]/g, '').trim() || '',
        dataOcorrido: initialCase.openedAt || new Date().toISOString().split('T')[0],
        participants: [initialCase.studentName, ...(initialCase.involvedParties || [])],
        responsavelMediacao: initialCase.teacherName || 'PROFESSOR MEDIADOR'
      }));
    }
  }, [initialCase]);

  // Sequência automática do número da ata
  useEffect(() => {
    if (viewMode === 'form' && !form.number) {
      const currentYear = new Date().getFullYear().toString();
      const yearAtas = atas.filter(a => a.year === currentYear);
      const nextNum = (yearAtas.length + 1).toString().padStart(2, '0');
      setForm(prev => ({ ...prev, number: nextNum }));
    }
  }, [viewMode, atas]);

  const handleSave = async () => {
    if (!form.descricaoConflito && !form.pauta) {
      alert("Por favor, preencha a descrição breve do conflito/assunto.");
      return;
    }

    setIsSaving(true);
    const generatedId = crypto.randomUUID();
    const newAta: PsychosocialMeetingAta = {
      id: generatedId,
      ...form,
      timestamp: Date.now()
    };

    const updatedList = [newAta, ...atas.filter(a => a.id !== generatedId)];
    setAtas(updatedList);
    localStorage.setItem('psychosocial_atas_v2', JSON.stringify(updatedList));

    // 1. Salvar no Supabase (tabela civic_documents)
    try {
      const docPayload = {
        id: generatedId,
        template: 'psychosocial_ata',
        date: form.date,
        timestamp: Date.now(),
        student_name: `ATA Nº ${form.number}/${form.year} - ${form.parte1Nome || form.pauta || 'Mediação'}`,
        student_class: 'MEDIACAO',
        content: newAta
      };

      const { error: dbError } = await supabase
        .from('civic_documents')
        .upsert([docPayload], { onConflict: 'id' });

      if (dbError) {
        console.error('Erro ao persistir ata no Supabase:', dbError);
      }
    } catch (e) {
      console.error('Erro de rede ao salvar ata:', e);
    }

    // 2. Se houver caso vinculado, salvar log no Supabase
    if (initialCase?.id) {
      try {
        const ataLog = {
          id: `log-${Date.now()}`,
          date: form.date,
          professional: form.responsavelMediacao || 'PROFESSOR MEDIADOR',
          content: `[ATA OFICIAL SEDUC LAVRADA Nº ${newAta.number}/${newAta.year}] Ata de mediação registrada formalmente para ${form.parte1Nome} e ${form.parte2Nome || 'envolvidos'}.`
        };
        const updatedLogs = [ataLog, ...(initialCase.logs || [])];
        await supabase
          .from('mediation_cases')
          .update({ logs: updatedLogs })
          .eq('id', initialCase.id);
      } catch (err) {
        console.warn('Aviso ao registrar ata no caso de mediação:', err);
      }
    }

    setIsSaving(false);
    alert("Ata de Mediação registrada e salva no histórico e na nuvem com sucesso!");
    setViewMode('list');
    resetForm();
    if (onBack) onBack();
  };

  const resetForm = () => {
    setForm({
      number: '',
      year: new Date().getFullYear().toString(),
      pauta: '',
      date: new Date().toISOString().split('T')[0],
      location: 'SALA DE MEDIAÇÃO - EE ANDRÉ ANTÔNIO MAGGI',
      participants: [''],
      objectives: '',
      definitions: [''],
      forwarding: [''],
      responsible: 'PROFESSOR MEDIADOR',
      responsavelMediacao: '',
      horarioInicio: '08:00',
      horarioTermino: '09:00',
      descricaoConflito: '',
      dataOcorrido: new Date().toISOString().split('T')[0],
      parte1Nome: '',
      interessesParte1: '',
      parte2Nome: '',
      interessesParte2: '',
      desenvolvimentoSessao: '',
      compromissoParte1: '',
      compromissoParte2: '',
      compromissoMutuo: '',
      encerramentoEncaminhamentos: ''
    });
  };

  const handleDeleteAta = async (ata: PsychosocialMeetingAta) => {
    if (!window.confirm(`Deseja excluir permanentemente a ATA Nº ${ata.number}/${ata.year}?`)) return;
    const filtered = atas.filter(a => a.id !== ata.id);
    setAtas(filtered);
    localStorage.setItem('psychosocial_atas_v2', JSON.stringify(filtered));

    try {
      if (ata.id && !ata.id.startsWith('ata-')) {
        await supabase.from('civic_documents').delete().eq('id', ata.id);
      } else {
        await supabase.from('civic_documents').delete().match({
          template: 'psychosocial_ata',
          date: ata.date
        });
      }
    } catch (e) {
      console.error('Erro ao excluir ata da nuvem:', e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl">
            <FileText size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Atas de Reunião de Mediação</h2>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Modelo Oficial Professor Mediador - SEDUC/MT</p>
          </div>
        </div>
        <button 
          onClick={() => setViewMode(viewMode === 'list' ? 'form' : 'list')}
          className="px-8 py-3.5 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-rose-700 transition-all flex items-center gap-2"
        >
          {viewMode === 'list' ? <Plus size={16} /> : <ArrowLeft size={16} />}
          {viewMode === 'list' ? 'Lavrar Nova Ata de Mediação' : 'Voltar ao Acervo'}
        </button>
      </div>

      {viewMode === 'list' ? (
        loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
            <Loader2 className="animate-spin text-rose-600 mb-3" size={36} />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Carregando atas da nuvem...</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
           {atas.length === 0 ? (
             <div className="col-span-full bg-white p-12 rounded-[2.5rem] text-center border border-dashed border-gray-200">
               <FileText className="mx-auto text-gray-300 mb-3" size={48} />
               <p className="text-sm font-bold text-gray-500 uppercase">Nenhuma ata de mediação registrada ainda.</p>
               <button
                 onClick={() => setViewMode('form')}
                 className="mt-4 px-6 py-2.5 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all"
               >
                 Lavrar Primeira Ata
               </button>
             </div>
           ) : (
             atas.map(ata => (
               <div key={ata.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-rose-300 hover:shadow-xl transition-all group flex flex-col justify-between">
                  <div>
                     <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-all">
                          <FileCheck size={24} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {new Date(ata.date).toLocaleDateString('pt-BR')}
                        </span>
                     </div>
                     <h3 className="text-lg font-black text-gray-900 uppercase leading-tight mb-2">ATA Nº {ata.number}/{ata.year}</h3>
                     <p className="text-xs font-bold text-gray-700 line-clamp-2 uppercase mb-3">
                       {ata.descricaoConflito || ata.pauta || 'Mediação Escolar'}
                     </p>
                     
                     <div className="space-y-1 text-[10px] font-medium text-gray-500 border-t border-gray-50 pt-3">
                       {ata.responsavelMediacao && <p><strong>Mediador(a):</strong> {ata.responsavelMediacao}</p>}
                       {ata.parte1Nome && <p><strong>Parte 1:</strong> {ata.parte1Nome}</p>}
                       {ata.parte2Nome && <p><strong>Parte 2:</strong> {ata.parte2Nome}</p>}
                     </div>
                  </div>
                  
                  <div className="mt-6 flex gap-2 border-t border-gray-100 pt-4">
                     <button 
                       onClick={() => handlePrint(ata)}
                       className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                     >
                        <Printer size={14} /> Imprimir / PDF
                     </button>
                     <button 
                       onClick={() => handleDeleteAta(ata)}
                       className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                       title="Excluir Ata"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
               </div>
             ))
           )}
        </div>
        )
      ) : (
        /* FORMULÁRIO COMPLETO MODELO PROFESSOR MEDIADOR */
        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 no-print">
           <div className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8">
              
              <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-rose-600 text-white rounded-2xl shadow-md">
                       <PlusCircle size={26} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Lavrar Ata Modelo Professor Mediador</h3>
                       <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest mt-0.5">Formulário oficial de mediação de conflitos escolares</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-8 text-xs">
                 
                 {/* BLOCO 1: IDENTIFICAÇÃO */}
                 <div className="space-y-4 bg-rose-50/40 p-6 rounded-3xl border border-rose-100/60">
                    <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest flex items-center gap-2 border-b border-rose-100 pb-2">
                       <FileCheck size={16} /> 1. Identificação da Mediação
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Número da Ata</label>
                          <input 
                            type="text" 
                            placeholder="Ex: 01" 
                            value={form.number} 
                            onChange={e => setForm({...form, number: e.target.value})} 
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-xs text-center outline-none focus:border-rose-500" 
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Ano</label>
                          <input 
                            value={form.year} 
                            onChange={e => setForm({...form, year: e.target.value})} 
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-xs text-center outline-none focus:border-rose-500" 
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Data da Mediação</label>
                          <input 
                            type="date" 
                            value={form.date} 
                            onChange={e => setForm({...form, date: e.target.value})} 
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-xs outline-none focus:border-rose-500" 
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Horários (Início / Término)</label>
                          <div className="flex gap-2">
                            <input 
                              type="time" 
                              value={form.horarioInicio} 
                              onChange={e => setForm({...form, horarioInicio: e.target.value})} 
                              className="w-1/2 p-3 bg-white border border-gray-200 rounded-xl font-bold text-xs text-center outline-none focus:border-rose-500" 
                            />
                            <input 
                              type="time" 
                              value={form.horarioTermino} 
                              onChange={e => setForm({...form, horarioTermino: e.target.value})} 
                              className="w-1/2 p-3 bg-white border border-gray-200 rounded-xl font-bold text-xs text-center outline-none focus:border-rose-500" 
                            />
                          </div>
                       </div>
                    </div>

                    <div>
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Responsável pela Mediação (Professor Mediador)</label>
                       <input 
                         type="text"
                         value={form.responsavelMediacao} 
                         onChange={e => setForm({...form, responsavelMediacao: e.target.value.toUpperCase()})} 
                         placeholder="NOME COMPLETO DO PROFESSOR MEDIADOR / MEDIADORA" 
                         className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-xs uppercase outline-none focus:border-rose-500" 
                       />
                    </div>
                 </div>

                 {/* BLOCO 2: DETALHAMENTO */}
                 <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200/80">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                       <UserCheck size={16} /> 2. Detalhamento do Conflito e Partes
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="md:col-span-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Descrição Breve do Conflito</label>
                          <input 
                            type="text"
                            value={form.descricaoConflito} 
                            onChange={e => setForm({...form, descricaoConflito: e.target.value})} 
                            placeholder="Ex: Desentendimento verbal entre alunos durante a aula de Educação Física" 
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl font-medium text-xs outline-none focus:border-rose-500" 
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Data do Ocorrido</label>
                          <input 
                            type="date" 
                            value={form.dataOcorrido} 
                            onChange={e => setForm({...form, dataOcorrido: e.target.value})} 
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-xs outline-none focus:border-rose-500" 
                          />
                       </div>
                    </div>

                    {/* Parte 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-gray-100">
                       <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Nome da Parte 1 (Aluno / Envolvido)</label>
                          <input 
                            type="text"
                            value={form.parte1Nome} 
                            onChange={e => setForm({...form, parte1Nome: e.target.value.toUpperCase()})} 
                            placeholder="NOME COMPLETO E TURMA DA PARTE 1" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs uppercase outline-none focus:bg-white focus:border-rose-500" 
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Interesses / Necessidades da Parte 1</label>
                          <textarea 
                            value={form.interessesParte1} 
                            onChange={e => setForm({...form, interessesParte1: e.target.value})} 
                            placeholder="Relato e necessidades expressas pela Parte 1..." 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal h-16 outline-none focus:bg-white resize-none" 
                          />
                       </div>
                    </div>

                    {/* Parte 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-gray-100">
                       <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Nome da Parte 2 (Aluno / Responsável / Envolvido)</label>
                          <input 
                            type="text"
                            value={form.parte2Nome} 
                            onChange={e => setForm({...form, parte2Nome: e.target.value.toUpperCase()})} 
                            placeholder="NOME COMPLETO E TURMA/CARGO DA PARTE 2" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs uppercase outline-none focus:bg-white focus:border-rose-500" 
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Interesses / Necessidades da Parte 2</label>
                          <textarea 
                            value={form.interessesParte2} 
                            onChange={e => setForm({...form, interessesParte2: e.target.value})} 
                            placeholder="Relato e necessidades expressas pela Parte 2..." 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal h-16 outline-none focus:bg-white resize-none" 
                          />
                       </div>
                    </div>
                 </div>

                 {/* BLOCO 3: DESENVOLVIMENTO DA SESSÃO */}
                 <div className="space-y-2">
                    <label className="text-xs font-black text-gray-900 uppercase tracking-widest block">3. Desenvolvimento da Sessão</label>
                    <textarea 
                      value={form.desenvolvimentoSessao} 
                      onChange={e => setForm({...form, desenvolvimentoSessao: e.target.value})} 
                      placeholder="Descreva o desenrolar do diálogo, esclarecimentos prestados e escuta ativa promovida durante a sessão de mediação..." 
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-normal h-32 outline-none focus:bg-white resize-none" 
                    />
                 </div>

                 {/* BLOCO 4: ACORDO / ENCAMINHAMENTO */}
                 <div className="space-y-4 bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2 border-b border-emerald-200/60 pb-2">
                       <ShieldCheck size={16} /> 4. Acordo / Encaminhamento (Compromissos Mútuos)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest block mb-1">Compromisso da Parte 1</label>
                          <textarea 
                            value={form.compromissoParte1} 
                            onChange={e => setForm({...form, compromissoParte1: e.target.value})} 
                            placeholder="O que a Parte 1 se compromete a fazer..." 
                            className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-xs font-normal h-20 outline-none focus:border-emerald-500 resize-none" 
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest block mb-1">Compromisso da Parte 2</label>
                          <textarea 
                            value={form.compromissoParte2} 
                            onChange={e => setForm({...form, compromissoParte2: e.target.value})} 
                            placeholder="O que a Parte 2 se compromete a fazer..." 
                            className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-xs font-normal h-20 outline-none focus:border-emerald-500 resize-none" 
                          />
                       </div>
                    </div>

                    <div>
                       <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest block mb-1">Compromisso Mútuo / Acordo Comum</label>
                       <textarea 
                         value={form.compromissoMutuo} 
                         onChange={e => setForm({...form, compromissoMutuo: e.target.value})} 
                         placeholder="Acordos gerais estabelecidos em conjunto por ambas as partes..." 
                         className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-xs font-normal h-20 outline-none focus:border-emerald-500 resize-none" 
                       />
                    </div>
                 </div>

                 {/* BLOCO 5: ENCERRAMENTO E ENCAMINHAMENTOS */}
                 <div className="space-y-2">
                    <label className="text-xs font-black text-gray-900 uppercase tracking-widest block">5. Encerramento e Encaminhamentos Finais</label>
                    <textarea 
                      value={form.encerramentoEncaminhamentos} 
                      onChange={e => setForm({...form, encerramentoEncaminhamentos: e.target.value})} 
                      placeholder="Registros finais, encaminhamento para equipe de coordenação ou acompanhamento futuro..." 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-normal h-20 outline-none focus:bg-white resize-none" 
                    />
                 </div>

                  <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
                     {isSaving ? 'Salvando Ata na Nuvem...' : 'Registrar e Finalizar Ata de Mediação'}
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* ÁREA DE IMPRESSÃO DA ATA (PDF/PRINT - MODELO PROFESSOR MEDIADOR) */}
      {printingAta && (
        <div className="print-ata-area">
           <div className="pdf-page p-6 sm:p-8 flex flex-col justify-between min-h-[275mm] text-black font-serif">
              
              <div className="flex-1 flex flex-col justify-start">
                 {/* CABEÇALHO OFICIAL DAS ATAS */}
                 <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                   <img 
                     src="/brasao_mt.png" 
                     alt="Brasão MT" 
                     className="h-24 w-auto object-contain shrink-0 max-h-[95px]" 
                     onError={(e) => (e.currentTarget.src = '/SEDUC 2.jpg')} 
                   />
                   <div className="text-center flex-1 mx-2 space-y-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
                     <h1 className="text-[11px] font-bold uppercase text-black leading-tight">Governo do Estado de Mato Grosso</h1>
                     <h2 className="text-[10px] font-bold uppercase text-black leading-tight">Secretaria de Estado de Educação</h2>
                     <h3 className="text-[10px] font-bold uppercase text-black leading-tight">Secretaria Adjunta de Gestão Regional</h3>
                     <h4 className="text-[9px] font-bold uppercase text-black leading-tight">Superintendência de Gestão das Diretorias Regionais</h4>
                     <h5 className="text-[9px] font-bold uppercase text-black leading-tight">Diretoria Regional de Educação de Sinop</h5>
                     <h6 className="text-[11px] font-black uppercase text-black leading-tight pt-0.5">Escola Estadual Cívico-Militar André Antônio Maggi</h6>
                   </div>
                   <img 
                     src="/logo-escola-oficial.png" 
                     alt="Escola Logo" 
                     className="h-28 w-auto object-contain shrink-0 max-h-[115px]" 
                     onError={(e) => (e.currentTarget.src = '/logo-escola.png')} 
                   />
                 </div>

                 {/* TÍTULO DA ATA MODELO PROFESSOR MEDIADOR */}
                 <div className="text-center my-4 space-y-1">
                   <h2 className="text-base font-bold uppercase text-black tracking-wider">
                     ATA Nº {printingAta.number}/{printingAta.year}
                   </h2>
                   <p className="text-xs font-semibold text-gray-800 uppercase tracking-widest">
                     (MEDIAÇÃO ESCOLAR — PROFESSOR MEDIADOR)
                   </p>
                 </div>

                 {/* CONTEÚDO E SEÇÕES DA ATA */}
                 <div className="text-xs leading-relaxed text-justify space-y-4 text-black font-serif">
                    
                    {/* 1. IDENTIFICAÇÃO */}
                    <div className="space-y-1 border-b border-gray-300 pb-2">
                       <p className="font-bold uppercase text-sm">Identificação:</p>
                       <p><strong>Responsável pela mediação:</strong> {printingAta.responsavelMediacao || printingAta.responsible || '---'}</p>
                       <p><strong>Data da Mediação:</strong> {new Date(printingAta.date).toLocaleDateString('pt-BR')}</p>
                       <p><strong>Horário de Início:</strong> {printingAta.horarioInicio || '---'} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Horário de Término:</strong> {printingAta.horarioTermino || '---'}</p>
                    </div>

                    {/* 2. DETALHAMENTO */}
                    <div className="space-y-1 border-b border-gray-300 pb-2">
                       <p className="font-bold uppercase text-sm">Detalhamento:</p>
                       <p><strong>Descrição Breve do Conflito:</strong> {printingAta.descricaoConflito || printingAta.pauta || '---'}</p>
                       <p><strong>Data do Ocorrido:</strong> {printingAta.dataOcorrido ? new Date(printingAta.dataOcorrido).toLocaleDateString('pt-BR') : '---'}</p>
                       <p><strong>Interesses/Necessidades da Parte 1 ({printingAta.parte1Nome || 'Parte 1'}):</strong> {printingAta.interessesParte1 || '---'}</p>
                       <p><strong>Interesses/Necessidades da Parte 2 ({printingAta.parte2Nome || 'Parte 2'}):</strong> {printingAta.interessesParte2 || '---'}</p>
                    </div>

                    {/* 3. DESENVOLVIMENTO DA SESSÃO */}
                    <div className="space-y-1 border-b border-gray-300 pb-2">
                       <p className="font-bold uppercase text-sm">Desenvolvimento da Sessão:</p>
                       <p className="whitespace-pre-line text-justify">{printingAta.desenvolvimentoSessao || (printingAta.definitions && printingAta.definitions.join('\n')) || '---'}</p>
                    </div>

                    {/* 4. ACORDO / ENCAMINHAMENTO */}
                    <div className="space-y-1 border-b border-gray-300 pb-2">
                       <p className="font-bold uppercase text-sm">Acordo/Encaminhamento:</p>
                       <p className="italic text-gray-700">As partes firmaram os seguintes compromissos mútuos:</p>
                       <p><strong>Compromisso da Parte 1 ({printingAta.parte1Nome || 'Parte 1'}):</strong> {printingAta.compromissoParte1 || '---'}</p>
                       <p><strong>Compromisso da Parte 2 ({printingAta.parte2Nome || 'Parte 2'}):</strong> {printingAta.compromissoParte2 || '---'}</p>
                       <p><strong>Compromisso Mútuo:</strong> {printingAta.compromissoMutuo || (printingAta.forwarding && printingAta.forwarding.join('\n')) || '---'}</p>
                    </div>

                    {/* 5. ENCERRAMENTO E ENCAMINHAMENTOS */}
                    {printingAta.encerramentoEncaminhamentos && (
                      <div className="space-y-1 border-b border-gray-300 pb-2">
                         <p className="font-bold uppercase text-sm">Encerramento e Encaminhamentos:</p>
                         <p className="whitespace-pre-line">{printingAta.encerramentoEncaminhamentos}</p>
                      </div>
                    )}

                    {/* 6. ASSINATURAS */}
                    <div className="space-y-4 pt-2">
                       <p className="font-bold uppercase text-xs">Assinaturas:</p>
                       <p className="italic text-[11px] text-gray-800">
                         A presente Ata, com o Acordo/Encaminhamento, foi redigida e segue para a coleta das assinaturas.
                       </p>

                       <div className="grid grid-cols-2 gap-x-8 gap-y-8 pt-6 text-center text-xs">
                          <div>
                             <div className="border-t border-black pt-1">
                               <p className="font-bold uppercase">{printingAta.responsavelMediacao || printingAta.responsible || 'Professor(a) Mediador(a)'}</p>
                               <p className="text-[10px] text-gray-600">Mediador(a)</p>
                             </div>
                          </div>

                          <div>
                             <div className="border-t border-black pt-1">
                               <p className="font-bold uppercase">{printingAta.parte1Nome || 'Parte 1'}</p>
                               <p className="text-[10px] text-gray-600">Estudante / Parte 1</p>
                             </div>
                          </div>

                          <div>
                             <div className="border-t border-black pt-1">
                               <p className="font-bold uppercase">{printingAta.parte2Nome || 'Parte 2'}</p>
                               <p className="text-[10px] text-gray-600">Estudante / Parte 2 / Responsável</p>
                             </div>
                          </div>

                          <div>
                             <div className="border-t border-black pt-1">
                               <p className="font-bold uppercase">EQUIPE DE MEDIAÇÃO ESCOLAR / DIREÇÃO</p>
                               <p className="text-[10px] text-gray-600">Testemunha / Gestão Escolar</p>
                             </div>
                          </div>
                       </div>
                    </div>

                 </div>
              </div>

              {/* RODAPÉ OFICIAL DAS ATAS */}
              <div className="mt-auto border-t border-black/40 pt-2 grid grid-cols-2 gap-4 text-[8.5px] leading-tight text-black" style={{ color: '#000000', fontFamily: 'Arial, sans-serif' }}>
                <div className="text-left space-y-0.5">
                  <p>Rua Engenheiro Edgar Prado Arze, Quadra 01, Lote 05, Setor A, Centro Político Administrativo,</p>
                  <p>CEP: 78049-906 – Cuiabá-MT Fone (65) 3613-6300</p>
                  <p>Site: www.seduc.mt.gov.br</p>
                </div>
                <div className="text-left space-y-0.5 pl-6">
                  <p>Rua Borba Gato, nº 80, Bairro Torre</p>
                  <p>CEP: 78500-000 – Colíder-MT Fones +55 (66) 99682-7608</p>
                  <p>Email: escola.158330@edu.mt.gov.br</p>
                </div>
              </div>

           </div>
        </div>
      )}

      {/* ESTILOS CSS DE IMPRESSÃO */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media screen {
          .print-ata-area { display: none !important; }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          html, body {
            height: 100% !important;
            width: 100% !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * { visibility: hidden !important; }
          .no-print { display: none !important; }
          .print-ata-area, .print-ata-area * { visibility: visible !important; }
          .print-ata-area { 
            position: fixed !important; 
            left: 0 !important; 
            top: 0 !important; 
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important; 
            height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: white !important;
            color: black !important;
            box-sizing: border-box !important;
            padding: 8mm 12mm 4mm 12mm !important;
          }
          .pdf-page { 
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            height: 100% !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}} />
    </div>
  );
};

export default PsychosocialMeetingAtaManager;
