
import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  Package,
  Truck,
  MessageSquare,
  History,
  Search,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { PedagogicalMaterialRequest } from '../types';

import { supabase } from '../supabaseClient';
import { useToast } from './Toast';

const AlmoxarifeRequestManager: React.FC = () => {
  const { addToast } = useToast();
  const [requests, setRequests] = useState<PedagogicalMaterialRequest[]>([]);
  const [filter, setFilter] = useState<'TODOS' | 'PENDENTE' | 'APROVADO' | 'ENTREGUE'>('PENDENTE');

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('almoxarifado_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setRequests(data.map(r => ({
          id: r.id,
          teacherId: r.teacher_id,
          teacherName: r.teacher_name,
          date: r.date,
          status: r.status,
          items: r.items,
          reason: r.reason
        })));
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    }
  };

  useEffect(() => {
    fetchRequests();

    const subscription = supabase
      .channel('almoxarifado_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'almoxarifado_requests' }, fetchRequests)
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);

  const updateStatus = async (id: string, status: PedagogicalMaterialRequest['status']) => {
    const targetRequest = requests.find(r => r.id === id);
    if (!targetRequest) return;

    try {
      // 1. Atualizar Status do Pedido
      const { error: updateError } = await supabase
        .from('almoxarifado_requests')
        .update({ status })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. Se ENTREGUE, realizar baixa no estoque
      if (status === 'ENTREGUE' && targetRequest.status !== 'ENTREGUE') {

        for (const item of targetRequest.items) {
          // Decrementar Estoque (Item Genérico)
          // Nota: Na implementação ideal, teríamos tabelas separadas ou um discriminador.
          // Aqui vamos tentar decrementar de almoxarifado_items se encontrar o ID/Nome

          // Chamada RPC para decrementar seguro ou fetch+update
          const { error: stockError } = await supabase.rpc('decrement_stock', {
            item_id: item.materialId,
            qty: item.quantity
          });

          if (stockError) {
            // Fallback se RPC não existir: Fetch -> Update
            const { data: stockItem } = await supabase.from('almoxarifado_items').select('quantity').eq('id', item.materialId).single();
            if (stockItem) {
              await supabase
                .from('almoxarifado_items')
                .update({ quantity: Math.max(0, stockItem.quantity - item.quantity) })
                .eq('id', item.materialId);
            }
          }

          // Registrar Movimentação
          await supabase.from('almoxarifado_movements').insert([{
            item_id: item.materialId,
            type: 'SAIDA',
            quantity: item.quantity,
            requester: targetRequest.teacherName,
            observations: `Pedido ${targetRequest.id} - ${item.unit}`
          }]);
        }
      }

      await fetchRequests();
      addToast(`Solicitação atualizada para: ${status}`, 'success');

    } catch (error) {
      console.error("Erro ao atualizar pedido:", error);
      addToast("Erro ao processar atualização.", 'error');
    }
  };

  const filteredRequests = useMemo(() => {
    if (filter === 'TODOS') return requests;
    return requests.filter(r => r.status === filter);
  }, [requests, filter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md">
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
          {['PENDENTE', 'APROVADO', 'ENTREGUE', 'TODOS'].map(f => (
            <button key={f} onClick={() => setFilter(f as any)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${filter === f ? 'bg-orange-600 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20">
          <Clock size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">{requests.filter(r => r.status === 'PENDENTE').length} Pendentes</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredRequests.length > 0 ? filteredRequests.map(req => (
          <div key={req.id} className="bg-white/5 p-8 rounded-[3rem] border border-white/10 shadow-lg hover:shadow-xl hover:bg-white/10 transition-all flex flex-col lg:flex-row gap-8 relative overflow-hidden backdrop-blur-md">
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${req.status === 'PENDENTE' ? 'bg-amber-500' : req.status === 'APROVADO' ? 'bg-emerald-500' : req.status === 'ENTREGUE' ? 'bg-blue-500' : 'bg-red-500'
              }`}></div>
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl text-white/40 border border-white/5"><User size={24} /></div>
                  <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tight">{req.teacherName}</h4>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-white/40 uppercase mt-1">
                      <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(req.date).toLocaleDateString('pt-BR')}</span>
                      <span className="flex items-center gap-1.5"><History size={12} /> ID: {req.id.split('-')[1] || req.id.substring(0, 6)}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${req.status === 'PENDENTE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : req.status === 'APROVADO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : req.status === 'ENTREGUE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-white/10 text-white/40 border border-white/10'
                  }`}>{req.status}</span>
              </div>
              <div className="p-6 bg-black/20 rounded-[2rem] border border-white/5 space-y-4">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2"><Package size={14} className="text-orange-500" /> Detalhes do Pedido</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {req.items && req.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                      <span className="text-[10px] font-bold text-white/60 uppercase">{item.materialName}</span>
                      <span className="text-[11px] font-black text-orange-400">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-orange-500/10 rounded-2xl border border-orange-500/10">
                <MessageSquare size={16} className="text-orange-400 mt-1 shrink-0" />
                <div><p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Observações</p>
                  <p className="text-xs text-white/80 font-medium italic mt-1">"{req.reason}"</p></div>
              </div>
            </div>
            <div className="lg:w-64 flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8">
              {req.status === 'PENDENTE' && (
                <><button onClick={() => updateStatus(req.id, 'APROVADO')} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 border border-emerald-500/20"><CheckCircle2 size={16} /> Autorizar</button>
                  <button onClick={() => updateStatus(req.id, 'REJEITADO')} className="w-full py-4 bg-red-500/10 text-red-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500/20 transition-all border border-red-500/20">Recusar</button></>
              )}
              {req.status === 'APROVADO' && (
                <button onClick={() => updateStatus(req.id, 'ENTREGUE')} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 border border-blue-500/20"><Truck size={16} /> Marcar Entregue</button>
              )}
            </div>
          </div>
        )) : <div className="py-32 text-center bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10"><ClipboardList size={48} className="mx-auto mb-4 text-white/20" /><p className="text-white/30 font-black uppercase text-xs tracking-widest">Nenhum pedido pendente</p></div>}
      </div>
    </div>
  );
};

export default AlmoxarifeRequestManager;
