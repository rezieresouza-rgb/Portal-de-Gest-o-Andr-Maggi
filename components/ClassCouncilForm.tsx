import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  ClipboardList, 
  TrendingUp, 
  Save, 
  Printer, 
  X, 
  ChevronDown, 
  AlertCircle,
  FileText,
  UserCheck,
  Brain,
  MessageSquare,
  ArrowRight,
  PlusCircle,
  Hash
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from './Toast';
import { ClassCouncil, ClassCouncilStudentObservation, Classroom, Student } from '../types';

interface ClassCouncilFormProps {
  onCancel: () => void;
  onSave: (council: ClassCouncil) => Promise<void>;
  initialData?: ClassCouncil;
}

const ClassCouncilForm: React.FC<ClassCouncilFormProps> = ({ onCancel, onSave, initialData }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  
  const [formData, setFormData] = useState<Partial<ClassCouncil>>(initialData || {
    bimestre: '1º BIMESTRE',
    date: new Date().toISOString().split('T')[0],
    generalDiagnosis: '',
    studentObservations: [],
    decisions: '',
    attendanceTeachers: [],
    status: 'RASCUNHO'
  });

  const [selectedClassId, setSelectedClassId] = useState<string>(initialData?.classroomId || '');
  const [students, setStudents] = useState<Student[]>([]);

  // Carregar turmas
  useEffect(() => {
    const fetchClassrooms = async () => {
      const { data } = await supabase.from('classrooms').select('*').order('name');
      if (data) setClassrooms(data);
    };
    fetchClassrooms();
  }, []);

  // Carregar alunos da turma selecionada
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          students (*)
        `)
        .eq('classroom_id', selectedClassId);

      if (data) {
        const studentList = data
          .map((e: any) => e.students)
          .sort((a: any, b: any) => a.name.localeCompare(b.name, 'pt-BR'));
        
        setStudents(studentList);
        
        // Se for um novo conselho, inicializar as observações
        if (!initialData) {
          const initialObs: ClassCouncilStudentObservation[] = studentList.map(s => ({
            studentId: s.id,
            studentName: s.name,
            pedagogicalProgress: 'SATISFATORIO',
            behavioralStatus: 'BOM',
            notes: '',
            recommendations: ''
          }));
          setFormData(prev => ({ ...prev, studentObservations: initialObs }));
        }
      }
    };

    fetchStudents();
  }, [selectedClassId, initialData]);

  const handleUpdateStudentObs = (studentId: string, field: keyof ClassCouncilStudentObservation, value: any) => {
    setFormData(prev => ({
      ...prev,
      studentObservations: prev.studentObservations?.map(obs => 
        obs.studentId === studentId ? { ...obs, [field]: value } : obs
      )
    }));
  };

  const handleSave = async (isFinal: boolean) => {
    if (!selectedClassId) {
      addToast("Selecione uma turma.", "error");
      return;
    }

    setLoading(true);
    try {
      const finalData = {
        ...formData,
        classroomId: selectedClassId,
        status: isFinal ? 'FINALIZADO' : 'RASCUNHO' as 'RASCUNHO' | 'FINALIZADO',
        timestamp: Date.now()
      } as ClassCouncil;

      await onSave(finalData);
      addToast(isFinal ? "Conselho finalizado com sucesso!" : "Rascunho salvo!", "success");
    } catch (error) {
      console.error("Erro ao salvar conselho:", error);
      addToast("Erro ao salvar registro.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const element = document.getElementById('ata-conselho');
    if (!element) {
      addToast("Erro ao gerar PDF: Elemento não encontrado.", "error");
      return;
    }

    const className = classrooms.find(c => c.id === selectedClassId)?.name || 'Turma';
    const filename = `Ata_Conselho_${className.replace(/\s+/g, '_')}_${formData.bimestre?.replace(/\s+/g, '_')}.pdf`;

    const opt = {
      margin: [15, 15],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // @ts-ignore
    if (typeof html2pdf !== 'undefined') {
      // @ts-ignore
      html2pdf().set(opt).from(element).save().then(() => {
        addToast("PDF gerado com sucesso!", "success");
      });
    } else {
      // Fallback para impressão do navegador caso a lib falhe
      window.print();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20 no-print">
      
      {/* HEADER FIXO */}
      <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-xl backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-blue-500/10 text-blue-400 rounded-3xl border border-blue-500/20 shadow-inner">
            <ClipboardList size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Registro de Conselho de Classe</h3>
            <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">Sistematização de Resultados e Encaminhamentos</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={handlePrint} className="px-6 py-3 bg-white/5 text-white/60 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all flex items-center gap-2">
            <Printer size={16} /> Imprimir Ata
          </button>
          <button onClick={onCancel} className="px-6 py-3 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-2">
            <X size={16} /> Cancelar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: DADOS DA REUNIÃO */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-xl backdrop-blur-md space-y-6">
            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
              <Calendar size={14} className="text-blue-400" /> Detalhes do Conselho
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-white/30 uppercase ml-2 mb-1 block">Turma</label>
                <select 
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  disabled={!!initialData}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-white">Selecione...</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name} ({c.shift})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-white/30 uppercase ml-2 mb-1 block">Bimestre</label>
                  <select 
                    value={formData.bimestre}
                    onChange={e => setFormData({...formData, bimestre: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                  >
                    <option className="bg-slate-900 text-white">1º BIMESTRE</option>
                    <option className="bg-slate-900 text-white">2º BIMESTRE</option>
                    <option className="bg-slate-900 text-white">3º BIMESTRE</option>
                    <option className="bg-slate-900 text-white">4º BIMESTRE</option>
                    <option className="bg-slate-900 text-white">EXAME FINAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-white/30 uppercase ml-2 mb-1 block">Data</label>
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 p-8 rounded-[2.5rem] border border-blue-500/20 shadow-xl backdrop-blur-md space-y-6">
            <h4 className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp size={14} /> Diagnóstico Geral
            </h4>
            <textarea 
              value={formData.generalDiagnosis}
              onChange={e => setFormData({...formData, generalDiagnosis: e.target.value})}
              placeholder="Descreva o perfil da turma neste bimestre, avanços coletivos e desafios principais..."
              className="w-full h-48 bg-white/5 border border-white/5 rounded-3xl p-6 text-xs font-medium text-white/90 outline-none focus:ring-2 focus:ring-blue-500/30 resize-none transition-all"
            />
          </div>

          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-xl backdrop-blur-md space-y-6">
            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <UserCheck size={14} /> Encaminhamentos / Decisões
            </h4>
            <textarea 
              value={formData.decisions}
              onChange={e => setFormData({...formData, decisions: e.target.value})}
              placeholder="Ações pedagógicas decididas para o próximo período..."
              className="w-full h-40 bg-white/5 border border-white/5 rounded-3xl p-6 text-xs font-medium text-white/90 outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none transition-all"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => handleSave(false)}
                disabled={loading}
                className="flex-1 py-4 bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/5"
              >
                {loading ? 'Salvando...' : 'Salvar Rascunho'}
              </button>
              <button 
                onClick={() => handleSave(true)}
                disabled={loading}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <Save size={16} /> Finalizar
              </button>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: OBSERVADOR POR ALUNO */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 shadow-xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Users size={20} className="text-blue-400" /> Acompanhamento Individual dos Alunos
              </h4>
              <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black text-white/40 uppercase tracking-widest">
                {students.length} Alunos na Turma
              </span>
            </div>

            <div className="space-y-4 max-h-[1200px] overflow-y-auto pr-4 custom-scrollbar">
              {formData.studentObservations?.map((obs, idx) => (
                <div key={obs.studentId} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all group">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 font-black text-xs border border-white/10 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all">
                          {idx + 1}
                        </div>
                        <h5 className="text-sm font-black text-white uppercase tracking-tight">{obs.studentName}</h5>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-[8px] font-black text-white/20 uppercase ml-1 mb-1 block tracking-widest">Desempenho Pedagógico</label>
                          <div className="flex gap-1">
                            {['SATISFATORIO', 'PARCIAL', 'INSATISFATORIO'].map(level => (
                              <button 
                                key={level}
                                onClick={() => handleUpdateStudentObs(obs.studentId, 'pedagogicalProgress', level as any)}
                                className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all border ${
                                  obs.pedagogicalProgress === level 
                                    ? level === 'SATISFATORIO' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : level === 'PARCIAL' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : 'bg-white/5 text-white/20 border-white/5 hover:bg-white/10'
                                }`}
                              >
                                {level === 'SATISFATORIO' ? 'Satis.' : level === 'PARCIAL' ? 'Parcial' : 'Insat.'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-white/20 uppercase ml-1 mb-1 block tracking-widest">Comportamento</label>
                          <div className="flex gap-1">
                            {['BOM', 'REGULAR', 'CRITICO'].map(status => (
                              <button 
                                key={status}
                                onClick={() => handleUpdateStudentObs(obs.studentId, 'behavioralStatus', status as any)}
                                className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all border ${
                                  obs.behavioralStatus === status 
                                    ? status === 'BOM' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : status === 'REGULAR' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : 'bg-white/5 text-white/20 border-white/5 hover:bg-white/10'
                                }`}
                              >
                                {status === 'BOM' ? 'Bom' : status === 'REGULAR' ? 'Reg.' : 'Crítico'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 text-white/20" size={14} />
                          <input 
                            type="text"
                            value={obs.notes}
                            onChange={e => handleUpdateStudentObs(obs.studentId, 'notes', e.target.value)}
                            placeholder="Observações pedagógicas..."
                            className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-[10px] font-medium text-white/80 outline-none focus:ring-1 focus:ring-blue-500/30"
                          />
                        </div>
                        <div className="relative">
                          <ArrowRight className="absolute left-3 top-3 text-white/20" size={14} />
                          <input 
                            type="text"
                            value={obs.recommendations}
                            onChange={e => handleUpdateStudentObs(obs.studentId, 'recommendations', e.target.value)}
                            placeholder="Intervenções / Assistências..."
                            className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-[10px] font-medium text-white/80 outline-none focus:ring-1 focus:ring-emerald-500/30"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COMPONENTE DE IMPRESSÃO (Oculto na tela, mas visível para o gerador de PDF) */}
      <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', width: '210mm' }}>
        <div id="ata-conselho" className="bg-white text-black p-12 min-h-screen font-sans">
         <div className="flex justify-between items-center border-b-2 border-black pb-6 mb-8 gap-6">
            <div className="flex items-center justify-start flex-1">
               <img src="/logo-escola.png" alt="Escola Logo" className="h-44 w-auto object-contain" />
            </div>
            <div className="flex-[2] flex justify-center px-4">
               <img src="/dados escola.jpeg" alt="Dados da Escola" className="h-44 w-full object-contain" />
            </div>
            <div className="flex items-center justify-end flex-1">
               <img src="/SEDUC 2.jpg" alt="SEDUC MT" className="h-28 w-auto object-contain" />
            </div>
         </div>

         <div className="text-center mb-10">
            <h1 className="text-2xl font-bold uppercase tracking-tighter">Ata de Conselho de Classe</h1>
            <div className="flex justify-center gap-10 mt-4 text-xs font-bold uppercase">
               <span>Turma: {classrooms.find(c => c.id === selectedClassId)?.name}</span>
               <span>Bimestre: {formData.bimestre}</span>
               <span>Data: {formData.date?.split('-').reverse().join('/')}</span>
            </div>
         </div>

         <div className="space-y-10">
            <section>
               <h2 className="text-lg font-bold border-b border-black mb-3 uppercase tracking-tight">1. Diagnóstico Geral da Turma</h2>
               <p className="text-sm leading-relaxed text-justify">{formData.generalDiagnosis || 'Nenhuma observação registrada.'}</p>
            </section>

            <section>
               <h2 className="text-lg font-bold border-b border-black mb-3 uppercase tracking-tight">2. Deliberações e Ações Pedagógicas</h2>
               <p className="text-sm leading-relaxed text-justify">{formData.decisions || 'Nenhuma decisão registrada.'}</p>
            </section>

            <section>
               <h2 className="text-lg font-bold border-b border-black mb-6 uppercase tracking-tight">3. Análise Individual dos Estudantes</h2>
               <table className="w-full border-collapse border border-black text-[10px]">
                  <thead>
                     <tr className="bg-gray-100">
                        <th className="border border-black px-3 py-2 text-left w-1/4">ESTUDANTE</th>
                        <th className="border border-black px-2 py-2 text-center">DESEMPENHO</th>
                        <th className="border border-black px-2 py-2 text-center">COMPORT.</th>
                        <th className="border border-black px-3 py-2 text-left">OBSERVAÇÕES / RECOMENDAÇÕES</th>
                     </tr>
                  </thead>
                  <tbody>
                     {formData.studentObservations?.map(obs => (
                        <tr key={obs.studentId}>
                           <td className="border border-black px-3 py-2 font-bold uppercase">{obs.studentName}</td>
                           <td className="border border-black px-2 py-2 text-center">{obs.pedagogicalProgress}</td>
                           <td className="border border-black px-2 py-2 text-center">{obs.behavioralStatus}</td>
                           <td className="border border-black px-3 py-2">
                              {obs.notes && <p><strong>Obs:</strong> {obs.notes}</p>}
                              {obs.recommendations && <p><strong>Intervenção:</strong> {obs.recommendations}</p>}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </section>

            <div className="mt-20 pt-10 grid grid-cols-2 gap-20 px-10">
               <div className="text-center border-t border-black pt-4">
                  <p className="text-[10px] uppercase font-bold">Coordenação Pedagógica</p>
               </div>
               <div className="text-center border-t border-black pt-4">
                  <p className="text-[10px] uppercase font-bold">Direção Escolar</p>
               </div>
            </div>
         </div>
         </div>
      </div>

    </div>
  );
};

export default ClassCouncilForm;
