
import React, { useState, useMemo, useEffect } from 'react';
import {
   Users,
   Plus,
   ArrowRight,
   Calendar,
   UserCheck,
   Clock,
   Trash2,
   Search,
   BookOpen,
   ArrowRightLeft,
   ShieldCheck,
   ChevronRight,
   X,
   GraduationCap,
   MapPin,
   Edit3,
   Save
} from 'lucide-react';
import { Classroom, Shift } from '../types';
import { supabase } from '../supabaseClient';

interface EnhancedClassroom extends Classroom {
   studentCount: number;
   students: any[];
   salaNum: string;
   room_number?: string; // Coluna do banco
}

const SecretariatClassroomManager: React.FC = () => {
   const [classrooms, setClassrooms] = useState<EnhancedClassroom[]>([]);
   const [activeShift, setActiveShift] = useState<Shift | 'TODOS'>('TODOS');
   const [selectedClassDetail, setSelectedClassDetail] = useState<EnhancedClassroom | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   // New State for Create Class
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [newClass, setNewClass] = useState({ name: '', year: '6º ANO', shift: 'MATUTINO' as Shift, room_number: '' });

   // State for editing room number inline
   const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
   const [editRoomValue, setEditRoomValue] = useState('');

   useEffect(() => {
      fetchClassrooms();
   }, []);

   const fetchClassrooms = async () => {
      try {
         setIsLoading(true);

         // 1. Buscar Turmas
         const { data: dbClassrooms, error: classError } = await supabase
            .from('classrooms')
            .select('*')
            .order('name');

         if (classError) throw classError;

         // 2. Buscar Matrículas com dados do Aluno
         const { data: enrollments, error: enrollError } = await supabase
            .from('enrollments')
            .select(`
          classroom_id,
          students (
            id,
            name,
            registration_number,
            paed,
            school_transport
          )
        `);

         if (enrollError) throw enrollError;

         if (dbClassrooms) {
            const enhanced = dbClassrooms.map((cls: any) => {
               // Filtrar matrículas desta turma
               const classEnrollments = enrollments?.filter((e: any) => e.classroom_id === cls.id) || [];
               const classStudents = classEnrollments.map((e: any) => ({
                  ...e.students,
                  Nome: e.students?.name, // Mapeando para formato esperado pela UI antiga
                  CodigoAluno: e.students?.registration_number,
                  PAED: e.students?.paed ? 'Sim' : 'Não',
                  TransporteEscolar: e.students?.school_transport ? 'Sim' : 'Não'
               }));

               // Lógica visual de sala: Prioriza o banco, se não tiver, usa fallback hardcoded (retrocompatibilidade)
               let salaNum = cls.room_number || '---';

               // Fallback apenas se não vier do banco (migração gradual)
               if (!cls.room_number || cls.room_number === '---') {
                  if (cls.name === '6º ANO A') salaNum = '007';
                  else if (cls.name === '6º ANO B') salaNum = '008';
                  else if (cls.name === '6º ANO D') salaNum = '007';
                  else if (cls.name === '6º ANO E') salaNum = '008';
                  else if (cls.name === '7º ANO A') salaNum = '010';
                  else if (cls.name === '7º ANO D') salaNum = '010';
                  else if (cls.name === '7º ANO B') salaNum = '011';
                  else if (cls.name === '7º ANO E') salaNum = '011';
                  else if (cls.name === '8º ANO A') salaNum = '023';
                  else if (cls.name === '8º ANO B') salaNum = '024';
                  else if (cls.name === '8º ANO D') salaNum = '023';
                  else if (cls.name === '8º ANO E') salaNum = '024';
                  else if (cls.name === '9º ANO A') salaNum = '019';
                  else if (cls.name === '9º ANO B') salaNum = '020';
                  else if (cls.name === '9º ANO C') salaNum = '021';
                  else if (cls.name === '9º ANO D') salaNum = '020';
                  else if (cls.name === '9º ANO E') salaNum = '021';
               }

               return {
                  id: cls.id,
                  name: cls.name,
                  year: cls.year,
                  shift: cls.shift,
                  teacherId: '---', // Não integrado ainda
                  studentIds: [],
                  schedule: [],
                  studentCount: classStudents.length,
                  students: classStudents,
                  salaNum,
                  room_number: cls.room_number
               };
            });
            setClassrooms(enhanced);
         }

      } catch (error) {
         console.error("Erro ao carregar turmas:", error);
      } finally {
         setIsLoading(false);
      }
   };

   const handleCreateClass = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         setIsLoading(true);
         const { error } = await supabase.from('classrooms').insert([{
            name: newClass.name.toUpperCase(),
            year: newClass.year,
            shift: newClass.shift,
            room_number: newClass.room_number || null
         }]);

         if (error) throw error;

         alert("Turma criada com sucesso!");
         setIsCreateModalOpen(false);
         setNewClass({ name: '', year: '6º ANO', shift: 'MATUTINO', room_number: '' });
         fetchClassrooms();
      } catch (error) {
         console.error("Erro ao criar turma:", error);
         alert("Erro ao criar turma.");
      } finally {
         setIsLoading(false);
      }
   };

   const startEditingRoom = (cls: EnhancedClassroom) => {
      setEditingRoomId(cls.id);
      setEditRoomValue(cls.salaNum === '---' ? '' : cls.salaNum);
   };

   const saveRoomNumber = async (classId: string) => {
      try {
         const { error } = await supabase
            .from('classrooms')
            .update({ room_number: editRoomValue })
            .eq('id', classId);

         if (error) throw error;

         setEditingRoomId(null);
         fetchClassrooms(); // Refresh to update UI
      } catch (error) {
         console.error("Erro ao atualizar sala:", error);
         alert("Erro ao salvar número da sala.");
      }
   };

   const deleteClassroom = async (cls: EnhancedClassroom) => {
      if (cls.studentCount > 0) {
         alert(`Não é possível excluir a turma "${cls.name}" pois existem ${cls.studentCount} alunos matriculados nela.\n\nRemova ou transfira os alunos antes de excluir a turma.`);
         return;
      }

      if (window.confirm(`Tem certeza que deseja excluir a turma "${cls.name}" PERMANENTEMENTE?\n\nEsta ação não pode ser desfeita.`)) {
         try {
            setIsLoading(true);
            const { error } = await supabase
               .from('classrooms')
               .delete()
               .eq('id', cls.id);

            if (error) throw error;

            alert("Turma excluída com sucesso!");
            fetchClassrooms();
         } catch (error) {
            console.error("Erro ao excluir turma:", error);
            alert("Erro ao excluir a turma.");
         } finally {
            setIsLoading(false);
         }
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500">

         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl">
                  <Users size={32} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Grade de Turmas</h3>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gerenciamento de Enturmação e Ocupação</p>
               </div>
            </div>
            <div className="flex gap-3">
               <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"
               >
                  <Plus size={14} /> Nova Turma
               </button>
               <div className="flex bg-gray-100 p-1 rounded-2xl">
                  {['TODOS', 'MATUTINO', 'VESPERTINO'].map(s => (
                     <button
                        key={s}
                        onClick={() => setActiveShift(s as any)}
                        className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${activeShift === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                           }`}
                     >
                        {s}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classrooms.filter(c => activeShift === 'TODOS' || c.shift === activeShift).map(cls => (
               <div key={cls.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-2xl transition-all group flex flex-col justify-between">
                  <div>
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 bg-gray-900 text-white rounded-[2rem] flex items-center justify-center font-black text-xl group-hover:bg-indigo-600 transition-colors">
                           {cls.name.substring(0, 2)}
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                           <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{cls.shift}</span>
                           <button
                              onClick={() => deleteClassroom(cls)}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                              title="Excluir Turma"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </div>

                     <h3 className="text-2xl font-black text-gray-900 uppercase mb-4">{cls.name}</h3>

                     <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                           <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Alunos</p>
                           <p className={`text-xl font-black ${cls.studentCount > 0 ? 'text-indigo-600' : 'text-red-400'}`}>{cls.studentCount}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center relative group/sala">
                           <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Sala</p>

                           {editingRoomId === cls.id ? (
                              <div className="flex items-center gap-1 justify-center">
                                 <input
                                    autoFocus
                                    value={editRoomValue}
                                    onChange={e => setEditRoomValue(e.target.value)}
                                    className="w-12 text-center font-black text-lg bg-white border border-indigo-300 rounded-lg outline-none"
                                    onBlur={() => saveRoomNumber(cls.id!)}
                                    onKeyDown={e => e.key === 'Enter' && saveRoomNumber(cls.id!)}
                                 />
                                 <button onMouseDown={() => saveRoomNumber(cls.id!)} className="text-emerald-500"><Save size={14} /></button>
                              </div>
                           ) : (
                              <div className="flex items-center justify-center gap-2 cursor-pointer" onClick={() => startEditingRoom(cls)}>
                                 <p className="text-xl font-black text-gray-900">{cls.salaNum}</p>
                                 <Edit3 size={12} className="text-gray-300 opacity-0 group-hover/sala:opacity-100 transition-opacity absolute right-2 top-2" />
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-3">
                     <button
                        onClick={() => setSelectedClassDetail(cls)}
                        className="py-3 bg-gray-900 text-white hover:bg-black rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 shadow-lg"
                     >
                        <BookOpen size={14} /> Detalhar Turma
                     </button>
                  </div>
               </div>
            ))}
         </div>

         {/* Modal de Nova Turma */}
         {isCreateModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden p-8">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Nova Turma</h3>
                     <button onClick={() => setIsCreateModalOpen(false)}><X size={24} className="text-gray-400 hover:text-red-500" /></button>
                  </div>
                  <form onSubmit={handleCreateClass} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Turma</label>
                           <input
                              required
                              placeholder="EX: 6º ANO A"
                              value={newClass.name}
                              onChange={e => setNewClass({ ...newClass, name: e.target.value.toUpperCase() })}
                              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white uppercase"
                           />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ano Letivo</label>
                           <select
                              value={newClass.year}
                              onChange={e => setNewClass({ ...newClass, year: e.target.value })}
                              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white"
                           >
                              {["1º ANO", "2º ANO", "3º ANO", "4º ANO", "5º ANO", "6º ANO", "7º ANO", "8º ANO", "9º ANO"].map(y => <option key={y} value={y}>{y}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turno</label>
                           <select
                              value={newClass.shift}
                              onChange={e => setNewClass({ ...newClass, shift: e.target.value as Shift })}
                              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white"
                           >
                              {["MATUTINO", "VESPERTINO", "INTEGRAL", "NOTURNO"].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número da Sala (Opcional)</label>
                        <input
                           placeholder="EX: 007"
                           value={newClass.room_number}
                           onChange={e => setNewClass({ ...newClass, room_number: e.target.value })}
                           className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white uppercase"
                        />
                     </div>

                     <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all flex justify-center gap-2 items-center shadow-lg">
                        <Plus size={16} /> Criar Turma
                     </button>
                  </form>
               </div>
            </div>
         )}

         {/* Modal de Detalhamento da Turma */}
         {selectedClassDetail && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Header do Modal */}
                  <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-2xl font-black">
                           {selectedClassDetail.name.substring(0, 2)}
                        </div>
                        <div>
                           <h3 className="text-2xl font-black uppercase tracking-tighter">{selectedClassDetail.name}</h3>
                           <div className="flex items-center gap-4 mt-1">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                 <MapPin size={12} /> Sala {selectedClassDetail.salaNum}
                              </p>
                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                 <GraduationCap size={12} /> {selectedClassDetail.studentCount} Alunos Ativos
                              </p>
                           </div>
                        </div>
                     </div>
                     <button
                        onClick={() => setSelectedClassDetail(null)}
                        className="p-3 bg-white/10 hover:bg-red-50 rounded-2xl transition-all"
                     >
                        <X size={24} />
                     </button>
                  </div>

                  {/* Lista de Alunos */}
                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                     <div className="bg-gray-50 rounded-[2.5rem] border border-gray-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="bg-gray-100/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                 <th className="px-8 py-4 w-20">Seq.</th>
                                 <th className="px-8 py-4">Código</th>
                                 <th className="px-8 py-4">Nome do Aluno</th>
                                 <th className="px-8 py-4 text-center">PAED</th>
                                 <th className="px-8 py-4 text-center">Tr. Escolar</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                              {selectedClassDetail.students.map((student: any, idx: number) => (
                                 <tr key={student.CodigoAluno} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-8 py-4"><span className="text-[10px] font-black text-gray-300 group-hover:text-indigo-600">#{idx + 1}</span></td>
                                    <td className="px-8 py-4"><span className="text-[10px] font-bold text-gray-500">{student.CodigoAluno}</span></td>
                                    <td className="px-8 py-4"><p className="text-sm font-black text-gray-900 uppercase">{student.Nome}</p></td>
                                    <td className="px-8 py-4 text-center">
                                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${student.PAED === 'Sim' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                                          {student.PAED}
                                       </span>
                                    </td>
                                    <td className="px-8 py-4 text-center">
                                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${student.TransporteEscolar === 'Sim' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                                          {student.TransporteEscolar}
                                       </span>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  {/* Footer com Selo de Integridade */}
                  <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-3">
                        <ShieldCheck size={20} className="text-indigo-600" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Relatório Auditado • Base SEDUC-MT</p>
                     </div>
                     <button
                        onClick={() => window.print()}
                        className="px-6 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all"
                     >
                        Imprimir Relação
                     </button>
                  </div>
               </div>
            </div>
         )}

      </div>
   );
};

export default SecretariatClassroomManager;
