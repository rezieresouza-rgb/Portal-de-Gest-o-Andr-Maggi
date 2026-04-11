import React, { useState, useMemo, useEffect, useRef } from 'react';
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
   Save,
   User,
   History,
   FileText,
   Pencil,
   Stethoscope,
   LogOut,
   TrendingDown,
   Building2,
   Hash,
   Sparkles,
   Loader2,
   Download,
   RefreshCw,
   UserPlus,
   AlertCircle,
   CheckCircle2,
   FileUp,
   Phone
} from 'lucide-react';
import { Classroom, Shift, StudentMovement } from '../types';
import { supabase } from '../supabaseClient';
import { extractDetailedStudentList } from '../geminiService';

interface EnhancedClassroom extends Classroom {
   studentCount: number;
   students: any[];
   salaNum: string;
   room_number?: string;
}

interface DetailedStudent {
  id?: string;
  Nome: string;
  registration_number: string;
  birth_date: string;
  paed: boolean;
  school_transport: boolean;
  guardian_name: string;
  contact_phone: string;
  status?: string;
  Turma: string;
  Turno: string;
  Sequencia?: string;
  DataMatricula?: string;
  PAED: string;
  TransporteEscolar: string;
  NomeResponsavel: string;
  TelefoneContato: string;
  gender?: string;
}

