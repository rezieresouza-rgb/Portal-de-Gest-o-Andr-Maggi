
import React, { useState, useEffect, useMemo } from 'react';
import {
   BookOpen,
   Plus,
   Search,
   Filter,
   History,
   ChevronRight,
   AlertTriangle,
   CheckCircle2,
   ShieldCheck,
   Trash2,
   Clock,
   FileText,
   User,
   // Added missing Users icon
   Users,
   MapPin,
   Sparkles,
   ArrowLeft,
   Loader2,
   Send,
   X,
   Printer
} from 'lucide-react';
import { useToast } from './Toast';
import { PedagogicalOccurrence, OccurrenceCategory } from '../types';
import PedagogicalOccurrenceForm from './PedagogicalOccurrenceForm';
import PedagogicalOccurrenceAta from './PedagogicalOccurrenceAta';
import { supabase } from '../supabaseClient';

const PedagogicalOccurrenceBook: React.FC = () => {
   const [view, setView] = useState<'list' | 'form' | 'ata' | 'report'>('list');
   const { addToast } = useToast();
   const [occurrences, setOccurrences] = useState<PedagogicalOccurrence[]>([]);

   const [selectedOccId, setSelectedOccId] = useState<string | null>(null);
   const [searchTerm, setSearchTerm] = useState('');
   const [filterProf, setFilterProf] = useState('');
   const [filterCat, setFilterCat] = useState<OccurrenceCategory | 'TODOS'>('TODOS');
   const [filterSeverity, setFilterSeverity] = useState<string>('TODOS');

   const fetchOccurrences = async () => {
      const { data } = await supabase.from('occurrences').select('*').order('date', { ascending: false });
      if (data) {
         setOccurrences(data.map(o => ({
            id: o.id,
            date: o.date,
            time: o.time,
            involvedStudents: o.student_name || 'N/A',
            className: o.classroom_name || 'N/A',
            location: o.location,
            report: o.description,
            responsible: o.responsible_name || 'COORDENAÇÃO',
            category: o.category as any,
            attachments: o.attachments || [],
            status: o.status as any,
            timestamp: new Date(o.date + 'T' + o.time).getTime()
         })));
      }
   };

   useEffect(() => {
      fetchOccurrences();

      const sub = supabase.channel('occurrences_updates')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, fetchOccurrences)
         .subscribe();

      return () => { sub.unsubscribe(); };
   }, []);

   const filtered = useMemo(() => {
      return occurrences.filter(o => {
         const matchSearch = o.involvedStudents.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.className.toLowerCase().includes(searchTerm.toLowerCase());
         const matchCat = filterCat === 'TODOS' || o.category === filterCat;
         const matchSev = filterSeverity === 'TODOS' || o.severity === filterSeverity;
         const matchProf = !filterProf || o.responsible.toLowerCase().includes(filterProf.toLowerCase());
         return matchSearch && matchCat && matchSev && matchProf;
      }).sort((a, b) => b.timestamp - a.timestamp);
   }, [occurrences, searchTerm, filterCat, filterSeverity, filterProf]);

   const handleDelete = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("Deseja excluir este registro de ocorrência permanentemente?")) {
         const { error } = await supabase.from('occurrences').delete().eq('id', id);
         if (error) {
            addToast("Erro ao excluir ocorrência.", "error");
         } else {
            setOccurrences(prev => prev.filter(o => o.id !== id));
            addToast("Ocorrência excluída com sucesso.", "success");
         }
      }
   };

   const handleSaveOccurrence = async (occ: PedagogicalOccurrence) => {
      try {
         const occurrenceData = {
            date: occ.date,
            time: occ.time,
            student_name: occ.involvedStudents,
            classroom_name: occ.className,
            location: occ.location,
            description: occ.report,
            responsible_name: occ.responsible,
            category: occ.category,
            severity: occ.severity || 'LEVE',
            attachments: occ.attachments,
            status: occ.status
         };

         let newOccId = occ.id;

         if (occ.id.startsWith('occ-')) {
            // Insert
            const { data, error } = await supabase.from('occurrences').insert([occurrenceData]).select().single();
            if (error) throw error;
            if (data) newOccId = data.id;
         } else {
            // Update
            const { error } = await supabase
               .from('occurrences')
               .update(occurrenceData)
               .eq('id', occ.id);
            if (error) throw error;
         }

         await fetchOccurrences();

         // AUTO-REDIRECT TO ATA GENERATION
         setSelectedOccId(newOccId);
         setView('ata');

      } catch (error) {
         console.error("Erro ao salvar ocorrência:", error);
         addToast("Erro ao salvar ocorrência.", "error");
      }
   };

   const categories: OccurrenceCategory[] = ['INDISCIPLINA', 'CONFLITO', 'ATRASO', 'VIOLÊNCIA', 'DESCUMPRIMENTO_REGRAS', 'OUTRO'];

   if (view === 'form') {
      return (
         <PedagogicalOccurrenceForm
            onCancel={() => setView('list')}
            onSave={handleSaveOccurrence}
            initialData={occurrences.find(o => o.id === selectedOccId)}
         />
      );
   }

   if (view === 'ata' && selectedOccId) {
      return (
         <PedagogicalOccurrenceAta
            occurrence={occurrences.find(o => o.id === selectedOccId)!}
            onBack={() => setView('list')}
            onUpdateStatus={async (id, status) => {
               const { error } = await supabase.from('occurrences').update({ status }).eq('id', id);
               if (!error) {
                  setOccurrences(prev => prev.map(o => o.id === id ? { ...o, status } : o));
                  addToast("Status atualizado com sucesso.", "success");
               } else {
                  addToast("Erro ao atualizar status.", "error");
               }
            }}
         />
      );
   }

   if (view === 'report') {
      return (
         <div className="bg-white text-black p-8 rounded-2xl min-h-screen">
            <div className="flex justify-between items-center mb-8 no-print">
               <button onClick={() => setView('list')} className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 transition-colors rounded-xl text-xs font-black uppercase text-gray-700">
                  <ArrowLeft size={16} /> Voltar
               </button>
               <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 transition-colors text-white rounded-xl text-xs font-black uppercase shadow-lg">
                  <Printer size={16} /> Imprimir Relatório
               </button>
            </div>
            
            <div className="print-area">
               <div className="text-center mb-8 border-b-2 border-black pb-4">
                  <h2 className="text-2xl font-black uppercase tracking-tight">Relatório de Ocorrências Pedagógicas</h2>
                  <p className="text-sm font-bold text-gray-600 mt-1">Total de registros no filtro atual: {filtered.length}</p>
                  <p className="text-xs text-gray-500 uppercase mt-2">
                     Filtro Ativo: {searchTerm ? `[Busca: ${searchTerm}]` : '[Sem busca]'} | Categoria: {filterCat} | Gravidade: {filterSeverity} | Professor: {filterProf || 'Todos'}
                  </p>
               </div>

               <table className="w-full text-left text-xs border-collapse">
                  <thead>
                     <tr className="border-b-2 border-black bg-gray-50">
                        <th className="py-2 px-2 font-black uppercase border-r border-gray-300">Data/Hora</th>
                        <th className="py-2 px-2 font-black uppercase border-r border-gray-300">Aluno(s) / Turma</th>
                        <th className="py-2 px-2 font-black uppercase border-r border-gray-300">Categoria / Local</th>
                        <th className="py-2 px-2 font-black uppercase border-r border-gray-300 w-1/3">Descrição do Registro</th>
                        <th className="py-2 px-2 font-black uppercase">Registrado Por</th>
                     </tr>
                  </thead>
                  <tbody>
                     {filtered.map(occ => (
                        <tr key={occ.id} className="border-b border-gray-300 break-inside-avoid">
                           <td className="py-3 px-2 whitespace-nowrap align-top border-r border-gray-300">
                              <strong>{new Date(occ.date).toLocaleDateString('pt-BR')}</strong> <br/>
                              <span className="text-gray-500">{occ.time}</span>
                           </td>
                           <td className="py-3 px-2 align-top border-r border-gray-300">
                              <strong className="uppercase">{occ.involvedStudents}</strong><br/>
                              <span className="text-gray-600">{occ.className}</span>
                           </td>
                           <td className="py-3 px-2 align-top border-r border-gray-300">
                              <span className="font-bold">{occ.category.replace('_', ' ')}</span><br/>
                              <span className="text-[9px] bg-gray-200 px-1 py-0.5 rounded text-gray-800 uppercase font-black">{occ.severity}</span><br/>
                              <span className="text-gray-600 mt-1 block">{occ.location}</span>
                           </td>
                           <td className="py-3 px-2 align-top border-r border-gray-300 text-[10px] text-gray-800">
                              {occ.report}
                           </td>
                           <td className="py-3 px-2 align-top font-medium uppercase text-[10px]">
                              {occ.responsible}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <style>{`
               @media print {
                  body { background: white !important; -webkit-print-color-adjust: exact; }
                  .no-print { display: none !important; }
                  .print-area { display: block !important; width: 100%; }
                  @page { size: landscape; margin: 15mm; }
               }
            `}</style>
         </div>
      );
   }

   return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">

         {/* HEADER GERAL */}
         <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="p-4 bg-violet-500/10 text-violet-400 rounded-3xl border border-violet-500/20">
                  <BookOpen size={32} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Livro de Ocorrência Digital</h3>
                  <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">Escrituração Escolar e Mediação de Conflitos</p>
               </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input
                     type="text"
                     placeholder="Aluno ou Turma..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
               </div>
               <div className="relative flex-1 md:w-48">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input
                     type="text"
                     placeholder="Professor..."
                     value={filterProf}
                     onChange={e => setFilterProf(e.target.value)}
                     className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
               </div>
               <button
                  onClick={() => setView('report')}
                  className="px-6 py-3 bg-white/5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-white/10 active:scale-95 transition-all flex items-center gap-2 shrink-0 border border-white/10"
               >
                  <Printer size={16} /> Relatório
               </button>
               <button
                  onClick={() => { setSelectedOccId(null); setView('form'); }}
                  className="px-6 py-3 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-violet-700 active:scale-95 transition-all flex items-center gap-2 shrink-0 border border-white/10"
               >
                  <Plus size={16} /> Novo Registro
               </button>
            </div>
         </div>

         {/* FILTROS DE CATEGORIA E GRAVIDADE */}
         <div className="flex flex-col gap-3 pb-2 no-print custom-scrollbar">
            <div className="flex gap-2 overflow-x-auto">
               <span className="text-[10px] text-white/50 font-black uppercase my-auto mr-2 min-w-max">Categoria:</span>
               <button
                  onClick={() => setFilterCat('TODOS')}
                  className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap border ${filterCat === 'TODOS' ? 'bg-violet-600 text-white border-violet-500 shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}`}
               >
                  Tudo
               </button>
               {categories.map(cat => (
                  <button
                     key={cat}
                     onClick={() => setFilterCat(cat)}
                     className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap border ${filterCat === cat ? 'bg-violet-600 text-white border-violet-500 shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}`}
                  >
                     {cat.replace('_', ' ')}
                  </button>
               ))}
            </div>
            <div className="flex gap-2 overflow-x-auto">
               <span className="text-[10px] text-white/50 font-black uppercase my-auto mr-2 min-w-max">Classificação (Fato):</span>
               {['TODOS', 'LEVE', 'MÉDIA', 'GRAVE', 'GRAVÍSSIMA'].map(sev => (
                  <button
                     key={sev}
                     onClick={() => setFilterSeverity(sev)}
                     className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap border ${filterSeverity === sev ? 'bg-amber-600 text-white border-amber-500 shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}`}
                  >
                     {sev}
                  </button>
               ))}
            </div>
         </div>

         {/* LISTAGEM */}
         <div className="grid grid-cols-1 gap-4">
            {filtered.length > 0 ? filtered.map(occ => (
               <div
                  key={occ.id}
                  onClick={() => { setSelectedOccId(occ.id); setView('ata'); }}
                  className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-lg hover:border-violet-500/30 hover:bg-white/10 transition-all cursor-pointer group flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-sm"
               >
                  <div className="flex items-center gap-6 flex-1">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${occ.status === 'ATA_GERADA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                        {occ.status === 'ATA_GERADA' ? <CheckCircle2 size={24} /> : <FileText size={24} />}
                     </div>
                     <div>
                        <div className="flex items-center gap-3">
                           <h4 className="text-lg font-black text-white uppercase leading-none">{occ.involvedStudents}</h4>
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${occ.category === 'VIOLÊNCIA' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-white/40 border-white/10'
                              }`}>{occ.category.replace('_', ' ')}</span>
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border bg-amber-500/10 text-amber-400 border-amber-500/20`}>{occ.severity}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                           <span className="text-[10px] font-bold text-white/40 uppercase flex items-center gap-1"><Clock size={12} /> {new Date(occ.date).toLocaleDateString('pt-BR')} às {occ.time}</span>
                           <span className="text-[10px] font-bold text-white/40 uppercase flex items-center gap-1"><Users size={12} /> {occ.className}</span>
                           <span className="text-[10px] font-bold text-white/40 uppercase flex items-center gap-1"><MapPin size={12} /> {occ.location}</span>
                           <span className="text-[10px] font-bold text-violet-400 uppercase flex items-center gap-1" title="Registrado por"><User size={12} /> {occ.responsible}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                     <div className="text-right mr-4">
                        <p className="text-[9px] font-black text-white/30 uppercase">Status</p>
                        <p className={`text-[10px] font-black uppercase ${occ.status === 'ATA_GERADA' ? 'text-emerald-400' : 'text-amber-400'}`}>
                           {occ.status.replace('_', ' ')}
                        </p>
                     </div>
                     <button onClick={(e) => handleDelete(occ.id, e)} className="p-3 text-white/30 hover:text-red-400 transition-colors">
                        <Trash2 size={20} />
                     </button>
                     <div className="p-3 bg-white/5 text-white/40 group-hover:bg-violet-600 group-hover:text-white rounded-xl transition-all shadow-sm border border-white/5">
                        <ChevronRight size={24} />
                     </div>
                  </div>
               </div>
            )) : (
               <div className="py-32 text-center bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10">
                  <History size={48} className="mx-auto mb-4 text-white/20" />
                  <p className="text-white/30 font-black uppercase text-xs tracking-widest">Nenhuma ocorrência encontrada</p>
               </div>
            )}
         </div>

         {/* FOOTER STATS */}
         <div className="bg-gradient-to-br from-indigo-900/80 to-violet-900/80 p-10 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden border border-white/10 backdrop-blur-md">
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><ShieldCheck size={180} /></div>
            <div className="flex items-center gap-6 relative z-10">
               <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20">
                  <ShieldCheck size={32} className="text-emerald-400" />
               </div>
               <div>
                  <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1">Base Legal SEDUC-MT</p>
                  <h4 className="text-xl font-black uppercase">Documentação Blindada</h4>
                  <p className="text-indigo-200/60 text-xs font-medium uppercase tracking-tight">Ocorrências registradas com integridade temporal e backup IA.</p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default PedagogicalOccurrenceBook;