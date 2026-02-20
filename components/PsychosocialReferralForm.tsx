
import React, { useState, useRef } from 'react';
import {
   X,
   Save,
   Printer,
   ArrowLeft,
   FileText,
   User,
   GraduationCap,
   CheckSquare,
   Square,
   ShieldCheck,
   MessageSquare,
   Brain,
   Smile,
   Activity,
   Loader2,
   AlertTriangle,
   ClipboardList
} from 'lucide-react';
import { PsychosocialReferral } from '../types';
import { useStudents } from '../hooks/useStudents';
import { Search, Plus } from 'lucide-react';

interface PsychosocialReferralFormProps {
   onCancel: () => void;
   onSave: (referral: PsychosocialReferral) => void;
   initialData?: PsychosocialReferral;
}

const PsychosocialReferralForm: React.FC<PsychosocialReferralFormProps> = ({ onCancel, onSave, initialData }) => {
   const [isGenerating, setIsGenerating] = useState(false);
   const printRef = useRef<HTMLDivElement>(null);

   const [formData, setFormData] = useState<PsychosocialReferral>(initialData || {
      id: `ref-${Date.now()}`,
      schoolUnit: 'E.E. ANDRÉ ANTÔNIO MAGGI',
      studentName: '',
      studentAge: '',
      className: '',
      teacherName: '',
      previousStrategies: '',
      attendanceFrequency: '0',
      adoptedProcedures: [],
      observedAspects: {
         learning: [],
         behavioral: [],
         emotional: [],
      },
      report: '',
      status: 'PENDENTE',
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
   });

   const ASPECTS = {
      learning: [
         "Dificuldade de leitura",
         "Dificuldade em decodificar palavras e números",
         "Dificuldade em compreender textos",
         "Dificuldade de escrita"
      ],
      behavioral: [
         "Dificuldade em manter o foco",
         "Esquecimento frequente de instruções ou tarefas",
         "Dificuldade em se manter sentado durante a aula",
         "Dificuldade em esperar a vez",
         "Mudança brusca de comportamento"
      ],
      emotional: [
         "Preocupação excessiva com desempenho escolar",
         "Medo de fracassar ou decepcionar os outros",
         "Baixa autoestima",
         "Sentimentos de inadequação",
         "Tristeza frequente"
      ]
   };

   const ADOPTED_PROCEDURES = [
      "Contato Telefônico com os pais",
      "Anotação em Diário de Classe",
      "Visita Domiciliar realizada",
      "Reunião com a Coordenação",
      "Advertência Verbal",
      "Encaminhamento para Reforço escolar"
   ];

   const toggleAspect = (category: keyof typeof ASPECTS, aspect: string) => {
      setFormData(prev => {
         const current = prev.observedAspects[category];
         const updated = current.includes(aspect)
            ? current.filter(a => a !== aspect)
            : [...current, aspect];
         return {
            ...prev,
            observedAspects: { ...prev.observedAspects, [category]: updated }
         };
      });
   };

   const toggleProcedure = (proc: string) => {
      setFormData(prev => {
         const current = prev.adoptedProcedures || [];
         const updated = current.includes(proc)
            ? current.filter(p => p !== proc)
            : [...current, proc];
         return { ...prev, adoptedProcedures: updated };
      });
   };

   const handlePrint = async () => {
      setIsGenerating(true);
      setTimeout(async () => {
         const element = printRef.current;
         if (!element) return setIsGenerating(false);

         try {
            // @ts-ignore
            await window.html2pdf().set({
               margin: 10,
               filename: `Encaminhamento_Psicossocial_${formData.studentName}.pdf`,
               image: { type: 'jpeg', quality: 0.98 },
               html2canvas: { scale: 2 },
               jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(element).save();
         } catch (err) {
            console.error(err);
         } finally {
            setIsGenerating(false);
         }
      }, 100);
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
   };

   /*
    * INTEGRAÇÃO COM CADASTRO DE ALUNOS
    */

   const [searchStudent, setSearchStudent] = useState('');
   const [showDropdown, setShowDropdown] = useState(false);
   const { students } = useStudents();

   const filteredStudents = React.useMemo(() => {
      if (!searchStudent || searchStudent.length < 2) return [];
      return students.filter(s => s.name.toLowerCase().includes(searchStudent.toLowerCase())).slice(0, 5);
   }, [searchStudent, students]);

   const selectStudent = (student: any) => {
      // Calcular idade aproximada se houver data de nascimento
      let age = '';
      if (student.birth_date) {
         const birth = new Date(student.birth_date);
         const today = new Date();
         let ageNum = today.getFullYear() - birth.getFullYear();
         const m = today.getMonth() - birth.getMonth();
         if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            ageNum--;
         }
         age = ageNum.toString();
      }

      setFormData({
         ...formData,
         studentName: student.name,
         studentAge: age || formData.studentAge, // Mantém manual se não calcular
         className: student.class,
         schoolUnit: 'E.E. ANDRÉ ANTÔNIO MAGGI' // Fixo por enquanto
      });
      setSearchStudent('');
      setShowDropdown(false);
   };


   return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

         {/* HEADER EDITOR */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 no-print">
            <div className="flex items-center gap-6">
               <button onClick={onCancel} className="p-3 bg-gray-50 text-gray-400 hover:text-rose-600 rounded-2xl transition-all">
                  <ArrowLeft size={24} />
               </button>
               <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Ficha de Encaminhamento Psicossocial</h3>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Instrumento Oficial de Apoio Multidisciplinar</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <button
                  onClick={handlePrint}
                  disabled={isGenerating}
                  className="px-6 py-4 bg-gray-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2"
               >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                  Gerar PDF Oficial
               </button>
               <button
                  onClick={handleSubmit}
                  className="px-8 py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center gap-2"
               >
                  <Save size={16} /> Efetivar Registro
               </button>
            </div>
         </div>

         {/* FORMULÁRIO VISÍVEL */}
         <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10 no-print">

            {/* Seção 1: Dados Iniciais */}
            <div className="space-y-6">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-gray-50 pb-2">
                  <User size={14} className="text-rose-600" /> 1. Identificação do Estudante
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-2 space-y-1.5 relative">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Estudante (Busca)</label>
                     <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input
                           type="text"
                           value={formData.studentName || searchStudent}
                           onChange={e => {
                              setFormData({ ...formData, studentName: e.target.value.toUpperCase() });
                              setSearchStudent(e.target.value);
                              setShowDropdown(true);
                           }}
                           onFocus={() => setShowDropdown(true)}
                           placeholder="Digite o nome..."
                           className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase"
                        />
                        {showDropdown && filteredStudents.length > 0 && (
                           <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                              {filteredStudents.map(s => (
                                 <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => selectStudent(s)}
                                    className="w-full text-left px-6 py-3 hover:bg-rose-50 transition-colors flex justify-between items-center group"
                                 >
                                    <div>
                                       <p className="text-xs font-black text-gray-800 uppercase">{s.name}</p>
                                       <p className="text-[10px] text-gray-400 font-bold uppercase group-hover:text-rose-500">{s.class}</p>
                                    </div>
                                    <Plus size={16} className="text-gray-300 group-hover:text-rose-500" />
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-red-600 flex items-center gap-1"><AlertTriangle size={12} /> Infrequência (%)</label>
                     <input required type="number" min="0" max="100" value={formData.attendanceFrequency} onChange={e => setFormData({ ...formData, attendanceFrequency: e.target.value })} className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl font-black text-lg text-red-700 outline-none focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ano / Turma</label>
                     <input required type="text" value={formData.className} onChange={e => setFormData({ ...formData, className: e.target.value.toUpperCase() })} placeholder="Ex: 9º ANO A" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase" />
                  </div>
                  <div className="lg:col-span-2 space-y-1.5">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professor Responsável</label>
                     <input required type="text" value={formData.teacherName} onChange={e => setFormData({ ...formData, teacherName: e.target.value.toUpperCase() })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase" />
                  </div>
                  <div className="lg:col-span-2 space-y-1.5">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unidade Escolar</label>
                     <input disabled type="text" value={formData.schoolUnit} className="w-full p-4 bg-gray-100 border border-gray-100 rounded-2xl font-black text-xs text-gray-500 outline-none" />
                  </div>
               </div>
            </div>

            {/* Seção Nova: Procedimentos Adotados */}
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-gray-50 pb-2">
                  <ClipboardList size={14} className="text-rose-600" /> 2. Procedimentos Adotados (Busca Ativa)
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ADOPTED_PROCEDURES.map(proc => (
                     <button
                        key={proc}
                        type="button"
                        onClick={() => toggleProcedure(proc)}
                        className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 text-left ${formData.adoptedProcedures?.includes(proc)
                           ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                           : 'bg-gray-50 border-gray-100 text-gray-400'
                           }`}
                     >
                        {formData.adoptedProcedures?.includes(proc) ? <CheckSquare size={18} /> : <Square size={18} />}
                        <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{proc}</span>
                     </button>
                  ))}
               </div>
            </div>

            {/* Seção 2: Estratégias Realizadas */}
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-gray-50 pb-2">
                  <Activity size={14} className="text-rose-600" /> 3. Estratégias Pedagógicas Realizadas
               </h4>
               <textarea
                  value={formData.previousStrategies}
                  onChange={e => setFormData({ ...formData, previousStrategies: e.target.value })}
                  placeholder="Descreva adaptações curriculares ou atendimentos pedagógicos prévios..."
                  className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium h-32 resize-none outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/5 transition-all"
               />
            </div>

            {/* Seção 3: Aspectos Observados */}
            <div className="space-y-6">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-gray-50 pb-2">
                  <CheckSquare size={14} className="text-rose-600" /> 4. Aspectos Observados em Sala
               </h4>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Aprendizagem */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 text-rose-600">
                        <Brain size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Aprendizagem</span>
                     </div>
                     <div className="space-y-2">
                        {ASPECTS.learning.map(aspect => (
                           <button
                              key={aspect}
                              type="button"
                              onClick={() => toggleAspect('learning', aspect)}
                              className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${formData.observedAspects.learning.includes(aspect)
                                 ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                                 : 'bg-white border-gray-100 text-gray-400 hover:border-rose-200'
                                 }`}
                           >
                              <div className="mt-0.5">{formData.observedAspects.learning.includes(aspect) ? <CheckSquare size={14} /> : <Square size={14} />}</div>
                              <span className="text-[10px] font-bold leading-tight">{aspect}</span>
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Comportamentais */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 text-rose-600">
                        <Activity size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Comportamentais</span>
                     </div>
                     <div className="space-y-2">
                        {ASPECTS.behavioral.map(aspect => (
                           <button
                              key={aspect}
                              type="button"
                              onClick={() => toggleAspect('behavioral', aspect)}
                              className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${formData.observedAspects.behavioral.includes(aspect)
                                 ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                                 : 'bg-white border-gray-100 text-gray-400 hover:border-rose-200'
                                 }`}
                           >
                              <div className="mt-0.5">{formData.observedAspects.behavioral.includes(aspect) ? <CheckSquare size={14} /> : <Square size={14} />}</div>
                              <span className="text-[10px] font-bold leading-tight">{aspect}</span>
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Emocionais */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 text-rose-600">
                        <Smile size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Emocionais</span>
                     </div>
                     <div className="space-y-2">
                        {ASPECTS.emotional.map(aspect => (
                           <button
                              key={aspect}
                              type="button"
                              onClick={() => toggleAspect('emotional', aspect)}
                              className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${formData.observedAspects.emotional.includes(aspect)
                                 ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                                 : 'bg-white border-gray-100 text-gray-400 hover:border-rose-200'
                                 }`}
                           >
                              <div className="mt-0.5">{formData.observedAspects.emotional.includes(aspect) ? <CheckSquare size={14} /> : <Square size={14} />}</div>
                              <span className="text-[10px] font-bold leading-tight">{aspect}</span>
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Seção 4: Relato Descritivo */}
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-gray-50 pb-2">
                  <MessageSquare size={14} className="text-rose-600" /> 5. Relato Descritivo Adicional
               </h4>
               <textarea
                  value={formData.report}
                  onChange={e => setFormData({ ...formData, report: e.target.value })}
                  placeholder="Espaço livre para observações do professor ou equipe gestora..."
                  className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium h-40 resize-none outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all"
               />
            </div>
         </form>

         {/* TEMPLATE OCULTO PARA PDF */}
         <div className="hidden">
            <div ref={printRef} className="p-16 space-y-12 text-gray-900 font-sans border-[1px] border-gray-200 bg-white min-h-[297mm]">
               <div className="text-center border-b-2 border-black pb-8 space-y-2">
                  <h1 className="text-2xl font-black uppercase">Ficha de Encaminhamento Psicossocial</h1>
                  <p className="text-sm font-bold uppercase">{formData.schoolUnit}</p>
                  <p className="text-[10px] text-gray-500">Estado de Mato Grosso - Secretaria de Estado de Educação</p>
               </div>

               <div className="grid grid-cols-2 gap-8 text-xs">
                  <div className="p-4 border-2 border-black rounded-xl space-y-2">
                     <h4 className="font-black uppercase tracking-widest border-b border-black/10 pb-1">Identificação do Aluno</h4>
                     <p><strong>NOME:</strong> {formData.studentName}</p>
                     <p><strong>IDADE:</strong> {formData.studentAge} ANOS</p>
                     <p><strong>TURMA:</strong> {formData.className}</p>
                     <p><strong>INFREQUÊNCIA REGISTRADA:</strong> <span className="text-red-600 font-black">{formData.attendanceFrequency}%</span></p>
                  </div>
                  <div className="p-4 border-2 border-black rounded-xl space-y-2">
                     <h4 className="font-black uppercase tracking-widest border-b border-black/10 pb-1">Dados de Emissão</h4>
                     <p><strong>PROFESSOR:</strong> {formData.teacherName}</p>
                     <p><strong>DATA:</strong> {new Date(formData.date).toLocaleDateString('pt-BR')}</p>
                     <p><strong>STATUS:</strong> {formData.status}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 w-fit">Procedimentos Adotados pela Escola</h4>
                  <div className="grid grid-cols-2 gap-x-10 gap-y-1 text-[10px]">
                     {ADOPTED_PROCEDURES.map(proc => (
                        <div key={proc} className="flex items-center gap-2">
                           <div className="w-3 h-3 border border-black flex items-center justify-center font-black">
                              {formData.adoptedProcedures?.includes(proc) ? 'X' : ''}
                           </div>
                           <span className="uppercase">{proc}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 w-fit">Estratégias Prévias Realizadas</h4>
                  <p className="text-xs leading-relaxed border-2 border-black p-4 rounded-xl italic">
                     {formData.previousStrategies || "Nenhuma estratégia relatada."}
                  </p>
               </div>

               <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 w-fit">Aspectos Observados em Sala</h4>

                  <div className="grid grid-cols-1 gap-6 text-[10px]">
                     {Object.entries(ASPECTS).map(([key, list]) => (
                        <div key={key} className="space-y-2">
                           <p className="font-black uppercase border-b border-black/10">{key === 'learning' ? 'Aprendizagem' : key === 'behavioral' ? 'Comportamental' : 'Emocional'}</p>
                           <div className="grid grid-cols-2 gap-x-10 gap-y-1">
                              {list.map(item => (
                                 <div key={item} className="flex items-center gap-2">
                                    <div className="w-3 h-3 border border-black flex items-center justify-center font-black">
                                       {formData.observedAspects[key as keyof typeof ASPECTS].includes(item) ? 'X' : ''}
                                    </div>
                                    <span>{item}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 w-fit">Relato Descritivo Adicional</h4>
                  <p className="text-xs leading-relaxed border-2 border-black p-4 rounded-xl min-h-[100px]">
                     {formData.report || "Sem observações adicionais."}
                  </p>
               </div>

               <div className="pt-20 grid grid-cols-2 gap-20 text-center">
                  <div className="border-t-2 border-black pt-4">
                     <p className="text-xs font-black uppercase">{formData.teacherName}</p>
                     <p className="text-[9px] uppercase text-gray-500 font-bold">Professor(a) Solicitante</p>
                  </div>
                  <div className="border-t-2 border-black pt-4">
                     <p className="text-xs font-black uppercase">Equipe Psicossocial</p>
                     <p className="text-[9px] uppercase text-gray-500 font-bold">Ciente e Recebido em ____/____/____</p>
                  </div>
               </div>

               <div className="pt-10 flex items-center justify-center gap-2 opacity-40">
                  <ShieldCheck size={16} />
                  <p className="text-[8px] font-black uppercase tracking-[0.3em]">Documento Autenticado pelo Portal Gestão André Maggi</p>
               </div>
            </div>
         </div>

      </div>
   );
};

export default PsychosocialReferralForm;
