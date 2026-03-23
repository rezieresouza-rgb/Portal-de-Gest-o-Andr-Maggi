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
  X
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { PsychosocialReferral, PsychosocialRole } from '../types';
import PsychosocialReferralForm from './PsychosocialReferralForm';

interface PsychosocialReferralListProps {
  role: PsychosocialRole;
}

const PsychosocialReferralList: React.FC<PsychosocialReferralListProps> = ({ role }) => {
  const [referrals, setReferrals] = useState<PsychosocialReferral[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

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
    school_unit: 'Unidade Escolar',
    teacher_name: 'COORDENAÇÃO', // Default or logged user
    previous_strategies: '',
    attendance_frequency: '',
    adopted_procedures: [] as string[],
    report: ''
  });

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('psychosocial_referrals')
        .select('*')
        .order('date', { ascending: false });

      if (data) {
        const formatted: PsychosocialReferral[] = data.map(r => ({
          id: r.id,
          schoolUnit: r.school_unit,
          studentName: r.student_name,
          studentAge: r.student_age,
          className: r.class_name,
          teacherName: r.teacher_name,
          priority: r.priority || 'MEDIA', // Ensure priority exists
          previousStrategies: r.previous_strategies || '',
          attendanceFrequency: r.attendance_frequency || '0',
          adoptedProcedures: r.adopted_procedures || [],
          observedAspects: r.observations || { learning: [], behavioral: [], emotional: [] },
          report: r.report || '',
          status: r.status as any,
          date: r.date,
          observations: typeof r.observations === 'string' ? r.observations : JSON.stringify(r.observations), // Handle varying formats if any
          timestamp: new Date(r.created_at).getTime(),
          reason: r.reason || r.report || 'Sem motivo especificado' // Fallback
        }));
        setReferrals(formatted);
      }
    } catch (error) {
      console.error("Erro ao buscar encaminhamentos:", error);
    }
  };

  useEffect(() => {
    fetchReferrals();
    const subscription = supabase
      .channel('psychosocial_referrals_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'psychosocial_referrals' }, fetchReferrals)
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);

  const handleCreateOrUpdate = async (formData: PsychosocialReferral) => {
    setLoading(true);
    try {
      const referralData = {
        student_name: formData.studentName,
        class_name: formData.className,
        reason: formData.report || 'Encaminhamento',
        priority: newReferral.priority,
        status: formData.status,
        observations: formData.observedAspects,
        school_unit: formData.schoolUnit,
        teacher_name: formData.teacherName,
        date: new Date().toLocaleDateString('sv-SE'),
        student_age: formData.studentAge,
        previous_strategies: formData.previousStrategies,
        attendance_frequency: formData.attendanceFrequency,
        adopted_procedures: formData.adoptedProcedures,
        report: formData.report
      };

      if (editingId) {
        // UPDATE
        const { error } = await supabase
          .from('psychosocial_referrals')
          .update(referralData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // INSERT
        const { error, data } = await supabase
          .from('psychosocial_referrals')
          .insert([referralData])
          .select();

        if (error) throw error;

        // Notification
        await supabase.from('psychosocial_notifications').insert([{
          title: 'Novo Encaminhamento',
          message: `Aluno ${newReferral.student_name} encaminhado.`,
          is_read: false
        }]);

        // [NOVO] Integração Automática com Módulo de Mediação
        try {
          const savedCases = localStorage.getItem('mediation_cases_v1');
          const mediationCases = savedCases ? JSON.parse(savedCases) : [];
          
          const newMediationCase = {
            id: `med-ref-${Date.now()}`,
            studentId: 'N/A',
            studentName: referralData.student_name,
            className: referralData.class_name,
            type: 'OUTRO',
            severity: referralData.priority === 'ALTA' ? 'ALTA' : (referralData.priority === 'BAIXA' ? 'BAIXA' : 'MÉDIA'),
            status: 'ABERTURA',
            openedAt: referralData.date,
            description: `[Origem: Encaminhamento Psicossocial] Motivo/Relato: ${referralData.report || referralData.reason || 'Sem descrição detalhada.'}`,
            involvedParties: [referralData.teacher_name],
            steps: [
              { id: '1', label: 'Análise do Encaminhamento', completed: true, date: referralData.date },
              { id: '2', label: 'Escuta das Partes', completed: false },
              { id: '3', label: 'Círculo de Mediação / Paz', completed: false },
              { id: '4', label: 'Acordo / Finalização', completed: false }
            ]
          };
          
          localStorage.setItem('mediation_cases_v1', JSON.stringify([newMediationCase, ...mediationCases]));
        } catch (e) {
          console.error('Erro ao integrar encaminhamento à mediação:', e);
        }
      }

      await fetchReferrals();
      setIsModalOpen(false);
      resetForm();
      // alert("Salvo com sucesso!"); // Removed alert for smoother UX or use toast later
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar encaminhamento.");
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
      school_unit: 'Unidade Escolar',
      teacher_name: 'COORDENAÇÃO',
      previous_strategies: '',
      attendance_frequency: '',
      adopted_procedures: [],
      report: ''
    });
    setEditingId(null);
  }

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
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase text-blue-950">Guia de Encaminhamento Psicossocial</h1>
          <p className="text-[10px] font-bold uppercase text-blue-900/60 tracking-widest">Rede de Proteção à Criança e ao Adolescente</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:bg-white/10 transition-all w-48 placeholder:text-white/20"
            />
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-violet-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-all flex items-center gap-2 border border-violet-500/20"
          >
            <PlusCircle size={18} /> Novo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(ref => (
          <div key={ref.id} className="bg-white/5 p-6 rounded-[2rem] border border-white/10 shadow-sm hover:border-violet-500/30 hover:bg-white/10 transition-all group backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${ref.priority === 'ALTA' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  ref.priority === 'MEDIA' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                  Prioridade {ref.priority}
                </span>
                <div className="flex gap-2">
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(ref.id);
                    setNewReferral({
                      student_name: ref.studentName,
                      class_name: ref.className,
                      reason: ref.reason || '',
                      priority: ref.priority,
                      status: ref.status,
                      observations: typeof ref.observations === 'string' ? ref.observations : '',
                      student_age: ref.studentAge || '',
                      school_unit: ref.schoolUnit || 'Unidade Escolar',
                      teacher_name: ref.teacherName || '',
                      previous_strategies: ref.previousStrategies || '',
                      attendance_frequency: ref.attendanceFrequency || '',
                      adopted_procedures: ref.adoptedProcedures || [],
                      report: ref.report || ''
                    });
                    setIsModalOpen(true);
                  }} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-violet-400 transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={(e) => handleDelete(ref.id, e)} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">{ref.studentName}</h3>
              <p className="text-xs font-bold text-white/40 uppercase mb-4">{ref.className}</p>

              <div className="space-y-3">
                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] font-black text-white/30 uppercase mb-1">Motivo do Encaminhamento</p>
                  <p className="text-xs text-white/80 font-medium line-clamp-2">{ref.reason}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${ref.status === 'CONCLUÍDO' ? 'bg-emerald-500' :
                  ref.status === 'EM_ANDAMENTO' || ref.status === 'EM_ACOMPANHAMENTO' ? 'bg-blue-500' : 'bg-amber-500'
                  }`} />
                <span className="text-[10px] font-black text-white/60 uppercase">{ref.status.replace('_', ' ')}</span>
              </div>
              <span className="text-[10px] font-bold text-white/20">{new Date(ref.date).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-sm">
            <HeartHandshake size={48} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/30 font-black uppercase text-xs tracking-widest">Nenhum encaminhamento registrado</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="py-10 min-h-screen flex flex-col items-center">
            {loading && <div className="text-white mb-4 animate-pulse">Salvando encaminhamento...</div>}
            <div className="w-full max-w-5xl px-4">
              <PsychosocialReferralForm 
                onCancel={() => setIsModalOpen(false)} 
                onSave={handleCreateOrUpdate} 
                initialData={{
                  id: editingId || `ref-${Date.now()}`,
                  studentName: newReferral.student_name,
                  className: newReferral.class_name,
                  report: newReferral.reason || newReferral.report,
                  status: (newReferral.status as any) || 'PENDENTE',
                  observedAspects: typeof newReferral.observations === 'string' || !newReferral.observations ? { learning: [], behavioral: [], emotional: [] } : (newReferral.observations as any),
                  schoolUnit: newReferral.school_unit,
                  teacherName: newReferral.teacher_name,
                  date: new Date().toLocaleDateString('sv-SE'),
                  studentAge: newReferral.student_age,
                  previousStrategies: newReferral.previous_strategies,
                  attendanceFrequency: newReferral.attendance_frequency,
                  adoptedProcedures: newReferral.adopted_procedures,
                  timestamp: Date.now()
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PsychosocialReferralList;
