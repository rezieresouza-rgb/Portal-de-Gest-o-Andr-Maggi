import React, { useState, useEffect, useMemo } from 'react';
import {
   Briefcase,
   Search,
   Plus,
   User,
   Mail,
   Calendar,
   Clock,
   FileText,
   ChevronRight,
   ShieldCheck,
   CheckCircle2,
   AlertTriangle,
   History,
   X,
   Save,
   ShieldAlert,
   Trash2,
   Edit3,
   GraduationCap,
   Baby,
   FileBadge,
   Filter,
   Fingerprint,
   Info,
   CheckSquare,
   Square,
   BookMarked,
   ArrowRightLeft,
   ArrowUpRight,
   Send,
   Camera,
   Download,
   AlertCircle,
   FileDown,
   Printer,
   Loader2,
   UserCheck,
   ClipboardList,
   PlusCircle,
   BookOpen,
   Sun,
   Moon,
   CloudSun,
   Scale,
   CalendarDays,
   Users,
   Lock
} from 'lucide-react';
import { StaffMember, UserRole, StaffMovement, MovementType, Shift } from '../types';
import { supabase } from '../supabaseClient';
import { extractStaffInfo } from '../geminiService';

const STAFF_FUNCTIONS = [
   "DIRETOR",
   "COORDENADOR PEDAGÓGICO",
   "SECRETÁRIO",
   "REGÊNCIA",
   "BUSCA ATIVA",
   "MEDIADOR",
   "PSICOSSOCIAL",
   "BIBLIOTECA",
   "LIMPEZA",
   "NUTRIÇÃO",
   "AUXILIAR DE PÁTIO",
   "AUXILIAR DE COORDENAÇÃO PEDAGÓGICA",
   "ASSISTENTE DE EDUCAÇÃO ESPECIAL",
   "APA",
   "SALA DE RECURSOS",
   "OUTROS"
];

