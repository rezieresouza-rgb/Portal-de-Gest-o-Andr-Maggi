import React, { useState, useMemo, useEffect } from 'react';
import {
   AlertCircle,
   Save,
   Search,
   History,
   Loader2,
   Plus,
   FileText,
   Trash2,
   X,
   ShieldCheck,
   BookOpen,
   Shield,
   HeartHandshake,
   CheckCircle2,
   Filter,
   Sparkles,
   User,
   Clock,
   FileSpreadsheet,
   MessageSquare,
   AlertTriangle,
   Send,
   Users,
   ArrowRightLeft
} from 'lucide-react';
import { ClassroomOccurrence } from '../types';
import { SCHOOL_CLASSES } from '../constants/initialData';
import { supabase } from '../supabaseClient';
import { useStudents } from '../hooks/useStudents';
import { User as UserType } from '../types';
import PsychosocialReferralList from './PsychosocialReferralList';

interface TeacherOccurrencesProps {
   user: UserType;
}

type OccurrenceDestination = 'PEDAGOGICAL' | 'CIVICO_MILITAR' | 'PSYCHOSOCIAL';

interface QuickReason {
   id: string;
   label: string;
   destination: OccurrenceDestination;
   severity: 'LEVE' | 'MÉDIA' | 'ALTA' | 'CRÍTICA';
   defaultText: string;
   icon: string;
}

const QUICK_REASONS: QuickReason[] = [
   // PEDAGÓGICOS
   {
      id: 'no_homework',
      label: 'Não fez atividade / tarefa',
      destination: 'PEDAGOGICAL',
      severity: 'LEVE',
      defaultText: 'O aluno não realizou nem entregou as atividades/tarefas propostas em sala de aula/casa, demonstrando desinteresse na fixação dos conteúdos.',
      icon: '📝'
   },
   {
      id: 'learning_diff',
      label: 'Dificuldade de aprendizagem',
      destination: 'PEDAGOGICAL',
      severity: 'MÉDIA',
      defaultText: 'O aluno apresenta expressiva dificuldade na assimilação e compreensão dos conteúdos da disciplina, necessitando de acompanhamento e reforço pedagógico.',
      icon: '🧠'
   },
   {
      id: 'no_material',
      label: 'Falta de material escolar',
      destination: 'PEDAGOGICAL',
      severity: 'LEVE',
      defaultText: 'O aluno compareceu à aula sem o material didático/caderno necessário para o acompanhamento das atividades propostas.',
      icon: '🎒'
   },
   {
      id: 'inattention',
      label: 'Desatenção / Sonolência',
      destination: 'PEDAGOGICAL',
      severity: 'LEVE',
      defaultText: 'O aluno apresenta quadro recorrente de apatia, desatenção ou sonolência excessiva durante as explicações pedagógicas.',
      icon: '😴'
   },
   {
      id: 'low_performance',
      label: 'Baixo rendimento / Reforço',
      destination: 'PEDAGOGICAL',
      severity: 'MÉDIA',
      defaultText: 'O aluno obteve rendimento abaixo do esperado nas avaliações recentes. Solicito intervenção da Coordenação para plano de recuperação.',
      icon: '📉'
   },

   // CÍVICO-MILITARES / DISCIPLINARES
   {
      id: 'disrespect',
      label: 'Falta de respeito com professor',
      destination: 'CIVICO_MILITAR',
      severity: 'ALTA',
      defaultText: 'O aluno demonstrou postura de desrespeito, desacato ou resposta insolente com o(a) professor(a) durante o período de aula.',
      icon: '⚠️'
   },
   {
      id: 'bullying',
      label: 'Prática de Bullying / Ofensas',
      destination: 'CIVICO_MILITAR',
      severity: 'ALTA',
      defaultText: 'O aluno praticou ofensas verbais, apelidos pejorativos, intimidação ou conduta depreciativa contra colega de turma.',
      icon: '🛑'
   },
   {
      id: 'cellphone',
      label: 'Uso indevido de celular',
      destination: 'CIVICO_MILITAR',
      severity: 'MÉDIA',
      defaultText: 'O aluno foi advertido quanto ao uso inadequado de aparelho celular/jogos eletrônicos durante a aula sem autorização pedagógica.',
      icon: '📱'
   },
   {
      id: 'aggression',
      label: 'Agressão verbal ou física',
      destination: 'CIVICO_MILITAR',
      severity: 'CRÍTICA',
      defaultText: 'Ocorreu situação grave de agressão ou ameaça no ambiente de sala de aula, exigindo intervenção imediata da Monitoria Cívico-Militar.',
      icon: '💥'
   },
   {
      id: 'left_classroom',
      label: 'Saída indevida de sala',
      destination: 'CIVICO_MILITAR',
      severity: 'MÉDIA',
      defaultText: 'O aluno ausentou-se ou recusou-se a permanecer em sala de aula sem a devida autorização do professor.',
      icon: '🚪'
   },
   {
      id: 'vandalism',
      label: 'Dano ao patrimônio escolar',
      destination: 'CIVICO_MILITAR',
      severity: 'ALTA',
      defaultText: 'O aluno causou danos materiais (riscou/danificou carteira, porta, parede ou material da escola).',
      icon: '🪑'
   },

   // MEDIAÇÃO & PSICOSSOCIAL
   {
      id: 'mediation_peer',
      label: 'Conflito entre colegas (Círculo de Paz)',
      destination: 'PSYCHOSOCIAL',
      severity: 'MÉDIA',
      defaultText: 'Há um conflito interpessoal recorrente entre estudantes que necessita de escuta qualificada e Círculo de Mediação / Paz.',
      icon: '🕊️'
   },
   {
      id: 'emotional_crisis',
      label: 'Crise emocional / Sofrimento',
      destination: 'PSYCHOSOCIAL',
      severity: 'ALTA',
      defaultText: 'O aluno apresentou choro convulsivo, alteração brusca de comportamento ou sinais visíveis de angústia e sofrimento emocional.',
      icon: '😢'
   }
];

