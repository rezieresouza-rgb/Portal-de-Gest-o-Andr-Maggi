import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Package,
  Calendar,
  Filter,
  ArrowDown
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from './Toast';

interface OrderItem {
  id: string;
  contract_item_id: string;
  description: string;
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  issue_date: string;
  supplier_name: string;
  items: OrderItem[];
}

interface GuideItem {
  contract_item_id: string;
  quantity: number;
}

interface Guide {
  id: string;
  order_number: string;
  guide_number: string;
  items: GuideItem[];
}

interface ProcessedItem {
  contract_item_id: string;
  description: string;
  ordered: number;
  delivered: number;
  pending: number;
  status: 'ENTREGUE' | 'PARCIAL' | 'PENDENTE';
}

interface ProcessedOrder {
  order_number: string;
  issue_date: string;
  supplier_name: string;
  items: ProcessedItem[];
  status: 'ENTREGUE' | 'PARCIAL' | 'PENDENTE';
}

const MerendaDeliveryReport: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<ProcessedOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ENTREGUE' | 'PARCIAL' | 'PENDENTE'>('ALL');
  const { addToast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Orders with Items and Supplier Info
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          issue_date,
          contracts (
            suppliers (
              name
            )
          ),
          items:order_items (
            id,
            contract_item_id,
            description,
            quantity
          )
        `)
        .order('issue_date', { ascending: false });

      if (ordersError) throw ordersError;

      // 2. Fetch Payment Guides with Items to get delivered quantities
      const { data: guidesData, error: guidesError } = await supabase
        .from('payment_guides')
        .select(`
          id,
          order_number,
          guide_number,
          items:payment_guide_items (
            contract_item_id,
            quantity
          )
        `)
        .not('order_number', 'is', null);

      if (guidesError) throw guidesError;

      // 3. Process the data
      const processed: ProcessedOrder[] = [];

      for (const order of ordersData || []) {
        const orderNumber = order.order_number;
        const supplierName = order.contracts?.suppliers?.name || 'Desconhecido';
        
        // Find all guides for this order
        const relatedGuides = (guidesData || []).filter(g => g.order_number === orderNumber);
        
        // Sum delivered quantities per contract_item_id
        const deliveredQuantities: Record<string, number> = {};
        relatedGuides.forEach(guide => {
          (guide.items || []).forEach((gItem: any) => {
            if (!deliveredQuantities[gItem.contract_item_id]) {
              deliveredQuantities[gItem.contract_item_id] = 0;
            }
            deliveredQuantities[gItem.contract_item_id] += Number(gItem.quantity);
          });
        });

        const processedItems: ProcessedItem[] = (order.items || []).map((item: any) => {
          const ordered = Number(item.quantity);
          const delivered = deliveredQuantities[item.contract_item_id] || 0;
          const pending = Math.max(0, ordered - delivered);
          
          let status: 'ENTREGUE' | 'PARCIAL' | 'PENDENTE' = 'PENDENTE';
          if (delivered >= ordered) status = 'ENTREGUE';
          else if (delivered > 0) status = 'PARCIAL';

          return {
            contract_item_id: item.contract_item_id,
            description: item.description,
            ordered,
            delivered,
            pending,
            status
          };
        });

        // Determine overall order status
        let orderStatus: 'ENTREGUE' | 'PARCIAL' | 'PENDENTE' = 'ENTREGUE';
        if (processedItems.every(i => i.status === 'PENDENTE')) {
          orderStatus = 'PENDENTE';
        } else if (processedItems.some(i => i.status === 'PENDENTE' || i.status === 'PARCIAL')) {
          orderStatus = 'PARCIAL';
        }

        processed.push({
          order_number: orderNumber,
          issue_date: order.issue_date,
          supplier_name: supplierName,
          items: processedItems,
          status: orderStatus
        });
      }

      setOrders(processed);
    } catch (err: any) {
      console.error('Error fetching report data:', err);
      addToast('Erro ao carregar o relatório', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(i => i.description?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, filterStatus]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
        <p className="text-gray-500 font-medium">Cruzando dados de Pedidos e Entregas...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-emerald-600" />
            Relatório de Entregas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cruzamento entre Pedidos de Compra e Guias de Recebimento
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por número do pedido, fornecedor ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 w-5 h-5" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ENTREGUE">Totalmente Entregues</option>
            <option value="PARCIAL">Entregas Parciais</option>
            <option value="PENDENTE">Não Entregues / Pendentes</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum pedido encontrado com os filtros atuais.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.order_number} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      Pedido #{order.order_number}
                      {order.status === 'ENTREGUE' && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">ENTREGUE</span>}
                      {order.status === 'PARCIAL' && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">PARCIAL</span>}
                      {order.status === 'PENDENTE' && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">PENDENTE</span>}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(order.issue_date).toLocaleDateString('pt-BR')}
                      <span className="text-gray-300">•</span>
                      <span className="font-medium text-gray-700">{order.supplier_name}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-white border-b border-gray-100 text-xs uppercase font-semibold text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3 text-right">Qtd. Pedida</th>
                      <th className="px-4 py-3 text-right">Qtd. Entregue</th>
                      <th className="px-4 py-3 text-right">Pendente</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{item.description}</td>
                        <td className="px-4 py-3 text-right">{item.ordered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                          {item.delivered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold ${item.pending > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {item.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            {item.status === 'ENTREGUE' && <CheckCircle2 className="w-5 h-5 text-emerald-500" title="Entregue" />}
                            {item.status === 'PARCIAL' && <AlertTriangle className="w-5 h-5 text-amber-500" title="Entrega Parcial" />}
                            {item.status === 'PENDENTE' && <XCircle className="w-5 h-5 text-red-500" title="Não Entregue" />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MerendaDeliveryReport;