const SecretariatStaffManager: React.FC = () => {
   const [staff, setStaff] = useState<StaffMember[]>([]);
   const [movementsData, setMovementsData] = useState<StaffMovement[]>([]);
   const [loading, setLoading] = useState(true);

   const [activeTab, setActiveTab] = useState<'ativos' | 'afastados' | 'movements' | 'calendar'>('ativos');
   const [roleFilter, setRoleFilter] = useState<string>('TODOS');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');
   const [editingId, setEditingId] = useState<string | null>(null);
   const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
   const [isImporting, setIsImporting] = useState(false);
   const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
   const fileInputRef = React.useRef<HTMLInputElement>(null);

   const [form, setForm] = useState<Partial<StaffMember>>({
      code: '',
      name: '',
      registration: '',
      cpf: '',
      birthDate: '',
      entryProfile: '',
      qualification: '',
      serverType: 'Professor',
      jobFunction: '',
      shift: 'MATUTINO',
      role: 'PROFESSOR',
      email: '',
      assignedSubjects: [],
      workload: 0,
      contractTerm: { start: '', end: '' },
      additionalClasses: [],
      additionalWorkloadHours: 0,
      additionalWorkloadTerm: { start: '', end: '' },
      status: 'EM_ATIVIDADE',
      notifyAlerts: true,
      photoUrl: '',
      movementHistory: []
   });

   const [movementForm, setMovementForm] = useState<Partial<StaffMovement>>({
      type: 'FÉRIAS',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      durationDays: 0,
      substituteId: '',
      substituteName: '',
      reason: '',
      notes: '',
      responsible: 'GESTOR ANDRÉ',
      attachmentUrl: ''
   });

   // --- Data Fetching ---

   const fetchData = async () => {
      setLoading(true);
      try {
         // Fetch Staff
         const { data: staffData, error: staffError } = await supabase
            .from('staff')
            .select('*')
            .order('name');

         if (staffError) throw staffError;

         // Fetch Movements
         const { data: movData, error: movError } = await supabase
            .from('staff_movements')
            .select('*')
            .order('start_date', { ascending: false });

         if (movError) throw movError;

         // Map Staff
         const mappedStaff: StaffMember[] = (staffData || []).map((s: any) => ({
            id: s.id,
            code: s.code,
            registration: s.registration,
            name: s.name,
            role: s.role as UserRole,
            cpf: s.cpf,
            birthDate: s.birth_date,
            entryProfile: s.entry_profile,
            qualification: s.qualification,
            serverType: s.server_type as any,
            jobFunction: s.job_function,
            shift: s.shift as Shift,
            email: s.email,
            status: s.status as any,
            workload: s.workload,
            assignedSubjects: s.assigned_subjects,
            contractTerm: s.contract_term,
            additionalWorkloadHours: s.additional_workload_hours,
            additionalWorkloadTerm: s.additional_workload_term,
            notifyAlerts: s.notify_alerts,
            photoUrl: s.photo_url,
            movementHistory: [] // Will populate or link later
         }));

         // Map Movements
         const mappedMovs: StaffMovement[] = (movData || []).map((m: any) => ({
            id: m.id,
            staffId: m.staff_id,
            type: m.type as MovementType,
            startDate: m.start_date,
            endDate: m.end_date,
            durationDays: m.duration_days,
            substituteId: m.substitute_id,
            reason: m.reason,
            notes: m.notes,
            responsible: m.responsible,
            attachmentUrl: m.attachment_url,
            created_at: m.created_at
         }));

         // Enrich Movements with Names
         const finalMovs = mappedMovs.map(m => {
            const s = mappedStaff.find(st => st.id === m.staffId);
            const sub = mappedStaff.find(st => st.id === m.substituteId);
            return {
               ...m,
               staffName: s?.name || 'DESCONHECIDO',
               staffRole: s?.role || '',
               substituteName: sub?.name || (m.substituteId ? 'EXTERNO' : '')
            };
         });

         setStaff(mappedStaff);
         setMovementsData(finalMovs);

      } catch (error) {
         console.error("Error loading staff data:", error);
         alert("Erro ao carregar dados dos servidores.");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   // Fetch linked user password when editing
   useEffect(() => {
      const fetchLinkedUser = async () => {
         if (editingId && form.email) {
            const { data, error } = await supabase
               .from('users')
               .select('password_hash, role')
               .eq('email', form.email)
               .maybeSingle();

            if (data && !error) {
               setForm(prev => ({
                  ...prev,
                  password: data.password_hash,
                  userRole: data.role as any
               }));
            }
         }
      };

      if (isModalOpen && editingId) {
         fetchLinkedUser();
      }
   }, [isModalOpen, editingId, form.email]);

   // --- Logic ---

   useEffect(() => {
      if (movementForm.startDate && movementForm.endDate) {
         const start = new Date(movementForm.startDate);
         const end = new Date(movementForm.endDate);
         const diffTime = Math.abs(end.getTime() - start.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
         setMovementForm(prev => ({ ...prev, durationDays: diffDays > 0 ? diffDays : 0 }));
      }
   }, [movementForm.startDate, movementForm.endDate]);

   const MOVEMENT_TYPES: MovementType[] = ['FÉRIAS', 'LICENÇA PRÊMIO', 'ATESTADO', 'AFASTAMENTO', 'RETORNO'];

   const handleImportStaffPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type !== 'application/pdf') {
         alert('Por favor, selecione um arquivo PDF válido.');
         return;
      }

      setIsImporting(true);
      try {
         const reader = new FileReader();
         reader.readAsDataURL(file);

         reader.onload = async () => {
            const base64Data = reader.result?.toString().split(',')[1];
            if (!base64Data) throw new Error("Falha ao ler o arquivo.");

            const extractedData = await extractStaffInfo(base64Data, "application/pdf");

            const staffList = extractedData.staffList || [];

            if (staffList.length === 0) {
               alert("Não foi possível extrair dados de servidores deste PDF.");
               return;
            }

            if (staffList.length === 1) {
               // Single Staff - Old Behavior
               const data = staffList[0];
               setForm(prev => ({
                  ...prev,
                  name: data.name?.toUpperCase() || '',
                  cpf: data.cpf || '',
                  registration: data.registration || '',
                  birthDate: data.birthDate || '',
                  qualification: data.qualification?.toUpperCase() || '',
                  entryProfile: data.entryProfile?.toUpperCase() || '',
                  role: (data.role?.toUpperCase() as any) || 'PROFESSOR',
                  serverType: (data.role?.toUpperCase().includes('PROFESSOR') ? 'Professor' : 'Apoio') as any,
                  jobFunction: data.role?.toUpperCase() || ''
               }));
               setIsModalOpen(true);
               setEditingId(null);
               alert("Dados extraídos com sucesso! Verifique e complete o cadastro.");
            } else {
               // Multiple Staff - Bulk Import
               let successCount = 0;
               for (const data of staffList) {
                  try {
                     const targetRole = data.role?.toUpperCase().includes('PROFESSOR') ? 'PROFESSOR' : 'MANUTENCAO'; // Basic mapping

                     await supabase.from('staff').insert([{
                        id: String(Date.now() + Math.random()),
                        code: 'AUTO-' + Math.floor(Math.random() * 1000),
                        registration: data.registration || '',
                        name: data.name?.toUpperCase(),
                        role: targetRole,
                        cpf: data.cpf,
                        birth_date: data.birthDate,
                        entry_profile: data.entryProfile?.toUpperCase(),
                        qualification: data.qualification?.toUpperCase(),
                        server_type: targetRole === 'PROFESSOR' ? 'Professor' : 'Apoio',
                        job_function: data.role?.toUpperCase(),
                        shift: 'MATUTINO', // Default
                        status: 'EM_ATIVIDADE'
                     }]);
                     successCount++;
                  } catch (err) {
                     console.error("Erro ao importar servidor da lista:", data.name, err);
                  }
               }
               await fetchData();
               alert(`Importação em Lote Concluída!\n\n${successCount} servidores importados de ${staffList.length} encontrados.`);
            }
         };

      } catch (error) {
         console.error("Erro na importação:", error);
         alert("Erro ao processar o arquivo.");
      } finally {
         setIsImporting(false);
         if (fileInputRef.current) fileInputRef.current.value = '';
      }
   };

   const handleDelete = async (id: string) => {
      if (window.confirm("Deseja realmente excluir este servidor permanentemente? Todos os históricos vinculados serão perdidos.")) {
         const { error } = await supabase.from('staff').delete().eq('id', id);
         if (error) {
            alert("Erro ao excluir.");
         } else {
            setStaff(prev => prev.filter(s => s.id !== id));
            setSelectedStaffIds(prev => prev.filter(sid => sid !== id));
         }
      }
   };

   const toggleSelectAll = () => {
      if (selectedStaffIds.length === filteredStaff.length && filteredStaff.length > 0) {
         setSelectedStaffIds([]);
      } else {
         setSelectedStaffIds(filteredStaff.map(s => s.id!));
      }
   };

   const toggleSelectStaff = (id: string) => {
      if (selectedStaffIds.includes(id)) {
         setSelectedStaffIds(prev => prev.filter(sid => sid !== id));
      } else {
         setSelectedStaffIds(prev => [...prev, id]);
      }
   };

   const handleBulkDelete = async () => {
      if (selectedStaffIds.length === 0) return;

      if (window.confirm(`ATENÇÃO: Você está prestes a excluir ${selectedStaffIds.length} servidores.\n\nEsta ação é irreversível e excluirá todo o histórico destes servidores.\n\nDeseja continuar?`)) {
         try {
            setLoading(true);
            const { error } = await supabase
               .from('staff')
               .delete()
               .in('id', selectedStaffIds);

            if (error) throw error;

            alert("Servidores excluídos com sucesso!");
            setSelectedStaffIds([]);
            await fetchData();
         } catch (error: any) {
            console.error("Erro deletar em massa:", error);
            alert("Erro ao excluir servidores: " + error.message);
         } finally {
            setLoading(false);
         }
      }
   };

   const handleSaveMovement = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedStaff || !movementForm.type || !movementForm.startDate) return;

      try {
         const { data, error } = await supabase.from('staff_movements').insert([{
            staff_id: selectedStaff.id,
            type: movementForm.type,
            start_date: movementForm.startDate,
            end_date: movementForm.endDate,
            duration_days: movementForm.durationDays,
            substitute_id: movementForm.substituteId || null,
            reason: movementForm.reason?.toUpperCase(),
            notes: movementForm.notes?.toUpperCase(),
            responsible: movementForm.responsible,
            attachment_url: movementForm.attachmentUrl
         }]).select().single();

         if (error) throw error;

         // Update Staff Status
         let newStatus = selectedStaff.status;
         if (movementForm.type === 'AFASTAMENTO') newStatus = 'AFASTADO';
         if (movementForm.type === 'FÉRIAS') newStatus = 'FERIAS';
         if (movementForm.type === 'LICENÇA PRÊMIO') newStatus = 'LICENCA_PREMIO';
         if (movementForm.type === 'ATESTADO') newStatus = 'LICENCA_MEDICA';
         if (movementForm.type === 'RETORNO') newStatus = 'EM_ATIVIDADE';

         if (newStatus !== selectedStaff.status) {
            await supabase.from('staff').update({ status: newStatus }).eq('id', selectedStaff.id);
            setStaff(prev => prev.map(s => s.id === selectedStaff.id ? { ...s, status: newStatus } : s));
         }

         await fetchData(); // Refresh all
         setIsMovementModalOpen(false);
         setSelectedStaff(null);
         alert("Movimentação registrada com sucesso!");

      } catch (err) {
         console.error(err);
         alert("Erro ao salvar movimentação.");
      }
   };

   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();

      let targetRole: UserRole = 'USUARIO_COMUM';
      const job = (form.jobFunction || "").toUpperCase();
      const type = form.serverType || 'Apoio';

      // 1. Prioridade: Funções de Gestão e Administração independente do tipo de servidor
      if (job.includes('DIREÇÃO') || job.includes('DIRETOR') || job.includes('COORDENADOR') || job.includes('GESTOR')) {
         targetRole = 'GESTAO';
      } else if (job.includes('SECRETÁRIO') || job.includes('SECRETARIA') || job.includes('ADM')) {
         targetRole = 'SECRETARIA';
      } else if (job.includes('PSICOSSOCIAL') || job.includes('MEDIAÇÃO') || job.includes('MEDIADOR') || job.includes('PSICÓLOG') || job.includes('BUSCA ATIVA')) {
         targetRole = 'PSICOSSOCIAL';
      }
      // 2. Prioridade: Tags específicas para pessoal de Apoio
      else if (job.includes('NUTRIÇÃO') || job.includes('COZINHA') || job.includes('MERENDA')) {
         targetRole = 'AEE_NUTRICAO';
      } else if (job.includes('LIMPEZA') || job.includes('ZELADORIA')) {
         targetRole = 'AAE_LIMPEZA';
      }
      // 3. Fallback: Baseado no Tipo de Servidor
      else {
         if (type === 'Professor') {
            targetRole = 'PROFESSOR';
         } else if (type === 'Técnico') {
            targetRole = 'TAE';
         } else {
            targetRole = 'AAE';
         }
      }

      const serverData = {
         code: form.code,
         registration: form.registration,
         name: form.name?.toUpperCase(),
         role: form.userRole || targetRole, // Use explicit userRole if selected
         cpf: form.cpf,
         birth_date: form.birthDate,
         entry_profile: form.entryProfile?.toUpperCase(),
         qualification: form.qualification?.toUpperCase(),
         server_type: form.serverType,
         job_function: form.jobFunction?.toUpperCase(),
         shift: form.shift,
         email: form.email,
         status: form.status,
         workload: form.workload,
         assigned_subjects: form.assignedSubjects,
         contract_term: form.contractTerm,
         additional_workload_hours: form.additionalWorkloadHours,
         additional_workload_term: form.additionalWorkloadTerm,
         notify_alerts: form.notifyAlerts,
         photo_url: form.photoUrl
      };

      try {
         let currentStaffId = editingId || String(Date.now());

         if (editingId) {
            const { error } = await supabase.from('staff').update(serverData).eq('id', editingId);
            if (error) throw error;
         } else {
            const { error } = await supabase.from('staff').insert([{
               id: currentStaffId,
               ...serverData
            }]);
            if (error) throw error;
         }

         // --- INTEGRATION: Create/Update System User ---
         const cleanCpf = (serverData.cpf || "").replace(/\D/g, "");
         if (cleanCpf || serverData.email) {
            // Find existing user by email or CPF
            let query = supabase.from('users').select('id, login, email, cpf');

            if (serverData.email && cleanCpf) {
               query = query.or(`email.eq."${serverData.email}",cpf.eq."${cleanCpf}"`);
            } else if (serverData.email) {
               query = query.eq('email', serverData.email);
            } else {
               query = query.eq('cpf', cleanCpf);
            }

            const { data: existingUser } = await query.maybeSingle();

            const passwordToSet = form.password || 'Mudar123!';
            const userData = {
               name: serverData.name,
               login: cleanCpf || existingUser?.login || serverData.email,
               email: serverData.email || null,
               cpf: cleanCpf || null,
               role: (form.userRole as UserRole) || targetRole,
               password_hash: passwordToSet,
               status: 'ATIVO'
            };

            if (existingUser) {
               const { error: userUpdateError } = await supabase
                  .from('users')
                  .update(userData)
                  .eq('id', existingUser.id);

               if (userUpdateError) console.error("Erro ao atualizar usuário:", userUpdateError);
            } else {
               const { error: userCreateError } = await supabase
                  .from('users')
                  .insert([userData]);

               if (userCreateError) console.error("Erro ao criar usuário:", userCreateError);
               else alert(`✅ Servidor salvo e Usuário de Sistema criado!\n\nLOGIN: ${userData.login}\nSENHA: ${passwordToSet}`);
            }
         }
         // ---------------------------------------------

         await fetchData();
         setIsModalOpen(false);
         resetForm();
      } catch (err) {
         console.error(err);
         alert("Erro ao salvar servidor.");
      }
   };

   const resetForm = () => {
      setForm({
         code: '', name: '', registration: '', cpf: '', birthDate: '',
         entryProfile: '', qualification: '', serverType: 'Professor', jobFunction: '', role: 'PROFESSOR',
         email: '', password: '', userRole: '' as any, assignedSubjects: [], workload: 0, contractTerm: { start: '', end: '' },
         additionalClasses: [], status: 'EM_ATIVIDADE', shift: 'MATUTINO'
      });
      setEditingId(null);
   };

   const filteredStaff = useMemo(() => {
      return staff.filter(member => {
         const matchSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || member.registration.includes(searchTerm);
         const matchRole = roleFilter === 'TODOS' || member.role === roleFilter;
         const matchStatus = activeTab === 'ativos' ? member.status === 'EM_ATIVIDADE' : activeTab === 'afastados' ? member.status !== 'EM_ATIVIDADE' : true;
         if (activeTab === 'calendar' || activeTab === 'movements') return true; // Don't filter by status on these tabs
         return matchSearch && matchRole && matchStatus;
      });
   }, [staff, searchTerm, roleFilter, activeTab]);

   const getShiftIcon = (shift: Shift) => {
      switch (shift) {
         case 'MATUTINO': return <Sun size={12} className="text-amber-50" />;
         case 'VESPERTINO': return <CloudSun size={12} className="text-orange-500" />;
         case 'INTEGRAL': return <Sun size={12} className="text-blue-500" />;
         case 'NOTURNO': return <Moon size={12} className="text-indigo-400" />;
         default: return <Clock size={12} className="text-gray-400" />;
      }
   };

   const isContratado = form.entryProfile === 'CONTRATADO';

   // --- Calendar Logic ---
   const renderCalendar = () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const monthName = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

      // Filter active movements in current month
      const activeMovementsInMonth = movementsData.filter(m => {
         const start = new Date(m.startDate);
         const end = m.endDate ? new Date(m.endDate) : new Date(start);
         return (start.getMonth() === currentMonth || end.getMonth() === currentMonth) &&
            (start.getFullYear() === currentYear || end.getFullYear() === currentYear);
      });

      return (
         <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-8 animate-in fade-in">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                  <CalendarDays size={20} className="text-indigo-600" /> Calendário de Ausências - {monthName}
               </h3>
               <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400"><span className="w-2 h-2 rounded-full bg-red-400"></span> Férias/Licença</span>
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Substituto</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {activeMovementsInMonth.length > 0 ? activeMovementsInMonth.map(mov => (
                  <div key={mov.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex flex-col gap-3">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(mov.startDate).toLocaleDateString('pt-BR')} - {mov.endDate ? new Date(mov.endDate).toLocaleDateString('pt-BR') : '...'}</p>
                           <h4 className="font-black text-gray-800 uppercase text-sm mt-1">{mov.staffName}</h4>
                           <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-2 py-0.5 rounded border border-red-100 mt-1 inline-block">{mov.type}</span>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center text-xs font-black text-gray-500">
                           {mov.staffName?.[0]}
                        </div>
                     </div>

                     {/* Substitute Section */}
                     <div className="mt-2 pt-3 border-t border-gray-200">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Substituído Por:</p>
                        {mov.substituteName ? (
                           <div className="flex items-center gap-2">
                              <UserCheck size={14} className="text-emerald-500" />
                              <span className="text-xs font-bold text-emerald-700 uppercase">{mov.substituteName}</span>
                           </div>
                        ) : (
                           <span className="text-[10px] italic text-gray-400">Sem substituto indicado</span>
                        )}
                     </div>
                  </div>
               )) : (
                  <div className="col-span-3 py-10 text-center text-gray-400 font-bold uppercase text-xs">
                     Nenhuma ausência registrada neste mês.
                  </div>
               )}
            </div>
         </div>
      );
   };

   if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">

         {/* HEADER RH */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl">
                  <Briefcase size={32} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">Gestão de Servidores & RH</h3>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">Controle Funcional e Movimentações</p>
               </div>
            </div>
            <div className="flex flex-wrap gap-3">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                     type="text"
                     placeholder="Busca por nome ou matrícula..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="pl-12 pr-6 py-3.5 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all w-64 md:w-80"
                  />
               </div>
               <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-black transition-all">
                  <Plus size={16} /> Novo Cadastro
               </button>
               <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"
               >
                  {isImporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                  Importar PDF
               </button>
               <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportStaffPDF}
                  className="hidden"
                  accept=".pdf"
               />
            </div>
         </div>

         {/* TABS E FILTROS */}
         <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
               {[
                  { id: 'ativos', label: 'Quadro Ativo', icon: Users },
                  { id: 'afastados', label: 'Licenças/Afastados', icon: UserCheck },
                  { id: 'movements', label: 'Log de Movimentações', icon: History },
                  { id: 'calendar', label: 'Calendário Ausências', icon: CalendarDays }
               ].map(t => (
                  <button
                     key={t.id}
                     onClick={() => setActiveTab(t.id as any)}
                     className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                  >
                     <t.icon size={12} />
                     {t.label}
                  </button>
               ))}
            </div>

            <div className="flex items-center gap-3">
               <Filter size={14} className="text-gray-300" />
               <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-[9px] font-black uppercase outline-none"
               >
                  <option value="TODOS">Todos os Cargos</option>
                  <option value="PROFESSOR">Professor</option>
                  <option value="SECRETARIA">Secretaria</option>
                  <option value="GESTAO">Gestão</option>
                  <option value="PSICOSSOCIAL">Mediação</option>
                  <option value="AAE">AAE</option>
                  <option value="TAE">TAE</option>
                  <option value="AAE_LIMPEZA">AAE/Limpeza</option>
                  <option value="AEE_NUTRICAO">AEE/Nutrição</option>
               </select>
            </div>
         </div>

         {activeTab === 'calendar' ? renderCalendar() :
            activeTab === 'movements' ? (
               <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                     <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                        <History size={20} className="text-emerald-600" /> Histórico Geral de RH
                     </h3>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{movementsData.length} Registros Processados</p>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                              <th className="px-8 py-5">Período</th>
                              <th className="px-8 py-5">Servidor</th>
                              <th className="px-8 py-5">Tipo</th>
                              <th className="px-8 py-5">Substituto / Justificativa</th>
                              <th className="px-8 py-5 text-right">Ações</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {movementsData.map(mov => (
                              <tr key={mov.id} className="hover:bg-gray-50/50 transition-colors group">
                                 <td className="px-8 py-5">
                                    <p className="text-xs font-black text-gray-900">{new Date(mov.startDate).toLocaleDateString('pt-BR')} a {mov.endDate ? new Date(mov.endDate).toLocaleDateString('pt-BR') : '---'}</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase">{mov.durationDays} dias</p>
                                 </td>
                                 <td className="px-8 py-5">
                                    <p className="text-xs font-black text-gray-800 uppercase">{mov.staffName}</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">{mov.staffRole}</p>
                                 </td>
                                 <td className="px-8 py-5">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${mov.type === 'AFASTAMENTO' || mov.type === 'ATESTADO' ? 'bg-red-50 text-red-700 border-red-100' :
                                       mov.type === 'RETORNO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                       }`}>{mov.type}</span>
                                 </td>
                                 <td className="px-8 py-5">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase leading-none truncate w-48">SUB: {mov.substituteName || 'NÃO INFORMADO'}</p>
                                    <p className="text-[9px] font-medium text-gray-400 mt-1 uppercase line-clamp-1 italic">"{mov.reason}"</p>
                                 </td>
                                 <td className="px-8 py-5 text-right">
                                    {mov.attachmentUrl && (
                                       <a href={mov.attachmentUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-[9px] font-bold uppercase">Ver Anexo</a>
                                    )}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            ) : (
               <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                  {/* Bulk Action Bar */}
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                     <div className="flex items-center gap-4">
                        <input
                           type="checkbox"
                           className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                           checked={selectedStaffIds.length === filteredStaff.length && filteredStaff.length > 0}
                           onChange={toggleSelectAll}
                        />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                           {selectedStaffIds.length} Selecionados
                        </span>
                     </div>
                     {selectedStaffIds.length > 0 && (
                        <button
                           onClick={handleBulkDelete}
                           className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-100 transition-all animate-in fade-in slide-in-from-right-5"
                        >
                           <Trash2 size={14} /> Excluir ({selectedStaffIds.length})
                        </button>
                     )}
                  </div>

                  <div className="divide-y divide-gray-50">
                     {filteredStaff.length > 0 ? filteredStaff.map(member => (
                        <div key={member.id} className={`p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:bg-gray-50/50 transition-all group relative ${selectedStaffIds.includes(member.id!) ? 'bg-indigo-50/30' : ''}`}>
                           {/* Selection Checkbox */}
                           <div className="absolute left-6 top-1/2 -translate-y-1/2">
                              <input
                                 type="checkbox"
                                 className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                 checked={selectedStaffIds.includes(member.id!)}
                                 onChange={() => toggleSelectStaff(member.id!)}
                              />
                           </div>

                           <div className="flex items-center gap-6 flex-1 pl-8">
                              <div className="w-16 h-16 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center justify-center text-emerald-600 font-black text-xl group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0 shadow-inner overflow-hidden">
                                 {member.photoUrl ? <img src={member.photoUrl} alt="" className="w-full h-full object-cover" /> : member.name[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-3">
                                    <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight truncate">{member.name}</h4>
                                    <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border shrink-0 ${member.status === 'EM_ATIVIDADE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                                       }`}>
                                       {member.status.replace('_', ' ')}
                                    </span>
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[7px] font-black uppercase border bg-gray-50 border-gray-200 shrink-0">
                                       {getShiftIcon(member.shift)} {member.shift}
                                    </span>
                                 </div>

                                 <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5"><Fingerprint size={12} className="text-indigo-500" /> CPF: {member.cpf}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5"><FileBadge size={12} className="text-blue-500" /> MAT: {member.registration}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-500" /> {member.jobFunction}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5"><BookOpen size={12} className="text-amber-500" /> {member.qualification}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5"><Clock size={12} /> {member.workload}h</span>
                                 </div>
                              </div>
                           </div>

                           <div className="flex items-center gap-3 no-print">
                              <button
                                 onClick={() => { setSelectedStaff(member); setIsMovementModalOpen(true); }}
                                 className="px-5 py-3 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-100 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
                              >
                                 <ArrowRightLeft size={14} /> Movimentar
                              </button>
                              <button
                                 onClick={() => { setForm(member); setEditingId(member.id); setIsModalOpen(true); }}
                                 className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100"
                                 title="Editar Cadastro"
                              >
                                 <Edit3 size={18} />
                              </button>
                              <button
                                 onClick={() => handleDelete(member.id)}
                                 className="p-3 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100"
                                 title="Excluir Registro"
                              >
                                 <Trash2 size={18} />
                              </button>
                           </div>
                        </div>
                     )) : (
                        <div className="p-20 text-center">
                           <p className="text-gray-300 font-bold uppercase tracking-widest text-xs">Nenhum servidor encontrado</p>
                        </div>
                     )}
                  </div>
               </div>
            )}

         {/* MODAL CADASTRO DINÂMICO CONFORME JSON ESPECIFICADO */}
         {isModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-5">
                        <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl">
                           {editingId ? <Edit3 size={28} /> : <Plus size={28} />}
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                              {editingId ? 'Editar Servidor' : 'Novo Servidor'}
                           </h3>
                           <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">Formulário de Cadastro RH Escolar</p>
                        </div>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                     <form onSubmit={handleSave} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Código do Sistema</label>
                              <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="RH-000" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Matrícula</label>
                              <input required value={form.registration} onChange={e => setForm({ ...form, registration: e.target.value })} placeholder="Número Matrícula" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                           <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })} placeholder="NOME DO SERVIDOR" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white uppercase" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CPF</label>
                              <input required value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                              <input required type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Perfil de Ingresso</label>
                              <select required value={form.entryProfile} onChange={e => setForm({ ...form, entryProfile: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white">
                                 <option value="">Selecione...</option>
                                 <option value="EFETIVO">EFETIVO</option>
                                 <option value="CONTRATADO">CONTRATADO</option>
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Habilitação (Formação)</label>
                              <input required value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value.toUpperCase() })} placeholder="EX: LICENCIATURA PLENA EM HISTÓRIA" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white uppercase" />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Servidor</label>
                              <select required value={form.serverType} onChange={e => setForm({ ...form, serverType: e.target.value as any })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white">
                                 <option value="Professor">Professor</option>
                                 <option value="Apoio">Apoio</option>
                                 <option value="Técnico">Técnico</option>
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turno de Atuação</label>
                              <select required value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value as any })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white">
                                 <option value="MATUTINO">MATUTINO</option>
                                 <option value="VESPERTINO">VESPERTINO</option>
                                 <option value="INTEGRAL">INTEGRAL</option>
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Função Atual</label>
                              <select
                                 required
                                 value={form.jobFunction || ""}
                                 onChange={e => setForm({ ...form, jobFunction: e.target.value })}
                                 className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white"
                              >
                                 <option value="">Selecione...</option>
                                 {STAFF_FUNCTIONS.map(fn => <option key={fn} value={fn}>{fn}</option>)}
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail Institucional / Contato</label>
                              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value.toLowerCase() })} placeholder="exemplo@edu.br" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Foto URL (Opcional)</label>
                              <input value={form.photoUrl || ''} onChange={e => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://..." className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                           </div>
                        </div>

                        {/* CONDIÇÕES ESPECIFICADAS NO JSON */}

                        {form.serverType === 'Professor' && (
                           <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 space-y-6 animate-in slide-in-from-top-2">
                              <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                                 <Scale size={16} /> Atribuição de Aula
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1">Disciplina Atribuída</label>
                                    <select
                                       value={form.assignedSubjects?.[0] || ''}
                                       onChange={e => {
                                          setForm({ ...form, assignedSubjects: [e.target.value] });
                                       }}
                                       className="w-full p-4 bg-white border border-amber-200 rounded-2xl font-black text-xs uppercase"
                                    >
                                       <option value="">Selecione...</option>
                                       {["Matemática", "Português", "História", "Geografia", "Ciências", "Educação Física", "Artes", "Inglês"].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1">Carga Horária (Horas)</label>
                                    <input type="number" value={form.workload} onChange={e => setForm({ ...form, workload: Number(e.target.value) })} className="w-full p-4 bg-white border border-amber-200 rounded-2xl font-black text-lg text-center" />
                                 </div>
                              </div>

                              {/* ADDITIONAL WORKLOAD SECTION */}
                              <div className="pt-4 border-t border-amber-200/50">
                                 <div className="flex items-center gap-2 mb-4">
                                    <input
                                       type="checkbox"
                                       id="hasAdditional"
                                       checked={(form.additionalWorkloadHours || 0) > 0}
                                       onChange={e => {
                                          if (e.target.checked) {
                                             setForm({ ...form, additionalWorkloadHours: 4 }); // Default start value
                                          } else {
                                             setForm({ ...form, additionalWorkloadHours: 0, additionalWorkloadTerm: { start: '', end: '' } });
                                          }
                                       }}
                                       className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 border-gray-300"
                                    />
                                    <label htmlFor="hasAdditional" className="text-xs font-black text-amber-800 uppercase cursor-pointer select-none">
                                       Possui Aulas Adicionais (Extensão)?
                                    </label>
                                 </div>

                                 {((form.additionalWorkloadHours || 0) > 0) && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-amber-200 animate-in fade-in slide-in-from-top-1">
                                       <div className="space-y-1">
                                          <label className="text-[8px] font-black text-amber-500 uppercase tracking-widest ml-1">Qtd. Horas</label>
                                          <input type="number" value={form.additionalWorkloadHours} onChange={e => setForm({ ...form, additionalWorkloadHours: Number(e.target.value) })} className="w-full p-3 bg-amber-50 border border-amber-100 rounded-xl font-bold text-center text-amber-900" />
                                       </div>
                                       <div className="space-y-1">
                                          <label className="text-[8px] font-black text-amber-500 uppercase tracking-widest ml-1">Início Vigência</label>
                                          <input type="date" value={form.additionalWorkloadTerm?.start} onChange={e => setForm({ ...form, additionalWorkloadTerm: { ...form.additionalWorkloadTerm!, start: e.target.value, end: form.additionalWorkloadTerm?.end || '' } })} className="w-full p-3 bg-amber-50 border border-amber-100 rounded-xl font-bold text-xs uppercase text-amber-900" />
                                       </div>
                                       <div className="space-y-1">
                                          <label className="text-[8px] font-black text-amber-500 uppercase tracking-widest ml-1">Fim Vigência</label>
                                          <input type="date" value={form.additionalWorkloadTerm?.end} onChange={e => setForm({ ...form, additionalWorkloadTerm: { ...form.additionalWorkloadTerm!, end: e.target.value, start: form.additionalWorkloadTerm?.start || '' } })} className="w-full p-3 bg-amber-50 border border-amber-100 rounded-xl font-bold text-xs uppercase text-amber-900" />
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </div>
                        )}


                        {(isContratado) && (
                           <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 space-y-4 animate-in slide-in-from-top-2">
                              <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
                                 <Clock size={16} /> Vigência do Contrato
                              </h4>
                              <div className="grid grid-cols-2 gap-6">
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Data Início</label>
                                    <input type="date" value={form.contractTerm?.start} onChange={e => setForm({ ...form, contractTerm: { ...form.contractTerm!, start: e.target.value, end: form.contractTerm?.end || '' } })} className="w-full p-4 bg-white border border-blue-200 rounded-2xl text-sm font-bold" />
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Data Término</label>
                                    <input type="date" value={form.contractTerm?.end} onChange={e => setForm({ ...form, contractTerm: { ...form.contractTerm!, end: e.target.value, start: form.contractTerm?.start || '' } })} className="w-full p-4 bg-white border border-blue-200 rounded-2xl text-sm font-bold" />
                                 </div>
                              </div>
                           </div>
                        )}

                        {(form.status !== 'EM_ATIVIDADE' && !isContratado) && (
                           <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 space-y-4 animate-in slide-in-from-top-2">
                              <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest flex items-center gap-2">
                                 <Clock size={16} /> Vigência da Licença / Afastamento
                              </h4>
                              <div className="grid grid-cols-2 gap-6">
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-red-400 uppercase tracking-widest">Data Início</label>
                                    <input type="date" value={form.contractTerm?.start} onChange={e => setForm({ ...form, contractTerm: { ...form.contractTerm!, start: e.target.value, end: form.contractTerm?.end || '' } })} className="w-full p-4 bg-white border border-red-200 rounded-2xl text-sm font-bold" />
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-red-400 uppercase tracking-widest">Data Término</label>
                                    <input type="date" value={form.contractTerm?.end} onChange={e => setForm({ ...form, contractTerm: { ...form.contractTerm!, end: e.target.value, start: form.contractTerm?.start || '' } })} className="w-full p-4 bg-white border border-red-200 rounded-2xl text-sm font-bold" />
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* SEÇÃO ACESSO AO SISTEMA - INTEGRADA */}
                        <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 space-y-6 animate-in slide-in-from-top-2">
                           <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                              <ShieldCheck size={16} /> Acesso ao Sistema
                           </h4>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Senha de Acesso (Login: {form.email || 'CPF'})</label>
                                 <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={16} />
                                    <input
                                       type="text"
                                       value={form.password || ''}
                                       onChange={e => setForm({ ...form, password: e.target.value })}
                                       placeholder="Defina uma senha (Padrão: Mudar123!)"
                                       className="w-full pl-12 pr-4 py-4 bg-white border border-indigo-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                    />
                                 </div>
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Nível de Acesso (Sobrescrita de Perfil)</label>
                                 <select
                                    value={form.userRole || ''}
                                    onChange={e => setForm({ ...form, userRole: e.target.value as UserRole })}
                                    className="w-full p-4 bg-white border border-indigo-200 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-indigo-500/5"
                                 >
                                    <option value="">Automático (Pelo Cargo)</option>
                                    <option value="GESTAO">Gestão (Administrador)</option>
                                    <option value="SECRETARIA">Secretaria</option>
                                    <option value="PROFESSOR">Professor (Diário de Classe)</option>
                                    <option value="TAE">Técnico (TAE)</option>
                                    <option value="AAE">Apoio (AAE)</option>
                                    <option value="PSICOSSOCIAL">Mediação & Psicossocial</option>
                                    <option value="AEE_NUTRICAO">Nutrição / Merenda</option>
                                    <option value="AAE_LIMPEZA">Limpeza / Zeladoria</option>
                                    <option value="ADMINISTRADOR">Admin Full (TI)</option>
                                 </select>
                                 <p className="text-[8px] text-indigo-400 font-bold uppercase mt-2 ml-1">O login será realizado via CPF ou E-mail.</p>
                              </div>
                           </div>
                        </div>

                        <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                           <Save size={24} /> Efetivar Registro de RH
                        </button>
                     </form>
                  </div>
               </div>
            </div>
         )}

         {/* MODAL DE MOVIMENTAÇÃO */}
         {isMovementModalOpen && selectedStaff && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-[3.5rem] w-full max-w-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-8 bg-amber-50 border-b border-amber-100 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-5">
                        <div className="p-4 bg-amber-500 text-white rounded-3xl shadow-lg">
                           <ArrowRightLeft size={28} strokeWidth={3} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Lançar Movimentação</h3>
                           <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-1">Alteração de Status Funcional - {selectedStaff.name}</p>
                        </div>
                     </div>
                     <button onClick={() => setIsMovementModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl shadow-sm transition-all"><X size={24} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                     <form onSubmit={handleSaveMovement} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Movimentação</label>
                              <select
                                 required
                                 value={movementForm.type}
                                 onChange={e => setMovementForm({ ...movementForm, type: e.target.value as MovementType })}
                                 className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm uppercase outline-none focus:bg-white"
                              >
                                 {MOVEMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                              </select>
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Servidor Substituto (Opcional)</label>
                              <select
                                 value={movementForm.substituteId || ''}
                                 onChange={e => setMovementForm({ ...movementForm, substituteId: e.target.value })}
                                 className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white"
                              >
                                 <option value="">Nenhum / Selecione...</option>
                                 {staff.filter(s => s.status === 'EM_ATIVIDADE' && s.id !== selectedStaff.id).map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                 ))}
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Início</label>
                              <input required type="date" value={movementForm.startDate} onChange={e => setMovementForm({ ...movementForm, startDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Término</label>
                              <input type="date" value={movementForm.endDate} onChange={e => setMovementForm({ ...movementForm, endDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Duração (Dias)</label>
                              <input disabled type="number" value={movementForm.durationDays} className="w-full p-4 bg-gray-100 border border-gray-100 rounded-2xl font-black text-lg text-center text-gray-500 shadow-inner" />
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Link do Anexo (Comprovante/Atestado)</label>
                           <input
                              type="text"
                              value={movementForm.attachmentUrl || ''}
                              onChange={e => setMovementForm({ ...movementForm, attachmentUrl: e.target.value })}
                              placeholder="Cole o link do Drive/Documento aqui..."
                              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white"
                           />
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Motivo / Fundamentação</label>
                           <textarea
                              required
                              value={movementForm.reason}
                              onChange={e => setMovementForm({ ...movementForm, reason: e.target.value })}
                              placeholder="Justificativa técnica..."
                              className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2.5rem] text-sm font-medium h-24 resize-none outline-none focus:bg-white transition-all"
                           />
                        </div>

                        <button type="submit" className="w-full py-5 bg-amber-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-amber-700 transition-all flex items-center justify-center gap-3">
                           <ArrowUpRight size={24} /> Efetivar Registro Funcional
                        </button>
                     </form>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default SecretariatStaffManager;