
import React, { useState, useMemo, useEffect } from 'react';
import {
  History,
  Search,
  Calendar,
  ChevronRight,
  Trash2,
  FileText,
  DollarSign,
  ArrowLeft,
  Filter,
  PackageCheck,
  FileDown,
  Lock
} from 'lucide-react';
import { Order } from '../types';

const OrderHistory: React.FC = () => {
  const [history, setHistory] = useState<Order[]>(() => {
    const saved = localStorage.getItem('merenda_order_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isSystemLocked, setIsSystemLocked] = useState(localStorage.getItem('system_shield_lock') === 'true');

  useEffect(() => {
    localStorage.setItem('merenda_order_history', JSON.stringify(history));
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter(order =>
      order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.contractNumber.includes(searchTerm) ||
      order.orderNumber.includes(searchTerm)
    );
  }, [history, searchTerm]);

  const selectedOrder = useMemo(() =>
    history.find(o => o.id === selectedOrderId),
    [history, selectedOrderId]);

  const deleteOrder = (id: string, e?: React.MouseEvent) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (isSystemLocked) {
      return alert("Ação Bloqueada: A Blindagem de Sistema está ativa. Desative-a nas Configurações para excluir registros.");
    }

    const confirmacao = window.confirm("Deseja realmente excluir este pedido do histórico? Esta ação é permanente.");

    if (confirmacao) {
      setHistory(prev => {
        const newHistory = prev.filter(o => o.id !== id);
        localStorage.setItem('merenda_order_history', JSON.stringify(newHistory));
        return newHistory;
      });
      if (selectedOrderId === id) setSelectedOrderId(null);
    }
  };

  if (selectedOrder) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-20">
        <div className="flex items-center justify-between no-print">
          <button
            onClick={() => setSelectedOrderId(null)}
            className="flex items-center gap-2 text-emerald-700 font-black uppercase text-xs tracking-widest hover:text-emerald-800 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao histórico
          </button>

          <button
            onClick={(e) => deleteOrder(selectedOrder.id, e)}
            className={`flex items-center gap-2 font-black uppercase text-[10px] tracking-widest px-4 py-2 rounded-xl transition-all ${isSystemLocked ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'
              }`}
          >
            {isSystemLocked ? <Lock size={14} /> : <Trash2 size={14} />}
            Excluir Registro Permanente
          </button>
        </div>

        <div className="bg-white p-10 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-xl max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print-container">
          <div className="flex justify-between items-start border-b border-gray-50 pb-6 mb-6">
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-2 no-print">Pedido Registrado</p>
              <h2 className="text-2xl font-black text-gray-900 leading-none uppercase">Guia #{selectedOrder.orderNumber}</h2>
              <p className="text-gray-400 font-bold uppercase mt-2 text-xs">Contrato: {selectedOrder.contractNumber}</p>
            </div>
            <div className="text-right">
              <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest no-print">
                Finalizado
              </span>
              <p className="mt-4 text-[10px] font-bold text-gray-500 uppercase">Emissão: {new Date(selectedOrder.issueDate).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Fornecedor</p>
              <p className="font-black text-gray-900 text-base uppercase leading-tight">{selectedOrder.supplierName}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total do Pedido</p>
              <p className="font-black text-emerald-900 text-xl">R$ {selectedOrder.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <PackageCheck size={12} className="text-emerald-600" /> Lista de Itens Solicitados
            </h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400">
                    <th className="px-4 py-2 font-black uppercase">Descrição / Detalhes</th>
                    <th className="px-4 py-2 font-black uppercase text-center">Qtd</th>
                    <th className="px-4 py-2 font-black uppercase text-right">Unitário</th>
                    <th className="px-4 py-2 font-black uppercase text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedOrder.items.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-bold text-gray-900 uppercase leading-none">{item.description}</p>
                        <div className="flex gap-2 mt-1.5">
                          <span className="text-[8px] font-black bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 uppercase border border-gray-200">UNID: {item.unit}</span>
                          {item.brand && <span className="text-[8px] font-black bg-blue-50 px-1.5 py-0.5 rounded text-blue-600 uppercase border border-blue-100">MARCA: {item.brand}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-black">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-4 text-right text-gray-500">R$ {item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-4 text-right font-black text-gray-900">R$ {(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Observações Registradas</p>
            <p className="text-[11px] text-gray-600 leading-relaxed italic border-l-4 border-emerald-500 pl-4 bg-gray-50 py-3 rounded-r-xl font-medium">
              {selectedOrder.observations || "Nenhuma observação informada."}
            </p>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-20 text-center pdf-signature-row">
            <div className="border-t-2 border-black pt-2">
              <p className="font-black uppercase text-[10px] leading-tight">Gestão da Merenda / CDCE</p>
            </div>
            <div className="border-t-2 border-black pt-2">
              <p className="font-black uppercase text-[10px] leading-tight">Entregue em ____/____/____</p>
              <p className="text-[8px] font-bold text-gray-500 uppercase mt-1">Visto do Fornecedor</p>
            </div>
          </div>

          <div className="flex gap-4 no-print mt-12">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
            >
              <FileDown size={18} /> Imprimir Guia
            </button>
            <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3">
              <FileText size={18} /> Exportar CSV
            </button>
          </div>
        </div>

        <style>{`
          .pdf-signature-row { display: none; }
          @media print {
            .print-container {
              width: 100% !important;
              max-width: none !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            .pdf-signature-row { display: grid !important; }
            body, html { height: auto !important; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Histórico de Pedidos</h2>
          <p className="text-gray-500 font-medium">Controle de todas as guias emitidas e recebidas pela unidade.</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input
              type="text"
              placeholder="Nº Pedido ou Fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent text-sm font-bold outline-none border-none focus:ring-0"
            />
          </div>
          <button className="p-2 bg-gray-50 text-gray-400 hover:text-emerald-600 rounded-xl transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {filteredHistory.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filteredHistory.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="group p-6 hover:bg-emerald-50/30 cursor-pointer flex flex-col md:flex-row md:items-center gap-8 transition-all relative"
              >
                <div className="w-16 h-16 bg-gray-100 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-emerald-600 transition-colors shrink-0">
                  <FileText size={28} />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-black text-gray-900 uppercase">Guia #{order.orderNumber}</h4>
                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-100">
                      Entregue
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-tight">{order.supplierName}</p>
                  <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(order.issueDate).toLocaleDateString('pt-BR')}</span>
                    <span className="flex items-center gap-1"><FileText size={12} /> CT {order.contractNumber}</span>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2 shrink-0">
                  <p className="text-xl font-black text-gray-900">R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50 px-3 py-1 rounded-lg">
                    {order.items.length} ITENS SOLICITADOS
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-4 no-print relative z-20">
                  <button
                    type="button"
                    onClick={(e) => deleteOrder(order.id, e)}
                    className={`p-4 rounded-2xl transition-all border border-transparent shadow-sm ${isSystemLocked ? 'text-gray-200 cursor-not-allowed' : 'text-gray-300 hover:text-red-600 hover:bg-red-50 hover:border-red-100'
                      }`}
                    title={isSystemLocked ? "Blindagem Ativa" : "Excluir permanentemente"}
                  >
                    {isSystemLocked ? <Lock size={22} /> : <Trash2 size={22} />}
                  </button>
                  <div className="p-4 bg-gray-50 text-gray-400 group-hover:bg-emerald-500 group-hover:text-white rounded-2xl transition-all shadow-sm">
                    <ChevronRight size={22} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-32 text-center flex flex-col items-center gap-4">
            <div className="p-8 bg-gray-50 rounded-full text-gray-200">
              <History size={64} />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900 uppercase tracking-tight">Nenhum pedido no histórico</p>
              <p className="text-gray-400 font-medium">Os guias que você finalizar e salvar aparecerão aqui.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-900/10">
          <div className="flex items-center gap-3 mb-4 opacity-50">
            <FileText size={18} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Total de Guias</p>
          </div>
          <h3 className="text-4xl font-black">{history.length}</h3>
          <p className="text-emerald-300 text-xs font-bold mt-2 uppercase">Registros em 2026</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm md:col-span-2 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl">
              <DollarSign size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Volume Financeiro Histórico</p>
              <h3 className="text-3xl font-black text-gray-900">R$ {history.reduce((acc, o) => acc + o.totalValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
          <button className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg">
            Relatório Anual
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
