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
    school_unit: 'E.E. André Antônio Maggi',
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

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const referralData = {
        student_name: newReferral.student_name,
        class_name: newReferral.class_name,
        reason: newReferral.reason,
        priority: newReferral.priority,
        status: newReferral.status,
        observations: newReferral.observations,
        // Default/Hidden fields
        school_unit: newReferral.school_unit,
        teacher_name: newReferral.teacher_name,
        date: new Date().toISOString().split('T')[0]
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
      school_unit: 'E.E. André Antônio Maggi',
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
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Caminhos do Cuidado</h2>
          <p className="text-white/60 font-bold text-xs uppercase tracking-widest">Encaminhamentos Psicossociais</p>
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
                      school_unit: ref.schoolUnit || 'E.E. André Antônio Maggi',
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden">
            <div className="p-8 border-b border-white/10 bg-white/5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">
                      {editingId ? 'Editar Encaminhamento' : 'Novo Encaminhamento'}
                    </h3>
                    <p className="text-[10px] font-bold text-white/40 uppercase">Preencha os dados do estudante</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl text-white/40 transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Nome do Estudante</label>
                  <input
                    required
                    value={newReferral.student_name}
                    onChange={e => setNewReferral({ ...newReferral, student_name: e.target.value.toUpperCase() })}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white uppercase outline-none focus:bg-white/10 transition-all placeholder:text-white/20"
                    placeholder="NOME COMPLETO"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Turma</label>
                  <input
                    required
                    value={newReferral.class_name}
                    onChange={e => setNewReferral({ ...newReferral, class_name: e.target.value.toUpperCase() })}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white uppercase outline-none focus:bg-white/10 transition-all placeholder:text-white/20"
                    placeholder="EX: 3º A"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Prioridade</label>
                  <select
                    value={newReferral.priority}
                    onChange={e => setNewReferral({ ...newReferral, priority: e.target.value as any })}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white uppercase outline-none focus:bg-white/10 transition-all [&>option]:bg-gray-900"
                  >
                    <option value="BAIXA">BAIXA</option>
                    <option value="MEDIA">MÉDIA</option>
                    <option value="ALTA">ALTA</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Motivo do Encaminhamento</label>
                <textarea
                  required
                  value={newReferral.reason}
                  onChange={e => setNewReferral({ ...newReferral, reason: e.target.value })}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-medium text-sm text-white outline-none focus:bg-white/10 transition-all h-24 resize-none placeholder:text-white/20"
                  placeholder="Descreva o motivo..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Observações Adicionais</label>
                <textarea
                  value={newReferral.observations}
                  onChange={e => setNewReferral({ ...newReferral, observations: e.target.value })}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-medium text-sm text-white outline-none focus:bg-white/10 transition-all h-24 resize-none placeholder:text-white/20"
                  placeholder="Observações extras..."
                />
              </div>

              {editingId && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Status</label>
                  <select
                    value={newReferral.status}
                    onChange={e => setNewReferral({ ...newReferral, status: e.target.value as any })}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-white uppercase outline-none focus:bg-white/10 transition-all [&>option]:bg-gray-900"
                  >
                    <option value="AGUARDANDO">AGUARDANDO</option>
                    <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                    <option value="CONCLUIDO">CONCLUÍDO</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-all border border-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Criar Encaminhamento')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PsychosocialReferralList;
