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
   Users,
   MapPin,
   Sparkles,
   ArrowLeft,
   Loader2,
   Send,
   X,
   Printer,
   ArrowRightLeft
} from 'lucide-react';
import { useToast } from './Toast';
import { PedagogicalOccurrence, OccurrenceCategory } from '../types';
import PedagogicalOccurrenceForm from './PedagogicalOccurrenceForm';
import PedagogicalOccurrenceAta from './PedagogicalOccurrenceAta';
import { TramitationModal } from './TramitationModal';
import { supabase } from '../supabaseClient';

interface PedagogicalOccurrenceBookProps {
   user?: any;
}

const PedagogicalOccurrenceBook: React.FC<PedagogicalOccurrenceBookProps> = ({ user }) => {
   const [view, setView] = useState<'list' | 'form' | 'ata' | 'report'>('list');
   const { addToast } = useToast();
   const [occurrences, setOccurrences] = useState<PedagogicalOccurrence[]>([]);

   const [selectedOccId, setSelectedOccId] = useState<string | null>(null);
   const [searchTerm, setSearchTerm] = useState('');
   const [filterProf, setFilterProf] = useState('');
   const [filterCat, setFilterCat] = useState<OccurrenceCategory | 'TODOS'>('TODOS');
   const [filterSeverity, setFilterSeverity] = useState<string>('TODOS');
   const [isExportingPDF, setIsExportingPDF] = useState(false);
   const [tramitatingOcc, setTramitatingOcc] = useState<PedagogicalOccurrence | null>(null);

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
            severity: o.severity || 'LEVE',
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
         const matchSearch = (o.involvedStudents || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.className || '').toLowerCase().includes(searchTerm.toLowerCase());
         const matchCat = filterCat === 'TODOS' || o.category === filterCat;
         const matchSev = filterSeverity === 'TODOS' || (o.severity || 'LEVE') === filterSeverity;
         const matchProf = !filterProf || (o.responsible || '').toLowerCase().includes(filterProf.toLowerCase());
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
            const { data, error } = await supabase.from('occurrences').insert([occurrenceData]).select().single();
            if (error) throw error;
            if (data) newOccId = data.id;
         } else {
            const { error } = await supabase
               .from('occurrences')
               .update(occurrenceData)
               .eq('id', occ.id);
            if (error) throw error;
         }

         await fetchOccurrences();
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
            user={user}
            onCancel={() => setView('list')}
            onSave={(occ) => {
               handleSaveOccurrence(occ);
            }}
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
         <div className="bg-white text-slate-900 p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center no-print">
               <button onClick={() => setView('list')} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 transition-all rounded-xl text-xs font-black uppercase text-slate-700">
                  <ArrowLeft size={16} /> Voltar
               </button>
               <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 transition-all text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-violet-600/20">
                  <Printer size={16} /> Imprimir Relatório
               </button>
            </div>
            
            <div id="print-report-area" className="print-area bg-white p-4">
               <div className="text-center mb-8 border-b-2 border-slate-900 pb-4">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Relatório de Ocorrências Pedagógicas</h2>
                  <p className="text-sm font-bold text-slate-600 mt-1">Total de registros no filtro atual: {filtered.length}</p>
                  <p className="text-xs text-slate-500 uppercase mt-1">
                     Filtro Ativo: {searchTerm ? `[Busca: ${searchTerm}]` : '[Sem busca]'} | Categoria: {filterCat} | Gravidade: {filterSeverity} | Professor: {filterProf || 'Todos'}
                  </p>
               </div>

               <table className="w-full text-left text-xs border-collapse">
                  <thead>
                     <tr className="border-b-2 border-slate-900 bg-slate-50">
                        <th className="py-2.5 px-3 font-black uppercase border-r border-slate-200">Data/Hora</th>
                        <th className="py-2.5 px-3 font-black uppercase border-r border-slate-200">Aluno(s) / Turma</th>
                        <th className="py-2.5 px-3 font-black uppercase border-r border-slate-200">Categoria / Local</th>
                        <th className="py-2.5 px-3 font-black uppercase border-r border-slate-200 w-1/3">Descrição</th>
                        <th className="py-2.5 px-3 font-black uppercase">Registrado Por</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                     {filtered.map(occ => (
                        <tr key={occ.id} className="hover:bg-slate-50">
                           <td className="py-3 px-3 whitespace-nowrap align-top border-r border-slate-200">
                              <strong className="text-slate-900">{new Date(occ.date + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> <br/>
                              <span className="text-slate-500">{occ.time}</span>
                           </td>
                           <td className="py-3 px-3 align-top border-r border-slate-200">
                              <strong className="uppercase text-slate-900">{occ.involvedStudents}</strong><br/>
                              <span className="text-slate-600 font-bold">{occ.className}</span>
                           </td>
                           <td className="py-3 px-3 align-top border-r border-slate-200">
                              <span className="font-black text-indigo-700">{occ.category.replace('_', ' ')}</span><br/>
                              <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 uppercase font-black">{occ.severity}</span><br/>
                              <span className="text-slate-500 mt-1 block">{occ.location}</span>
                           </td>
                           <td className="py-3 px-3 align-top border-r border-slate-200 text-xs text-slate-700">
                              {occ.report}
                           </td>
                           <td className="py-3 px-3 align-top font-bold uppercase text-xs text-slate-800">
                              {occ.responsible}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">

         {/* HEADER GERAL */}
         <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
               <div className="p-3.5 bg-violet-100 text-violet-700 rounded-2xl">
                  <BookOpen size={28} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Livro de Ocorrências Digital</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">Escrituração Escolar e Mediação de Conflitos</p>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
               <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                     type="text"
                     placeholder="Aluno ou Turma..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                  />
               </div>

               <div className="relative flex-1 sm:w-44">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                     type="text"
                     placeholder="Professor..."
                     value={filterProf}
                     onChange={e => setFilterProf(e.target.value)}
                     className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                  />
               </div>

               <button
                  onClick={() => setView('report')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0"
               >
                  <Printer size={15} /> Relatório
               </button>

               <button
                  onClick={() => { setSelectedOccId(null); setView('form'); }}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-violet-600/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
               >
                  <Plus size={15} /> Novo Registro
               </button>
            </div>
         </div>

         {/* FILTROS DE CATEGORIA E GRAVIDADE */}
         <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
               <span className="text-[10px] text-slate-400 font-black uppercase shrink-0 mr-1">Categoria:</span>
               <button
                  onClick={() => setFilterCat('TODOS')}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                     filterCat === 'TODOS' ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
               >
                  TUDO
               </button>
               {categories.map(cat => (
                  <button
                     key={cat}
                     onClick={() => setFilterCat(cat)}
                     className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                        filterCat === cat ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                     }`}
                  >
                     {cat.replace('_', ' ')}
                  </button>
               ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pt-2 border-t border-slate-100">
               <span className="text-[10px] text-slate-400 font-black uppercase shrink-0 mr-1">Gravidade:</span>
               {['TODOS', 'LEVE', 'MÉDIA', 'GRAVE', 'GRAVÍSSIMA'].map(sev => (
                  <button
                     key={sev}
                     onClick={() => setFilterSeverity(sev)}
                     className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                        filterSeverity === sev ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                     }`}
                  >
                     {sev}
                  </button>
               ))}
            </div>
         </div>

         {/* LISTAGEM DE OCORRÊNCIAS COM CONTRASTE PROFISSIONAL */}
         <div className="grid grid-cols-1 gap-3">
            {filtered.length > 0 ? filtered.map(occ => (
               <div
                  key={occ.id}
                  onClick={() => { setSelectedOccId(occ.id); setView('ata'); }}
                  className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm hover:border-violet-400 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
               >
                  <div className="flex items-center gap-4 flex-1">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black ${
                        occ.status === 'ATA_GERADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-900'
                     }`}>
                        {occ.status === 'ATA_GERADA' ? <CheckCircle2 size={22} /> : <FileText size={22} />}
                     </div>
                     <div>
                        <div className="flex flex-wrap items-center gap-2">
                           <h4 className="text-base font-black text-slate-900 uppercase leading-none">{occ.involvedStudents}</h4>
                           <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                              occ.category === 'VIOLÊNCIA' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                           }`}>
                              {occ.category.replace('_', ' ')}
                           </span>
                           <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-100 text-amber-900">
                              {occ.severity || 'LEVE'}
                           </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-bold text-slate-500">
                           <span className="flex items-center gap-1"><Clock size={12} className="text-slate-400" /> {new Date(occ.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {occ.time}</span>
                           <span className="flex items-center gap-1"><Users size={12} className="text-slate-400" /> {occ.className}</span>
                           <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> {occ.location}</span>
                           <span className="flex items-center gap-1 text-indigo-600"><User size={12} /> {occ.responsible}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-auto">
                     <button
                        type="button"
                        onClick={(e) => {
                           e.stopPropagation();
                           setTramitatingOcc(occ);
                        }}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border border-indigo-200"
                        title="Tramitar ocorrência entre setores"
                     >
                        <ArrowRightLeft size={13} /> Tramitar
                     </button>

                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        occ.status === 'ATA_GERADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                     }`}>
                        {occ.status.replace('_', ' ')}
                     </span>

                     <button onClick={(e) => handleDelete(occ.id, e)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 size={16} />
                     </button>
                     
                     <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                        <ChevronRight size={18} />
                     </div>
                  </div>
               </div>
            )) : (
               <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-200 space-y-2">
                  <History size={36} className="mx-auto text-slate-300" />
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma ocorrência encontrada nesta busca</p>
               </div>
            )}
         </div>

         {/* MODAL DE TRAMITAÇÃO INTERSETORIAL */}
         {tramitatingOcc && (
            <TramitationModal
               occurrence={tramitatingOcc}
               currentSector="PROFESSOR"
               user={user || { id: 'coord', name: 'Coordenação' }}
               onClose={() => setTramitatingOcc(null)}
               onSuccess={() => fetchOccurrences()}
            />
         )}

      </div>
   );
};

export default PedagogicalOccurrenceBook;
