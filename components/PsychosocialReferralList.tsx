import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  Trash2,
  Edit2,
  Filter,
  History,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Printer,
  Users,
  AlertTriangle,
  PlusCircle,
  HeartHandshake,
  X,
  Scale
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { PsychosocialReferral, PsychosocialRole } from '../types';
import PsychosocialReferralForm from './PsychosocialReferralForm';

interface PsychosocialReferralListProps {
  role: PsychosocialRole;
  user?: any; // Add user prop for teacher context
  onTabChange?: (tab: string) => void;
  filterDestination?: 'BUSCA_ATIVA' | 'MEDIACAO';
  initialSearch?: string;
}

const PsychosocialReferralList: React.FC<PsychosocialReferralListProps> = ({ 
  role, 
  user, 
  onTabChange, 
  filterDestination,
  initialSearch 
}) => {
  const [referrals, setReferrals] = useState<PsychosocialReferral[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState<PsychosocialReferral | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  const [loading, setLoading] = useState(false);
  const [printingReferral, setPrintingReferral] = useState<PsychosocialReferral | null>(null);

  const handlePrintReferral = (ref: PsychosocialReferral, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPrintingReferral(ref);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Form State
  const [newReferral, setNewReferral] = useState({
    student_name: '',
    class_name: '',
    reason: '',
    priority: 'MEDIA',
    status: 'AGUARDANDO',
    observations: '',
    // Additional fields to match type if needed, but for now specific form fields
    student_age: '',
    school_unit: 'EE CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI',
    teacher_name: user?.name || 'PROFESSOR',
    previous_strategies: '',
    attendance_frequency: '',
    adopted_procedures: [] as string[],
    report: ''
  });

  const fetchReferrals = async () => {
    try {
      let query = supabase
        .from('psychosocial_referrals')
        .select('*')
        .order('date', { ascending: false });

      if (role === 'PROFESSOR' && user?.name) {
        query = query.ilike('teacher_name', `%${user.name.trim()}%`);
      }

      if (filterDestination) {
        query = query.eq('referral_destination', filterDestination);
      }

      const { data, error } = await query;

      // Buscar também casos de mediação que foram triados para o psicossocial
      const { data: medData } = await supabase
        .from('mediation_cases')
        .select('*')
        .order('opened_at', { ascending: false });

      const triagedFromMediation = (medData || []).filter((c: any) => 
        (typeof c.description === 'string' && (c.description.includes('PSICOSSOCIAL') || c.description.includes('TRIAGEM P/ PSICOSSOCIAL'))) ||
        (c.feedback && c.feedback.includes('PSICOSSOCIAL'))
      );

      const existingNames = new Set((data || []).map((r: any) => (r.student_name || '').toUpperCase().trim()));

      const formattedFromMed: PsychosocialReferral[] = triagedFromMediation
        .filter((c: any) => !existingNames.has((c.student_name || '').toUpperCase().trim()))
        .map((c: any) => ({
          id: `med-${c.id}`,
          schoolUnit: 'EE CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI',
          studentName: c.student_name || 'Estudante',
          studentAge: 'N/A',
          className: c.class_name || 'N/A',
          teacherName: 'PROFESSOR MEDIADOR',
          priority: c.severity === 'CRÍTICA' ? 'ALTA' : (c.severity === 'BAIXA' ? 'BAIXA' : 'MEDIA'),
          previousStrategies: 'Pré-círculo e acolhimento na Mediação Escolar',
          attendanceFrequency: '100',
          adoptedProcedures: ['Mediação de Conflitos', 'Escuta Qualificada'],
          observedAspects: { learning: [], behavioral: ['Conflito Interpessoal'], emotional: ['Vulnerabilidade Identificada'] },
          report: c.description || 'Caso encaminhado pela Mediação Escolar para acompanhamento especializado.',
          status: c.status === 'CONCLUÍDO' || c.status === 'CONCLUIDO' ? 'CONCLUÍDO' : 'PENDENTE',
          date: c.opened_at ? c.opened_at.split('T')[0] : new Date().toLocaleDateString('sv-SE'),
          timestamp: new Date(c.opened_at || Date.now()).getTime(),
          reason: c.description || 'Triagem da Mediação Escolar',
          feedback: c.feedback,
          referralDestination: 'PSICOSSOCIAL',
          mediationProcedures: ['Acolhimento', 'Triagem Psicossocial'],
          origin_case_id: c.id
        }));

      if (data || formattedFromMed.length > 0) {
        const filteredData = role === 'PROFESSOR' ? (data || []) : (data || []).filter((r: any) => {
          const tName = (r.teacher_name || '').toUpperCase();
          const rReason = (r.reason || r.report || '').toUpperCase();
          const rDest = (r.referral_destination || '').toUpperCase();
          return tName.includes('MEDIAÇÃO') || 
                 tName.includes('MEDIACAO') || 
                 rReason.includes('TRIAGEM DA MEDIAÇÃO') || 
                 rReason.includes('TRIADO VIA MEDIAÇÃO') ||
                 rReason.includes('PSICOSSOCIAL') ||
                 rDest === 'PSICOSSOCIAL' ||
                 r.origin_case_id;
        });

        const formattedDb: PsychosocialReferral[] = filteredData.map(r => {
          let parsedObs = { learning: [] as string[], behavioral: [] as string[], emotional: [] as string[] };
          if (r.observations) {
            if (typeof r.observations === 'object' && r.observations !== null) {
              parsedObs = {
                learning: Array.isArray(r.observations.learning) ? r.observations.learning : [],
                behavioral: Array.isArray(r.observations.behavioral) ? r.observations.behavioral : [],
                emotional: Array.isArray(r.observations.emotional) ? r.observations.emotional : []
              };
            } else if (typeof r.observations === 'string') {
              try {
                const json = JSON.parse(r.observations);
                if (typeof json === 'object' && json !== null) {
                  parsedObs = {
                    learning: Array.isArray(json.learning) ? json.learning : [],
                    behavioral: Array.isArray(json.behavioral) ? json.behavioral : [],
                    emotional: Array.isArray(json.emotional) ? json.emotional : []
                  };
                }
              } catch (e) {}
            }
          }

          return {
            id: r.id,
            schoolUnit: r.school_unit,
            studentName: r.student_name,
            studentAge: r.student_age,
            className: r.class_name,
            teacherName: r.teacher_name,
            priority: r.priority || 'MEDIA',
            previousStrategies: r.previous_strategies || '',
            attendanceFrequency: r.attendance_frequency || '0',
            adoptedProcedures: r.adopted_procedures || [],
            observedAspects: parsedObs,
            report: r.report || r.reason || '',
            status: r.status as any,
            date: r.date,
            observations: parsedObs,
            timestamp: new Date(r.created_at || Date.now()).getTime(),
            reason: r.reason || r.report || 'Sem motivo especificado',
            feedback: r?.feedback,
            referralDestination: r.referral_destination,
            mediationProcedures: r.mediation_procedures || [],
            origin_case_id: r.origin_case_id
          };
        });

        setReferrals([...formattedFromMed, ...formattedDb]);
      }
    } catch (error) {
      console.error("Erro ao buscar encaminhamentos:", error);
    }
  };

  useEffect(() => {
    fetchReferrals();
    const sub1 = supabase
      .channel('psychosocial_referrals_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'psychosocial_referrals' }, fetchReferrals)
      .subscribe();

    const sub2 = supabase
      .channel('mediation_cases_changes_in_psycho')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mediation_cases' }, fetchReferrals)
      .subscribe();

    return () => { 
      sub1.unsubscribe(); 
      sub2.unsubscribe();
    };
  }, [user?.name, role]);

  const handleCreateOrUpdate = async (formData: PsychosocialReferral) => {
    setLoading(true);
    try {
      const isEditing = Boolean(editingReferral?.id);
      const referralData = {
        student_name: formData.studentName,
        class_name: formData.className,
        reason: formData.report || 'Encaminhamento',
        priority: formData.priority || 'MEDIA',
        status: formData.status || 'PENDENTE',
        observations: formData.observedAspects,
        school_unit: formData.schoolUnit,
        teacher_name: formData.teacherName,
        date: formData.date || new Date().toLocaleDateString('sv-SE'),
        student_age: formData.studentAge,
        previous_strategies: formData.previousStrategies,
        attendance_frequency: formData.attendanceFrequency,
        adopted_procedures: formData.adoptedProcedures,
        report: formData.report,
        referral_destination: formData.referralDestination || 'MEDIACAO',
        mediation_procedures: formData.mediationProcedures || []
      };

      if (isEditing && editingReferral) {
        // UPDATE
        const { error } = await supabase
          .from('psychosocial_referrals')
          .update(referralData)
          .eq('id', editingReferral.id);

        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase
          .from('psychosocial_referrals')
          .insert([referralData]);

        if (error) throw error;

        // Auto vincular / criar caso de abertura na Mediação Escolar
        try {
          const activeTeacher = referralData.teacher_name || user?.name || 'PROFESSOR';
          await supabase.from('mediation_cases').insert([{
            origin_referral_id: formData.id,
            student_id: 'N/A',
            student_name: formData.studentName,
            class_name: formData.className,
            type: 'OUTRO',
            severity: formData.priority === 'ALTA' ? 'ALTA' : (formData.priority === 'BAIXA' ? 'BAIXA' : 'MÉDIA'),
            status: 'ABERTURA',
            opened_at: referralData.date,
            description: `[Origem: Encaminhamento do Professor] Relato: ${formData.report || formData.reason || 'Sem relato'} | Unidade: ${formData.schoolUnit}`,
            involved_parties: [activeTeacher],
            steps: [
              { id: '1', label: 'Encaminhamento Recebido do Professor', completed: true, date: referralData.date },
              { id: '2', label: 'Escuta das Partes', completed: false },
              { id: '3', label: 'Círculo de Mediação / Paz', completed: false },
              { id: '4', label: 'Acordo / Finalização', completed: false }
            ]
          }]);
        } catch (caseErr) {
          console.warn("Aviso ao criar caso correspondente na mediação:", caseErr);
        }
      }

      await fetchReferrals();
      setIsModalOpen(false);
      setEditingReferral(null);
      resetForm();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      alert(`Erro ao salvar encaminhamento: ${error?.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewReferral({
      student_name: '',
      class_name: '',
      reason: '',
      priority: 'MEDIA',
      status: 'AGUARDANDO',
      observations: '',
      student_age: '',
      school_unit: 'EE CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI',
      teacher_name: user?.name || 'PROFESSOR',
      previous_strategies: '',
      attendance_frequency: '',
      adopted_procedures: [],
      report: ''
    });
    setEditingReferral(null);
  }

  const handleSendToMediation = async (ref: PsychosocialReferral, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // 1. Verificar se já existe caso para este aluno no mediátion
      const { data: existing } = await supabase
        .from('mediation_cases')
        .select('id')
        .eq('student_name', ref.studentName)
        .eq('status', 'ABERTURA') // Ou qualquer status em aberto
        .limit(1);

      if (existing && existing.length > 0) {
        if (onTabChange) onTabChange('mediation');
        return;
      }

      // 2. Se não existir, criar
      const { error } = await supabase.from('mediation_cases').insert([{
        origin_referral_id: ref.id,
        student_id: 'N/A',
        student_name: ref.studentName,
        class_name: ref.className,
        type: 'OUTRO',
        severity: ref.priority === 'ALTA' ? 'ALTA' : (ref.priority === 'BAIXA' ? 'BAIXA' : 'MÉDIA'),
        status: 'ABERTURA',
        opened_at: new Date().toLocaleDateString('sv-SE'),
        description: `[Vínculo Direto] Motivo: ${ref.reason}`,
        involved_parties: [ref.teacherName || 'EQUIPE MULTI'],
        steps: [
          { id: '1', label: 'Início via Encaminhamento', completed: true, date: new Date().toLocaleDateString('sv-SE') },
          { id: '2', label: 'Escuta das Partes', completed: false },
          { id: '3', label: 'Círculo de Mediação / Paz', completed: false },
          { id: '4', label: 'Acordo / Finalização', completed: false }
        ]
      }]);

      if (error) throw error;

      alert("Caso de mediação criado com sucesso para este aluno!");
      if (onTabChange) onTabChange('mediation');
    } catch (err: any) {
      console.error(err);
      alert("Erro ao vincular com mediação: " + (err.message || "Erro desconhecido"));
    }
  };

  const handleProvideFeedbackToMediation = async (ref: PsychosocialReferral, e: React.MouseEvent) => {
    e.stopPropagation();
    const feedbackText = window.prompt(
      `Registrar Parecer / Devolutiva para a Mediação Escolar (${ref.studentName}):`,
      ref.feedback || ''
    );
    if (feedbackText === null) return;

    try {
      await supabase
        .from('psychosocial_referrals')
        .update({ feedback: feedbackText })
        .eq('id', ref.id);

      if ((ref as any).origin_case_id) {
        await supabase
          .from('mediation_cases')
          .update({ feedback: feedbackText })
          .eq('id', (ref as any).origin_case_id);
      } else {
        await supabase
          .from('mediation_cases')
          .update({ feedback: feedbackText })
          .ilike('student_name', ref.studentName);
      }

      alert('Parecer/Devolutiva registrada com sucesso e sincronizada com o Módulo de Mediação Escolar!');
      fetchReferrals();
    } catch (err: any) {
      console.error('Erro ao enviar parecer para a Mediação:', err);
      alert('Ocorreu um erro ao salvar o parecer.');
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm("Confirmar exclusão?")) {
      const { error } = await supabase.from('psychosocial_referrals').delete().eq('id', id);
      if (!error) {
        setReferrals(prev => prev.filter(r => r.id !== id));
      } else {
        alert("Erro ao excluir.");
      }
    }
  };

  const filtered = referrals.filter(r =>
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Banner de Roteamento Exclusivo */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 p-6 rounded-[2rem] text-white shadow-xl border border-rose-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-600/30 text-rose-300 rounded-2xl border border-rose-500/30">
            <HeartHandshake size={24} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-white">
              {role === 'PROFESSOR' ? 'Encaminhamentos para a Mediação Escolar' : 'Central Técnica Psicossocial'}
            </h2>
            <p className="text-xs text-rose-200/80 font-medium">
              {role === 'PROFESSOR' 
                ? 'Registre estudantes para acolhimento, escuta ativa e resolução pacífica pela equipe de Mediação Escolar.' 
                : 'Exibindo exclusivamente estudantes triados e encaminhados pelo Módulo de Mediação Escolar.'}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0">
          {role === 'PROFESSOR' ? 'Área Docente' : 'Entrada Única: Mediação Escolar'}
        </span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black uppercase text-gray-900 border-b-4 border-rose-500 pb-1">
            {role === 'PROFESSOR' ? 'Meus Encaminhamentos para a Mediação' : 'Triagens Recebidas da Mediação Escolar'}
          </h1>
          <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mt-2 font-mono">
            {role === 'PROFESSOR' ? 'Acompanhamento do Atendimento e Devolutivas' : 'Acompanhamento Clínico & Apoio Técnico Especializado'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Buscar aluno ou turma..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-rose-100 transition-all w-56 placeholder:text-gray-300"
            />
          </div>
          <button
            onClick={() => {
              setEditingReferral(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
          >
            <PlusCircle size={16} /> {role === 'PROFESSOR' ? 'Novo Encaminhamento' : 'Nova Avaliação Técnica'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(ref => (
          <div 
             key={ref.id} 
             onClick={() => {
               setEditingReferral(ref);
               setIsModalOpen(true);
             }}
             className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-violet-200 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${ref.priority === 'ALTA' ? 'bg-red-50 text-red-600 border-red-100' :
                  ref.priority === 'MEDIA' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                  Prioridade {ref.priority}
                </span>
                
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${ref.status === 'CONCLUIDO' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                  <span className="text-[10px] font-black uppercase text-gray-500">{ref.status || 'AGUARDANDO'}</span>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-1">{ref.studentName}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-3">{ref.className}</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(ref.date).toLocaleDateString('pt-BR')}</span>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-[1.8rem] border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-widest">Motivo do Encaminhamento</p>
                  <p className="text-xs text-gray-600 font-medium line-clamp-3 leading-relaxed italic">"{ref.reason}"</p>
                </div>

                {/* Devolutiva da Mediação */}
                {ref?.feedback && (
                  <div className="bg-emerald-50 p-4 rounded-[1.8rem] border border-emerald-100 animate-in fade-in slide-in-from-top-2 duration-700 shadow-sm shadow-emerald-100/50">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-1.5 tracking-widest flex items-center gap-2">
                       <CheckCircle2 size={12} strokeWidth={3} /> Devolutiva da Mediação
                    </p>
                    <p className="text-[11px] text-emerald-800 font-bold leading-relaxed">
                      {ref?.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* BARRA DE AÇÕES DO CARD */}
            <div className="mt-6 flex gap-2 border-t border-gray-100 pt-4">
               <button 
                 type="button"
                 onClick={(e) => handlePrintReferral(ref, e)}
                 className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-sm"
               >
                  <Printer size={14} /> Imprimir / PDF
               </button>
               <button 
                 type="button"
                 onClick={(e) => {
                   e.stopPropagation();
                   setEditingReferral(ref);
                   setIsModalOpen(true);
                 }}
                 className="p-3 bg-gray-100 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-xl transition-all"
                 title="Editar Encaminhamento"
               >
                  <Edit2 size={15} />
               </button>
               <button 
                 type="button"
                 onClick={(e) => handleDelete(ref.id, e)}
                 className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                 title="Excluir Encaminhamento"
               >
                  <Trash2 size={15} />
               </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50 flex flex-col items-center justify-center">
            <HeartHandshake size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-black uppercase text-xs tracking-widest">
              {role === 'PROFESSOR' ? 'Nenhum encaminhamento enviado por você ainda.' : 'Nenhum encaminhamento registrado.'}
            </p>
            {role === 'PROFESSOR' && (
              <button
                onClick={() => {
                  setEditingReferral(null);
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="mt-4 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
              >
                <PlusCircle size={16} /> Fazer Primeiro Encaminhamento
              </button>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-rose-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="py-10 min-h-screen flex flex-col items-center">
            {loading && <div className="text-white mb-4 animate-pulse font-black uppercase text-xs tracking-widest">Salvando encaminhamento...</div>}
            <div className="w-full max-w-5xl px-4">
              <PsychosocialReferralForm 
                onCancel={() => {
                  setIsModalOpen(false);
                  setEditingReferral(null);
                }} 
                onSave={handleCreateOrUpdate} 
                initialData={editingReferral ? {
                  id: editingReferral.id,
                  studentName: editingReferral.studentName,
                  studentAge: editingReferral.studentAge,
                  className: editingReferral.className,
                  teacherName: editingReferral.teacherName || user?.name || 'PROFESSOR',
                  schoolUnit: (editingReferral.schoolUnit && editingReferral.schoolUnit !== 'Unidade Escolar') ? editingReferral.schoolUnit : 'EE CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI',
                  previousStrategies: editingReferral.previousStrategies || '',
                  attendanceFrequency: editingReferral.attendanceFrequency || '0',
                  adoptedProcedures: editingReferral.adoptedProcedures || [],
                  observedAspects: editingReferral.observedAspects || { learning: [], behavioral: [], emotional: [] },
                  report: editingReferral.report || editingReferral.reason || '',
                  status: editingReferral.status || 'PENDENTE',
                  priority: editingReferral.priority || 'MEDIA',
                  date: editingReferral.date || new Date().toISOString().split('T')[0],
                  referralDestination: 'MEDIACAO'
                } : {
                  id: `ref-${Date.now()}`,
                  schoolUnit: 'EE CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI',
                  teacherName: user?.name || 'PROFESSOR',
                  date: new Date().toISOString().split('T')[0],
                  observedAspects: { learning: [], behavioral: [], emotional: [] },
                  referralDestination: 'MEDIACAO'
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* ÁREA DE IMPRESSÃO DA FICHA DE ENCAMINHAMENTO (PDF / IMPRESSÃO) */}
      {printingReferral && (
        <div className="print-referral-area">
          <div className="pdf-page p-6 sm:p-8 flex flex-col justify-between min-h-[275mm] text-black font-serif">
            
            <div className="flex-1 flex flex-col justify-start">
              {/* CABEÇALHO OFICIAL SEDUC/MT */}
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                <img 
                  src="/brasao_mt.png" 
                  alt="Brasão MT" 
                  className="h-24 w-auto object-contain shrink-0 max-h-[90px]" 
                  onError={(e) => (e.currentTarget.src = '/SEDUC 2.jpg')} 
                />
                <div className="text-center flex-1 mx-2 space-y-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
                  <h1 className="text-[11px] font-bold uppercase text-black leading-tight">Governo do Estado de Mato Grosso</h1>
                  <h2 className="text-[10px] font-bold uppercase text-black leading-tight">Secretaria de Estado de Educação</h2>
                  <h3 className="text-[10px] font-bold uppercase text-black leading-tight">Secretaria Adjunta de Gestão Regional</h3>
                  <h4 className="text-[9px] font-bold uppercase text-black leading-tight">Superintendência de Gestão das Diretorias Regionais</h4>
                  <h5 className="text-[9px] font-bold uppercase text-black leading-tight">Diretoria Regional de Educação de Sinop</h5>
                  <h6 className="text-[11px] font-black uppercase text-black leading-tight pt-0.5">Escola Estadual Cívico-Militar André Antônio Maggi</h6>
                </div>
                <img 
                  src="/logo-escola-oficial.png" 
                  alt="Escola Logo" 
                  className="h-28 w-auto object-contain shrink-0 max-h-[110px]" 
                  onError={(e) => (e.currentTarget.src = '/logo-escola.png')} 
                />
              </div>

              {/* TÍTULO */}
              <div className="text-center my-3">
                <h2 className="text-base font-bold uppercase text-black tracking-wider" style={{ fontFamily: 'Arial, sans-serif' }}>
                  ENCAMINHAMENTO PARA MEDIAÇÃO
                </h2>
              </div>

              {/* IDENTIFICAÇÃO */}
              <div className="text-xs space-y-1.5 border border-black p-3 mb-3 leading-relaxed">
                <p><strong>Unidade Escolar:</strong> {printingReferral.schoolUnit || 'EE CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI'}</p>
                <p><strong>Nome do estudante:</strong> {printingReferral.studentName || '________________________________________'}</p>
                <div className="grid grid-cols-2 gap-4">
                  <p><strong>Idade:</strong> {printingReferral.studentAge ? `${printingReferral.studentAge} anos` : '____ anos'}</p>
                  <p><strong>Ano/Turma:</strong> {printingReferral.className || '____________'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <p><strong>Professor:</strong> {printingReferral.teacherName || '________________________'}</p>
                  <p><strong>Data:</strong> {new Date(printingReferral.date).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* ESTRATÉGIAS */}
              <div className="text-xs space-y-1 mb-3">
                <p className="font-bold uppercase">Estratégias já realizadas pela PROFESSOR :</p>
                <div className="border border-black p-2.5 min-h-[60px] text-justify leading-relaxed whitespace-pre-line">
                  {printingReferral.previousStrategies || "________________________________________________________________________________________________________________________________________________________________________________________________________________________________"}
                </div>
              </div>

              {/* ASPECTOS OBSERVADOS */}
              <div className="text-xs space-y-2 mb-3">
                <p className="font-bold uppercase">Marque com X a alternativa corresponde ao que foi observado.</p>

                {/* Aprendizagem */}
                <div className="space-y-0.5">
                  <p className="font-bold text-[11px] uppercase">Aspectos relacionados à aprendizagem</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10.5px]">
                    {[
                      "Dificuldade de Leitura;",
                      "Dificuldade em decodificar palavras e números;",
                      "Dificuldade em compreender textos;",
                      "Dificuldade de escrita."
                    ].map(item => (
                      <div key={item} className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs">
                          ({printingReferral.observedAspects?.learning?.includes(item) ? ' X ' : '   '})
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comportamentais */}
                <div className="space-y-0.5 pt-1">
                  <p className="font-bold text-[11px] uppercase">Aspectos comportamentais</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10.5px]">
                    {[
                      "Dificuldades em manter o foco;",
                      "Esquecimento frequente de instruções ou tarefas;",
                      "Muita Dificuldade de se manter sentado ao decorrer da aula;",
                      "Dificuldade em esperar a vez;",
                      "Mudança brusca de comportamento."
                    ].map(item => (
                      <div key={item} className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs">
                          ({printingReferral.observedAspects?.behavioral?.includes(item) ? ' X ' : '   '})
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emocionais */}
                <div className="space-y-0.5 pt-1">
                  <p className="font-bold text-[11px] uppercase">Aspectos Emocionais</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10.5px]">
                    {[
                      "Preocupação excessiva com desempenho escolar;",
                      "Medo de fracassar ou decepcionar os outros;",
                      "Baixa Autoestima;",
                      "Sentimentos de inadequação;",
                      "Tristeza frequente."
                    ].map(item => (
                      <div key={item} className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs">
                          ({printingReferral.observedAspects?.emotional?.includes(item) ? ' X ' : '   '})
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* BREVE RELATO */}
              <div className="text-xs space-y-1 mb-4">
                <p className="font-bold uppercase">Escreva um breve relato:</p>
                <div className="border border-black p-2.5 min-h-[90px] text-justify leading-relaxed whitespace-pre-line">
                  {printingReferral.report || printingReferral.reason || "________________________________________________________________________________________________________________________________________________________________________________________________________________________________"}
                </div>
              </div>

              {/* ASSINATURAS */}
              <div className="grid grid-cols-2 gap-12 text-center text-xs pt-6">
                <div>
                  <div className="border-t border-black pt-1">
                    <p className="font-bold uppercase">{printingReferral.teacherName || 'PROFESSOR(A)'}</p>
                    <p className="text-[10px] text-gray-600">Professor(a) Solicitante</p>
                  </div>
                </div>
                <div>
                  <div className="border-t border-black pt-1">
                    <p className="font-bold uppercase">EQUIPE DE MEDIAÇÃO ESCOLAR</p>
                    <p className="text-[10px] text-gray-600">Ciente e Recebido em ____/____/________</p>
                  </div>
                </div>
              </div>

            </div>

            {/* RODAPÉ OFICIAL */}
            <div className="mt-auto border-t border-black/40 pt-2 grid grid-cols-2 gap-4 text-[8.5px] leading-tight text-black" style={{ color: '#000000', fontFamily: 'Arial, sans-serif' }}>
              <div className="text-left space-y-0.5">
                <p>Rua Engenheiro Edgar Prado Arze, Quadra 01, Lote 05, Setor A, Centro Político Administrativo,</p>
                <p>CEP: 78049-906 – Cuiabá-MT Fone (65) 3613-6300</p>
                <p>Site: www.seduc.mt.gov.br</p>
              </div>
              <div className="text-left space-y-0.5 pl-6">
                <p>Rua Borba Gato, nº 80, Bairro Torre</p>
                <p>CEP: 78500-000 – Colíder-MT Fones +55 (66) 99682-7608</p>
                <p>Email: escola.158330@edu.mt.gov.br</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ESTILOS CSS DE IMPRESSÃO */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media screen {
          .print-referral-area { display: none !important; }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm !important;
          }
          html, body {
            height: auto !important;
            width: 100% !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * { visibility: hidden !important; }
          .no-print { display: none !important; }
          .print-referral-area, .print-referral-area * { visibility: visible !important; }
          .print-referral-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            min-height: 100% !important;
            display: block !important;
            background: white !important;
            color: black !important;
            box-sizing: border-box !important;
            padding: 0 !important;
          }
          .pdf-page { 
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            min-height: 275mm !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 0 !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
          }
        }
      `}} />
    </div>
  );
};

export default PsychosocialReferralList;