const TeacherOccurrences: React.FC<TeacherOccurrencesProps> = ({ user }) => {
   const [activeTab, setActiveTab] = useState<'occurrences' | 'referrals'>('occurrences');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');
   const [showDropdown, setShowDropdown] = useState(false);
   const [masterStudents, setMasterStudents] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [selectedStudents, setSelectedStudents] = useState<{ name: string; class: string }[]>([]);

   // Form State
   const [form, setForm] = useState({
      date: new Date().toLocaleDateString('sv-SE'),
      teacherName: user.name,
      className: '',
      discipline: '',
      destination: 'PEDAGOGICAL' as OccurrenceDestination,
      severity: 'MÉDIA' as 'LEVE' | 'MÉDIA' | 'ALTA' | 'CRÍTICA',
      title: '',
      description: '',
      forwardToPsychosocial: false
   });

   const [recentOccurrences, setRecentOccurrences] = useState<any[]>([]);
   const [filterClass, setFilterClass] = useState('');
   const [filterStudent, setFilterStudent] = useState('');
   const [filterDestination, setFilterDestination] = useState<string>('ALL');
   const [filterTeacher, setFilterTeacher] = useState<string>('ALL');

   const fetchOccurrences = async () => {
      setLoading(true);
      const { data, error } = await supabase
         .from('occurrences')
         .select('*')
         .order('date', { ascending: false });

      if (error) {
         console.error('Error fetching occurrences:', error);
      } else {
         setRecentOccurrences(data || []);
      }
      setLoading(false);
   };

   useEffect(() => {
      fetchOccurrences();
   }, []);

   const resetForm = () => {
      setForm({
         date: new Date().toLocaleDateString('sv-SE'),
         teacherName: user.name,
         className: '',
         discipline: '',
         destination: 'PEDAGOGICAL',
         severity: 'MÉDIA',
         title: '',
         description: '',
         forwardToPsychosocial: false
      });
      setSearchTerm('');
      setSelectedStudents([]);
   };

   const { students: dbStudents } = useStudents();

   useEffect(() => {
      if (dbStudents) {
         setMasterStudents(dbStudents);
      }
   }, [dbStudents]);

   useEffect(() => {
      const subscription = supabase
         .channel('occurrences_changes_teacher')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, () => {
            fetchOccurrences();
         })
         .subscribe();

      return () => {
         subscription.unsubscribe();
      };
   }, []);

   const uniqueTeachers = useMemo(() => {
      const teachers = new Set<string>();
      recentOccurrences.forEach(o => {
         const name = (o.responsible_name || o.teacherName || '').trim();
         if (name) teachers.add(name);
      });
      return Array.from(teachers).sort();
   }, [recentOccurrences]);

   const filteredStudents = useMemo(() => {
      const searchClass = form.className;
      if (!searchClass && (!searchTerm || searchTerm.length < 2)) return [];
      let filtered = masterStudents;
      if (searchClass) {
         filtered = filtered.filter(s => s.class === searchClass);
      }
      if (searchTerm) {
         filtered = filtered.filter(s => s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      return filtered
         .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
         .slice(0, searchClass && !searchTerm ? 50 : 6);
   }, [searchTerm, masterStudents, form.className]);

   const handleSelectStudent = (student: any) => {
      if (selectedStudents.some(s => s.name === student.name)) {
         setShowDropdown(false);
         setSearchTerm('');
         return;
      }
      setSelectedStudents(prev => [...prev, { name: student.name, class: student.class }]);
      if (selectedStudents.length === 0) {
         setForm(prev => ({ ...prev, className: student.class }));
      }
      setSearchTerm('');
      setShowDropdown(false);
   };

   const handleRemoveStudent = (name: string) => {
      setSelectedStudents(prev => prev.filter(s => s.name !== name));
   };

   const applyQuickReason = (reason: QuickReason) => {
      setForm(prev => ({
         ...prev,
         destination: reason.destination,
         severity: reason.severity,
         title: reason.label,
         description: prev.description ? `${prev.description}\n\n• ${reason.defaultText}` : reason.defaultText,
         forwardToPsychosocial: reason.destination === 'PSYCHOSOCIAL' ? true : prev.forwardToPsychosocial
      }));
   };

   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();

      if (selectedStudents.length === 0) return alert("Por favor, selecione ao menos um aluno.");
      if (!form.description.trim()) return alert("Por favor, descreva o que ocorreu no relato.");

      setIsSaving(true);
      const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      try {
         for (const student of selectedStudents) {
            let categoryName = 'ACOMPANHAMENTO PEDAGÓGICO';
            let targetDept = 'COORDENACAO_PEDAGOGICA';

            if (form.destination === 'CIVICO_MILITAR') {
               categoryName = 'FATO OBSERVADO';
               targetDept = 'CIVICO_MILITAR';
            } else if (form.destination === 'PSYCHOSOCIAL') {
               categoryName = 'MEDIAÇÃO / PSICOSSOCIAL';
               targetDept = 'PSICOSSOCIAL_MEDIACAO';
            }

            const targetTag = form.destination === 'CIVICO_MILITAR' 
               ? '\n[SETOR: CIVICO_MILITAR]' 
               : form.destination === 'PSYCHOSOCIAL' 
                 ? '\n[SETOR: PSICOSSOCIAL]' 
                 : '\n[SETOR: COORDENACAO_PEDAGOGICA]';

            const formattedDesc = form.title 
               ? `[${form.title.toUpperCase()}]\n${form.description}${targetTag}`
               : `${form.description}${targetTag}`;

            const payload = {
               date: form.date,
               time,
               responsible_name: form.teacherName,
               classroom_name: student.class,
               student_name: student.name,
               category: categoryName,
               severity: form.severity,
               description: formattedDesc,
               status: 'PENDENTE',
               location: 'SALA DE AULA'
            };

            const { data, error } = await supabase.from('occurrences').insert([payload]).select();
            if (error) throw error;

            // ENCAMINHAMENTO 1: CÍVICO-MILITAR (Apenas se for disciplinar)
            if (form.destination === 'CIVICO_MILITAR') {
               const savedDocs = localStorage.getItem('civico_militar_documentos_v2');
               let docsList = [];
               if (savedDocs) {
                  try {
                     docsList = JSON.parse(savedDocs);
                  } catch (e) {}
               }
               docsList.unshift({
                  id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  studentId: 'AUTO_GEK',
                  studentName: student.name,
                  className: student.class,
                  shiftName: 'MATUTINO/VESPERTINO',
                  template: 'fato_observado',
                  templateLabel: 'Relatório de Fato Observado',
                  date: form.date,
                  fields: {
                     date: form.date,
                     recebidoDate: '',
                     teacher: form.teacherName,
                     monitor: '',
                     series: student.class,
                     discipline: form.discipline || 'MÚLTIPLAS',
                     achado: formattedDesc,
                     city: 'Colíder - MT'
                  },
                  timestamp: Date.now()
               });
               localStorage.setItem('civico_militar_documentos_v2', JSON.stringify(docsList));
            }

            // ENCAMINHAMENTO 2: MEDIAÇÃO ESCOLAR (Porta de Entrada / Triagem)
            if (form.destination === 'PSYCHOSOCIAL' || form.forwardToPsychosocial) {
               const activeTeacher = form.teacherName || 'PROFESSOR';
               const fullReport = `[ENCAMINHAMENTO DOCENTE] [Professor: ${activeTeacher}]\nMotivo: ${form.title || 'Encaminhamento Direto'}\n\nRelato:\n${form.description}`;

               // Criar caso EXCLUSIVAMENTE na Mediação Escolar para escuta e acolhimento
               await supabase.from('mediation_cases').insert([{
                  student_id: student.id || 'N/A',
                  student_name: student.name,
                  class_name: student.class,
                  type: form.destination === 'CIVICO_MILITAR' ? 'DISCIPLINAR' : 'CONFLITO',
                  severity: form.severity === 'CRÍTICA' ? 'CRÍTICA' : (form.severity === 'ALTA' ? 'ALTA' : 'MÉDIA'),
                  status: 'ABERTURA',
                  opened_at: form.date,
                  description: fullReport,
                  involved_parties: [activeTeacher],
                  steps: [
                     { id: '1', label: 'Encaminhamento pelo Professor', completed: true, date: form.date },
                     { id: '2', label: 'Escuta das Partes / Aluno', completed: false },
                     { id: '3', label: 'Círculo de Mediação / Paz', completed: false },
                     { id: '4', label: 'Acordo / Finalização', completed: false }
                  ]
               }]);

               await supabase.from('psychosocial_notifications').insert([{
                  title: 'Novo Encaminhamento Docente • Mediação Escolar',
                  message: `O professor(a) ${activeTeacher} encaminhou o aluno ${student.name} (${student.class}) para acolhimento e mediação.`,
                  is_read: false
               }]);
            }
         }

         setIsModalOpen(false);
         resetForm();
         fetchOccurrences();
         
         const destLabel = form.destination === 'PEDAGOGICAL' 
            ? 'Coordenação Pedagógica' 
            : form.destination === 'CIVICO_MILITAR' 
               ? 'Monitoria Cívico-Militar' 
               : 'Mediação Escolar / Psicossocial';

         alert(`Ocorrência registrada com sucesso e encaminhada para a ${destLabel}!`);
      } catch (err) {
         console.error(err);
         alert('Erro ao enviar ocorrência.');
      } finally {
         setIsSaving(false);
      }
   };

   const deleteOccurrence = async (id: string) => {
      if (window.confirm("Deseja remover este registro do seu histórico?")) {
         const { error } = await supabase.from('occurrences').delete().eq('id', id);
         if (error) {
            console.error(error);
            alert("Erro ao excluir registro.");
         } else {
            setRecentOccurrences(prev => prev.filter(o => o.id !== id));
         }
      }
   };

   const filteredOccurrences = useMemo(() => {
      return recentOccurrences.filter(occ => {
         const studentName = occ.student_name || occ.studentName || '';
         const className = occ.classroom_name || occ.className || '';
         const cat = (occ.category || '').toUpperCase();
         const responsible = (occ.responsible_name || occ.teacherName || '').trim();

         const matchesClass = !filterClass || className === filterClass;
         const matchesStudent = !filterStudent || studentName.toLowerCase().includes(filterStudent.toLowerCase());
         
         let matchesDest = true;
         if (filterDestination === 'PEDAGOGICAL') {
            matchesDest = cat.includes('PEDAGÓGICO') || cat.includes('PEDAGOGICO') || cat.includes('ACOMPANHAMENTO');
         } else if (filterDestination === 'CIVICO_MILITAR') {
            matchesDest = cat.includes('FATO') || cat.includes('DISCIPLINAR') || cat.includes('MILITAR');
         } else if (filterDestination === 'PSYCHOSOCIAL') {
            matchesDest = cat.includes('MEDIAÇÃO') || cat.includes('MEDICAO') || cat.includes('PSICOSSOCIAL');
         }

         let matchesTeacher = true;
         if (filterTeacher === 'MY_RECORDS') {
            matchesTeacher = responsible.toLowerCase() === (user.name || '').toLowerCase();
         } else if (filterTeacher !== 'ALL') {
            matchesTeacher = responsible.toLowerCase() === filterTeacher.toLowerCase();
         }

         return matchesClass && matchesStudent && matchesDest && matchesTeacher;
      });
   }, [recentOccurrences, filterClass, filterStudent, filterDestination, filterTeacher, user.name]);

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20 no-print">
         
         {/* CABEÇALHO PRINCIPAL COM ABAS INTEGRADAS */}
         <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-8 md:p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/10">
            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
               <ShieldCheck size={200} />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div className="space-y-2">
                  <div className="flex items-center gap-3">
                     <span className="px-3.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Portal Docente Integrado
                     </span>
                     <span className="text-white/40 text-xs font-bold">•</span>
                     <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
                        Logado como: {user.name} ({user.role || 'DOCENTE'})
                     </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
                     Ocorrências & Encaminhamentos
                  </h1>
                  <p className="text-blue-100/70 text-xs md:text-sm max-w-2xl font-medium">
                     Registre situações de sala e direcione automaticamente para a <strong className="text-blue-300">Coordenação Pedagógica</strong>, <strong className="text-amber-300">Monitoria Cívico-Militar</strong> ou <strong className="text-emerald-300">Mediação / Psicossocial</strong>.
                  </p>
               </div>

               <div className="flex flex-wrap items-center gap-3">
                  <button 
                     onClick={() => setIsModalOpen(true)}
                     className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border border-white/20"
                  >
                     <Plus size={18} strokeWidth={3} className="text-white" />
                     Novo Registro
                  </button>
               </div>
            </div>

            {/* SELETOR DE ABAS PRINCIPAIS */}
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-white/10 relative z-10">
               <button
                  onClick={() => setActiveTab('occurrences')}
                  className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${
                     activeTab === 'occurrences'
                        ? 'bg-white text-slate-900 shadow-xl scale-105'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
               >
                  <FileText size={16} />
                  Ocorrências e Fatos ({recentOccurrences.length})
               </button>

               <button
                  onClick={() => setActiveTab('referrals')}
                  className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${
                     activeTab === 'referrals'
                        ? 'bg-emerald-500 text-white shadow-xl scale-105'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
               >
                  <HeartHandshake size={16} />
                  Acompanhamento de Mediações & Psicossocial
               </button>
            </div>
         </div>

         {/* CONTEÚDO DA ABA 1: OCORRÊNCIAS & HISTÓRICO */}
         {activeTab === 'occurrences' && (
            <div className="space-y-6">
               
               {/* CARDS DE RESUMO RÁPIDO POR SETOR */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div 
                     onClick={() => setFilterDestination(filterDestination === 'PEDAGOGICAL' ? 'ALL' : 'PEDAGOGICAL')}
                     className={`p-6 rounded-[2.5rem] border cursor-pointer transition-all ${
                        filterDestination === 'PEDAGOGICAL' 
                           ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20 scale-[1.02]' 
                           : 'bg-white text-slate-800 border-gray-100 shadow-sm hover:border-blue-200'
                     }`}
                  >
                     <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${filterDestination === 'PEDAGOGICAL' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                           <BookOpen size={24} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${filterDestination === 'PEDAGOGICAL' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                           Coordenação
                        </span>
                     </div>
                     <h3 className="text-lg font-black uppercase tracking-tight">Pedagógico</h3>
                     <p className={`text-xs mt-1 font-medium ${filterDestination === 'PEDAGOGICAL' ? 'text-blue-100' : 'text-gray-500'}`}>
                        Não faz tarefas, dificuldades de aprendizagem, sem material.
                     </p>
                  </div>

                  <div 
                     onClick={() => setFilterDestination(filterDestination === 'CIVICO_MILITAR' ? 'ALL' : 'CIVICO_MILITAR')}
                     className={`p-6 rounded-[2.5rem] border cursor-pointer transition-all ${
                        filterDestination === 'CIVICO_MILITAR' 
                           ? 'bg-amber-600 text-white border-amber-600 shadow-xl shadow-amber-500/20 scale-[1.02]' 
                           : 'bg-white text-slate-800 border-gray-100 shadow-sm hover:border-amber-200'
                     }`}
                  >
                     <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${filterDestination === 'CIVICO_MILITAR' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'}`}>
                           <Shield size={24} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${filterDestination === 'CIVICO_MILITAR' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'}`}>
                           Cívico-Militar
                        </span>
                     </div>
                     <h3 className="text-lg font-black uppercase tracking-tight">Disciplinar</h3>
                     <p className={`text-xs mt-1 font-medium ${filterDestination === 'CIVICO_MILITAR' ? 'text-amber-100' : 'text-gray-500'}`}>
                        Falta de respeito, bullying, uso de celular, indisciplina.
                     </p>
                  </div>

                  <div 
                     onClick={() => setFilterDestination(filterDestination === 'PSYCHOSOCIAL' ? 'ALL' : 'PSYCHOSOCIAL')}
                     className={`p-6 rounded-[2.5rem] border cursor-pointer transition-all ${
                        filterDestination === 'PSYCHOSOCIAL' 
                           ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-500/20 scale-[1.02]' 
                           : 'bg-white text-slate-800 border-gray-100 shadow-sm hover:border-emerald-200'
                     }`}
                  >
                     <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${filterDestination === 'PSYCHOSOCIAL' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                           <HeartHandshake size={24} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${filterDestination === 'PSYCHOSOCIAL' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                           Psicossocial
                        </span>
                     </div>
                     <h3 className="text-lg font-black uppercase tracking-tight">Mediação & Apoio</h3>
                     <p className={`text-xs mt-1 font-medium ${filterDestination === 'PSYCHOSOCIAL' ? 'text-emerald-100' : 'text-gray-500'}`}>
                        Conflitos graves entre alunos, crises emocionais, Círculos de Paz.
                     </p>
                  </div>
               </div>

               {/* TABELA DE REGISTROS DO PROFESSOR */}
               <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-gray-100 bg-gray-50/40 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                     <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                           <History size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Registros de Ocorrências</h3>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              {filterTeacher === 'MY_RECORDS' ? `Exibindo apenas os seus lançamentos (${user.name})` : filterTeacher === 'ALL' ? 'Exibindo lançamentos de todos os professores' : `Filtrado por: ${filterTeacher}`}
                           </p>
                        </div>
                     </div>

                     <div className="flex flex-wrap items-center gap-3">
                        <div className="relative w-full md:w-60">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                           <input
                              type="text"
                              placeholder="BUSCAR ALUNO..."
                              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                              value={filterStudent}
                              onChange={(e) => setFilterStudent(e.target.value)}
                           />
                        </div>
                        
                        {/* SELETOR DE PROFESSOR (MEUS REGISTROS VS TODOS) */}
                        <select
                           value={filterTeacher}
                           onChange={(e) => setFilterTeacher(e.target.value)}
                           className="w-full md:w-56 px-4 py-3 bg-white border border-gray-200 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer text-indigo-700"
                        >
                           <option value="ALL">🏫 TODOS OS PROFESSORES</option>
                           <option value="MY_RECORDS">👤 APENAS MEUS REGISTROS</option>
                           {uniqueTeachers.filter(t => t.toLowerCase() !== (user.name || '').toLowerCase()).map(t => (
                              <option key={t} value={t}>👨‍🏫 {t}</option>
                           ))}
                        </select>

                        <select
                           value={filterClass}
                           onChange={(e) => setFilterClass(e.target.value)}
                           className="w-full md:w-36 px-4 py-3 bg-white border border-gray-200 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                        >
                           <option value="">TODAS TURMAS</option>
                           {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <select
                           value={filterDestination}
                           onChange={(e) => setFilterDestination(e.target.value)}
                           className="w-full md:w-44 px-4 py-3 bg-white border border-gray-200 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer text-blue-600"
                        >
                           <option value="ALL">TODOS OS SETORES</option>
                           <option value="PEDAGOGICAL">📚 PEDAGÓGICO</option>
                           <option value="CIVICO_MILITAR">🛡️ CÍVICO-MILITAR</option>
                           <option value="PSYCHOSOCIAL">🤝 MEDIAÇÃO</option>
                        </select>
                     </div>
                  </div>

                  <div className="divide-y divide-gray-50">
                     {loading ? (
                        <div className="p-16 flex flex-col items-center justify-center gap-3">
                           <Loader2 className="animate-spin text-blue-600" size={36} />
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando ocorrências...</p>
                        </div>
                     ) : filteredOccurrences.length > 0 ? (
                        filteredOccurrences.map((occ: any) => {
                           const studentName = occ.student_name || occ.studentName || 'Aluno não informado';
                           const className = occ.classroom_name || occ.className || 'Turma N/A';
                           const date = occ.date ? new Date(occ.date).toLocaleDateString('pt-BR') : 'Data N/A';
                           const category = (occ.category || '').toUpperCase();
                           const rawDesc = occ.description || '';
                           const teacherAuthor = occ.responsible_name || occ.teacherName || 'Docente';
                           const isMyRecord = teacherAuthor.toLowerCase() === (user.name || '').toLowerCase();

                           let cleanDesc = rawDesc;
                           let parsedFeedback = occ.feedback || '';
                           let parsedResolvedBy = occ.resolved_by || 'Coordenação Pedagógica';
                           let parsedResolvedAt = occ.resolved_at || '';

                           if (rawDesc.includes('[DEVOLUTIVA')) {
                              const match = rawDesc.match(/\[DEVOLUTIVA (?:DA COORDENAÇÃO|DA GESTÃO)?\s*(?:-\s*([^\]]+))?\]:?([\s\S]*)/i);
                              if (match) {
                                 cleanDesc = (rawDesc.split(/\[DEVOLUTIVA/i)[0] || '').trim();
                                 parsedResolvedAt = match[1] ? match[1].trim() : parsedResolvedAt;
                                 parsedFeedback = (match[2] || '').trim();
                              }
                           }
                           
                           cleanDesc = cleanDesc.replace(/\[SETOR:\s*[^\]]+\]/gi, '').trim();

                           const isPedagogical = category.includes('PEDAGÓGICO') || category.includes('PEDAGOGICO') || category.includes('ACOMPANHAMENTO') || rawDesc.includes('[SETOR: COORDENACAO_PEDAGOGICA]');
                           const isCivicoMilitar = category.includes('FATO') || category.includes('DISCIPLINAR') || category.includes('MILITAR') || rawDesc.includes('[SETOR: CIVICO_MILITAR]');
                           const statusRaw = (occ.status || 'PENDENTE').toUpperCase();
                           const isResolved = statusRaw === 'RESOLVIDO' || statusRaw === 'CONCLUÍDO' || !!parsedFeedback;
                           const isAttending = statusRaw === 'EM_ATENDIMENTO';
                           const isTramitated = statusRaw === 'TRAMITADO';

                           return (
                              <div key={occ.id} className="p-6 md:p-8 flex flex-col justify-between gap-4 hover:bg-gray-50/60 transition-all group">
                                 <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                                          isPedagogical 
                                             ? 'bg-blue-50 text-blue-600 border-blue-200' 
                                             : isCivicoMilitar 
                                                ? 'bg-amber-50 text-amber-600 border-amber-200' 
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                       }`}>
                                          {isPedagogical ? <BookOpen size={20} /> : isCivicoMilitar ? <Shield size={20} /> : <HeartHandshake size={20} />}
                                       </div>
                                       
                                       <div className="space-y-1.5 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                             <h4 className="font-black text-gray-900 uppercase tracking-tight text-base">{studentName}</h4>
                                             <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black uppercase">
                                                {className}
                                             </span>
                                             <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border ${
                                                isPedagogical 
                                                   ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                   : isCivicoMilitar 
                                                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                      : 'bg-purple-50 text-purple-700 border-purple-200'
                                             }`}>
                                                {isPedagogical ? 'Coord. Pedagógica' : isCivicoMilitar ? 'Gestão Militar' : 'Mediação Escolar'}
                                             </span>
                                             {occ.severity && (
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                                   occ.severity === 'CRÍTICA' || occ.severity === 'ALTA' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                   Grau: {occ.severity}
                                                </span>
                                             )}
                                             {isMyRecord ? (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-black uppercase">
                                                   ★ Seu Registro
                                                </span>
                                             ) : (
                                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[9px] font-black uppercase">
                                                   Docente: {teacherAuthor}
                                                </span>
                                             )}
                                          </div>

                                          <p className="text-xs text-gray-700 font-medium whitespace-pre-line">
                                             {cleanDesc}
                                          </p>

                                          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-1">
                                             <span className="flex items-center gap-1"><Clock size={12} /> {date}</span>
                                             <span>•</span>
                                             <span>Registrado por: <strong>{teacherAuthor}</strong></span>
                                          </div>
                                       </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-start shrink-0">
                                       {isResolved ? (
                                          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                                             <CheckCircle2 size={13} className="text-emerald-600" /> Resolvido / Devolutiva Pronta
                                          </span>
                                       ) : isAttending ? (
                                          <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                                             <User size={13} className="text-blue-600" /> Em Atendimento
                                          </span>
                                       ) : isTramitated ? (
                                          <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                                             <ArrowRightLeft size={13} className="text-purple-600" /> Tramitado de Setor
                                          </span>
                                       ) : (
                                          <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                                             <Clock size={13} className="text-amber-600" /> Aguardando Ação
                                          </span>
                                       )}

                                       <button 
                                          onClick={() => deleteOccurrence(occ.id)}
                                          className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                          title="Excluir Registro"
                                       >
                                          <Trash2 size={15} />
                                       </button>
                                    </div>
                                 </div>

                                 {parsedFeedback && (
                                    <div className="mt-2 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-1.5 animate-in fade-in">
                                       <div className="flex items-center justify-between text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                                          <span className="flex items-center gap-1.5">
                                             <CheckCircle2 size={14} className="text-emerald-600" />
                                             Devolutiva da Coordenação Pedagógica / Gestão Escolar:
                                          </span>
                                          {parsedResolvedAt && (
                                             <span className="text-emerald-700 font-bold">
                                                {parsedResolvedAt} {parsedResolvedBy ? `• Por: ${parsedResolvedBy}` : ''}
                                             </span>
                                          )}
                                       </div>
                                       <p className="text-xs text-emerald-950 font-medium leading-relaxed whitespace-pre-line">
                                          {parsedFeedback}
                                       </p>
                                    </div>
                                 )}
                              </div>
                           );
                        })
                     ) : (
                        <div className="p-16 text-center flex flex-col items-center justify-center">
                           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                              <FileText size={36} />
                           </div>
                           <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nenhum registro encontrado</p>
                           <p className="text-gray-400 text-[11px] mt-1">Utilize o botão "Novo Registro" para cadastrar ocorrências ou encaminhamentos.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* CONTEÚDO DA ABA 2: ACOMPANHAMENTO DE MEDIAÇÕES & PSICOSSOCIAL */}
         {activeTab === 'referrals' && (
            <div className="space-y-6">
               <PsychosocialReferralList role="PROFESSOR" user={user} />
            </div>
         )}

         {/* MODAL DE NOVO REGISTRO / ENCAMINHAMENTO */}
         {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
               
               <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh] overflow-hidden border border-gray-100">
                  
                  {/* HEADER DO MODAL */}
                  <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                           <Sparkles size={24} />
                        </div>
                        <div>
                           <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Novo Registro & Encaminhamento</h2>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Triagem Direcionada da Área do Professor</p>
                        </div>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors">
                        <X size={18} />
                     </button>
                  </div>

                  {/* CORPO DO FORMULÁRIO COM SCROLL */}
                  <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
                     <form id="occurrenceForm" onSubmit={handleSave} className="space-y-6">
                        
                        {/* 1. SELETOR DE DESTINO PRINCIPAL (3 CARDS) */}
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                              1. Selecione o Setor de Destino da Situação:
                           </label>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              
                              {/* OPÇÃO PEDAGÓGICA */}
                              <div
                                 onClick={() => setForm({ ...form, destination: 'PEDAGOGICAL' })}
                                 className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                    form.destination === 'PEDAGOGICAL'
                                       ? 'bg-blue-50/60 border-blue-600 shadow-md scale-[1.02]'
                                       : 'bg-white border-gray-100 hover:border-gray-200 opacity-70 hover:opacity-100'
                                 }`}
                              >
                                 <div className="flex items-center justify-between mb-2">
                                    <div className="p-2 bg-blue-600 text-white rounded-xl">
                                       <BookOpen size={18} />
                                    </div>
                                    {form.destination === 'PEDAGOGICAL' && <CheckCircle2 size={18} className="text-blue-600" />}
                                 </div>
                                 <div>
                                    <h4 className="font-black text-sm uppercase text-gray-900">Coordenação Pedagógica</h4>
                                    <p className="text-[10px] text-gray-500 font-bold mt-1 leading-tight">
                                       Não faz atividades, dificuldade de aprendizado, sem material, rendimento.
                                    </p>
                                 </div>
                              </div>

                              {/* OPÇÃO CÍVICO-MILITAR */}
                              <div
                                 onClick={() => setForm({ ...form, destination: 'CIVICO_MILITAR' })}
                                 className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                    form.destination === 'CIVICO_MILITAR'
                                       ? 'bg-amber-50/60 border-amber-600 shadow-md scale-[1.02]'
                                       : 'bg-white border-gray-100 hover:border-gray-200 opacity-70 hover:opacity-100'
                                 }`}
                              >
                                 <div className="flex items-center justify-between mb-2">
                                    <div className="p-2 bg-amber-600 text-white rounded-xl">
                                       <Shield size={18} />
                                    </div>
                                    {form.destination === 'CIVICO_MILITAR' && <CheckCircle2 size={18} className="text-amber-600" />}
                                 </div>
                                 <div>
                                    <h4 className="font-black text-sm uppercase text-gray-900">Cívico-Militar (Fato Observado)</h4>
                                    <p className="text-[10px] text-gray-500 font-bold mt-1 leading-tight">
                                       Falta de respeito com professor, bullying, uso de celular, indisciplina.
                                    </p>
                                 </div>
                              </div>

                              {/* OPÇÃO PSICOSSOCIAL / MEDIAÇÃO */}
                              <div
                                 onClick={() => setForm({ ...form, destination: 'PSYCHOSOCIAL' })}
                                 className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                    form.destination === 'PSYCHOSOCIAL'
                                       ? 'bg-emerald-50/60 border-emerald-600 shadow-md scale-[1.02]'
                                       : 'bg-white border-gray-100 hover:border-gray-200 opacity-70 hover:opacity-100'
                                 }`}
                              >
                                 <div className="flex items-center justify-between mb-2">
                                    <div className="p-2 bg-emerald-600 text-white rounded-xl">
                                       <HeartHandshake size={18} />
                                    </div>
                                    {form.destination === 'PSYCHOSOCIAL' && <CheckCircle2 size={18} className="text-emerald-600" />}
                                 </div>
                                 <div>
                                    <h4 className="font-black text-sm uppercase text-gray-900">Mediação & Psicossocial</h4>
                                    <p className="text-[10px] text-gray-500 font-bold mt-1 leading-tight">
                                       Conflitos graves entre colegas, crise de ansiedade, Círculos de Paz.
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* 2. ATALHOS RÁPIDOS DE 1 CLIQUE (TAGS) */}
                        <div className="space-y-2 bg-gray-50/70 p-5 rounded-2xl border border-gray-100">
                           <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <Sparkles size={14} className="text-amber-500" />
                                 2. Motivos Frequentes (Clique para preencher rápido):
                              </label>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">Auto-preenchimento</span>
                           </div>

                           <div className="flex flex-wrap gap-2 pt-1">
                              {QUICK_REASONS.map(reason => (
                                 <button
                                    key={reason.id}
                                    type="button"
                                    onClick={() => applyQuickReason(reason)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                                       form.title === reason.label
                                          ? 'bg-gray-900 text-white border-gray-900 scale-105'
                                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                                    }`}
                                 >
                                    <span>{reason.icon}</span>
                                    <span>{reason.label}</span>
                                 </button>
                              ))}
                           </div>
                        </div>

                        {/* 3. SELEÇÃO DE TURMA, DATA E ALUNOS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma do Aluno</label>
                              <select
                                 value={form.className}
                                 onChange={e => {
                                    setForm({ ...form, className: e.target.value });
                                    setSearchTerm('');
                                 }}
                                 className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-black text-sm uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                              >
                                 <option value="">Selecione a Turma</option>
                                 {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data da Ocorrência</label>
                              <input
                                 type="date"
                                 required
                                 value={form.date}
                                 onChange={e => setForm({ ...form, date: e.target.value })}
                                 className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-black text-sm uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                              />
                           </div>
                        </div>

                        {/* SELETOR DE ALUNOS COM AUTOCOMPLETE */}
                        <div className="space-y-1.5 relative">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aluno(s) Envolvido(s)</label>
                           
                           {selectedStudents.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                 {selectedStudents.map(student => (
                                    <span key={student.name} className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-black uppercase flex items-center gap-2">
                                       <User size={12} />
                                       {student.name} ({student.class})
                                       <button type="button" onClick={() => handleRemoveStudent(student.name)} className="hover:bg-blue-200 p-0.5 rounded-full transition-colors"><X size={12} /></button>
                                    </span>
                                 ))}
                              </div>
                           )}

                           <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                              <input
                                 type="text"
                                 placeholder="Digite o nome do aluno para buscar e adicionar..."
                                 value={searchTerm}
                                 onFocus={() => setShowDropdown(true)}
                                 onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowDropdown(true);
                                 }}
                                 className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                              />
                              
                              {showDropdown && (searchTerm.length >= 2 || form.className) && (
                                 <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-56 overflow-y-auto">
                                    {filteredStudents.length > 0 ? (
                                       filteredStudents.map(student => (
                                          <button
                                             key={student.CodigoAluno || student.name}
                                             type="button"
                                             onClick={() => handleSelectStudent(student)}
                                             className="w-full text-left px-5 py-3 hover:bg-blue-50/50 border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center"
                                          >
                                             <span className="font-bold text-gray-800 uppercase text-xs">{student.name}</span>
                                             <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase tracking-widest">{student.class}</span>
                                          </button>
                                       ))
                                    ) : (
                                       <div className="px-6 py-6 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                                          Nenhum aluno encontrado
                                       </div>
                                    )}
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* DISCIPLINA E GRAVIDADE */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Disciplina / Matéria</label>
                              <input
                                 type="text"
                                 value={form.discipline}
                                 onChange={e => setForm({ ...form, discipline: e.target.value })}
                                 placeholder="Ex: Língua Portuguesa, Matemática..."
                                 className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
                              />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nível de Severidade</label>
                              <select
                                 value={form.severity}
                                 onChange={e => setForm({ ...form, severity: e.target.value as any })}
                                 className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-black text-sm uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                              >
                                 <option value="LEVE">🟢 LEVE (Advertência inicial / Orientação)</option>
                                 <option value="MÉDIA">🟡 MÉDIA (Reincidência / Atenção)</option>
                                 <option value="ALTA">🟠 ALTA (Falta grave / Intervenção)</option>
                                 <option value="CRÍTICA">🔴 CRÍTICA (Urgente / Convocação)</option>
                              </select>
                           </div>
                        </div>

                        {/* RELATO DESCRITIVO */}
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição dos Fatos (Relato Docente)</label>
                           <textarea
                              required
                              value={form.description}
                              onChange={e => setForm({ ...form, description: e.target.value })}
                              placeholder="Descreva detalhadamente o ocorrido..."
                              className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium h-36 resize-none outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                           />
                        </div>

                        {/* ENCAMINHAMENTO CONJUNTO OPCIONAL PARA O PSICOSSOCIAL */}
                        {form.destination !== 'PSYCHOSOCIAL' && (
                           <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                              <input
                                 type="checkbox"
                                 id="forward_psycho_check"
                                 checked={form.forwardToPsychosocial}
                                 onChange={e => setForm({ ...form, forwardToPsychosocial: e.target.checked })}
                                 className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <label htmlFor="forward_psycho_check" className="text-xs font-black text-emerald-900 uppercase tracking-wide cursor-pointer select-none">
                                 Também enviar cópia para a Equipe de Mediação & Psicossocial (Apoio Emocional)
                              </label>
                           </div>
                        )}

                     </form>
                  </div>

                  {/* FOOTER DO MODAL */}
                  <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
                     <div className="text-xs font-bold text-gray-500 flex items-center gap-2">
                        <span>Destino selecionado:</span>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase text-white ${
                           form.destination === 'PEDAGOGICAL' ? 'bg-blue-600' : form.destination === 'CIVICO_MILITAR' ? 'bg-amber-600' : 'bg-emerald-600'
                        }`}>
                           {form.destination === 'PEDAGOGICAL' ? '📚 Coordenação Pedagógica' : form.destination === 'CIVICO_MILITAR' ? '🛡️ Cívico-Militar' : '🤝 Mediação Escolar'}
                        </span>
                     </div>

                     <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                           type="button"
                           onClick={() => setIsModalOpen(false)}
                           className="px-6 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-black uppercase text-xs tracking-wider hover:bg-gray-100 transition-all flex-1 md:flex-none"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           form="occurrenceForm"
                           disabled={isSaving}
                           className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 flex-1 md:flex-none"
                        >
                           {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                           Enviar Ocorrência
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default TeacherOccurrences;
