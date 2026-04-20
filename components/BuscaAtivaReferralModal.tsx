
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
import { Referral, ReferralType, ReferralPriority } from '../types';

interface BuscaAtivaReferralModalProps {
  student: { id: string, name: string, class: string };
  studentHistory?: any[];
  absences?: number;
  onClose: () => void;
  onSave: (referral: Omit<Referral, 'id'>) => void;
}

const BuscaAtivaReferralModal: React.FC<BuscaAtivaReferralModalProps> = ({ student, studentHistory, absences, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    type: 'EVASÃO_INFREQUÊNCIA' as ReferralType,
    priority: 'MÉDIA' as ReferralPriority,
    reason: '',
    status: 'ABERTO' as 'ABERTO' | 'EM_ACOMPANHAMENTO' | 'CONCLUÍDO',
    responsible: 'COORDENADOR ANDRÉ',
    notes: '',
    date: new Date().toLocaleDateString('sv-SE')
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
    { id: 'EVASÃO_INFREQUÊNCIA', icon: GraduationCap, label: 'Evasão / Infrequência' },
    { id: 'CONFLITO_FAMILIAR', icon: HeartPulse, label: 'Conflito Familiar' },
    { id: 'VULNERABILIDADE_SOCIAL', icon: UsersIcon, label: 'Vulnerabilidade Social' },
    { id: 'SAÚDE_MENTAL', icon: ShieldAlert, label: 'Saúde Mental / Emocional' },
    { id: 'BULLYING_CONFLITO', icon: MessageSquare, label: 'Bullying / Conflitos' },
    { id: 'REDE_DE_PROTEÇÃO', icon: Scale, label: 'Rede de Proteção (CT)' },
    { id: 'OUTRO', icon: Tag, label: 'Outro' },
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
          <div className="mb-8 p-6 bg-emerald-900 rounded-[2rem] text-white relative overflow-hidden shrink-0">
             <div className="absolute top-0 right-0 p-6 opacity-10"><User size={80} /></div>
             <div className="relative z-10">
                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Aluno Selecionado</p>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-black uppercase leading-tight">{student.name}</h4>
                    <p className="text-xs font-bold text-emerald-300/70 uppercase mt-1">{student.class}</p>
                  </div>
                  {absences !== undefined && (
                    <div className={`px-5 py-4 rounded-3xl flex flex-col items-center justify-center border-2 border-white/10 shadow-2xl transition-all ${
                      absences > 15 ? 'bg-red-500/90 text-white' : 'bg-white/10 text-white'
                    }`}>
                      <span className="text-2xl font-black leading-none">{absences}</span>
                      <span className="text-[7px] font-black uppercase tracking-tighter mt-1 opacity-80">Faltas no Ano</span>
                    </div>
                  )}
                </div>
             </div>
          </div>

          {/* Seção de Histórico para consulta rápida */}
          {studentHistory && studentHistory.length > 0 && (
            <div className="mb-8 space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <MessageSquare size={12} /> Histórico de Acompanhamento (Consulta)
              </label>
              <div className="bg-gray-50 rounded-[2rem] p-4 space-y-3 max-h-48 overflow-y-auto border border-gray-100 shadow-inner custom-scrollbar">
                {studentHistory.map((log: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-emerald-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 font-medium leading-relaxed italic">"{log.description}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selecione o Motivo do Encaminhamento</label>
              <div className="grid grid-cols-2 gap-3">
                {types.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData({...formData, type: t.id as ReferralType})}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                      formData.type === t.id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <t.icon size={18} className={formData.type === t.id ? 'text-emerald-600' : 'text-gray-300'} />
                    <span className={`text-[9px] font-black uppercase text-left leading-tight ${formData.type === t.id ? 'text-emerald-700' : 'text-gray-400'}`}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nível de Urgência (Gravidade)</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'BAIXA', color: 'bg-slate-100 text-slate-500', active: 'bg-slate-600 text-white shadow-slate-200' },
                  { id: 'MÉDIA', color: 'bg-blue-100 text-blue-500', active: 'bg-blue-600 text-white shadow-blue-200' },
                  { id: 'ALTA', color: 'bg-amber-100 text-amber-600', active: 'bg-amber-600 text-white shadow-amber-200' },
                  { id: 'URGENTE', color: 'bg-red-100 text-red-600', active: 'bg-red-600 text-white shadow-red-200' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData({...formData, priority: p.id as ReferralPriority})}
                    className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border-b-4 ${
                      formData.priority === p.id ? `${p.active} border-black/10 scale-105` : `${p.color} border-transparent opacity-60 hover:opacity-100`
                    }`}
                  >
                    {p.id}
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
               <div className="grid grid-cols-2 gap-2 mb-2">
                  {['ANGELA MARIA TRAMARIN', 'ZENIR RODRIGUES GERALDO'].map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFormData({ ...formData, responsible: name })}
                      className={`py-3 px-4 rounded-xl border-2 text-[9px] font-black uppercase transition-all ${
                        formData.responsible === name 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                          : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
               </div>
               <input 
                  type="text" 
                  value={formData.responsible}
                  onChange={e => setFormData({...formData, responsible: e.target.value.toUpperCase()})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase"
                  placeholder="OU DIGITE O NOME DO RESPONSÁVEL"
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
