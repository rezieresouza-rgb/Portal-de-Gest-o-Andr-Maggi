
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Printer, 
  X, 
  Save, 
  History, 
  ChevronRight, 
  Search, 
  ShieldCheck, 
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  Loader2,
  PlusCircle,
  Hash,
  FileBadge
} from 'lucide-react';
import { PsychosocialMeetingAta } from '../types';

const PsychosocialMeetingAtaManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [atas, setAtas] = useState<PsychosocialMeetingAta[]>(() => {
    const saved = localStorage.getItem('psychosocial_atas_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<Omit<PsychosocialMeetingAta, 'id' | 'timestamp'>>({
    number: '',
    year: new Date().getFullYear().toString(),
    pauta: '',
    date: new Date().toISOString().split('T')[0],
    location: 'SALA DE MEDIAÇÃO - EE ANDRÉ ANTÔNIO MAGGI',
    participants: [''],
    objectives: '',
    definitions: [''],
    forwarding: [''],
    responsible: 'COORDENADOR DE MEDIAÇÃO'
  });

  useEffect(() => {
    localStorage.setItem('psychosocial_atas_v2', JSON.stringify(atas));
  }, [atas]);

  const addField = (field: 'participants' | 'definitions' | 'forwarding') => {
    setForm({ ...form, [field]: [...form[field], ''] });
  };

  const removeField = (field: 'participants' | 'definitions' | 'forwarding', index: number) => {
    const newList = [...form[field]];
    newList.splice(index, 1);
    setForm({ ...form, [field]: newList });
  };

  const updateField = (field: 'participants' | 'definitions' | 'forwarding', index: number, value: string) => {
    const newList = [...form[field]];
    newList[index] = value;
    setForm({ ...form, [field]: newList });
  };

  const handleSave = () => {
    const newAta: PsychosocialMeetingAta = {
      id: `ata-${Date.now()}`,
      ...form,
      timestamp: Date.now()
    };
    setAtas([newAta, ...atas]);
    alert("Ata lavrada com sucesso!");
    setViewMode('list');
    resetForm();
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
      responsible: 'COORDENADOR DE MEDIAÇÃO'
    });
  };

  const exportPDF = async (ataToExport: PsychosocialMeetingAta) => {
    setIsExporting(true);
    const element = document.getElementById(`print-ata-${ataToExport.id}`);
    if (!element) return setIsExporting(false);

    try {
      // @ts-ignore
      await window.html2pdf().set({
        margin: 10,
        filename: `ATA_${ataToExport.number}_${ataToExport.year}_Mediação.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(element).save();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl">
            <FileText size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Registro de Atas</h2>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Instrumento oficial conforme modelo SEDUC/MT</p>
          </div>
        </div>
        <button 
          onClick={() => setViewMode(viewMode === 'list' ? 'form' : 'list')}
          className="px-8 py-3.5 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-rose-700 transition-all flex items-center gap-2"
        >
          {viewMode === 'list' ? <Plus size={16} /> : <ArrowLeft size={16} />}
          {viewMode === 'list' ? 'Lavrar Nova Ata' : 'Voltar ao Acervo'}
        </button>
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {atas.map(ata => (
             <div key={ata.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-rose-300 hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                   <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-all">
                        <FileText size={24} />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(ata.date).toLocaleDateString('pt-BR')}</span>
                   </div>
                   <h3 className="text-lg font-black text-gray-900 uppercase leading-tight mb-2">ATA {ata.number}/{ata.year}</h3>
                   <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">Pauta: {ata.pauta}</p>
                   <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase border-t border-gray-50 pt-4">
                      <Users size={14} className="text-rose-400" /> {ata.participants.length} Presentes
                   </div>
                </div>
                <div className="mt-8 flex gap-2">
                   <button 
                     onClick={() => exportPDF(ata)}
                     className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                   >
                      <Printer size={14} /> Imprimir PDF
                   </button>
                   <button 
                     onClick={() => setAtas(atas.filter(a => a.id !== ata.id))}
                     className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                   >
                      <Trash2 size={18} />
                   </button>
                </div>

                {/* TEMPLATE PARA PDF (HIDDEN NO DOM) */}
                <div className="hidden">
                  <div id={`print-ata-${ata.id}`} className="p-16 space-y-12 text-gray-900 font-sans bg-white border-[1px] border-gray-200 min-h-[297mm]">
                    <div className="flex justify-between items-start border-b-2 border-black pb-8">
                       <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-black uppercase tracking-widest leading-none">SEDUC</p>
                          <p className="text-[8px] font-bold uppercase text-gray-500 leading-tight">Secretaria de Estado<br/>de Educação</p>
                       </div>
                       <div className="text-right flex flex-col gap-1">
                          <p className="text-[10px] font-black uppercase tracking-widest leading-none">Governo de<br/>Mato Grosso</p>
                       </div>
                    </div>

                    <div className="space-y-8">
                       <h1 className="text-xl font-black uppercase text-center underline tracking-widest">ATA {ata.number}/{ata.year}</h1>
                       
                       <div className="space-y-4 text-xs leading-relaxed">
                          <p><strong>Pauta:</strong> {ata.pauta}</p>
                          <p><strong>Data:</strong> {new Date(ata.date).toLocaleDateString('pt-BR')}</p>
                          <p><strong>Local:</strong> {ata.location}</p>
                          
                          <div className="space-y-2 pt-2">
                             <p><strong>Presentes:</strong></p>
                             <ul className="space-y-1 pl-4">
                                {ata.participants.filter(p => p.trim()).map((p, i) => (
                                  <li key={i}>{p}</li>
                                ))}
                             </ul>
                          </div>

                          <p className="pt-2"><strong>Objetivos:</strong> {ata.objectives}</p>

                          <div className="space-y-3 pt-4">
                             <p><strong>Acompanhamento e definições:</strong> Tudo o que foi dito durante a reunião, com a identificação de quem o disse. (Organizado em tópicos)</p>
                             <ul className="space-y-2 pl-6">
                                {ata.definitions.filter(d => d.trim()).map((d, i) => (
                                  <li key={i} className="flex gap-3"><span>●</span> <span>{d}</span></li>
                                ))}
                             </ul>
                          </div>

                          <div className="space-y-3 pt-4">
                             <p><strong>Encaminhamentos:</strong> Tudo o que se decidiu fazer. (Listagem de tarefas e responsáveis)</p>
                             <ul className="space-y-2 pl-6">
                                {ata.forwarding.filter(f => f.trim()).map((f, i) => (
                                  <li key={i} className="flex gap-3"><span>●</span> <span>{f}</span></li>
                                ))}
                             </ul>
                          </div>
                       </div>
                    </div>

                    <div className="pt-32 grid grid-cols-2 gap-20">
                       <div className="border-t-2 border-black text-center pt-4">
                          <p className="text-[10px] font-black uppercase">Assinaturas de quem lavrou a ATA</p>
                       </div>
                       <div className="border-t-2 border-black text-center pt-4">
                          <p className="text-[10px] font-black uppercase">Testemunhas</p>
                       </div>
                    </div>

                    <div className="pt-20 flex justify-center opacity-30">
                       <ShieldCheck size={16} />
                       <p className="text-[8px] font-black uppercase tracking-[0.4em] ml-2">Documento Autenticado Eletronicamente - Portal André Maggi</p>
                    </div>
                  </div>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-10">
              
              <div className="flex justify-between items-center border-b border-gray-50 pb-8">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-rose-600 text-white rounded-3xl shadow-lg">
                       <PlusCircle size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Lavrar Nova Ata</h3>
                       <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest mt-1">Escrituração oficial da mediação escolar</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número da Ata</label>
                       <input type="text" placeholder="Ex: 01" value={form.number} onChange={e => setForm({...form, number: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ano</label>
                       <input value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none text-center" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Realização</label>
                       <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pauta / Assunto</label>
                    <input value={form.pauta} onChange={e => setForm({...form, pauta: e.target.value.toUpperCase()})} placeholder="EX: CONSELHO DE CLASSE OU MEDIAÇÃO ESPECÍFICA" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white uppercase" />
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Participantes / Presentes</h4>
                       <button onClick={() => addField('participants')} className="text-rose-600 font-black text-[9px] uppercase hover:underline">+ Adicionar Nome</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {form.participants.map((p, i) => (
                         <div key={i} className="flex gap-2">
                            <input value={p} onChange={e => updateField('participants', i, e.target.value.toUpperCase())} placeholder="NOME COMPLETO" className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none" />
                            <button onClick={() => removeField('participants', i)} className="p-3 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Objetivos da Reunião</label>
                    <textarea value={form.objectives} onChange={e => setForm({...form, objectives: e.target.value})} placeholder="Motivos pelos quais a reunião foi proposta..." className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium h-24 outline-none focus:bg-white resize-none" />
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acompanhamento e Definições (Tópicos)</h4>
                       <button onClick={() => addField('definitions')} className="text-rose-600 font-black text-[9px] uppercase hover:underline">+ Novo Tópico</button>
                    </div>
                    <div className="space-y-3">
                       {form.definitions.map((d, i) => (
                         <div key={i} className="flex gap-2">
                            <textarea value={d} onChange={e => updateField('definitions', i, e.target.value)} placeholder="Descreva o que foi dito ou decidido..." className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium h-20 outline-none focus:bg-white resize-none" />
                            <button onClick={() => removeField('definitions', i)} className="p-4 text-gray-300 hover:text-red-500"><X size={16}/></button>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Encaminhamentos (Tarefas)</h4>
                       <button onClick={() => addField('forwarding')} className="text-rose-600 font-black text-[9px] uppercase hover:underline">+ Nova Tarefa</button>
                    </div>
                    <div className="space-y-3">
                       {form.forwarding.map((f, i) => (
                         <div key={i} className="flex gap-2">
                            <input value={f} onChange={e => updateField('forwarding', i, e.target.value)} placeholder="O que será feito e por quem..." className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium outline-none focus:bg-white" />
                            <button onClick={() => removeField('forwarding', i)} className="p-4 text-gray-300 hover:text-red-500"><X size={16}/></button>
                         </div>
                       ))}
                    </div>
                 </div>

                 <button onClick={handleSave} className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                    <Save size={24} /> Efetivar e Registrar ATA
                 </button>
              </div>
           </div>
        </div>
      )}

      {isExporting && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-950/40 backdrop-blur-sm">
           <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-white" size={48} />
              <p className="text-white font-black uppercase text-xs tracking-widest">Lavrando Documento...</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default PsychosocialMeetingAtaManager;
