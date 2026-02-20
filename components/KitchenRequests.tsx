
import React, { useState, useMemo, useEffect } from 'react';
import { 
  CookingPot, 
  Search, 
  Plus, 
  Trash2, 
  FileText, 
  History, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Loader2, 
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Filter,
  Package,
  HardHat,
  Droplets,
  Hammer,
  AlertTriangle,
  XCircle,
  PlusCircle,
  MessageSquare,
  Check,
  X
} from 'lucide-react';

type RequestStatus = 'PENDENTE' | 'APROVADO' | 'PARCIAL' | 'RECUSADO' | 'ENTREGUE';
type ItemStatus = 'ATENDIDO' | 'NÃO ATENDIDO' | 'PENDENTE';

interface MaterialItem {
  id: string;
  name: string;
  category: 'EPI' | 'LIMPEZA' | 'UTENSÍLIOS' | 'EQUIPAMENTOS';
  unit: string;
  isCustom?: boolean;
}

interface RequestItem extends MaterialItem {
  requestedQuantity: number;
  itemStatus?: ItemStatus;
}

interface KitchenRequest {
  id: string;
  requestNumber: string;
  date: string;
  responsible: string;
  status: RequestStatus;
  reason: string;
  managerNotes?: string;
  items: RequestItem[];
}

const KITCHEN_CATALOG: MaterialItem[] = [
  // EPI
  { id: 'epi-1', name: 'AVENTAL TÉRMICO (ALTA TEMPERATURA)', category: 'EPI', unit: 'UNID' },
  { id: 'epi-2', name: 'LUVA DE MALHA DE AÇO', category: 'EPI', unit: 'PAR' },
  { id: 'epi-3', name: 'TOUCA DESCARTÁVEL (PCT C/ 100)', category: 'EPI', unit: 'PCT' },
  { id: 'epi-4', name: 'BOTA DE PVC BRANCA CANO MÉDIO', category: 'EPI', unit: 'PAR' },
  { id: 'epi-5', name: 'MÁSCARA DESCARTÁVEL (PCT C/ 50)', category: 'EPI', unit: 'PCT' },
  // LIMPEZA
  { id: 'lim-1', name: 'DETERGENTE NEUTRO 500ML', category: 'LIMPEZA', unit: 'FRASCO' },
  { id: 'lim-2', name: 'ÁGUA SANITÁRIA 2L', category: 'LIMPEZA', unit: 'FRASCO' },
  { id: 'lim-3', name: 'DESENGORDURANTE INDUSTRIAL 5L', category: 'LIMPEZA', unit: 'GALÃO' },
  { id: 'lim-4', name: 'ESPONJA DUPLA FACE (PCT C/ 10)', category: 'LIMPEZA', unit: 'PCT' },
  { id: 'lim-5', name: 'PANO DE PRATO (ALGODÃO)', category: 'LIMPEZA', unit: 'UNID' },
  // UTENSÍLIOS
  { id: 'ute-1', name: 'PRATO FUNDO POLICARBONATO', category: 'UTENSÍLIOS', unit: 'UNID' },
  { id: 'ute-2', name: 'COLHER DE SOPA INOX', category: 'UTENSÍLIOS', unit: 'UNID' },
  { id: 'ute-3', name: 'ESCUMADEIRA GRANDE INDUSTRIAL', category: 'UTENSÍLIOS', unit: 'UNID' },
  { id: 'ute-4', name: 'CALDEIRÃO ALUMÍNIO 20L', category: 'UTENSÍLIOS', unit: 'UNID' },
  { id: 'ute-5', name: 'CONCHA GRANDE INOX', category: 'UTENSÍLIOS', unit: 'UNID' },
  // EQUIPAMENTOS
  { id: 'equ-1', name: 'LIQUIDIFICADOR INDUSTRIAL 6L', category: 'EQUIPAMENTOS', unit: 'UNID' },
  { id: 'equ-2', name: 'FOGÃO INDUSTRIAL 4 BOCAS', category: 'EQUIPAMENTOS', unit: 'UNID' },
  { id: 'equ-3', name: 'FREEZER VERTICAL 500L', category: 'EQUIPAMENTOS', unit: 'UNID' },
  { id: 'equ-4', name: 'FORNO ELÉTRICO INDUSTRIAL', category: 'EQUIPAMENTOS', unit: 'UNID' },
];

