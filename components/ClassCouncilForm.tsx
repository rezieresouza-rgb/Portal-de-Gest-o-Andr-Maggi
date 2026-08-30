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
  MessageSquare as MessageSquareIcon,
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
            pedagogicalProgress: 'ADEQUADO',
            behavioralStatus: 'BOM',
            notes: '',
            recommendations: ''
          }));
          setFormData(prev => ({ ...prev, studentObservations: initialObs }));
        }
      }
    };

    fetchStudents();
  }, [selectedClassId]);

  const handleStudentObservationChange = (index: number, field: keyof ClassCouncilStudentObservation, value: any) => {
    const updated = [...(formData.studentObservations || [])];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setFormData({ ...formData, studentObservations: updated });
  };

  const handleSave = async (finalize = false) => {
    if (!selectedClassId) {
      addToast("Selecione uma turma para o conselho.", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload: ClassCouncil = {
        id: initialData?.id || '',
        classroomId: selectedClassId,
        className: classrooms.find(c => c.id === selectedClassId)?.name || 'Turma',
        bimestre: formData.bimestre || '1º BIMESTRE',
        date: formData.date || new Date().toISOString().split('T')[0],
        generalDiagnosis: formData.generalDiagnosis || '',
        studentObservations: formData.studentObservations || [],
        decisions: formData.decisions || '',
        attendanceTeachers: formData.attendanceTeachers || [],
        status: finalize ? 'FINALIZADO' : 'RASCUNHO',
        timestamp: new Date().getTime()
      };

      await onSave(payload);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    const element = document.getElementById('ata-conselho-externo');
    if (!element) {
      addToast("Erro ao localizar elemento de impressão.", "error");
      return;
    }

    try {
      setLoading(true);
      addToast("Preparando PDF oficial...", "info");
      
      const className = classrooms.find(c => c.id === selectedClassId)?.name || 'Turma';
      const filename = `Ata_Conselho_${className.replace(/\s+/g, '_')}_${formData.bimestre?.replace(/\s+/g, '_')}.pdf`;
      
      // @ts-ignore
      const h2pdf = window.html2pdf;
      if (!h2pdf) {
        window.print();
        return;
      }

      const opt = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: true,
          letterRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await h2pdf().set(opt).from(element).save();
      addToast("PDF gerado com sucesso!", "success");
    } catch (error) {
      console.error("Erro no PDF:", error);
      window.print();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 no-print">
      
      {/* HEADER FIXO */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-100 text-blue-700 rounded-2xl">
            <ClipboardList size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Registro de Conselho de Classe</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">Sistematização de Resultados e Encaminhamentos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5">
            <Printer size={15} /> Imprimir Ata
          </button>
          <button onClick={onCancel} className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5">
            <X size={15} /> Cancelar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: DADOS DA REUNIÃO */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} className="text-indigo-600" /> Detalhes do Conselho
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 mb-1 block">Turma</label>
                <select 
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  disabled={!!initialData}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:bg-white cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.shift})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 mb-1 block">Bimestre</label>
                  <select 
                    value={formData.bimestre}
                    onChange={e => setFormData({...formData, bimestre: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-bold text-slate-900 outline-none focus:bg-white cursor-pointer"
                  >
                    <option>1º BIMESTRE</option>
                    <option>2º BIMESTRE</option>
                    <option>3º BIMESTRE</option>
                    <option>4º BIMESTRE</option>
                    <option>EXAME FINAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 mb-1 block">Data</label>
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-bold text-slate-900 outline-none focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} /> Diagnóstico Geral da Turma
            </h4>
            <textarea 
              value={formData.generalDiagnosis}
              onChange={e => setFormData({...formData, generalDiagnosis: e.target.value})}
              placeholder="Descreva o perfil da turma neste bimestre, avanços coletivos e desafios..."
              className="w-full h-36 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-900 outline-none focus:bg-white resize-none"
            />
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
              <UserCheck size={14} /> Encaminhamentos / Decisões
            </h4>
            <textarea 
              value={formData.decisions}
              onChange={e => setFormData({...formData, decisions: e.target.value})}
              placeholder="Ações pedagógicas decididas para o próximo período..."
              className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-900 outline-none focus:bg-white resize-none"
            />
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => handleSave(false)}
                disabled={loading}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                {loading ? 'Salvando...' : 'Salvar Rascunho'}
              </button>
              <button 
                onClick={() => handleSave(true)}
                disabled={loading}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Save size={14} /> Finalizar
              </button>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: OBSERVADOR POR ALUNO */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Users size={18} className="text-indigo-600" /> Acompanhamento Individual dos Alunos
              </h4>
              <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 uppercase">
                {students.length} Alunos na Turma
              </span>
            </div>

            <div className="space-y-4 max-h-[38rem] overflow-y-auto custom-scrollbar pr-1">
              {formData.studentObservations?.map((obs, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="font-black text-xs uppercase text-slate-900">{obs.studentName}</span>
                    <div className="flex gap-2">
                      <select 
                        value={obs.pedagogicalProgress}
                        onChange={e => handleStudentObservationChange(idx, 'pedagogicalProgress', e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[10px] font-black uppercase outline-none text-indigo-700 cursor-pointer"
                      >
                        <option value="AVANÇADO">AVANÇADO</option>
                        <option value="ADEQUADO">ADEQUADO</option>
                        <option value="BÁSICO">BÁSICO</option>
                        <option value="ABAIXO DO BÁSICO">ABAIXO DO BÁSICO</option>
                      </select>

                      <select 
                        value={obs.behavioralStatus}
                        onChange={e => handleStudentObservationChange(idx, 'behavioralStatus', e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[10px] font-black uppercase outline-none text-amber-700 cursor-pointer"
                      >
                        <option value="EXCELENTE">EXCELENTE</option>
                        <option value="BOM">BOM</option>
                        <option value="REGULAR">REGULAR</option>
                        <option value="CRÍTICO">CRÍTICO</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input 
                      type="text"
                      placeholder="Observações pedagógicas / comportamentais..."
                      value={obs.notes || ''}
                      onChange={e => handleStudentObservationChange(idx, 'notes', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    <input 
                      type="text"
                      placeholder="Intervenções / Encaminhamentos recomendados..."
                      value={obs.recommendations || ''}
                      onChange={e => handleStudentObservationChange(idx, 'recommendations', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ClassCouncilForm;
