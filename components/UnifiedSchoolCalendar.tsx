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
   Printer,
   Save,
   CheckCircle2,
   Trash2,
   FileText,
   History,
   Clock
} from 'lucide-react';
import { useToast } from './Toast';
import { SCHOOL_CALENDAR_2026 } from '../constants/schoolCalendar2026';
import { supabase } from '../supabaseClient';

const UnifiedSchoolCalendar: React.FC = () => {
   const [currentIdx, setCurrentIdx] = useState(() => new Date().getMonth());
   const { addToast } = useToast();
   const [monthlyLogs, setMonthlyLogs] = useState<any[]>([]);
   const [loadingLogs, setLoadingLogs] = useState(false);
   const [newLog, setNewLog] = useState({
      content: '',
      category: 'REALIZADO' as 'REALIZADO' | 'PLANEJADO' | 'OBSERVACAO',
      photos: [] as string[],
      reports: [] as string[]
   });
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
      setLoadingLogs(true);
      try {
         const dateStr = `2026-${String(currentIdx + 1).padStart(2, '0')}-01`;
         
         const { data, error } = await supabase
            .from('calendar_tracking')
            .select('*')
            .eq('date', dateStr)
            .order('created_at', { ascending: false });

         if (error) throw error;
         
         setMonthlyLogs(data || []);
      } catch (e) {
         console.error("Erro ao carregar monitoramento:", e);
      } finally {
         setLoadingLogs(false);
      }
   };

   const updateField = (field: string, value: any) => {
      // Not used anymore in timeline mode, but kept as stub
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

         setNewLog(prev => ({
            ...prev,
            [type]: [...prev[type], publicUrl]
         }));
         
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
      if (!newLog.content.trim()) {
         addToast("Por favor, descreva a ação realizada.", "warning");
         return;
      }

      setSaving(true);
      const dateStr = `2026-${String(currentIdx + 1).padStart(2, '0')}-01`;

      try {
         const { error } = await supabase
            .from('calendar_tracking')
            .insert([{
               event_type: 'MONTHLY_ACTION',
               date: dateStr,
               description: JSON.stringify({
                  category: newLog.category,
                  content: newLog.content,
                  photos: newLog.photos,
                  reports: newLog.reports
               }),
               created_by: 'COORDENAÇÃO'
            }]);

         if (error) throw error;

         addToast("Registro salvo com sucesso!", "success");
         setNewLog({ content: '', category: 'REALIZADO', photos: [], reports: [] });
         fetchTracker();
      } catch (e) {
         console.error(e);
         addToast("Erro ao salvar registro.", "error");
      } finally {
         setSaving(false);
      }
   };

   const handleDeleteLog = async (id: string) => {
      if (!confirm("Tem certeza que deseja excluir este registro?")) return;

      try {
         const { error } = await supabase
            .from('calendar_tracking')
            .delete()
            .eq('id', id);

         if (error) throw error;
         addToast("Registro excluído.", "success");
         fetchTracker();
      } catch (e) {
         addToast("Erro ao excluir.", "error");
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
                     <>
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-10 -mt-10 opacity-50"></div>
                        
                        <div className="relative">
                           <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tighter">Novo Registro</h3>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Monitoramento e Gestão Mensal</p>
                        </div>

                        <div className="space-y-6 relative">
                           <div className="grid grid-cols-3 gap-2">
                              {(['REALIZADO', 'PLANEJADO', 'OBSERVACAO'] as const).map(cat => (
                                 <button
                                    key={cat}
                                    onClick={() => setNewLog(prev => ({ ...prev, category: cat }))}
                                    className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${
                                       newLog.category === cat 
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                          : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200'
                                    }`}
                                 >
                                    {cat === 'REALIZADO' ? 'Ação Feita' : cat === 'PLANEJADO' ? 'Planejado' : 'Obs.'}
                                 </button>
                              ))}
                           </div>

                           <div className="relative">
                              <textarea
                                 value={newLog.content}
                                 onChange={e => setNewLog(prev => ({ ...prev, content: e.target.value }))}
                                 placeholder={`Descreva aqui o ${newLog.category.toLowerCase()}...`}
                                 className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-5 text-xs text-gray-600 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all placeholder:text-gray-300 resize-none"
                              />
                              <div className="absolute bottom-4 right-4 flex gap-2">
                                 {newLog.photos.length > 0 && <span className="bg-indigo-600 text-white text-[8px] px-2 py-1 rounded-full font-black animate-bounce">{newLog.photos.length} Fotos</span>}
                                 {newLog.reports.length > 0 && <span className="bg-emerald-600 text-white text-[8px] px-2 py-1 rounded-full font-black animate-bounce">{newLog.reports.length} Doc</span>}
                              </div>
                           </div>

                           <div className="flex gap-3">
                              <input type="file" ref={photoInputRef} onChange={e => handleFileUpload(e, 'photos')} accept="image/*" className="hidden" />
                              <input type="file" ref={reportInputRef} onChange={e => handleFileUpload(e, 'reports')} accept=".pdf,.doc,.docx" className="hidden" />
                              
                              <button 
                                 onClick={() => photoInputRef.current?.click()}
                                 className="flex-1 py-3 bg-gray-50 text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                              >
                                 <Camera size={14} /> Fotos
                              </button>
                              <button 
                                 onClick={() => reportInputRef.current?.click()}
                                 className="flex-1 py-3 bg-gray-50 text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                              >
                                 <FileText size={14} /> Doc
                              </button>
                              <button
                                 onClick={handleSave}
                                 disabled={saving || uploading !== null}
                                 className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                 {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Registrar
                              </button>
                           </div>
                        </div>

                        {/* TIMELINE DE REGISTROS MENSAL */}
                        <div className="pt-10 border-t border-gray-50 space-y-6">
                           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <History size={14} /> Histórico {monthData.mes}
                           </h4>
                           
                           {loadingLogs ? (
                              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-400" /></div>
                           ) : monthlyLogs.length === 0 ? (
                              <div className="text-center py-10">
                                 <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Nenhum registro ainda</p>
                              </div>
                           ) : (
                              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-50">
                                 {monthlyLogs.map((log) => {
                                    const data = JSON.parse(log.description);
                                    const date = new Date(log.created_at).toLocaleDateString('pt-BR');
                                    return (
                                       <div key={log.id} className="relative pl-8 group">
                                          <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 ${
                                             data.category === 'REALIZADO' ? 'bg-indigo-600' : data.category === 'PLANEJADO' ? 'bg-amber-500' : 'bg-gray-400'
                                          }`}>
                                             {data.category === 'REALIZADO' ? <CheckCircle2 size={12} className="text-white" /> : <Clock size={12} className="text-white" />}
                                          </div>
                                          <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group-hover:border-indigo-100">
                                             <div className="flex justify-between items-start mb-2">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">{date}</span>
                                                <button onClick={() => handleDeleteLog(log.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                                             </div>
                                             <p className="text-xs text-gray-700 leading-relaxed font-medium mb-3 whitespace-pre-wrap">{data.content}</p>
                                             
                                             {(data.photos?.length > 0 || data.reports?.length > 0) && (
                                                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100/50">
                                                   {data.photos?.map((url: string, i: number) => (
                                                      <a key={i} href={url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg border border-white shadow-sm overflow-hidden">
                                                         <img src={url} className="w-full h-full object-cover" alt="" />
                                                      </a>
                                                   ))}
                                                   {data.reports?.map((url: string, i: number) => (
                                                      <a key={i} href={url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">
                                                         <FileText size={12} />
                                                      </a>
                                                   ))}
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>
                           )}
                        </div>
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
                  </>
                  )}
               </div>
            </div>
         </div>

         {/* TEMPLATE DE IMPRESSÃO OFICIAL (VISÍVEL APENAS NA IMPRESSÃO) */}
         <div className="hidden print:block bg-white text-black p-12 min-h-screen font-serif">
            {/* CABEÇALHO OFICIAL */}
            <div className="flex items-start justify-between border-b-2 border-black pb-8 mb-10">
               <div className="flex gap-6 items-center">
                  <img src="/brasao_mt.png" alt="Brasão MT" className="w-20 h-20 object-contain" />
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

            {/* SEÇÃO II: MONITORAMENTO DA GESTÃO (AGRUPADO) */}
            <div className="space-y-8 mb-10">
               <h5 className="text-[10px] font-black bg-gray-100 p-2 uppercase tracking-widest border-l-4 border-black mb-6">II. Monitoramento e Acompanhamento das Ações</h5>
               
               {/* CATEGORIA: REALIZADO */}
               <div className="space-y-4">
                  <h6 className="text-[9px] font-black uppercase text-indigo-600 border-b border-indigo-50 pb-1">Ações de Gestão Realizadas:</h6>
                  <div className="space-y-3">
                     {monthlyLogs.filter(l => JSON.parse(l.description).category === 'REALIZADO').length > 0 ? (
                        monthlyLogs.filter(l => JSON.parse(l.description).category === 'REALIZADO').map((log, i) => {
                           const data = JSON.parse(log.description);
                           return (
                              <div key={i} className="pl-4 border-l-2 border-gray-100 py-1">
                                 <p className="text-[10px] font-bold text-gray-400 mb-1">Registro em {new Date(log.created_at).toLocaleDateString('pt-BR')}</p>
                                 <p className="text-xs text-gray-700 leading-relaxed font-medium">{data.content}</p>
                              </div>
                           )
                        })
                     ) : <p className="text-[10px] italic text-gray-400">Nenhum registro encontrado nesta categoria.</p>}
                  </div>
               </div>

               {/* CATEGORIA: PLANEJADO */}
               <div className="space-y-4">
                  <h6 className="text-[9px] font-black uppercase text-amber-600 border-b border-amber-50 pb-1">Planejamento para o Próximo Período:</h6>
                  <div className="space-y-3">
                     {monthlyLogs.filter(l => JSON.parse(l.description).category === 'PLANEJADO').length > 0 ? (
                        monthlyLogs.filter(l => JSON.parse(l.description).category === 'PLANEJADO').map((log, i) => {
                           const data = JSON.parse(log.description);
                           return (
                              <div key={i} className="pl-4 border-l-2 border-gray-100 py-1">
                                 <p className="text-[10px] font-bold text-gray-400 mb-1">Registro em {new Date(log.created_at).toLocaleDateString('pt-BR')}</p>
                                 <p className="text-xs text-gray-700 leading-relaxed font-medium">{data.content}</p>
                              </div>
                           )
                        })
                     ) : <p className="text-[10px] italic text-gray-400">Sem planejamento registrado.</p>}
                  </div>
               </div>

               {/* CATEGORIA: OBSERVACAO */}
               <div className="space-y-4">
                  <h6 className="text-[9px] font-black uppercase text-gray-600 border-b border-gray-50 pb-1">Observações de Frequência e Rendimento:</h6>
                  <div className="space-y-3">
                     {monthlyLogs.filter(l => JSON.parse(l.description).category === 'OBSERVACAO').length > 0 ? (
                        monthlyLogs.filter(l => JSON.parse(l.description).category === 'OBSERVACAO').map((log, i) => {
                           const data = JSON.parse(log.description);
                           return (
                              <div key={i} className="pl-4 border-l-2 border-gray-100 py-1">
                                 <p className="text-[10px] font-black text-gray-400 mb-1">Obs. registrada em {new Date(log.created_at).toLocaleDateString('pt-BR')}</p>
                                 <p className="text-xs text-gray-700 leading-relaxed font-medium italic">{data.content}</p>
                              </div>
                           )
                        })
                     ) : <p className="text-[10px] italic text-gray-400">Nenhuma observação relevante.</p>}
                  </div>
               </div>
            </div>

            {/* SEÇÃO III: EVIDÊNCIAS FOTOGRÁFICAS (AGRUPADAS) */}
            {monthlyLogs.some(l => JSON.parse(l.description).photos?.length > 0) && (
               <div className="mb-10 break-inside-avoid">
                  <h5 className="text-[10px] font-black bg-gray-100 p-2 uppercase tracking-widest border-l-4 border-black mb-6">III. Registro de Evidências Fotográficas do Monitoramento</h5>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                     {monthlyLogs.flatMap(l => JSON.parse(l.description).photos || []).map((url: string, i: number) => (
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
