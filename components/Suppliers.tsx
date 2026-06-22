
import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, ExternalLink, ShieldCheck, Sprout, Star, Plus, Trash2, X, Save, Building2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export interface Supplier {
  id: string;
  name: string;
  full_name: string;
  cnpj: string;
  email: string;
  phone: string;
  category: string;
  score: number;
  location: string;
}

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractItems, setContractItems] = useState<any[]>([]);
  const [selectedSupplierForItems, setSelectedSupplierForItems] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase.from('suppliers').select('*');
      if (error) throw error;
      setSuppliers(data || []);

      const { data: contractsData } = await supabase.from('contracts').select('*');
      setContracts(contractsData || []);

      const { data: itemsData } = await supabase.from('contract_items').select('*');
      setContractItems(itemsData || []);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', full_name: '', cnpj: '', email: '', phone: '', category: 'Gêneros Diversos', location: '' // Note: 'location' needs to be handled if not in DB schema, checking schema... Schema has no location column. I should add it or ignore it. Schema: name, full_name, cnpj, email, phone, category, score.
  });

  // Schema check: name, full_name, cnpj, email, phone, category, score.
  // The form has 'full' but schema has 'full_name'. I will update the state key to match schema or map it.
  // The form has 'location' but schema does not. I will add 'location' column to Supabase or drop it.
  // Let's add location column to Supabase first as it is in the UI.

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('suppliers').insert([{
        name: form.name,
        full_name: form.full_name,
        cnpj: form.cnpj,
        email: form.email,
        phone: form.phone,
        category: form.category,
        score: 5.0,
        location: form.location
      }]);

      if (error) throw error;

      fetchSuppliers();
      setIsModalOpen(false);
      setForm({ name: '', full_name: '', cnpj: '', email: '', phone: '', category: 'Gêneros Diversos', location: '' });
      alert("Fornecedor cadastrado com sucesso!");
    } catch (error: any) {
      alert("Erro ao salvar fornecedor: " + error.message);
    }
  };

  const deleteSupplier = async (id: string) => {
    if (window.confirm("Deseja remover este fornecedor do sistema?")) {
      try {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) throw error;
        setSuppliers(prev => prev.filter(s => s.id !== id));
      } catch (error: any) {
        alert("Erro ao excluir: " + error.message);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Fornecedores Homologados</h2>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-1">Diretório de Parceiros da Unidade</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2"
        >
          <Plus size={18} /> Novo Fornecedor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {suppliers.map((s) => {
          const sItems = contractItems.filter(item => {
            const contract = contracts.find(c => c.id === item.contract_id);
            return contract && contract.supplier_id === s.id;
          });

          return (
            <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-emerald-200 hover:shadow-lg transition-all group relative">
              <button
                onClick={() => deleteSupplier(s.id)}
                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>

              <div className="flex justify-between items-start mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${s.category.includes('Agricultura') ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                  {s.category.includes('Agricultura') ? <Sprout size={28} /> : <Building2 size={28} />}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-black uppercase tracking-tighter">
                  <Star size={12} className="fill-emerald-600" />
                  {s.score.toFixed(1)}
                </div>
              </div>

              <h3 className="text-lg font-black text-gray-900 uppercase leading-tight mb-1">{s.name}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest line-clamp-1 mb-2">{s.full_name}</p>
              <p className="text-[10px] text-gray-500 font-black bg-gray-50 px-2 py-1 rounded-lg w-fit border border-gray-100 uppercase tracking-widest">{s.cnpj}</p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                  <Mail size={14} className="text-gray-400" />
                  <span className="truncate">{s.email}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                  <Phone size={14} className="text-gray-400" />
                  {s.phone}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="line-clamp-1">{s.location}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-50 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-widest ${s.category.includes('Agricultura') ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                    {s.category}
                  </span>
                  
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Licitado: {sItems.length} {sItems.length === 1 ? 'item' : 'itens'}</span>
                </div>
                
                {sItems.length > 0 && (
                  <button
                    onClick={() => setSelectedSupplierForItems(s)}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-emerald-100/50"
                  >
                    Ver Alimentos Licitados <ExternalLink size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {suppliers.length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
            <Building2 size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Nenhum fornecedor cadastrado. Comece agora.</p>
          </div>
        )}
      </div>

      {/* Modal Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
              <h3 className="text-2xl font-black text-gray-900 uppercase">Novo Fornecedor</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Fantasia</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CNPJ</label><input required value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none" /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Razão Social Completa</label><input required value={form.full} onChange={e => setForm({ ...form, full: e.target.value.toUpperCase() })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none" /></div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value.toLowerCase() })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefone</label><input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs uppercase"><option>Agricultura Familiar</option><option>Gêneros Secos</option><option>Perecíveis</option><option>Padaria</option><option>Gêneros Diversos</option></select></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Localização (Cidade/Estado)</label><input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value.toUpperCase() })} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none" /></div>
              </div>
              <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"><Save size={20} /> Salvar Homologação</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Itens Licitados */}
      {selectedSupplierForItems && (() => {
        const sItems = contractItems.filter(item => {
          const contract = contracts.find(c => c.id === item.contract_id);
          return contract && contract.supplier_id === selectedSupplierForItems.id;
        });

        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
            <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase">Alimentos Licitados</h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Fornecedor: {selectedSupplierForItems.name}</p>
                </div>
                <button 
                  onClick={() => setSelectedSupplierForItems(null)}
                  className="p-3 hover:bg-emerald-100/50 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                {sItems.length === 0 ? (
                  <p className="text-center text-gray-400 py-12">Nenhum alimento licitado encontrado para este fornecedor.</p>
                ) : (
                  <div className="overflow-x-auto rounded-3xl border border-gray-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                          <th className="px-6 py-4">Alimento</th>
                          <th className="px-6 py-4">Marca</th>
                          <th className="px-6 py-4 text-center">Unidade</th>
                          <th className="px-6 py-4 text-right">Preço Unitário</th>
                          <th className="px-6 py-4 text-right">Qtd. Contratada</th>
                          <th className="px-6 py-4 text-right">Qtd. Entregue</th>
                          <th className="px-6 py-4 text-right">Progresso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700">
                        {sItems.map(item => {
                          const pct = item.contracted_quantity > 0 ? Math.min(100, Math.round((item.acquired_quantity / item.contracted_quantity) * 100)) : 0;
                          return (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 font-black uppercase text-gray-950">{item.description}</td>
                              <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">{item.brand || 'Não especificada'}</td>
                              <td className="px-6 py-4 text-center text-xs font-black bg-gray-50 border border-gray-100 rounded-lg w-fit mx-auto">{item.unit}</td>
                              <td className="px-6 py-4 text-right font-bold text-emerald-600">R$ {item.unit_price.toFixed(2)}</td>
                              <td className="px-6 py-4 text-right font-bold">{item.contracted_quantity}</td>
                              <td className="px-6 py-4 text-right font-bold text-blue-600">{item.acquired_quantity}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 justify-end">
                                  <div className="w-16 bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                                  </div>
                                  <span className="text-[10px] font-black text-gray-500">{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Suppliers;
