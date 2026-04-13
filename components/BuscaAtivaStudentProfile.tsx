
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  History, 
  MapPin, 
  Phone, 
  User, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  MessageSquare,
  Scale,
  Plus,
  Clock,
  Loader2
} from 'lucide-react';
import { Referral } from '../types';
import { supabase } from '../supabaseClient';
import BuscaAtivaAddLogModal from './BuscaAtivaAddLogModal';

interface BuscaAtivaStudentProfileProps {
  student: any;
  referrals: Referral[];
  onClose: () => void;
}

const BuscaAtivaStudentProfile: React.FC<BuscaAtivaStudentProfileProps> = ({ student, referrals, onClose }) => {
  const [monitoringLogs, setMonitoringLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [showAddLog, setShowAddLog] = useState(false);
  const studentReferrals = referrals.filter(r => r.studentId === student.id);

  useEffect(() => {
    fetchMonitoringLogs();

    const channel = supabase
      .channel(`student-monitoring-${student.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'occurrences', 
        filter: `student_id=eq.${student.id}` 
      }, () => {
        fetchMonitoringLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [student.id]);

  const fetchMonitoringLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .eq('student_id', student.id)
        .eq('category', 'BUSCA_ATIVA')
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error) throw error;
      setMonitoringLogs(data || []);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-end bg-emerald-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white h-full w-full max-w-2xl shadow-2xl border-l border-white/20 overflow-hidden flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* HEADER PERFIL */}
        <div className="p-8 bg-emerald-900 text-white shrink-0 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><User size={200} /></div>
           <div className="relative z-10 flex justify-between items-start">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-black">
                    {student.name[0]}
                 </div>
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight leading-none">{student.name}</h3>
                    <p className="text-emerald-300 font-bold uppercase text-[10px] tracking-widest mt-2">{student.class} • MATRÍCULA ATIVA</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                 <X size={28} />
              </button>
           </div>
        </div>

        {/* CONTEÚDO SCROLL */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-gray-50/50">
           
           {/* CARDS DE STATUS RÁPIDO */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Frequência Real</p>
                 <div className="flex items-end gap-2">
                    <p className={`text-3xl font-black ${student.attendance < 90 ? 'text-red-600' : 'text-emerald-600'}`}>
                       {student.attendance}%
                    </p>
                    <TrendingDown size={18} className={student.attendance < 90 ? 'text-red-400 mb-1' : 'hidden'} />
                 </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total de Registros</p>
                 <p className="text-3xl font-black text-gray-900">{monitoringLogs.length + studentReferrals.length}</p>
              </div>
           </div>

           {/* LINHA DO TEMPO DE BUSCA ATIVA */}
           <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <History size={16} className="text-emerald-600" /> Diário de Acompanhamento
                </h4>
                <button 
                  onClick={() => setShowAddLog(true)}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Plus size={14} /> Novo Registro
                </button>
              </div>
              
              <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-100">
                 {loadingLogs ? (
                   <div className="py-12 text-center ml-12"><Loader2 className="animate-spin mx-auto text-emerald-600" /></div>
                 ) : monitoringLogs.length > 0 || studentReferrals.length > 0 ? (
                   [...monitoringLogs.map(log => ({ 
                      id: log.id, 
                      date: log.date, 
                      time: log.time, 
                      type: 'BUSCA ATIVA', 
                      content: log.description, 
                      responsible: log.responsible_name || 'Equipe' 
                   })), ...studentReferrals.map(ref => ({
                      id: ref.id,
                      date: ref.date,
                      time: '00:00',
                      type: ref.type,
                      content: `Motivo: ${ref.reason}`,
                      responsible: ref.responsible
                   }))]
                   .sort((a, b) => {
                      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
                      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
                      return dateB.getTime() - dateA.getTime();
                   })
                   .map((item) => (
                    <div key={item.id} className="relative pl-12">
                       <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm z-10"></div>
                       <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:border-emerald-200 transition-all group">
                          <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border ${
                                  item.type === 'BUSCA ATIVA' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-violet-50 text-violet-600 border-violet-100'
                                }`}>
                                  {item.type}
                                </span>
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                <Calendar size={10} /> {new Date(item.date).toLocaleDateString('pt-BR')}
                                {item.time && <><Clock size={10} className="ml-1" /> {item.time.substring(0, 5)}</>}
                             </div>
                          </div>
                          <p className="text-xs font-bold text-gray-700 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mt-3 pt-3 border-t border-gray-50">
                             <User size={12} /> Resp: {item.responsible}
                          </div>
                       </div>
                    </div>
                  ))
                 ) : (
                   <div className="py-12 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-100 ml-12 mr-2">
                      <MessageSquare size={32} className="mx-auto mb-2 text-gray-200" />
                      <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Sem registros anteriores</p>
                      <button 
                        onClick={() => setShowAddLog(true)}
                        className="mt-4 text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                      >
                        Iniciar acompanhamento
                      </button>
                   </div>
                 )}
              </div>
           </div>

           {/* ALERTA FICAI */}
           {student.attendance < 90 && (
              <div className="p-8 bg-red-50 rounded-[2.5rem] border-2 border-red-100 border-dashed space-y-4">
                 <div className="flex items-center gap-3 text-red-600">
                    <AlertTriangle size={24} className="animate-pulse" />
                    <h4 className="text-sm font-black uppercase">Limite de Infrequência Atingido</h4>
                 </div>
                 <p className="text-xs text-red-700 font-medium leading-relaxed">
                    O aluno atingiu o patamar crítico de faltas. É obrigatória a abertura de <strong>FICAi</strong> e o encaminhamento imediato ao Conselho Tutelar.
                 </p>
                 <button className="w-full py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2">
                    <Scale size={14}/> Abrir FICAi Agora
                 </button>
              </div>
           )}
        </div>
      </div>

      {showAddLog && (
        <BuscaAtivaAddLogModal 
          student={student} 
          onClose={() => setShowAddLog(false)} 
          onSuccess={fetchMonitoringLogs}
        />
      )}
    </div>
  );
};

export default BuscaAtivaStudentProfile;