const SecretariatClassroomManager: React.FC = () => {
   const [classrooms, setClassrooms] = useState<EnhancedClassroom[]>([]);
   const [activeShift, setActiveShift] = useState<Shift | 'TODOS'>('TODOS');
   const [selectedClassDetail, setSelectedClassDetail] = useState<EnhancedClassroom | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   // Global Search States
   const [globalSearchTerm, setGlobalSearchTerm] = useState('');
   const [searchResults, setSearchResults] = useState<DetailedStudent[]>([]);
   const [isSearching, setIsSearching] = useState(false);

   // Student Registry States
   const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
   const [isEditingStudent, setIsEditingStudent] = useState(false);
   const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
   const [studentForm, setStudentForm] = useState<DetailedStudent>({
      Nome: '',
      Turma: '',
      Turno: 'MATUTINO',
      registration_number: '',
      birth_date: '',
      paed: false,
      school_transport: false,
      guardian_name: '',
      contact_phone: '',
      PAED: 'Não',
      TransporteEscolar: 'Não',
      NomeResponsavel: '',
      TelefoneContato: '',
      status: 'ATIVO',
      gender: 'MASCULINO'
   });

   // Movement States
   const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
   const [selectedStudentForMovement, setSelectedStudentForMovement] = useState<DetailedStudent | null>(null);
   const [movements, setMovements] = useState<StudentMovement[]>([]);
   const [newMovement, setNewMovement] = useState({
      type: 'TRANSFERENCIA',
      description: '',
      date: new Date().toLocaleDateString('sv-SE'),
      destination_school: '',
      document_number: '',
      days_absent: '',
      cid_code: '',
      doctor_name: '',
      return_date: '',
      responsible_name: '',
      transfer_subtype: 'EXTERNA' as 'INTERNA' | 'EXTERNA',
      is_reclassified: false
   });

   // New Class States
   const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
   const [newClass, setNewClass] = useState({ name: '', year: '6º ANO', shift: 'MATUTINO' as Shift, room_number: '' });

   // Room Editing
   const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
   const [editRoomValue, setEditRoomValue] = useState('');

   // Refs
   const fileInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      fetchClassrooms();
   }, []);

   // Sincroniza a modal de turma aberta sempre que a listagem de turmas for atualizada por baixo dos panos
   useEffect(() => {
      if (selectedClassDetail) {
         const updatedClass = classrooms.find(c => c.id === selectedClassDetail.id);
         if (updatedClass) {
            setSelectedClassDetail(updatedClass);
         }
      }
   }, [classrooms]);

   // --- DATA FETCHING ---

   const fetchClassrooms = async () => {
      try {
         setIsLoading(true);
         const { data: dbClassrooms, error: classError } = await supabase
            .from('classrooms')
            .select('*')
            .order('name');

         if (classError) throw classError;

         const { data: enrollments, error: enrollError } = await supabase
            .from('enrollments')
            .select(`
               classroom_id,
               status,
               students (*)
            `);

         if (enrollError) throw enrollError;

         if (dbClassrooms) {
            const enhanced = dbClassrooms.map((cls: any) => {
               const classEnrollments = enrollments?.filter((e: any) => e.classroom_id === cls.id) || [];
               const classStudents = classEnrollments.map((e: any) => ({
                  ...e.students,
                  status: e.status || e.students?.status || 'ATIVO',
                  Nome: e.students?.name,
                  CodigoAluno: e.students?.registration_number,
                  Turma: cls.name,
                  PAED: e.students?.paed ? 'Sim' : 'Não',
                  TransporteEscolar: e.students?.school_transport ? 'Sim' : 'Não',
                  NomeResponsavel: e.students?.guardian_name || '',
                  TelefoneContato: e.students?.contact_phone || ''
               })).sort((a, b) => a.Nome.localeCompare(b.Nome));

               let salaNum = cls.room_number || '---';
               
               return {
                  ...cls,
                  studentCount: classStudents.length,
                  students: classStudents,
                  salaNum
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

   // --- GLOBAL SEARCH ---
   useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
         if (globalSearchTerm.length >= 2) {
            performGlobalSearch();
         } else {
            setSearchResults([]);
         }
      }, 500);

      return () => clearTimeout(delayDebounceFn);
   }, [globalSearchTerm]);

   const performGlobalSearch = async () => {
      setIsSearching(true);
      try {
         const { data, error } = await supabase
            .from('students')
            .select(`
               *,
               enrollments (
                  status,
                  classrooms (name, shift)
               )
            `)
            .or(`name.ilike.%${globalSearchTerm}%,registration_number.ilike.%${globalSearchTerm}%`)
            .limit(10);

         if (error) throw error;

         if (data) {
            const mapped: DetailedStudent[] = data.map((s: any) => {
               const activeEnr = s.enrollments?.find((e: any) => e.status === 'ATIVO') || s.enrollments?.[0];
               const classroom = activeEnr?.classrooms;
               return {
                  ...s,
                  id: s.id,
                  Nome: s.name,
                  Turma: classroom?.name || 'SEM TURMA',
                  Turno: classroom?.shift || '---',
                  PAED: s.paed ? 'Sim' : 'Não',
                  TransporteEscolar: s.school_transport ? 'Sim' : 'Não',
                  NomeResponsavel: s.guardian_name || '',
                  TelefoneContato: s.contact_phone || '',
                  registration_number: s.registration_number,
                  birth_date: s.birth_date
               };
            });
            setSearchResults(mapped);
         }
      } catch (error) {
         console.error("Erro na busca global:", error);
      } finally {
         setIsSearching(false);
      }
   };

   // --- STUDENT ACTIONS ---

   const openStudentProfile = (student: any) => {
      const sid = student.id || student.id_aluno;
      console.log("Abrindo perfil do aluno ID:", sid);
      
      if (!sid) {
         alert("Erro: O ID do aluno não foi encontrado. Tente atualizar a página.");
         return;
      }

      // Normalize student data
      const normalized: DetailedStudent = {
         id: sid,
         Nome: student.name || student.Nome,
         registration_number: student.registration_number || student.CodigoAluno,
         birth_date: student.birth_date || student.DataNascimento,
         paed: student.paed === true || student.PAED === 'Sim',
         school_transport: student.school_transport === true || student.TransporteEscolar === 'Sim',
         guardian_name: student.guardian_name || student.NomeResponsavel || '',
         contact_phone: student.contact_phone || student.TelefoneContato || '',
         Turma: student.Turma || 'SEM TURMA',
         Turno: student.Turno || '---',
         PAED: (student.paed === true || student.PAED === 'Sim') ? 'Sim' : 'Não',
         TransporteEscolar: (student.school_transport === true || student.TransporteEscolar === 'Sim') ? 'Sim' : 'Não',
         NomeResponsavel: student.guardian_name || student.NomeResponsavel || '',
         TelefoneContato: student.contact_phone || student.TelefoneContato || '',
         status: student.status || 'ATIVO',
         gender: student.gender || 'MASCULINO'
      };

      setEditingStudentId(sid);
      setStudentForm(normalized);
      setIsEditingStudent(true);
      setIsStudentModalOpen(true);
      setGlobalSearchTerm('');
   };

   const handleSaveStudent = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         setIsLoading(true);
         const payload: any = {
            name: studentForm.Nome.toUpperCase(),
            registration_number: String(studentForm.registration_number).trim(),
            birth_date: studentForm.birth_date,
            paed: studentForm.PAED === 'Sim',
            school_transport: studentForm.TransporteEscolar === 'Sim',
            guardian_name: (studentForm.NomeResponsavel || '').toUpperCase(),
            contact_phone: studentForm.TelefoneContato,
            status: studentForm.status || 'ATIVO',
            gender: studentForm.gender || 'MASCULINO'
         };

         if (isEditingStudent) {
            if (!editingStudentId) {
               throw new Error("Erro técnico: O ID do aluno desapareceu durante a edição. Por favor, feche e abra o perfil novamente.");
            }

            const { error } = await supabase
               .from('students')
               .update(payload)
               .eq('id', editingStudentId);

            if (error) throw error;
            
            // Handle class change
            if (studentForm.Turma && studentForm.Turma !== 'SEM TURMA') {
               const targetClass = classrooms.find(c => c.name === studentForm.Turma);
               if (targetClass) {
                  const { data: currentEnrollments } = await supabase.from('enrollments').select('id, classroom_id, status').eq('student_id', editingStudentId).neq('status', 'TRANSFERIDO');
                  
                  if (!currentEnrollments?.some(e => e.classroom_id === targetClass.id)) {
                     // Ao envés de deletar a matrícula antiga, marcamos como TRANSFERIDO
                     await supabase.from('enrollments').update({ status: 'TRANSFERIDO DE TURMA' }).eq('student_id', editingStudentId).neq('classroom_id', targetClass.id);
                     await supabase.from('enrollments').insert([{
                        student_id: editingStudentId,
                        classroom_id: targetClass.id,
                        enrollment_date: new Date().toLocaleDateString('sv-SE'),
                        status: studentForm.status || 'ATIVO'
                     }]);
                  } else {
                     // Se continuou na mesma turma, vamos garantir que o status da matrícula no Banco acompanhou o status que ele editou no Modal!
                     const currentEnr = currentEnrollments.find(e => e.classroom_id === targetClass.id);
                     if (currentEnr && currentEnr.status !== studentForm.status) {
                        await supabase.from('enrollments').update({ status: studentForm.status || 'ATIVO' }).eq('id', currentEnr.id);
                     }
                  }
               }
            } else if (studentForm.Turma === 'SEM TURMA') {
               await supabase.from('enrollments').update({ status: 'TRANSFERIDO DE TURMA' }).eq('student_id', editingStudentId);
            }

            alert("Cadastro atualizado com sucesso!");
         } else {
            // New Student: Check if registration already exists to avoid technical error
            const { data: existingStudent } = await supabase
               .from('students')
               .select('id')
               .eq('registration_number', payload.registration_number)
               .maybeSingle();
            
            if (existingStudent) {
               alert(`Oops! A matrícula ${payload.registration_number} já está em uso por outro aluno.`);
               return;
            }

            // New Student creation logic...
            const { data: newStudent, error } = await supabase
               .from('students')
               .insert([payload])
               .select()
               .single();
            
            if (error) throw error;
            
            // Link to classroom if selected
            if (studentForm.Turma && studentForm.Turma !== 'SEM TURMA') {
               const targetClass = classrooms.find(c => c.name === studentForm.Turma);
               if (targetClass) {
                  await supabase.from('enrollments').insert([{
                     student_id: newStudent.id,
                     classroom_id: targetClass.id,
                     enrollment_date: new Date().toLocaleDateString('sv-SE')
                  }]);
               }
            }
            alert("Aluno cadastrado com sucesso!");
         }

         setIsStudentModalOpen(false);
         fetchClassrooms();
      } catch (error: any) {
         console.error("Erro ao salvar aluno:", error);

         // Handle duplicate registration conflict
         if (error.code === '23505' || (error.message && error.message.includes('unique constraint'))) {
            const currentReg = String(studentForm.registration_number).trim();
            const { data: conflictOwner } = await supabase
               .from('students')
               .select('name')
               .eq('registration_number', currentReg)
               .maybeSingle();
            
            if (conflictOwner) {
               alert(`CONFLITO DE MATRÍCULA: O número ${currentReg} já pertence ao(à) aluno(a) ${conflictOwner.name.toUpperCase()}.\n\nPara prosseguir, você precisa primeiro corrigir ou excluir o outro cadastro.`);
               return;
            }
         }

         const context = isEditingStudent ? `Alteração (ID: ${editingStudentId})` : "Novo Aluno";
         alert(`Erro ao salvar [${context}]: ${error.message}`);
      } finally {
         setIsLoading(false);
      }
   };

   // --- CLASSROOM ACTIONS ---

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
         setIsCreateClassModalOpen(false);
         setNewClass({ name: '', year: '6º ANO', shift: 'MATUTINO', room_number: '' });
         fetchClassrooms();
      } catch (error) {
         console.error("Erro ao criar turma:", error);
         alert("Erro ao criar turma.");
      } finally {
         setIsLoading(false);
      }
   };

   const saveRoomNumber = async (classId: string) => {
      try {
         const { error } = await supabase
            .from('classrooms')
            .update({ room_number: editRoomValue })
            .eq('id', classId);

         if (error) throw error;

         setEditingRoomId(null);
         fetchClassrooms();
      } catch (error) {
         console.error("Erro ao atualizar sala:", error);
      }
   };

   // --- MOVEMENT ACTIONS ---

   const openMovementHistory = async (student: DetailedStudent) => {
      setSelectedStudentForMovement(student);
      setIsMovementModalOpen(true);
      
      try {
         const { data, error } = await supabase
            .from('student_movements')
            .select('*')
            .eq('student_id', student.id)
            .order('movement_date', { ascending: false });

         if (error) throw error;
         setMovements(data || []);
      } catch (error) {
         console.error("Erro ao buscar histórico:", error);
      }
   };

   const handleRegisterMovement = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedStudentForMovement?.id) return;

      try {
         const payload: any = {
            student_id: selectedStudentForMovement.id,
            movement_type: newMovement.type,
            description: newMovement.description.toUpperCase() || newMovement.type,
            movement_date: newMovement.date,
            responsible_name: newMovement.responsible_name.toUpperCase(),
            is_reclassified: newMovement.type === 'RECLASSIFICADO' || newMovement.is_reclassified
         };

         if (newMovement.type === 'TRANSFERENCIA') {
            payload.destination_school = newMovement.destination_school.toUpperCase();
            payload.transfer_subtype = newMovement.transfer_subtype;
         }

         const { error } = await supabase.from('student_movements').insert([payload]);
         if (error) throw error;

         // Update Status
         if (newMovement.type === 'TRANSFERENCIA' && newMovement.transfer_subtype === 'EXTERNA') {
            await supabase.from('students').update({ status: 'TRANSFERIDO' }).eq('id', selectedStudentForMovement.id);
         }

         alert("Movimentação registrada!");
         openMovementHistory(selectedStudentForMovement);
      } catch (error: any) {
         console.error("Erro ao registrar movimento:", error);
         alert("Erro: " + error.message);
      }
   };

   // --- PDF IMPORT ---
   const handleImportPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
         setIsLoading(true);
         const reader = new FileReader();
         reader.readAsDataURL(file);
         reader.onload = async () => {
            const base64Data = reader.result?.toString().split(',')[1];
            if (!base64Data) return;

            const data = await extractDetailedStudentList(base64Data, "application/pdf");
            if (!data.Alunos) return;

            // Simple loop to insert/update - logic simplified for brevity
            for (const s of data.Alunos) {
               const { data: existing } = await supabase.from('students').select('id').ilike('name', s.Nome).maybeSingle();
               
               const payload = {
                  name: s.Nome,
                  registration_number: s.CodigoAluno || `PDF-${Date.now()}`,
                  birth_date: s.DataNascimento,
                  paed: s.PAED === 'Sim'
               };

               if (existing) {
                  await supabase.from('students').update(payload).eq('id', existing.id);
               } else {
                  const { data: newS } = await supabase.from('students').insert([payload]).select().single();
                  // Find classroom
                  const { data: cls } = await supabase.from('classrooms').select('id').ilike('name', `%${s.Turma}%`).maybeSingle();
                  if (cls && newS) {
                     await supabase.from('enrollments').insert([{ student_id: newS.id, classroom_id: cls.id, enrollment_date: new Date().toLocaleDateString('sv-SE') }]);
                  }
               }
            }
            alert("PDF processado com sucesso!");
            fetchClassrooms();
         };
      } catch (error) {
         console.error("Erro ao importar PDF:", error);
      } finally {
         setIsLoading(false);
      }
   };

   // --- RENDERING HELPERS ---

   const formatDateSafe = (dateStr: string) => {
      if (!dateStr) return '---';
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
         
         {/* HEADER UNIFICADO COM BUSCA GLOBAL */}
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-6">
                  <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-lg">
                     <Users size={32} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Gestão de Turmas</h3>
                     <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Controle de Enturmação e Cadastro de Alunos</p>
                  </div>
               </div>
               
               {/* BUSCA GLOBAL SEMPRE VISÍVEL */}
               <div className="relative w-full md:w-[400px]">
                  <div className={`relative transition-all ${globalSearchTerm ? 'scale-[1.02]' : ''}`}>
                     <Search className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${globalSearchTerm ? 'text-indigo-600' : 'text-gray-300'}`} size={20} />
                     <input
                        type="text"
                        placeholder="Pesquisar aluno em toda a escola..."
                        value={globalSearchTerm}
                        onChange={e => setGlobalSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-12 py-4 bg-gray-50 border-none rounded-[1.5rem] font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300"
                     />
                     {globalSearchTerm && (
                        <button 
                           onClick={() => {
                              setGlobalSearchTerm('');
                              setSearchResults([]);
                           }}
                           className="absolute right-12 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full text-gray-400 transition-all"
                        >
                           <X size={14} />
                        </button>
                     )}
                     {isSearching && <Loader2 size={16} className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-indigo-400" />}
                  </div>

                  {/* RESULTADOS DA BUSCA GLOBAL (POPUP) */}
                  {(searchResults.length > 0 || (globalSearchTerm.length >= 2 && !isSearching)) && globalSearchTerm.length >= 2 && (
                     <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 p-4 z-[200] max-h-[400px] overflow-y-auto animate-in slide-in-from-top-2 duration-300">
                        {searchResults.length > 0 ? (
                           <>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 mb-3">Resultados Encontrados</p>
                              <div className="space-y-1">
                                 {searchResults.map(s => (
                                    <button
                                       key={s.id}
                                       onClick={() => openStudentProfile(s)}
                                       className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-all text-left group"
                                    >
                                       <div>
                                          <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 uppercase">{s.Nome}</p>
                                          <p className="text-[9px] font-bold text-gray-400 uppercase">{s.Turma} • {s.registration_number}</p>
                                       </div>
                                       <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-600" />
                                    </button>
                                 ))}
                              </div>
                           </>
                        ) : (
                           <div className="p-6 text-center space-y-2">
                              <div className="flex justify-center text-gray-200">
                                 <Search size={32} />
                              </div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhum aluno encontrado</p>
                              <p className="text-[9px] font-bold text-gray-300">Tente buscar por nome completo ou número de matrícula</p>
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </div>

            {/* AÇÕES RÁPIDAS NO HEADER */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-50">
               <button
                  onClick={() => setIsCreateClassModalOpen(true)}
                  className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100"
               >
                  <Plus size={14} /> Nova Turma
               </button>
               <button
                  onClick={() => {
                     setIsEditingStudent(false);
                     setStudentForm({ ...studentForm, Nome: '', registration_number: '', birth_date: '', Turma: '' });
                     setIsStudentModalOpen(true);
                  }}
                  className="px-6 py-3 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-100 transition-all border border-gray-100"
               >
                  <UserPlus size={14} /> Novo Aluno
               </button>
               <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg"
               >
                  <FileUp size={14} /> Importar PDF
               </button>
               <input type="file" ref={fileInputRef} onChange={handleImportPDF} className="hidden" accept=".pdf" />
               
               <div className="flex-1" />

               <div className="flex bg-gray-100 p-1 rounded-2xl">
                  {['TODOS', 'MATUTINO', 'VESPERTINO'].map(s => (
                     <button
                        key={s}
                        onClick={() => setActiveShift(s as any)}
                        className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${activeShift === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                     >
                        {s}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {/* GRID DE TURMAS */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classrooms.filter(c => activeShift === 'TODOS' || c.shift === activeShift).map(cls => (
               <div key={cls.id} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-2xl transition-all group flex flex-col justify-between">
                  <div>
                     <div className="flex justify-between items-start mb-8">
                        <div className="w-16 h-16 bg-gray-900 text-white rounded-[2rem] flex items-center justify-center font-black text-xl group-hover:bg-indigo-600 transition-colors shadow-xl">
                           {cls.name.substring(0, 2)}
                        </div>
                        <div className="text-right flex flex-col items-end gap-3">
                           <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">{cls.shift}</span>
                        </div>
                     </div>

                     <h3 className="text-3xl font-black text-gray-900 uppercase mb-6 tracking-tighter">{cls.name}</h3>

                     <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 text-center">
                           <p className="text-[9px] font-black text-gray-400 uppercase mb-1.5">Alunos</p>
                           <p className={`text-2xl font-black ${cls.studentCount > 0 ? 'text-indigo-600' : 'text-red-400'}`}>{cls.studentCount}</p>
                        </div>
                        <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 text-center relative group/sala cursor-pointer" onClick={() => { setEditingRoomId(cls.id); setEditRoomValue(cls.salaNum); }}>
                           <p className="text-[9px] font-black text-gray-400 uppercase mb-1.5">Sala</p>
                           {editingRoomId === cls.id ? (
                              <input
                                 autoFocus
                                 value={editRoomValue}
                                 onChange={e => setEditRoomValue(e.target.value)}
                                 onBlur={() => saveRoomNumber(cls.id!)}
                                 onKeyDown={e => e.key === 'Enter' && saveRoomNumber(cls.id!)}
                                 className="w-12 text-center font-black text-xl bg-white border border-indigo-300 rounded-lg outline-none"
                              />
                           ) : (
                              <p className="text-2xl font-black text-gray-900">{cls.salaNum}</p>
                           )}
                           <Edit3 size={12} className="text-gray-300 opacity-0 group-hover/sala:opacity-100 transition-opacity absolute right-4 top-4" />
                        </div>
                     </div>
                  </div>

                  <button
                     onClick={() => setSelectedClassDetail(cls)}
                     className="w-full py-4 bg-gray-900 text-white hover:bg-black rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-3 shadow-xl"
                  >
                     <BookOpen size={16} /> Detalhes da Turma
                  </button>
               </div>
            ))}
         </div>

         {/* MODAL DETALHES DA TURMA (LISTA DE ALUNOS - DESIGN LIMPO) */}
         {selectedClassDetail && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
                  {/* HEADER MAIS LEVE */}
                  <div className="p-8 bg-white border-b border-gray-50 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-black border border-indigo-100 shadow-sm">
                           {selectedClassDetail.name.substring(0, 2)}
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{selectedClassDetail.name}</h3>
                           <div className="flex items-center gap-4 mt-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                 <MapPin size={12} className="text-indigo-400" /> Sala {selectedClassDetail.salaNum}
                              </p>
                              <div className="w-1 h-1 bg-gray-200 rounded-full" />
                              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <Users size={12} /> {selectedClassDetail.studentCount} Alunos Matriculados
                              </p>
                           </div>
                        </div>
                     </div>
                     <button onClick={() => setSelectedClassDetail(null)} className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"><X size={20} /></button>
                  </div>

                  {/* TABELA MAIS LIMPA */}
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                              <th className="px-6 py-4 w-16">Nº</th>
                              <th className="px-6 py-4 w-32">Código</th>
                              <th className="px-6 py-4">Nome do Aluno</th>
                              <th className="px-6 py-4 w-28">Status</th>
                              <th className="px-6 py-4 text-right w-32">Ações</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {selectedClassDetail.students.map((student: any, idx: number) => (
                              <tr key={student.id} className="hover:bg-indigo-50/30 transition-all group">
                                 <td className="px-6 py-4">
                                    <span className="text-[10px] font-bold text-gray-300 group-hover:text-indigo-400 font-mono">
                                       {String(idx + 1).padStart(2, '0')}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className="text-[10px] font-bold text-gray-400 font-mono">
                                       {student.registration_number}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-gray-700 uppercase group-hover:text-gray-900 transition-colors">
                                       {student.name}
                                    </p>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex">
                                       <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                                          (student.status || '').startsWith('TRANSFERIDO') 
                                          ? 'bg-amber-100 text-amber-600' 
                                          : (student.status === 'ABANDONO' || student.status === 'FALECIDO') ? 'bg-red-100 text-red-600'
                                          : student.status === 'RECLASSIFICADO' ? 'bg-blue-100 text-blue-600'
                                          : 'bg-emerald-50 text-emerald-600'
                                       }`}>
                                          {student.status || 'ATIVO'}
                                       </span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                       <button 
                                          onClick={() => openStudentProfile(student)} 
                                          className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                          title="Editar Cadastro"
                                       >
                                          <Edit3 size={16} />
                                       </button>
                                       <button 
                                          onClick={() => openMovementHistory(student)} 
                                          className="p-2 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                          title="Movimentações"
                                       >
                                          <History size={16} />
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>

                     {selectedClassDetail.studentCount === 0 && (
                        <div className="py-20 text-center flex flex-col items-center gap-3 text-gray-300">
                           <Users size={40} className="opacity-10" />
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Nenhum aluno enturmado</p>
                        </div>
                     )}
                  </div>

                  {/* FOOTER DISCRETO */}
                  <div className="p-4 bg-gray-50/50 border-t border-gray-50 flex justify-center">
                     <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest font-mono">Escrituração Digital Registrada</p>
                  </div>
               </div>
            </div>
         )}

         {/* MODAL FICHA DO ALUNO (INTEGRADO DO REGISTRY) */}
         {isStudentModalOpen && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-indigo-950/70 backdrop-blur-lg animate-in fade-in duration-300">
               <div className="bg-white rounded-[4rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-10 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                     <div className="flex items-center gap-6">
                        <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-2xl">
                           <UserPlus size={32} />
                        </div>
                        <div>
                           <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                              {isEditingStudent ? 'Perfil do Aluno' : 'Novo Aluno'}
                           </h3>
                           <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Dados Cadastrais e Contatos</p>
                        </div>
                     </div>
                     <button onClick={() => setIsStudentModalOpen(false)} className="p-4 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-[1.5rem] transition-all shadow-sm"><X size={28} /></button>
                  </div>

                  <form onSubmit={handleSaveStudent} className="p-12 space-y-8 overflow-y-auto custom-scrollbar">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                              <input
                                 required
                                 value={studentForm.Nome}
                                 onChange={e => setStudentForm({ ...studentForm, Nome: e.target.value.toUpperCase() })}
                                 className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-black text-base outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all uppercase"
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Matrícula</label>
                                 <input
                                    required
                                    value={studentForm.registration_number}
                                    onChange={e => setStudentForm({ ...studentForm, registration_number: e.target.value })}
                                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nascimento</label>
                                 <input
                                    required
                                    type="date"
                                    value={studentForm.birth_date}
                                    onChange={e => setStudentForm({ ...studentForm, birth_date: e.target.value })}
                                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all"
                                 />
                              </div>
                           </div>
                           <div className="grid grid-cols-3 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sexo</label>
                                 <select
                                    value={studentForm.gender}
                                    onChange={e => setStudentForm({...studentForm, gender: e.target.value})}
                                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-black text-xs outline-none focus:bg-white"
                                 >
                                    <option value="MASCULINO">MASCULINO</option>
                                    <option value="FEMININO">FEMININO</option>
                                 </select>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PAED</label>
                                 <select
                                    value={studentForm.PAED}
                                    onChange={e => setStudentForm({...studentForm, PAED: e.target.value})}
                                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-black text-xs outline-none focus:bg-white"
                                 >
                                    <option>Não</option>
                                    <option>Sim</option>
                                 </select>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tr. Escolar</label>
                                 <select
                                    value={studentForm.TransporteEscolar}
                                    onChange={e => setStudentForm({...studentForm, TransporteEscolar: e.target.value})}
                                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-black text-xs outline-none focus:bg-white"
                                 >
                                    <option>Não</option>
                                    <option>Sim</option>
                                 </select>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div className="p-8 bg-indigo-900 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                              <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-indigo-300">
                                 <Building2 size={16} /> Contato do Responsável
                              </h4>
                              <div className="space-y-4">
                                 <div className="space-y-2">
                                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Nome do Responsável</label>
                                    <input
                                       required
                                       value={studentForm.NomeResponsavel}
                                       onChange={e => setStudentForm({ ...studentForm, NomeResponsavel: e.target.value.toUpperCase() })}
                                       className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl font-bold text-sm outline-none focus:bg-white/20 transition-all uppercase placeholder:text-indigo-700"
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                                    <div className="relative">
                                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={16} />
                                       <input
                                          required
                                          value={studentForm.TelefoneContato}
                                          onChange={e => setStudentForm({ ...studentForm, TelefoneContato: e.target.value })}
                                          className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/10 rounded-2xl font-bold text-sm outline-none focus:bg-white/20 transition-all"
                                       />
                                    </div>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{isEditingStudent ? 'Turma Atual' : 'Enturmação Inicial'}</label>
                                 <select
                                    value={studentForm.Turma}
                                    onChange={e => setStudentForm({ ...studentForm, Turma: e.target.value })}
                                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-black text-xs outline-none focus:bg-white"
                                 >
                                    <option value="SEM TURMA">SEM TURMA</option>
                                    {classrooms.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status de Matrícula</label>
                                 <select
                                    value={studentForm.status}
                                    onChange={e => setStudentForm({ ...studentForm, status: e.target.value })}
                                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-black text-xs outline-none focus:bg-white"
                                 >
                                    <option value="ATIVO">ATIVO</option>
                                    <option value="TRANSFERIDO">TRANSFERIDO (ANTIGO)</option>
                                    <option value="TRANSFERIDO DE TURMA">TRANSFERIDO DE TURMA</option>
                                    <option value="TRANSFERIDO DE ESCOLA">TRANSFERIDO DE ESCOLA</option>
                                    <option value="RECLASSIFICADO">RECLASSIFICADO</option>
                                    <option value="ABANDONO">ABANDONO</option>
                                    <option value="FALECIDO">FALECIDO</option>
                                 </select>
                              </div>
                           </div>
                        </div>
                     </div>

                     <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4">
                        <Save size={24} />
                        {isEditingStudent ? 'Atualizar Perfil' : 'Cadastrar na Escola'}
                     </button>
                  </form>
               </div>
            </div>
         )}

         {/* MODAL HISTÓRICO E MOVIMENTAÇÃO (INTEGRADO) */}
         {isMovementModalOpen && selectedStudentForMovement && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-indigo-950/80 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl p-10 flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-8 shrink-0">
                     <div>
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Movimentações</h3>
                        <p className="text-sm font-black text-indigo-600 uppercase mt-1">{selectedStudentForMovement.Nome}</p>
                     </div>
                     <button onClick={() => setIsMovementModalOpen(false)} className="p-4 bg-gray-50 text-gray-400 hover:text-red-500 rounded-3xl transition-all shadow-sm"><X size={24} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto mb-10 pr-2 custom-scrollbar">
                     {movements.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-[3rem] border-2 border-gray-100 border-dashed">
                           <History size={48} className="mx-auto text-gray-200 mb-4" />
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhuma movimentação registrada</p>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           {movements.map((mov) => (
                              <div key={mov.id} className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex justify-between items-start hover:border-indigo-200 transition-all">
                                 <div>
                                    <div className="flex items-center gap-3 mb-2">
                                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                          mov.movement_type === 'TRANSFERENCIA' ? 'bg-amber-100 text-amber-700' : 
                                          mov.movement_type === 'RECLASSIFICADO' ? 'bg-emerald-100 text-emerald-700' :
                                          'bg-blue-100 text-blue-700'
                                       }`}>
                                          {mov.movement_type}
                                       </span>
                                       <span className="text-[10px] font-black text-gray-300 font-mono">{formatDateSafe(mov.movement_date)}</span>
                                    </div>
                                    <p className="text-xs font-black text-gray-700 uppercase leading-relaxed">{mov.description}</p>
                                    {mov.destination_school && <p className="text-[9px] font-bold text-indigo-400 mt-1 uppercase font-mono">Destino: {mov.destination_school}</p>}
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  <form onSubmit={handleRegisterMovement} className="pt-8 border-t border-gray-100 shrink-0 space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Evento</label>
                           <select 
                              value={newMovement.type}
                              onChange={e => setNewMovement({...newMovement, type: e.target.value, is_reclassified: e.target.value === 'RECLASSIFICADO'})}
                              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs outline-none"
                           >
                              <option value="TRANSFERENCIA">TRANSFERÊNCIA</option>
                              <option value="RECLASSIFICADO">RECLASSIFICADO</option>
                              <option value="ATESTADO">ATESTADO MÉDICO</option>
                              <option value="ABANDONO">ABANDONO</option>
                              <option value="OUTROS">OUTROS</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                           <input 
                              type="date"
                              value={newMovement.date}
                              onChange={e => setNewMovement({...newMovement, date: e.target.value})}
                              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs"
                           />
                        </div>
                     </div>
                     <textarea 
                        placeholder="Descreva o motivo ou detalhes..."
                        value={newMovement.description}
                        onChange={e => setNewMovement({...newMovement, description: e.target.value})}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-xs min-h-[80px] resize-none outline-none"
                     />
                     <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl">
                        Registrar Movimentação
                     </button>
                  </form>
               </div>
            </div>
         )}

         {/* MODAL NOVA TURMA */}
         {isCreateClassModalOpen && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl p-8 overflow-hidden">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Nova Turma</h3>
                     <button onClick={() => setIsCreateClassModalOpen(false)}><X size={24} className="text-gray-300 hover:text-red-500" /></button>
                  </div>
                  <form onSubmit={handleCreateClass} className="space-y-6">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Turma</label>
                        <input required placeholder="EX: 6º ANO A" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value.toUpperCase() })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white uppercase" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Série/Ano</label>
                           <select value={newClass.year} onChange={e => setNewClass({ ...newClass, year: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-xs" >
                              {["6º ANO", "7º ANO", "8º ANO", "9º ANO"].map(y => <option key={y} value={y}>{y}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Turno</label>
                           <select value={newClass.shift} onChange={e => setNewClass({ ...newClass, shift: e.target.value as Shift })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-xs" >
                              {["MATUTINO", "VESPERTINO"].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                     </div>
                     <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                        <Plus size={16} /> Criar Turma
                     </button>
                  </form>
               </div>
            </div>
         )}

      </div>
   );
};

export default SecretariatClassroomManager;
