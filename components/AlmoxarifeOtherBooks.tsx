
import React, { useState, useEffect } from 'react';

import { Book, PlusCircle, Search, Trash2, ArrowUpCircle, ArrowDownCircle, X, FolderOpen, Plus, Minus, Library, Box, Users, BookOpen } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from './Toast';

interface OtherMaterial {
    id: string;
    name: string;
    quantity: number;
    description: string; // JSON stringified
    // Helper fields parsed from description
    project?: string;
    targetClass?: string;
    type?: 'ESTUDANTE' | 'PROFESSOR';
    totalEntries?: number;
    totalExits?: number;
}

const AlmoxarifeOtherBooks: React.FC = () => {
    const { addToast } = useToast();
    const [materials, setMaterials] = useState<OtherMaterial[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRegModalOpen, setIsRegModalOpen] = useState(false);

    // Form State
    const [newBookForm, setNewBookForm] = useState({
        name: '',
        type: 'ESTUDANTE' as 'ESTUDANTE' | 'PROFESSOR',
        project: '',
        targetClass: '',
        initialEntry: '' as number | '',
        initialExit: '' as number | '',
        observations: ''
    });

    const fetchMaterials = async () => {
        try {
            const { data: itemsData, error: itemsError } = await supabase
                .from('almoxarifado_items')
                .select('*')
                .eq('category', 'OUTROS_LIVROS')
                .order('created_at', { ascending: false });

            if (itemsError) throw itemsError;

            // Fetch movements for stats
            const { data: movementsData, error: movementsError } = await supabase
                .from('almoxarifado_movements')
                .select('*')
                .in('item_id', itemsData?.map(i => i.id) || []);

            if (movementsError) throw movementsError;

            setMaterials(itemsData.map(item => {
                let meta: any = {};
                try {
                    meta = JSON.parse(item.description || '{}');
                } catch (e) {
                    meta = {};
                }

                const itemMovements = movementsData?.filter(m => m.item_id === item.id) || [];
                const entries = itemMovements.filter(m => m.type === 'ENTRADA').reduce((acc, m) => acc + m.quantity, 0);
                const exits = itemMovements.filter(m => m.type === 'SAIDA').reduce((acc, m) => acc + m.quantity, 0);

                return {
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    description: item.description,
                    project: meta.project || 'N/A',
                    targetClass: meta.targetClass || 'N/A',
                    type: meta.type || 'ESTUDANTE',
                    totalEntries: entries,
                    totalExits: exits
                };
            }));

        } catch (error) {
            console.error("Erro ao buscar livros:", error);
        }
    };

    useEffect(() => {
        fetchMaterials();

        const subscription = supabase
            .channel('almoxarifado_other_books_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'almoxarifado_items' }, fetchMaterials)
            .subscribe();

        return () => { subscription.unsubscribe(); };
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const entryQty = Number(newBookForm.initialEntry) || 0;
            const exitQty = Number(newBookForm.initialExit) || 0;
            const finalQty = entryQty - exitQty;

            const { data: itemData, error } = await supabase.from('almoxarifado_items').insert([{
                name: newBookForm.name.toUpperCase(),
                category: 'OUTROS_LIVROS',
                description: JSON.stringify({
                    project: newBookForm.project,
                    targetClass: newBookForm.targetClass,
                    type: newBookForm.type,
                    observations: newBookForm.observations
                }),
                quantity: finalQty
            }]).select().single();

            if (error) throw error;

            // Initial Movements
            const movements = [];
            if (entryQty > 0 && itemData) {
                movements.push({
                    item_id: itemData.id,
                    type: 'ENTRADA',
                    quantity: entryQty,
                    observation: 'CARGA INICIAL (OUTROS LIVROS)'
                });
            }
            if (exitQty > 0 && itemData) {
                movements.push({
                    item_id: itemData.id,
                    type: 'SAIDA',
                    quantity: exitQty,
                    observation: 'DISTRIBUIÇÃO INICIAL (OUTROS LIVROS)'
                });
            }

            if (movements.length > 0) {
                await supabase.from('almoxarifado_movements').insert(movements);
            }

            setIsRegModalOpen(false);
            setNewBookForm({
                name: '',
                type: 'ESTUDANTE',
                project: '',
                targetClass: '',
                initialEntry: '',
                initialExit: '',
                observations: ''
            });
            addToast("Livro cadastrado com sucesso!", 'success');
            fetchMaterials();

        } catch (error) {
            console.error("Erro ao cadastrar:", error);
            addToast("Erro ao cadastrar livro.", 'error');
        }
    };

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.targetClass?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER & FILTROS */}
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-orange-600 text-white rounded-3xl shadow-lg shadow-orange-600/20">
                            <Library size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Outros Livros e Projetos</h2>
                            <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">Gestão de materiais complementares e projetos específicos</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsRegModalOpen(true)}
                        className="px-6 py-3 bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all shadow-lg border border-white/5"
                    >
                        <PlusCircle size={18} /> Novo Item
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por título, projeto ou categoria..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-black/20 border border-white/5 rounded-2xl font-bold text-sm text-white outline-none focus:bg-black/40 focus:border-orange-500/30 transition-all placeholder-white/20"
                    />
                </div>
            </div>

            {/* LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaterials.map(item => (
                    <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${item.type === 'PROFESSOR' ? 'bg-indigo-50 text-indigo-600' : 'bg-pink-50 text-pink-600'
                                }`}>
                                {item.type}
                            </span>
                            <div className="flex flex-col items-end">
                                <span className="text-3xl font-black text-gray-900">{item.quantity}</span>
                                <span className="text-[10px] text-gray-400 font-black uppercase">Saldo Atual</span>
                            </div>
                        </div>

                        <h3 className="text-lg font-black text-gray-800 uppercase leading-snug mb-2 line-clamp-2 min-h-[3.5rem]">
                            {item.name}
                        </h3>

                        <div className="space-y-3 pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
                                    <Box size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase">Projeto</p>
                                    <p className="text-xs font-bold text-gray-700 uppercase">{item.project}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
                                    <Users size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase">Turma / Destino</p>
                                    <p className="text-xs font-bold text-gray-700 uppercase">{item.targetClass}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-6">
                            <div className="p-3 bg-gray-50 rounded-xl text-center">
                                <p className="text-[10px] text-gray-400 font-black uppercase">Entradas</p>
                                <p className="text-sm font-black text-emerald-600">{item.totalEntries}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl text-center">
                                <p className="text-[10px] text-gray-400 font-black uppercase">Saídas</p>
                                <p className="text-sm font-black text-red-600">{item.totalExits}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* REGISTRATION MODAL */}
            {isRegModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto">
                        <div className="p-8 bg-purple-50 flex justify-between items-center border-b border-purple-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg">
                                    <BookOpen size={24} />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Novo Livro / Projeto</h3>
                            </div>
                            <button onClick={() => setIsRegModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleRegister} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Livro ou Material</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="EX: LIVRO LEITURA EM FAMÍLIA - VOL 1"
                                    value={newBookForm.name}
                                    onChange={e => setNewBookForm({ ...newBookForm, name: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all uppercase"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Público Alvo</label>
                                    <select
                                        required
                                        value={newBookForm.type}
                                        onChange={e => setNewBookForm({ ...newBookForm, type: e.target.value as any })}
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none uppercase"
                                    >
                                        <option value="ESTUDANTE">ESTUDANTE</option>
                                        <option value="PROFESSOR">PROFESSOR</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turma / Destino</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="EX: 6º A, BIBLIOTECA..."
                                        value={newBookForm.targetClass}
                                        onChange={e => setNewBookForm({ ...newBookForm, targetClass: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none uppercase"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Projeto Vinculado</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="EX: PROJETO DE LEITURA, REFORÇO..."
                                    value={newBookForm.project}
                                    onChange={e => setNewBookForm({ ...newBookForm, project: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none uppercase"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                <div className="space-y-1.5 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Qtd. Chegou (Entrada)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="0"
                                        value={newBookForm.initialEntry}
                                        onChange={e => setNewBookForm({ ...newBookForm, initialEntry: e.target.value === '' ? '' : Number(e.target.value) })}
                                        className="w-full bg-transparent font-black text-3xl text-center outline-none text-emerald-700"
                                    />
                                </div>
                                <div className="space-y-1.5 p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1">Qtd. Saiu (Saída)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="0"
                                        value={newBookForm.initialExit}
                                        onChange={e => setNewBookForm({ ...newBookForm, initialExit: e.target.value === '' ? '' : Number(e.target.value) })}
                                        className="w-full bg-transparent font-black text-3xl text-center outline-none text-orange-700"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-all mt-6">
                                <PlusCircle size={20} /> Cadastrar Livro
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlmoxarifeOtherBooks;
