
import React from 'react';
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
  Scale
} from 'lucide-react';
import { Referral } from '../types';

interface BuscaAtivaStudentProfileProps {
  student: any;
  referrals: Referral[];
  onClose: () => void;
}

const BuscaAtivaStudentProfile: React.FC<BuscaAtivaStudentProfileProps> = ({ student, referrals, onClose }) => {
  const studentReferrals = referrals.filter(r => r.studentId === student.id);

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
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Intervenções</p>
                 <p className="text-3xl font-black text-gray-900">{studentReferrals.length}</p>
              </div>
           </div>

           {/* DADOS DE CONTATO */}
           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-3 flex items-center gap-2">
                 <Phone size={14} className="text-emerald-600" /> Canais de Contato
              </h4>
              <div className="grid grid-cols-1 gap-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Phone size={16}/></div>
                    <p className="text-sm font-bold text-gray-700">{student.phone}</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MapPin size={16}/></div>
                    <p className="text-xs font-medium text-gray-500 uppercase">{student.address}</p>
                 </div>
              </div>
           </div>

           {/* LINHA DO TEMPO DE BUSCA ATIVA */}
           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 px-2">
                 <History size={16} className="text-emerald-600" /> Histórico de Acompanhamento
              </h4>
              
              <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-100">
                 {studentReferrals.length > 0 ? studentReferrals.map((ref, idx) => (
                   <div key={ref.id} className="relative pl-12">
                      <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm z-10"></div>
                      <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:border-emerald-200 transition-all">
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase border border-emerald-100">{ref.type}</span>
                            <span className="text-[10px] font-bold text-gray-400">{new Date(ref.date).toLocaleDateString('pt-BR')}</span>
                         </div>
                         <p className="text-sm font-black text-gray-900 uppercase leading-tight mb-2">Motivo: {ref.reason.substring(0, 60)}...</p>
                         <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                            <User size={12} /> Resp: {ref.responsible}
                         </div>
                      </div>
                   </div>
                 )) : (
                   <div className="py-12 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-100 ml-12 mr-2">
                      <MessageSquare size={32} className="mx-auto mb-2 text-gray-200" />
                      <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Sem registros anteriores</p>
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
    </div>
  );
};

export default BuscaAtivaStudentProfile;