const KitchenRequests: React.FC = () => {
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Carrinho e Formulário
  const [cart, setCart] = useState<RequestItem[]>([]);
  const [reason, setReason] = useState('');
  const [responsible, setResponsible] = useState('Equipe de Cozinha');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Custom Item Form
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', category: 'UTENSÍLIOS' as any, unit: 'UNID' });

  // Manager Actions
  const [managerNotes, setManagerNotes] = useState('');

  const [history, setHistory] = useState<KitchenRequest[]>(() => {
    const saved = localStorage.getItem('merenda_kitchen_requests');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('merenda_kitchen_requests', JSON.stringify(history));
  }, [history]);

  const filteredCatalog = useMemo(() => {
    return KITCHEN_CATALOG.filter(item => {
      const matchCategory = activeCategory === 'TODOS' || item.category === activeCategory;
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchTerm]);

  const addToCart = (item: MaterialItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, requestedQuantity: i.requestedQuantity + 1 } : i);
      }
      return [...prev, { ...item, requestedQuantity: 1, itemStatus: 'PENDENTE' }];
    });
  };

  const addCustomItemToCart = () => {
    if (!customItem.name) return alert("Informe o nome do item.");
    const item: MaterialItem = {
      id: `custom-${Date.now()}`,
      name: customItem.name.toUpperCase(),
      category: customItem.category,
      unit: customItem.unit.toUpperCase(),
      isCustom: true
    };
    addToCart(item);
    setCustomItem({ name: '', category: 'UTENSÍLIOS', unit: 'UNID' });
    setShowCustomForm(false);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateCartQty = (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setCart(prev => prev.map(i => i.id === id ? { ...i, requestedQuantity: qty } : i));
  };

  const handleFinalize = async () => {
    if (cart.length === 0) return alert("Selecione ao menos um item.");
    setIsProcessing(true);
    try {
      const newRequest: KitchenRequest = {
        id: `req-${Date.now()}`,
        requestNumber: `RQ${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString(),
        responsible,
        reason,
        status: 'PENDENTE',
        items: cart.map(i => ({ ...i, itemStatus: 'PENDENTE' }))
      };

      setHistory([newRequest, ...history]);
      setCart([]);
      setReason('');
      alert("Requisição enviada com sucesso!");
      setViewMode('history');
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const updateStatus = (requestId: string, newStatus: RequestStatus) => {
    setHistory(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: newStatus, managerNotes } : req
    ));
    setManagerNotes('');
  };

  const toggleItemStatus = (requestId: string, itemId: string) => {
    setHistory(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      const updatedItems = req.items.map(item => {
        if (item.id !== itemId) return item;
        const nextStatus: ItemStatus = item.itemStatus === 'PENDENTE' ? 'ATENDIDO' : 
                                      item.itemStatus === 'ATENDIDO' ? 'NÃO ATENDIDO' : 'PENDENTE';
        return { ...item, itemStatus: nextStatus };
      });
      return { ...req, items: updatedItems };
    }));
  };

  const selectedRequestData = useMemo(() => 
    history.find(r => r.id === selectedRequestId),
  [history, selectedRequestId]);

  const getStatusColor = (status: RequestStatus | ItemStatus) => {
    switch (status) {
      case 'PENDENTE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'APROVADO': case 'ATENDIDO': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PARCIAL': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'RECUSADO': case 'NÃO ATENDIDO': return 'bg-red-100 text-red-700 border-red-200';
      case 'ENTREGUE': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 no-print">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-3xl shadow-lg ${viewMode === 'form' ? 'bg-emerald-600' : 'bg-gray-900'} text-white`}>
              {viewMode === 'form' ? <CookingPot size={32} /> : <History size={32} />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                {viewMode === 'form' ? "Requisição Cozinha" : "Auditoria de Requisições"}
              </h2>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
                {viewMode === 'form' ? "Solicitação Interna de Materiais" : "Controle e Validação da Gestão"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => { setViewMode(viewMode === 'form' ? 'history' : 'form'); setSelectedRequestId(null); }}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${
                viewMode === 'history' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <History size={16} /> Ver Histórico
            </button>
            {viewMode === 'form' && cart.length > 0 && (
              <button 
                onClick={handleFinalize} 
                disabled={isProcessing}
                className="px-8 py-2.5 bg-emerald-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Enviar para Direção
              </button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'form' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* CATÁLOGO E PESQUISA */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
               <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                    {['TODOS', 'EPI', 'LIMPEZA', 'UTENSÍLIOS', 'EQUIPAMENTOS'].map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                          activeCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                      <input 
                        type="text" 
                        placeholder="Buscar material..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => setShowCustomForm(true)}
                      className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2"
                      title="Adicionar item fora da lista"
                    >
                      <PlusCircle size={18} />
                      <span className="hidden md:block text-[10px] font-black uppercase">Novo Item</span>
                    </button>
                  </div>
               </div>

               {/* MODAL / FORM DE ITEM PERSONALIZADO */}
               {showCustomForm && (
                  <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 animate-in slide-in-from-top-4 duration-300">
                     <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                           <PlusCircle className="text-emerald-600" size={20} />
                           <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Adicionar Material Específico</h4>
                        </div>
                        <button onClick={() => setShowCustomForm(false)} className="text-emerald-400 hover:text-emerald-600"><XCircle size={18} /></button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1">
                           <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1">Descrição Detalhada</label>
                           <input 
                              type="text" 
                              placeholder="EX: PANELA DE PRESSÃO INDUSTRIAL 20L"
                              value={customItem.name}
                              onChange={(e) => setCustomItem({...customItem, name: e.target.value})}
                              className="w-full p-3 bg-white border border-emerald-100 rounded-xl text-xs font-bold outline-none"
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1">Categoria</label>
                           <select 
                              value={customItem.category}
                              onChange={(e) => setCustomItem({...customItem, category: e.target.value as any})}
                              className="w-full p-3 bg-white border border-emerald-100 rounded-xl text-xs font-black uppercase"
                           >
                              <option>UTENSÍLIOS</option>
                              <option>EPI</option>
                              <option>LIMPEZA</option>
                              <option>EQUIPAMENTOS</option>
                           </select>
                        </div>
                     </div>
                     <div className="flex gap-3 mt-4">
                        <button 
                          onClick={addCustomItemToCart}
                          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-emerald-700 transition-all"
                        >
                          Incluir na Requisição
                        </button>
                        <button 
                          onClick={() => setShowCustomForm(false)}
                          className="px-6 py-3 bg-white text-gray-400 rounded-xl text-[10px] font-black uppercase border border-gray-100"
                        >
                          Cancelar
                        </button>
                     </div>
                  </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCatalog.map(item => (
                    <div key={item.id} className="group p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-emerald-200 hover:bg-white transition-all flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${
                            item.category === 'EPI' ? 'bg-amber-100 text-amber-600' :
                            item.category === 'LIMPEZA' ? 'bg-blue-100 text-blue-600' :
                            item.category === 'UTENSÍLIOS' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'
                          }`}>
                            {item.category === 'EPI' ? <HardHat size={18} /> : 
                             item.category === 'LIMPEZA' ? <Droplets size={18} /> : 
                             item.category === 'UTENSÍLIOS' ? <CookingPot size={18} /> : <Hammer size={18} />}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-gray-900 uppercase leading-tight">{item.name}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.category} | {item.unit}</p>
                          </div>
                       </div>
                       <button onClick={() => addToCart(item)} className="p-2 bg-white text-gray-300 group-hover:bg-emerald-600 group-hover:text-white rounded-xl shadow-sm transition-all">
                         <Plus size={18} />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* LISTA ATUAL (CARRINHO) */}
          <div className="space-y-6">
             <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 sticky top-8">
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                     <Package size={18} className="text-emerald-600" /> Minha Requisição
                   </h3>
                   <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg uppercase">{cart.length} Itens</span>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.length > 0 ? cart.map(item => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                       <div className="flex-1">
                         <p className="text-[10px] font-black text-gray-900 uppercase truncate pr-2 flex items-center gap-1">
                            {item.name}
                            {item.isCustom && <span className="text-[7px] bg-emerald-100 text-emerald-600 px-1 rounded">MANUAL</span>}
                         </p>
                         <p className="text-[8px] text-gray-400 font-bold uppercase">{item.category} | {item.unit}</p>
                       </div>
                       <div className="flex items-center gap-3">
                          <input 
                            type="number" 
                            min="1"
                            value={item.requestedQuantity}
                            onChange={(e) => updateCartQty(item.id, parseInt(e.target.value))}
                            className="w-12 text-center bg-white border border-gray-200 rounded-lg py-1 text-xs font-black outline-none focus:border-emerald-500"
                          />
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                  )) : (
                    <div className="py-12 text-center text-gray-300">
                      <Package size={40} className="mx-auto mb-2 opacity-20" />
                      <p className="text-[10px] font-black uppercase">Sua lista está vazia</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-50">
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Motivo / Urgência</label>
                     <textarea 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ex: Reposição para início de semana..."
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-bold outline-none h-20 resize-none"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Responsável pela Cozinha</label>
                     <input type="text" value={responsible} onChange={(e) => setResponsible(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-black outline-none" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      ) : (
        /* ABA DE HISTÓRICO COM VALIDAÇÃO DO GESTOR */
        <div className="space-y-6">
          {selectedRequestId && selectedRequestData ? (
            <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-xl max-w-5xl mx-auto animate-in zoom-in-95 duration-300">
               <div className="flex justify-between items-start border-b border-gray-50 pb-6 mb-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Solicitação #{selectedRequestData.requestNumber}</h3>
                       <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border-2 ${getStatusColor(selectedRequestData.status)}`}>
                         {selectedRequestData.status}
                       </span>
                    </div>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Enviado em {new Date(selectedRequestData.date).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => window.print()} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:text-emerald-600 transition-colors"><Printer size={20} /></button>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* LISTA DE ITENS NO DETALHE */}
                  <div className="lg:col-span-2 space-y-6">
                     <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Package size={14} className="text-emerald-600" /> Detalhamento do Pedido</h4>
                        <p className="text-[9px] font-bold text-gray-400 uppercase italic">Clique no item para validar individualmente</p>
                     </div>
                     <div className="border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="bg-gray-50 text-gray-400">
                              <th className="px-4 py-3 font-black uppercase">Material</th>
                              <th className="px-4 py-3 text-center uppercase">Qtd Pedida</th>
                              <th className="px-4 py-3 text-center uppercase">Validação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {selectedRequestData.items.map((item, i) => (
                              <tr 
                                key={i} 
                                onClick={() => selectedRequestData.status === 'PENDENTE' && toggleItemStatus(selectedRequestData.id, item.id)}
                                className={`transition-colors cursor-pointer ${selectedRequestData.status === 'PENDENTE' ? 'hover:bg-gray-50' : ''}`}
                              >
                                <td className="px-4 py-3">
                                   <div className="flex items-center gap-2">
                                      {item.isCustom && <PlusCircle size={14} className="text-emerald-500" />}
                                      <div>
                                        <p className="font-bold uppercase text-gray-900">{item.name}</p>
                                        <p className="text-[8px] text-gray-400 font-black">{item.unit}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-4 py-3 text-center font-black text-lg text-emerald-700">{item.requestedQuantity}</td>
                                <td className="px-4 py-3 text-center">
                                   <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase border ${getStatusColor(item.itemStatus || 'PENDENTE')}`}>
                                      {item.itemStatus === 'ATENDIDO' ? <Check size={10} /> : item.itemStatus === 'NÃO ATENDIDO' ? <X size={10} /> : <Clock size={10} />}
                                      {item.itemStatus || 'PENDENTE'}
                                   </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                     </div>
                     <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Justificativa da Cozinha</p>
                        <p className="text-xs text-gray-600 font-medium italic">"{selectedRequestData.reason || 'Sem justificativa.'}"</p>
                     </div>
                  </div>

                  {/* PAINEL DO GESTOR (VALIDAÇÃO) */}
                  <div className="space-y-6">
                     <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-xl">
                        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                           <ShieldCheck className="text-emerald-400" />
                           <h4 className="text-xs font-black uppercase tracking-widest">Painel de Decisão</h4>
                        </div>
                        
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notas do Gestor / Observações</label>
                           <textarea 
                              value={managerNotes || selectedRequestData.managerNotes || ''}
                              onChange={(e) => setManagerNotes(e.target.value)}
                              disabled={selectedRequestData.status !== 'PENDENTE'}
                              placeholder="Descreva o motivo da decisão..."
                              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-medium text-emerald-50 outline-none focus:border-emerald-500 h-28 resize-none"
                           />
                        </div>

                        {selectedRequestData.status === 'PENDENTE' ? (
                          <div className="space-y-3">
                             <button 
                               onClick={() => updateStatus(selectedRequestData.id, 'APROVADO')}
                               className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                             >
                               <CheckCircle2 size={16} /> Aprovar Conforme Itens
                             </button>
                             <button 
                               onClick={() => updateStatus(selectedRequestData.id, 'PARCIAL')}
                               className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                             >
                               <AlertTriangle size={16} /> Atendimento Parcial
                             </button>
                             <button 
                               onClick={() => updateStatus(selectedRequestData.id, 'RECUSADO')}
                               className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                             >
                               <XCircle size={16} /> Recusar Requisição
                             </button>
                          </div>
                        ) : (
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                             <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Decisão Consolidada</p>
                             <p className="text-[11px] text-gray-400 mt-1">Este pedido já foi auditado e não pode mais ser alterado.</p>
                          </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          ) : (
            /* LISTAGEM HISTÓRICA */
            <div className="grid grid-cols-1 gap-4">
              {history.length > 0 ? history.map(req => (
                <div 
                  key={req.id} 
                  onClick={() => setSelectedRequestId(req.id)}
                  className="group bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col md:flex-row items-center gap-6"
                >
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${getStatusColor(req.status)} transition-colors`}>
                      {req.status === 'PENDENTE' ? <Clock size={24} /> : 
                       req.status === 'APROVADO' ? <CheckCircle2 size={24} /> : 
                       req.status === 'RECUSADO' ? <XCircle size={24} /> : <AlertTriangle size={24} />}
                   </div>
                   <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-black text-gray-900 uppercase">RQ {req.requestNumber}</h4>
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${getStatusColor(req.status)}`}>
                           {req.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight line-clamp-1">
                         {req.items.length} itens • Solicitado por {req.responsible} • {new Date(req.date).toLocaleDateString('pt-BR')}
                      </p>
                   </div>
                   <div className="flex items-center gap-4">
                      {req.items.some(i => i.isCustom) && (
                        <div className="flex items-center gap-1 text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full uppercase border border-emerald-100">
                           <PlusCircle size={10} /> Item Manual
                        </div>
                      )}
                      {req.managerNotes && <MessageSquare size={16} className="text-emerald-500" />}
                      <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                        <ChevronRight size={20} />
                      </div>
                   </div>
                </div>
              )) : (
                <div className="py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                   <History size={48} className="mx-auto mb-4 text-gray-200" />
                   <p className="text-gray-400 font-black uppercase text-xs">Sem solicitações no histórico</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default KitchenRequests;
