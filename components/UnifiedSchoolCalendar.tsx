import React, { useState, useEffect, useRef } from 'react';
import {
   Calendar as CalendarIcon,
   ChevronRight,
   ChevronLeft,
   FileText,
   ShieldCheck,
   Save,
   Camera,
   History,
   Sparkles,
   Info,
   Flag,
   CalendarDays,
   Loader2,
   Printer
} from 'lucide-react';
import { useToast } from './Toast';
import { SCHOOL_CALENDAR_2026 } from '../constants/schoolCalendar2026';
import { supabase } from '../supabaseClient';

const UnifiedSchoolCalendar: React.FC = () => {
   const [currentIdx, setCurrentIdx] = useState(() => new Date().getMonth());
   const { addToast } = useToast();
   const [localTracker, setLocalTracker] = useState<Record<string, any>>({});
   const [dynamicEventsList, setDynamicEventsList] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [saving, setSaving] = useState(false);
   const [uploading, setUploading] = useState<string | null>(null);

   const photoInputRef = useRef<HTMLInputElement>(null);
   const reportInputRef = useRef<HTMLInputElement>(null);

   const monthData = SCHOOL_CALENDAR_2026.meses[currentIdx];

   useEffect(() => {
      fetchTracker();
   }, []);

   const fetchTracker = async () => {
      setLoading(true);
      try {
         // 1. Fetch Calendar Tracking
         const { data: trackingData } = await supabase
            .from('calendar_tracking')
            .select('*')
            .eq('event_type', 'MONTHLY_REPORT');

         if (trackingData) {
            const tracker: Record<string, any> = {};
            trackingData.forEach(row => {
               try {
                  const json = row.description ? JSON.parse(row.description) : {};
                  if (json.monthName) {
                     tracker[json.monthName] = json;
                  }
               } catch (e) {
                  console.error("Error parsing calendar tracking", e);
               }
            });
            setLocalTracker(tracker);
         }

         // 2. Fetch Dynamic Events
         const { data: assessData } = await supabase.from('assessments').select('date, subject, type, description');
         const { data: projData } = await supabase.from('pedagogical_projects').select('name, date_start, date_end, status');
         const { data: eventData } = await supabase.from('school_events').select('title, date, type'); // Assuming table exists

         const dynamicEvents: any[] = [];

         if (assessData) {
            assessData.forEach(a => {
               dynamicEvents.push({
                  date: new Date(a.date),
                  tipo: 'AVALIAÇÃO',
                  categoria: 'PEDAGOGICO',
                  descricao: `${a.subject} - ${a.type}`
               });
            });
         }

         if (projData) {
            projData.forEach(p => {
               if (p.date_start) {
                  dynamicEvents.push({
                     date: new Date(p.date_start),
                     tipo: 'PROJETO',
                     categoria: 'PEDAGOGICO',
                     descricao: `Início: ${p.name}`
                  });
               }
               if (p.date_end) {
                  dynamicEvents.push({
                     date: new Date(p.date_end),
                     tipo: 'PROJETO',
                     categoria: 'PEDAGOGICO',
                     descricao: `Fim: ${p.name}`
                  });
               }
            });
         }

         if (eventData) {
            eventData.forEach(e => {
               dynamicEvents.push({
                  date: new Date(e.date),
                  tipo: 'EVENTO',
                  categoria: e.type === 'FESTIVO' ? 'FERIAS' : 'ADMINISTRATIVO', // Simplified mapping
                  descricao: e.title
               });
            });
         }

         // Helper to merge events into monthData in rendering or state
         // For now, let's just log them or store in a state if we want to display them
         // But the requirement is to "Update Agenda Data Source".
         // The current UI iterates `monthData.eventos`. We should probably update `monthData` or use a local state for events.
         setDynamicEventsList(dynamicEvents);

      } catch (error) {
         console.error("Error fetching data:", error);
      } finally {
         setLoading(false);
      }
   };

   const updateField = (field: string, value: any) => {
      setLocalTracker(prev => {
         const current = prev[monthData.mes] || {};
         return {
            ...prev,
            [monthData.mes]: { ...current, [field]: value }
         };
      });
   };

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photos' | 'reports') => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(type);
      try {
         const fileExt = file.name.split('.').pop();
         const fileName = `${monthData.mes}_${type}_${Date.now()}.${fileExt}`;
         const filePath = `calendar/${fileName}`;

         const { error: uploadError } = await supabase.storage
            .from('school-attachments')
            .upload(filePath, file);

         if (uploadError) throw uploadError;

         const { data: { publicUrl } } = supabase.storage
            .from('school-attachments')
            .getPublicUrl(filePath);

         const currentList = localTracker[monthData.mes]?.[type] || [];
         updateField(type, [...currentList, publicUrl]);
         addToast("Arquivo anexado com sucesso!", "success");
      } catch (err: any) {
         console.error("Upload error:", err);
         addToast("Erro ao fazer upload: " + (err.message || "Tente novamente"), "error");
      } finally {
         setUploading(null);
         if (e.target) e.target.value = '';
      }
   };

   const handleSave = async () => {
      setSaving(true);
      const monthName = monthData.mes;
      const currentData = localTracker[monthName] || {};

      // Validar se tem algo para salvar
      // if (!currentData.campanha_realizada && !currentData.campanha_a_realizar && !currentData.observacoes) return;

      // We store keyed by the first date of that month in 2026 to fit the 'date' column type
      // We need to map Month Name to a Date.
      // SCHOOL_CALENDAR_2026 doesn't strictly have dates for months, but we can assume index or just use a fixed year.
      // Index currentIdx matches month (0=Jan).
      const year = 2026;
      const monthIndex = SCHOOL_CALENDAR_2026.meses.findIndex(m => m.mes === monthName); // Or just currentIdx
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;

      const payload = {
         monthName,
         campanha_realizada: currentData.campanha_realizada || '',
         campanha_a_realizar: currentData.campanha_a_realizar || '',
         observacoes: currentData.observacoes || '',
         photos: currentData.photos || [],
         reports: currentData.reports || []
      };

      try {
         // Check if exists
         const { data: existing } = await supabase
            .from('calendar_tracking')
            .select('id')
            .eq('event_type', 'MONTHLY_REPORT')
            .eq('date', dateStr)
            .single();

         if (existing) {
            const { error } = await supabase
               .from('calendar_tracking')
               .update({
                  description: JSON.stringify(payload)
               })
               .eq('id', existing.id);
            if (error) throw error;
         } else {
            const { error } = await supabase
               .from('calendar_tracking')
               .insert([{
                  event_type: 'MONTHLY_REPORT',
                  date: dateStr,
                  description: JSON.stringify(payload),
                  created_by: 'PROF. CRISTIANO'
               }]);
            if (error) throw error;
         }
         addToast("Monitoramento salvo com sucesso!", "success");
      } catch (e) {
         console.error(e);
         addToast("Erro ao salvar monitoramento.", "error");
      } finally {
         setSaving(false);
      }
   };

   const getEventCategoryColor = (categoria: string) => {
      switch (categoria) {
         case 'FERIADO': return 'bg-red-50 text-red-600 border-red-100';
         case 'PEDAGOGICO': return 'bg-violet-50 text-violet-600 border-violet-100';
         case 'ADMINISTRATIVO': return 'bg-blue-50 text-blue-600 border-blue-100';
         case 'FERIAS': return 'bg-amber-50 text-amber-600 border-amber-100';
         default: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">

         {/* HEADER DE NAVEGAÇÃO MENSAL (HIDDEN ON PRINT) */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl flex items-center justify-between no-print">
            <div className="flex items-center gap-3 no-print">
               <button
                  onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="p-4 bg-gray-50 text-gray-400 hover:text-indigo-600 disabled:opacity-30 rounded-2xl transition-all shadow-sm border border-gray-100 hover:bg-white"
               >
                  <ChevronLeft size={28} />
               </button>
               <button
                  onClick={() => window.print()}
                  className="p-4 bg-white text-indigo-600 border border-indigo-100 rounded-2xl hover:bg-indigo-50 transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-sm"
               >
                  <Printer size={18} /> Imprimir Relatório Oficial
               </button>
            </div>
            <div className="text-center space-y-1">
               <h2 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter leading-none">{monthData.mes} 2026</h2>
               <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-[0.3em]">{SCHOOL_CALENDAR_2026.unidade_escolar}</p>
            </div>
            <button
               onClick={() => setCurrentIdx(prev => Math.min(SCHOOL_CALENDAR_2026.meses.length - 1, prev + 1))}
               disabled={currentIdx === SCHOOL_CALENDAR_2026.meses.length - 1}
               className="p-4 bg-gray-50 text-gray-400 hover:text-indigo-600 disabled:opacity-30 rounded-2xl transition-all shadow-sm border border-gray-100 hover:bg-white no-print"
            >
               <ChevronRight size={28} />
            </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* COLUNA ESQUERDA: EVENTOS (LARGURA 5) */}
            <div className="lg:col-span-5 space-y-6">
               <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                     <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tight flex items-center gap-3">
                        <CalendarIcon size={24} className="text-indigo-600" /> Datas e Eventos
                     </h3>
                     <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase border border-indigo-100">Oficial SEDUC</span>
                  </div>

                  <div className="space-y-4">
                     {(() => {
                        // Merge static and dynamic events for the current month
                        const currentMonthIdx = currentIdx; // 0-based
                        const year = 2026;

                        const staticEvents = monthData.eventos.map(e => {
                           return {
                              ...e,
                              dateObj: new Date(year, currentMonthIdx, e.dia),
                              source: 'STATIC'
                           };
                        });

                        const monthDynamicEvents = dynamicEventsList.filter(e => {
                           return e.date.getMonth() === currentMonthIdx && e.date.getFullYear() === year;
                        }).map(e => ({
                           dia: e.date.getDate(),
                           tipo: e.tipo,
                           categoria: e.categoria,
                           descricao: e.descricao,
                           dateObj: e.date,
                           source: 'DYNAMIC'
                        }));

                        const allEvents = [...staticEvents, ...monthDynamicEvents].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

                        if (allEvents.length === 0) {
                           return (
                              <p className="text-center py-20 text-gray-400 font-black uppercase text-xs tracking-widest">Nenhum evento registrado</p>
                           );
                        }

                        return allEvents.map((evt, idx) => (
                           <div key={`${evt.source}-${idx}`} className="flex gap-6 items-center group p-4 rounded-2xl hover:bg-indigo-50/50 transition-all border border-transparent hover:border-indigo-100">
                              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 shadow-sm border ${getEventCategoryColor(evt.categoria || '')}`}>
                                 <span className="text-lg leading-none">{evt.dia}</span>
                                 <span className="text-[8px] uppercase">{monthData.mes.substring(0, 3)}</span>
                              </div>
                              <div className="flex-1">
                                 <p className="text-sm font-black text-gray-900 uppercase tracking-tight leading-snug">{evt.tipo === 'EVENTO' ? evt.descricao : evt.tipo}</p>
                                 <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest">
                                    {evt.categoria || 'LETIVO'}
                                    {evt.source === 'DYNAMIC' && evt.descricao && evt.tipo !== 'EVENTO' ? ` • ${evt.descricao}` : ''}
                                 </p>
                              </div>
                           </div>
                        ));
                     })()}
                  </div>
               </div>

               {/* ORIENTATIVO MEDIAÇÃO (SE HOUVER) */}
               {monthData.orientativo && (
                  <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden animate-in slide-in-from-left duration-500">
                     <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Flag size={120} /></div>
                     <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30">
                              <ShieldCheck size={20} className="text-white" />
                           </div>
                           <h3 className="text-sm font-black uppercase tracking-widest text-white/90">Núcleo de Mediação</h3>
                        </div>
                        <p className="text-lg font-black leading-tight uppercase">{monthData.orientativo}</p>
                        <button className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/20">Ver Diretrizes 2026</button>
                     </div>
                  </div>
               )}
            </div>

            {/* COLUNA DIREITA: ACOMPANHAMENTO (LARGURA 7) */}
            <div className="lg:col-span-7 space-y-6">
               <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-10">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                     <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tight flex items-center gap-3">
                        <History size={24} className="text-indigo-600" /> Registro de Execução
                     </h3>
                     <div className="flex gap-2">
                        <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl border border-gray-100"><Info size={20} /></div>
                     </div>
                  </div>

                  {loading ? (
                     <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Campanhas Realizadas</label>
                           <textarea
                              value={localTracker[monthData.mes]?.campanha_realizada || ''}
                              onChange={e => updateField('campanha_realizada', e.target.value)}
                              placeholder="Quais ações foram concluídas neste mês?"
                              className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl text-sm font-medium h-32 text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all custom-scrollbar resize-none"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Planejamento Próximo Mês</label>
                           <textarea
                              value={localTracker[monthData.mes]?.campanha_a_realizar || ''}
                              onChange={e => updateField('campanha_a_realizar', e.target.value)}
                              placeholder="O que está previsto para o futuro?"
                              className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl text-sm font-medium h-32 text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all custom-scrollbar resize-none"
                           />
                        </div>
                     </div>
                  )}

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observações da Gestão</label>
                     <textarea
                        value={localTracker[monthData.mes]?.observacoes || ''}
                        onChange={e => updateField('observacoes', e.target.value)}
                        placeholder="Relate ocorrências fora do calendário, sucessos ou dificuldades..."
                        className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl text-sm font-medium h-24 text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all custom-scrollbar resize-none"
                     />
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 no-print">
                     <input 
                        type="file" 
                        ref={photoInputRef} 
                        onChange={e => handleFileUpload(e, 'photos')} 
                        accept="image/*" 
                        className="hidden" 
                     />
                     <input 
                        type="file" 
                        ref={reportInputRef} 
                        onChange={e => handleFileUpload(e, 'reports')} 
                        accept=".pdf,.doc,.docx,.xls,.xlsx" 
                        className="hidden" 
                     />

                     <button 
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploading === 'photos'}
                        className="flex-1 py-4 bg-gray-50 text-gray-600 border border-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 hover:text-indigo-600 transition-all flex items-center justify-center gap-3 relative"
                     >
                        {uploading === 'photos' ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />} 
                        Anexar Fotos
                        {localTracker[monthData.mes]?.photos?.length > 0 && (
                           <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] px-2 py-1 rounded-full">{localTracker[monthData.mes].photos.length}</span>
                        )}
                     </button>

                     <button 
                        onClick={() => reportInputRef.current?.click()}
                        disabled={uploading === 'reports'}
                        className="flex-1 py-4 bg-gray-50 text-gray-600 border border-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 hover:text-indigo-600 transition-all flex items-center justify-center gap-3 relative"
                     >
                        {uploading === 'reports' ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />} 
                        Anexar Documentos
                        {localTracker[monthData.mes]?.reports?.length > 0 && (
                           <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] px-2 py-1 rounded-full">{localTracker[monthData.mes].reports.length}</span>
                        )}
                     </button>

                     <button
                        onClick={handleSave}
                        disabled={saving || !!uploading}
                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                     >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar Registro
                     </button>
                  </div>

                  {/* GALERIA DE FOTOS E ANEXOS SALVOS */}
                  {(localTracker[monthData.mes]?.photos?.length > 0 || localTracker[monthData.mes]?.reports?.length > 0) && (
                     <div className="space-y-6 pt-6 border-t border-gray-50">
                        {localTracker[monthData.mes]?.photos?.length > 0 && (
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Galeria do Mês</label>
                              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                                 {localTracker[monthData.mes].photos.map((url: string, i: number) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                       <img src={url} alt={`Foto ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                       <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <Camera size={16} className="text-white" />
                                       </div>
                                    </a>
                                 ))}
                              </div>
                           </div>
                        )}

                        {localTracker[monthData.mes]?.reports?.length > 0 && (
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Documentos e Relatórios</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                 {localTracker[monthData.mes].reports.map((url: string, i: number) => {
                                    const fileName = url.split('/').pop()?.split('_').slice(2).join('_') || `Relatorio_${i}`;
                                    return (
                                       <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all group">
                                          <div className="p-2 bg-white text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                             <FileText size={16} />
                                          </div>
                                          <span className="text-[10px] font-bold text-gray-600 truncate flex-1">{fileName}</span>
                                       </a>
                                    );
                                 })}
                              </div>
                           </div>
                        )}
                     </div>
                  )}
               </div>

               <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-8 rounded-[3rem] text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={80} /></div>
                  <div className="flex items-center gap-6 relative z-10">
                     <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                        <CalendarDays size={32} className="text-white" />
                     </div>
                     <div>
                        <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Status Sincronismo</p>
                        <h4 className="text-sm font-black uppercase text-white">Calendário v2026.4 Ativo</h4>
                        <p className="text-white/60 text-[10px] font-medium leading-relaxed mt-1">Este calendário é compartilhado entre Secretaria, Professores e Equipe Psicossocial.</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* TEMPLATE DE IMPRESSÃO OFICIAL (VISÍVEL APENAS NA IMPRESSÃO) */}
         <div className="hidden print:block bg-white text-black p-12 min-h-screen font-serif">
            {/* CABEÇALHO OFICIAL */}
            <div className="flex items-start justify-between border-b-2 border-black pb-8 mb-10">
               <div className="flex gap-6 items-center">
                  <div className="w-20 h-20 border-2 border-black flex items-center justify-center p-2">
                     <span className="text-[8px] font-bold text-center leading-tight">BRASÃO DO ESTADO DE MATO GROSSO</span>
                  </div>
                  <div className="space-y-0.5">
                     <h3 className="text-sm font-black uppercase">Governo do Estado de Mato Grosso</h3>
                     <h4 className="text-xs font-bold uppercase">Secretaria de Estado de Educação</h4>
                     <p className="text-[10px] uppercase">{SCHOOL_CALENDAR_2026.unidade_escolar}</p>
                     <p className="text-[10px] uppercase font-bold">{SCHOOL_CALENDAR_2026.municipio}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest">Relatório Mensal</p>
                  <p className="text-lg font-black">{monthData.mes} / 2026</p>
               </div>
            </div>

            {/* SEÇÃO I: EVENTOS DO CALENDÁRIO */}
            <div className="mb-8">
               <h5 className="text-[10px] font-black bg-gray-100 p-2 uppercase tracking-widest border-l-4 border-black mb-4">I. Eventos e Atividades do Calendário Escolar</h5>
               <div className="grid grid-cols-2 gap-4">
                  {monthData.eventos.map((ev, i) => (
                     <div key={i} className="flex gap-3 text-[10px] items-baseline border-b border-gray-100 pb-1">
                        <span className="font-black min-w-[30px]">Dia {ev.dia}:</span>
                        <span className="text-gray-700">{ev.tipo}</span>
                     </div>
                  ))}
               </div>
               {monthData.orientativo && (
                  <div className="mt-4 p-3 border border-dotted border-gray-300">
                     <p className="text-[10px] font-black uppercase tracking-tight text-gray-500 mb-1">Tema Orientativo:</p>
                     <p className="text-[11px] font-bold italic">"{monthData.orientativo}"</p>
                  </div>
               )}
            </div>

            {/* SEÇÃO II: MONITORAMENTO DA GESTÃO */}
            <div className="space-y-6 mb-10">
               <h5 className="text-[10px] font-black bg-gray-100 p-2 uppercase tracking-widest border-l-4 border-black mb-4">II. Monitoramento e Acompanhamento Pedagógico</h5>
               
               <div className="space-y-2">
                  <h6 className="text-[9px] font-black uppercase text-gray-500">Campanhas e Ações Realizadas:</h6>
                  <div className="p-4 border border-gray-200 rounded min-h-[80px] text-xs leading-relaxed whitespace-pre-wrap">
                     {localTracker[monthData.mes]?.campanha_realizada || "Nenhuma ação registrada para este período."}
                  </div>
               </div>

               <div className="space-y-2">
                  <h6 className="text-[9px] font-black uppercase text-gray-500">Planejamento para o Próximo Período:</h6>
                  <div className="p-4 border border-gray-200 rounded min-h-[60px] text-xs leading-relaxed whitespace-pre-wrap">
                     {localTracker[monthData.mes]?.campanha_a_realizar || "Sem planejamento registrado."}
                  </div>
               </div>

               <div className="space-y-2">
                  <h6 className="text-[9px] font-black uppercase text-gray-500">Observações de Gestão:</h6>
                  <div className="p-4 border border-gray-200 rounded min-h-[60px] text-xs leading-relaxed whitespace-pre-wrap">
                     {localTracker[monthData.mes]?.observacoes || "Nenhuma observação relevante."}
                  </div>
               </div>
            </div>

            {/* SEÇÃO III: EVIDÊNCIAS FOTOGRÁFICAS */}
            {localTracker[monthData.mes]?.photos?.length > 0 && (
               <div className="mb-10 break-inside-avoid">
                  <h5 className="text-[10px] font-black bg-gray-100 p-2 uppercase tracking-widest border-l-4 border-black mb-4">III. Registro de Evidências (Fotos)</h5>
                  <div className="grid grid-cols-2 gap-4">
                     {localTracker[monthData.mes].photos.slice(0, 4).map((url: string, i: number) => (
                        <div key={i} className="border border-gray-100 p-1 bg-white">
                           <img src={url} alt="Evidência" className="w-full h-40 object-cover" />
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* SEÇÃO IV: ASSINATURAS */}
            <div className="mt-20 grid grid-cols-2 gap-12 text-center">
               <div className="space-y-2">
                  <div className="border-t border-black pt-2">
                     <p className="text-[10px] font-bold uppercase">Coordenação Pedagógica</p>
                     <p className="text-[8px] text-gray-500">Responsável pelo Preenchimento</p>
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="border-t border-black pt-2">
                     <p className="text-[10px] font-bold uppercase">Direção Escolar</p>
                     <p className="text-[8px] text-gray-500">Visto da Unidade Escolar</p>
                  </div>
               </div>
            </div>
         </div>

         {/* ESTILO PARA IMPRESSÃO */}
         <style>{`
            @media print {
               @page { size: A4; margin: 0; }
               body * { visibility: hidden; }
               .print\\:block, .print\\:block * { visibility: visible; }
               .print\\:block { 
                  position: absolute; 
                  left: 0; 
                  top: 0; 
                  width: 100%; 
                  display: block !important;
                  background: white !important;
                  color: black !important;
               }
               .no-print { display: none !important; }
               #sidebar, header, nav, button, input, textarea { display: none !important; }
            }
         `}</style>
      </div>
   );
};

export default UnifiedSchoolCalendar;
