
import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Users, 
  MessageCircle, 
  Bell, 
  ShieldCheck, 
  X, 
  Plus,
  Target,
  FileText
} from 'lucide-react';
import { SecretariatNotification } from '../types';

const SecretariatNotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<SecretariatNotification[]>(() => {
    const saved = localStorage.getItem('secretariat_notifications_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNotif, setNewNotif] = useState({
    title: '',
    message: '',
    priority: 'NORMAL' as 'ALTA' | 'NORMAL',
    targetClassId: 'TODOS'
  });

  useEffect(() => {
    localStorage.setItem('secretariat_notifications_v1', JSON.stringify(notifications));
  }, [notifications]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const notif: SecretariatNotification = {
      id: `notif-${Date.now()}`,
      ...newNotif,
      date: new Date().toISOString(),
      isRead: false
    };

    setNotifications([notif, ...notifications]);
    setIsModalOpen(false);
    setNewNotif({ title: '', message: '', priority: 'NORMAL', targetClassId: 'TODOS' });
    alert("Aviso enviado! O aviso aparecerá instantaneamente nos Diários de Classe sincronizados.");
  };

  return (
    <div className="fixed bottom-10 right-10 z-[50] no-print">
       <button 
         onClick={() => setIsModalOpen(true)}
         className="w-16 h-16 bg-indigo-600 text-white rounded-3xl shadow-2xl flex items-center justify-center hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all group border-4 border-white"
       >
          <Bell size={28} className="group-hover:animate-bounce" />
          {notifications.filter(n => !n.isRead).length > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-4 border-white text-[10px] font-black flex items-center justify-center">
              {notifications.filter(n => !n.isRead).length}
            </span>
          )}
       </button>

       {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-indigo-100 flex flex-col">
              <div className="p-8 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><MessageCircle size={24} /></div>
                    <div>
                       <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Comunicado Interno</h3>
                       <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">Notificação Automática Diário</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
              </div>

              <form onSubmit={handleSend} className="p-10 space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título do Comunicado</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Ex: Mudança de Enturmação"
                      value={newNotif.title}
                      onChange={e => setNewNotif({...newNotif, title: e.target.value.toUpperCase()})}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all"
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Destinatário</label>
                       <select 
                         value={newNotif.targetClassId}
                         onChange={e => setNewNotif({...newNotif, targetClassId: e.target.value})}
                         className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-[10px] uppercase outline-none"
                       >
                          <option value="TODOS">Todos os Professores</option>
                          <option>6º ANO A</option>
                          <option>7º ANO A</option>
                          <option>8º ANO B</option>
                          <option>9º ANO A</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prioridade</label>
                       <select 
                         value={newNotif.priority}
                         onChange={e => setNewNotif({...newNotif, priority: e.target.value as any})}
                         className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-[10px] uppercase outline-none"
                       >
                          <option value="NORMAL">Normal</option>
                          <option value="ALTA">Urgente (Notificação Push)</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Corpo da Mensagem</label>
                    <textarea 
                      required
                      value={newNotif.message}
                      onChange={e => setNewNotif({...newNotif, message: e.target.value})}
                      placeholder="Descreva o aviso detalhadamente..."
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium text-xs h-28 resize-none outline-none focus:bg-white"
                    />
                 </div>

                 <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                    <Send size={20}/> Disparar Aviso Imediato
                 </button>
              </form>
           </div>
        </div>
       )}
    </div>
  );
};

export default SecretariatNotificationCenter;
