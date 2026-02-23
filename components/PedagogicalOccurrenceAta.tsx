
import React, { useState, useRef } from 'react';
import {
   ArrowLeft,
   Sparkles,
   Printer,
   ShieldCheck,
   CheckCircle2,
   Loader2,
   X,
   MessageSquare,
   History
} from 'lucide-react';
import { PedagogicalOccurrence, OccurrenceAta } from '../types';
import { generateOccurrenceAta } from '../geminiService';

interface PedagogicalOccurrenceAtaProps {
   occurrence: PedagogicalOccurrence;
   onBack: () => void;
   onUpdateStatus: (id: string, status: PedagogicalOccurrence['status']) => void;
}

const PedagogicalOccurrenceAta: React.FC<PedagogicalOccurrenceAtaProps> = ({ occurrence, onBack, onUpdateStatus }) => {
   const [isGenerating, setIsGenerating] = useState(false);
   const [ata, setAta] = useState<Omit<OccurrenceAta, 'id' | 'occurrenceId' | 'date'> | null>(null);
   const [isExporting, setIsExporting] = useState(false);
   const printRef = useRef<HTMLDivElement>(null);

   const handleGenerate = async () => {
      setIsGenerating(true);
      try {
         const data = await generateOccurrenceAta(occurrence);
         if (data) {
            setAta(data);
         }
      } catch (e) {
         alert("Erro ao gerar ata via IA.");
      } finally {
         setIsGenerating(false);
      }
   };

   const handlePrint = async () => {
      if (!ata) return;
      setIsExporting(true);
      const element = printRef.current;
      if (!element) return setIsExporting(false);

      try {
         // @ts-ignore
         await window.html2pdf().set({
            margin: [10, 10, 10, 10],
            filename: `Ata_Ocorrencia_${occurrence.involvedStudents.replace(/\s/g, '_')}_${occurrence.date}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
         }).from(element).save();

         onUpdateStatus(occurrence.id, 'ATA_GERADA');
      } catch (err) {
         console.error(err);
      } finally {
         setIsExporting(false);
      }
   };

   return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

         {/* HEADER CONTROLE */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 no-print">
            <div className="flex items-center gap-6">
               <button onClick={onBack} className="p-3 bg-gray-50 text-gray-400 hover:text-violet-600 rounded-2xl transition-all">
                  <ArrowLeft size={24} />
               </button>
               <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Escrituração de Ocorrência</h3>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Geração de Documento Oficial via IA</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               {!ata ? (
                  <button
                     onClick={handleGenerate}
                     disabled={isGenerating}
                     className="px-8 py-4 bg-violet-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-violet-700 active:scale-95 transition-all flex items-center gap-3"
                  >
                     {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                     Gerar Ata Formal (IA)
                  </button>
               ) : (
                  <button
                     onClick={handlePrint}
                     disabled={isExporting}
                     className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-3"
                  >
                     {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                     Exportar PDF & Assinar
                  </button>
               )}
            </div>
         </div>

         {/* CONTEÚDO ORIGINAL */}
         {!ata && (
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                  <div className="p-5 bg-gray-50 rounded-3xl">
                     <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Envolvido(s)</p>
                     <p className="text-sm font-black text-gray-900 uppercase truncate">{occurrence.involvedStudents}</p>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-3xl">
                     <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Turma</p>
                     <p className="text-sm font-black text-gray-900 uppercase">{occurrence.className}</p>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-3xl">
                     <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Data/Hora</p>
                     <p className="text-sm font-black text-gray-900 uppercase">{new Date(occurrence.date).toLocaleDateString('pt-BR')} {occurrence.time}</p>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-3xl">
                     <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Categoria</p>
                     <p className="text-sm font-black text-violet-600 uppercase">{occurrence.category.replace('_', ' ')}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <MessageSquare size={14} className="text-violet-600" /> Relato Original do Registro
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium bg-gray-50 p-8 rounded-[2.5rem] italic border border-gray-100">
                     "{occurrence.report}"
                  </p>
               </div>
            </div>
         )}

         {/* RESULTADO IA (ATA FORMAL) */}
         {ata && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
               <div className="bg-violet-900 p-8 rounded-[3rem] text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Sparkles size={140} /></div>
                  <div className="relative z-10">
                     <h4 className="text-xl font-black uppercase tracking-widest mb-1 flex items-center gap-3">
                        <CheckCircle2 size={24} className="text-emerald-400" /> Ata Administrativa Gerada
                     </h4>
                     <p className="text-violet-200 text-sm font-medium opacity-80">Documento estruturado pronto para exportação e coleta de assinaturas físicas.</p>
                  </div>
                  <button onClick={() => setAta(null)} className="relative z-10 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                     <X size={20} />
                  </button>
               </div>

               <div id="printable-area" className="bg-white p-12 md:p-16 rounded-[3rem] border-2 border-violet-100 shadow-2xl space-y-12">
                  <div ref={printRef} className="space-y-12 text-gray-900 font-sans pdf-export-view">

                     {/* CABEÇALHO OFICIAL PDF */}
                     <div className="text-center border-b-2 border-black pb-8 space-y-2">
                        <h1 className="text-2xl font-black uppercase text-red-950">Ata de Ocorrência Pedagógica</h1>
                        <p className="text-[10px] font-bold uppercase text-red-900/60 tracking-widest">Registro Oficial de Fatos e Deliberações</p>
                     </div>

                     <div className="grid grid-cols-2 gap-10 text-[10px]">
                        <div className="p-4 border-2 border-black rounded-xl space-y-2">
                           <h4 className="font-black uppercase tracking-widest border-b border-black/10 pb-1">Identificação do Fato</h4>
                           <p><strong>DATA:</strong> {new Date(occurrence.date).toLocaleDateString('pt-BR')}</p>
                           <p><strong>HORÁRIO:</strong> {occurrence.time}</p>
                           <p><strong>LOCAL:</strong> {occurrence.location}</p>
                           <p><strong>TURMA:</strong> {occurrence.className}</p>
                        </div>
                        <div className="p-4 border-2 border-black rounded-xl space-y-2">
                           <h4 className="font-black uppercase tracking-widest border-b border-black/10 pb-1">Emissão do Documento</h4>
                           <p><strong>CLASSIFICAÇÃO:</strong> {occurrence.category.replace('_', ' ')}</p>
                           <p><strong>RELATOR:</strong> {occurrence.responsible}</p>
                           <p><strong>DATA EMISSÃO:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                           <p><strong>ORIGEM:</strong> ESCRITURAÇÃO DIGITAL</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 w-fit">Narrativa dos Fatos</h4>
                        <p className="text-sm leading-relaxed text-justify font-serif">
                           {ata.formalText}
                        </p>
                     </div>

                     <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 w-fit">Envolvidos</h4>
                        <p className="text-sm font-black uppercase tracking-tight">{ata.involvedParties}</p>
                     </div>

                     <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 w-fit">Resumo Executivo</h4>
                        <p className="text-sm italic font-medium border-l-4 border-black pl-6 py-2 bg-gray-50 rounded-r-xl">
                           {ata.summary}
                        </p>
                     </div>

                     <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 w-fit">Encaminhamentos e Medidas Sugeridas</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {ata.suggestedReferrals.map((ref, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 border border-black rounded-lg text-[10px] font-bold">
                                 <div className="w-5 h-5 border-2 border-black rounded flex items-center justify-center font-black">X</div>
                                 {ref}
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* CAMPOS DE ASSINATURA - ESSENCIAIS PARA O PDF */}
                     <div className="pt-24 grid grid-cols-2 gap-20 text-center">
                        <div className="space-y-2">
                           <div className="border-t-2 border-black pt-4">
                              <p className="text-xs font-black uppercase">{occurrence.responsible}</p>
                              <p className="text-[9px] uppercase text-gray-500 font-bold">Servidor Responsável pelo Relato</p>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <div className="border-t-2 border-black pt-4">
                              <p className="text-xs font-black uppercase">Direção / Coordenação</p>
                              <p className="text-[9px] uppercase text-gray-500 font-bold">Ciente e Validado em: ____/____/____</p>
                           </div>
                        </div>
                     </div>

                     <div className="pt-10 flex items-center justify-center gap-2 opacity-30">
                        <ShieldCheck size={16} />
                        <p className="text-[8px] font-black uppercase tracking-[0.4em]">Documento Autenticado via Portal Gestão Pedagógica André Maggi</p>
                     </div>
                  </div>
               </div>
            </div>
         )}

         <style>{`
        .pdf-export-view { font-family: 'Inter', sans-serif; }
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
      </div>
   );
};

export default PedagogicalOccurrenceAta;
