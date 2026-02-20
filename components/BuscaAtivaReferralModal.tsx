
import React, { useState } from 'react';
import { 
  X, 
  Send, 
  User, 
  MessageSquare, 
  Tag, 
  Calendar,
  ShieldAlert,
  GraduationCap,
  HeartPulse,
  Users as UsersIcon,
  Scale
} from 'lucide-react';
import { Referral, ReferralType } from '../types';

interface BuscaAtivaReferralModalProps {
  student: { id: string, name: string, class: string };
  onClose: () => void;
  onSave: (referral: Omit<Referral, 'id'>) => void;
}

const BuscaAtivaReferralModal: React.FC<BuscaAtivaReferralModalProps> = ({ student, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    type: 'PEDAGÓGICO' as ReferralType,
    reason: '',
    status: 'ABERTO' as 'ABERTO' | 'EM_ACOMPANHAMENTO' | 'CONCLUÍDO',
    responsible: 'COORDENADOR ANDRÉ',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason) return alert("Por favor, descreva o motivo do encaminhamento.");
    onSave({
      studentId: student.id,
      studentName: student.name,
      ...formData
    });
  };

  const types = [
    { id: 'PEDAGÓGICO', icon: GraduationCap, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'PSICOLÓGICO', icon: HeartPulse, color: 'bg-pink-50 text-pink-600 border-pink-100' },
    { id: 'SOCIAL', icon: UsersIcon, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { id: 'CONSELHO_TUTELAR', icon: Scale, color: 'bg-red-50 text-red-600 border-red-100' },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-8 bg-gray-50 flex justify-between items-center border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-lg">
              <Send size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Registrar Encaminhamento</h3>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Intervenção de Busca Ativa</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl shadow-sm transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="mb-8 p-6 bg-emerald-900 rounded-[2rem] text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10"><User size={80} /></div>
             <div className="relative z-10">
                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Aluno Selecionado</p>
                <h4 className="text-xl font-black uppercase leading-tight">{student.name}</h4>
                <p className="text-xs font-bold text-emerald-300/70 uppercase mt-1">{student.class}</p>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selecione o Tipo de Encaminhamento</label>
              <div className="grid grid-cols-2 gap-3">
                {types.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData({...formData, type: t.id as ReferralType})}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                      formData.type === t.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <t.icon size={20} className={formData.type === t.id ? 'text-emerald-600' : 'text-gray-300'} />
                    <span className={`text-[10px] font-black uppercase ${formData.type === t.id ? 'text-emerald-700' : 'text-gray-400'}`}>
                      {t.id.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data da Ocorrência</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status Inicial</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white"
                >
                  <option value="ABERTO">ABERTO</option>
                  <option value="EM_ACOMPANHAMENTO">EM ACOMPANHAMENTO</option>
                  <option value="CONCLUÍDO">CONCLUÍDO</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Motivo / Justificativa do Encaminhamento</label>
              <textarea 
                required
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
                placeholder="Descreva detalhadamente o fato que motivou esta intervenção..."
                className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium h-32 resize-none outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
              />
            </div>

            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Técnico / Responsável</label>
               <input 
                  type="text" 
                  value={formData.responsible}
                  onChange={e => setFormData({...formData, responsible: e.target.value.toUpperCase()})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none"
               />
            </div>

            <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-3">
               <ShieldAlert size={20} /> Efetivar Encaminhamento
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BuscaAtivaReferralModal;
