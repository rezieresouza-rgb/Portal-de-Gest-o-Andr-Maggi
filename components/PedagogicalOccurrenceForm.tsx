
import React, { useState } from 'react';
import {
   X,
   Save,
   ArrowLeft,
   User,
   Clock,
   MapPin,
   MessageSquare,
   Tag,
   Plus,
   Camera,
   Upload,
   ShieldCheck,
   AlertTriangle
} from 'lucide-react';
import { PedagogicalOccurrence, OccurrenceCategory } from '../types';
import { useStudents } from '../hooks/useStudents';

interface PedagogicalOccurrenceFormProps {
   onCancel: () => void;
   onSave: (occ: PedagogicalOccurrence) => void;
   initialData?: PedagogicalOccurrence;
}

const PedagogicalOccurrenceForm: React.FC<PedagogicalOccurrenceFormProps> = ({ onCancel, onSave, initialData }) => {
   const [form, setForm] = useState<PedagogicalOccurrence>(initialData || {
      id: `occ-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      involvedStudents: '',
      className: '',
      location: '',
      report: '',
      responsible: 'COORDENADOR ANDRÉ',
      category: 'INDISCIPLINA',
      attachments: [],
      status: 'REGISTRADO',
      timestamp: Date.now()
   });

   const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      setForm({
         ...form,
         involvedStudents: student.name,
         className: student.class
      });
      setSearchStudent('');
      setShowDropdown(false);
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.involvedStudents || !form.report) return alert("Preencha os campos obrigatórios.");
      onSave(form);
   };

   const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
            const base64 = reader.result as string;
            setImagePreview(base64);
            setForm(prev => ({ ...prev, attachments: [...prev.attachments, base64] }));
         };
         reader.readAsDataURL(file);
      }
   };

   const categories: OccurrenceCategory[] = ['INDISCIPLINA', 'CONFLITO', 'ATRASO', 'VIOLÊNCIA', 'DESCUMPRIMENTO_REGRAS', 'OUTRO'];

   return (
      <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-20">
         <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-10">

            <div className="flex justify-between items-center border-b border-gray-50 pb-8">
               <div className="flex items-center gap-6">
                  <button onClick={onCancel} className="p-3 bg-gray-50 text-gray-400 hover:text-violet-600 rounded-2xl transition-all">
                     <ArrowLeft size={24} />
                  </button>
                  <div>
                     <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Registro de Ocorrência</h3>
                     <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Instrumento Formal de Acompanhamento</p>
                  </div>
               </div>
               <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl border border-violet-100">
                  <AlertTriangle size={24} />
               </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">

               {/* SEÇÃO 1: DADOS BÁSICOS */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data e Hora do Fato</label>
                        <div className="flex gap-4">
                           <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                           <input required type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="w-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white text-center" />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Local da Ocorrência</label>
                        <div className="relative">
                           <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                           <input required type="text" placeholder="EX: PÁTIO, SALA 04, REFEITÓRIO..." value={form.location} onChange={e => setForm({ ...form, location: e.target.value.toUpperCase() })} className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estudante(s) Envolvido(s)</label>
                        <div className="relative">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                           <input
                              required
                              type="text"
                              placeholder="DIGITE O NOME..."
                              value={form.involvedStudents || searchStudent}
                              onChange={e => {
                                 setForm({ ...form, involvedStudents: e.target.value.toUpperCase() });
                                 setSearchStudent(e.target.value);
                                 setShowDropdown(true);
                              }}
                              onFocus={() => setShowDropdown(true)}
                              className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white"
                           />
                           {showDropdown && filteredStudents.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                 {filteredStudents.map(s => (
                                    <button
                                       key={s.id}
                                       type="button"
                                       onClick={() => selectStudent(s)}
                                       className="w-full text-left px-6 py-3 hover:bg-violet-50 transition-colors flex justify-between items-center group"
                                    >
                                       <div>
                                          <p className="text-xs font-black text-gray-800 uppercase">{s.name}</p>
                                          <p className="text-[10px] text-gray-400 font-bold uppercase group-hover:text-violet-500">{s.class}</p>
                                       </div>
                                       <Plus size={16} className="text-gray-300 group-hover:text-violet-500" />
                                    </button>
                                 ))}
                              </div>
                           )}
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ano / Turma</label>
                        <input required type="text" placeholder="EX: 9º ANO B" value={form.className} onChange={e => setForm({ ...form, className: e.target.value.toUpperCase() })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white uppercase" />
                     </div>
                  </div>
               </div>

               {/* SEÇÃO 2: CATEGORIA E RESPONSÁVEL */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Classificação do Fato</label>
                     <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as any })} className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white">
                           {categories.map(cat => <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Servidor Responsável pelo Registro</label>
                     <input disabled type="text" value={form.responsible} className="w-full p-4 bg-gray-100 border border-gray-100 rounded-2xl font-black text-xs text-gray-500 outline-none" />
                  </div>
               </div>

               {/* SEÇÃO 3: RELATO DETALHADO */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Relato Descritivo dos Fatos</label>
                  <div className="relative">
                     <MessageSquare className="absolute left-6 top-6 text-gray-300" size={20} />
                     <textarea
                        required
                        value={form.report}
                        onChange={e => setForm({ ...form, report: e.target.value })}
                        placeholder="Descreva de forma imparcial e objetiva o ocorrido..."
                        className="w-full p-8 pl-16 bg-gray-50 border border-gray-100 rounded-[2.5rem] font-medium text-sm leading-relaxed h-48 resize-none outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/5 transition-all"
                     />
                  </div>
               </div>

               {/* SEÇÃO 4: ANEXOS / EVIDÊNCIAS */}
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Evidências e Documentos (Opcional)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div
                        onClick={() => document.getElementById('occ-upload')?.click()}
                        className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-violet-300 hover:text-violet-600 transition-all group"
                     >
                        <Camera size={32} className="text-gray-300 group-hover:scale-110 transition-transform" />
                        <p className="text-[8px] font-black uppercase mt-3 tracking-widest text-gray-400 group-hover:text-violet-600 text-center px-4">Anexar Foto ou Documento</p>
                        <input id="occ-upload" type="file" className="hidden" accept="image/*,.pdf" onChange={handlePhotoUpload} />
                     </div>
                     {form.attachments.map((at, idx) => (
                        <div key={idx} className="aspect-square bg-gray-900 rounded-3xl overflow-hidden relative group">
                           <img src={at} className="w-full h-full object-cover opacity-80" alt="Anexo" />
                           <button
                              type="button"
                              onClick={() => setForm({ ...form, attachments: form.attachments.filter((_, i) => i !== idx) })}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <X size={14} />
                           </button>
                        </div>
                     ))}
                  </div>
               </div>

               {/* SUBMIT */}
               <button type="submit" className="w-full py-6 bg-violet-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-violet-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                  <Save size={24} /> Efetivar Registro no Livro
               </button>
            </form>
         </div>
      </div>
   );
};

export default PedagogicalOccurrenceForm;
