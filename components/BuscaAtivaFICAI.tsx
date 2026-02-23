
import React, { useState, useRef, useEffect } from 'react';
import {
   FileText,
   Printer,
   Download,
   X,
   ShieldCheck,
   Search,
   Loader2,
   CheckCircle2,
   AlertTriangle
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { INITIAL_STUDENTS } from '../constants/initialData';

const BuscaAtivaFICAI: React.FC = () => {
   const [selectedStudentId, setSelectedStudentId] = useState<string>('');
   const [isGenerating, setIsGenerating] = useState(false);
   const [studentsAtRisk, setStudentsAtRisk] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchRiskStudents();
   }, []);

   const fetchRiskStudents = async () => {
      setLoading(true);
      // Fetch attendance to find at-risk students
      const { data: attendanceData } = await supabase
         .from('class_attendance_students')
         .select('student_id, is_present');

      const stats: Record<string, { total: number, present: number }> = {};
      if (attendanceData) {
         attendanceData.forEach(r => {
            const sid = r.student_id;
            if (!stats[sid]) stats[sid] = { total: 0, present: 0 };
            stats[sid].total++;
            if (r.is_present) stats[sid].present++;
         });
      }

      const atRisk: any[] = [];
      INITIAL_STUDENTS.forEach(s => {
         const stat = stats[s.id] || { total: 0, present: 0 };
         const percent = stat.total > 0 ? (stat.present / stat.total) * 100 : 100;

         if (percent < 90) { // Limit for FICAI usually < 85% or 5 consecutive, let's show all Warning/Critical
            atRisk.push({
               id: s.id,
               name: s.name,
               class: s.class,
               absences: stat.total - stat.present,
               guardian: s.guardian || 'NÃO INFORMADO',
               phone: s.phone || 'NÃO INFORMADO'
            });
         }
      });

      setStudentsAtRisk(atRisk);
      setLoading(false);
   };

   const handlePrint = async () => {
      if (!selectedStudentId) return alert("Selecione um aluno.");
      setIsGenerating(true);

      setTimeout(async () => {
         const element = document.getElementById('ficai-document');
         if (!element) return setIsGenerating(false);

         try {
            // @ts-ignore
            if (window.html2pdf) {
               // @ts-ignore
               await window.html2pdf().set({
                  margin: 10,
                  filename: `FICAI_${selectedStudentId}.pdf`,
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2 },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
               }).from(element).save();
            } else {
               window.print();
            }
         } catch (err) {
            console.error(err);
            window.print(); // Fallback
         } finally {
            setIsGenerating(false);
         }
      }, 500);
   };

   const student = studentsAtRisk.find(s => s.id === selectedStudentId);

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">

         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1 space-y-1.5 w-full">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selecionar Aluno Crítico</label>
               {loading ? (
                  <div className="p-4 flex items-center gap-2 text-sm text-gray-400"><Loader2 className="animate-spin" size={16} /> Carregando alunos em risco...</div>
               ) : (
                  <select
                     value={selectedStudentId}
                     onChange={e => setSelectedStudentId(e.target.value)}
                     className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                  >
                     <option value="">Escolha um aluno para abrir FICAi...</option>
                     {studentsAtRisk.map(s => <option key={s.id} value={s.id}>{s.name} ({s.absences} faltas)</option>)}
                  </select>
               )}
            </div>
            <button
               onClick={handlePrint}
               disabled={!selectedStudentId || isGenerating}
               className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0 disabled:opacity-50"
            >
               {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
               Gerar e Baixar FICAi
            </button>
         </div>

         {selectedStudentId && student && (
            <div id="ficai-document" className="bg-white p-12 border border-gray-200 shadow-2xl max-w-4xl mx-auto space-y-10 font-sans text-gray-900">
               <div className="text-center border-b-2 border-orange-950 pb-8 mb-10">
                  <h1 className="text-2xl font-black uppercase text-orange-950">Formulário de Busca Ativa (FICAI)</h1>
                  <p className="text-[10px] font-bold">Base Legal: Estatuto da Criança e do Adolescente (ECA) - Art. 56, inciso II</p>
               </div>

               <div className="grid grid-cols-1 gap-6">
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-700">1. Identificação da Unidade Escolar</h4>
                     <p className="text-xs">Endereço: Avenida Borba Gato, nº 80, Colíder-MT</p>
                  </div>

                  <div className="p-4 border-2 border-black rounded-xl space-y-3">
                     <h4 className="text-[10px] font-black uppercase tracking-widest">2. Identificação do Aluno</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-[8px] font-black uppercase text-gray-400">Nome do Aluno</p><p className="text-xs font-bold uppercase">{student.name}</p></div>
                        <div><p className="text-[8px] font-black uppercase text-gray-400">Turma / Turno</p><p className="text-xs font-bold uppercase">{student.class}</p></div>
                        <div><p className="text-[8px] font-black uppercase text-gray-400">Nome do Responsável</p><p className="text-xs font-bold uppercase">{student.guardian}</p></div>
                        <div><p className="text-[8px] font-black uppercase text-gray-400">Telefone Contato</p><p className="text-xs font-bold uppercase">{student.phone}</p></div>
                     </div>
                  </div>

                  <div className="p-4 border-2 border-black rounded-xl space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest">3. Motivo da Comunicação</h4>
                     <div className="flex gap-10">
                        <div className="flex items-center gap-2">
                           <div className={`w-4 h-4 border-2 border-black flex items-center justify-center ${student.absences >= 5 ? 'bg-black text-white' : ''}`}>X</div>
                           <span className="text-[10px] font-bold uppercase">5 Faltas Consecutivas</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-4 h-4 border-2 border-black bg-black"></div>
                           <span className="text-[10px] font-bold uppercase">Infrequência Superior a 10%</span>
                        </div>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase text-gray-400">Total de faltas acumuladas no período:</p>
                        <p className="text-sm font-black">{student.absences} Faltas Registradas</p>
                     </div>
                  </div>

                  <div className="p-4 border-2 border-black rounded-xl space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest">4. Providências Adotadas pela Escola</h4>
                     <div className="space-y-2">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 border border-black flex items-center justify-center text-[8px]">X</div><span className="text-[9px] uppercase">Contato Telefônico com os pais</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 border border-black flex items-center justify-center text-[8px]">X</div><span className="text-[9px] uppercase">Anotação em Diário de Classe</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 border border-black"></div><span className="text-[9px] uppercase">Visita Domiciliar realizada</span></div>
                     </div>
                  </div>
               </div>

               <div className="pt-20 grid grid-cols-2 gap-20 text-center">
                  <div className="border-t-2 border-black pt-2">
                     <p className="text-[10px] font-black uppercase">Direção / Coordenação</p>
                  </div>
                  <div className="border-t-2 border-black pt-2">
                     <p className="text-[10px] font-black uppercase">Conselho Tutelar (Recebido em)</p>
                  </div>
               </div>

               <div className="pt-10 flex items-center justify-center gap-2 opacity-30">
                  <ShieldCheck size={16} />
                  <p className="text-[8px] font-black uppercase tracking-widest">Documento Autenticado via Portal Gestão André Maggi</p>
               </div>
            </div>
         )}

         {!selectedStudentId && !loading && (
            <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
               <AlertTriangle size={48} className="mx-auto mb-4 text-emerald-100" />
               <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Selecione um aluno para pré-visualizar a FICAi</p>
            </div>
         )}
      </div>
   );
};

export default BuscaAtivaFICAI;
