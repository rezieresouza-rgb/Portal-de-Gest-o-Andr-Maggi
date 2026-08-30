import React, { useState } from 'react';
import {
  Volume2,
  Plus,
  Search,
  Filter,
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  User,
  Calendar,
  X,
  Edit2,
  Trash2,
  ShieldCheck,
  Music
} from 'lucide-react';

interface EducarteInstrumentsProps {
  instruments: any[];
  members: any[];
  onSaveInstrument: (inst: any) => void;
  onDeleteInstrument: (id: string) => void;
}

const NAIPES = ['METAIS', 'MADEIRAS', 'PERCUSSÃO', 'ACESSÓRIOS / DIVERSOS'];
const CONDITIONS = ['NOVO', 'EXCELENTE', 'BOM', 'NECESSITA MANUTENÇÃO', 'DANIFICADO'];
const STATUSES = ['DISPONÍVEL', 'CAUTELADO', 'EM MANUTENÇÃO', 'BAIXADO'];

const EducarteInstruments: React.FC<EducarteInstrumentsProps> = ({
  instruments,
  members,
  onSaveInstrument,
  onDeleteInstrument
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNaipe, setFilterNaipe] = useState('TODOS');
  const [filterStatus, setFilterStatus] = useState('TODOS');

  // Modal de Instrumento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<any | null>(null);

  // Modal de Cautela / Impressão de Termo
  const [selectedForTerm, setSelectedForTerm] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    naipe: 'METAIS',
    brand: '',
    serialNumber: '',
    patrimonyCode: '',
    condition: 'BOM',
    status: 'DISPONÍVEL',
    loanedToId: '',
    loanedToName: '',
    loanDate: '',
    returnDueDate: '',
    notes: ''
  });

  const openNewModal = () => {
    setEditingInst(null);
    setFormData({
      id: crypto.randomUUID(),
      name: '',
      naipe: 'METAIS',
      brand: '',
      serialNumber: '',
      patrimonyCode: '',
      condition: 'BOM',
      status: 'DISPONÍVEL',
      loanedToId: '',
      loanedToName: '',
      loanDate: '',
      returnDueDate: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (inst: any) => {
    setEditingInst(inst);
    setFormData({
      id: inst.id,
      name: inst.name,
      naipe: inst.naipe || 'METAIS',
      brand: inst.brand || '',
      serialNumber: inst.serialNumber || '',
      patrimonyCode: inst.patrimonyCode || '',
      condition: inst.condition || 'BOM',
      status: inst.status || 'DISPONÍVEL',
      loanedToId: inst.loanedToId || '',
      loanedToName: inst.loanedToName || '',
      loanDate: inst.loanDate || '',
      returnDueDate: inst.returnDueDate || '',
      notes: inst.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Informe o nome do instrumento.");
      return;
    }

    let payload = { ...formData };
    if (formData.loanedToId) {
      const mem = members.find(m => m.id === formData.loanedToId);
      if (mem) {
        payload.loanedToName = mem.name;
        payload.status = 'CAUTELADO';
        if (!payload.loanDate) payload.loanDate = new Date().toLocaleDateString('sv-SE');
      }
    } else if (payload.status === 'CAUTELADO' && !payload.loanedToId) {
      payload.status = 'DISPONÍVEL';
    }

    onSaveInstrument(payload);
    setIsModalOpen(false);
  };

  const filteredInstruments = instruments
    .filter(i => filterNaipe === 'TODOS' || i.naipe === filterNaipe)
    .filter(i => filterStatus === 'TODOS' || i.status === filterStatus)
    .filter(i =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.loanedToName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* CABEÇALHO COM CONTROLES */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
            <Volume2 className="text-amber-500" size={26} /> Acervo Instrumental & Cautelas
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Inventário de Instrumentos e Termos de Responsabilidade • Banda André Maggi
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Cadastrar Instrumento
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={filterNaipe}
            onChange={e => setFilterNaipe(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
          >
            <option value="TODOS">TODOS OS NAIPES</option>
            {NAIPES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
          >
            <option value="TODOS">TODOS OS STATUS</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Buscar por instrumento, marca, serial..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* GRADE DE INSTRUMENTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInstruments.length > 0 ? (
          filteredInstruments.map(inst => (
            <div
              key={inst.id}
              className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-4 hover:border-amber-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200/60 rounded-full text-[9px] font-black uppercase tracking-wider">
                    {inst.naipe}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                    inst.status === 'DISPONÍVEL' ? 'bg-emerald-100 text-emerald-800' :
                    inst.status === 'CAUTELADO' ? 'bg-blue-100 text-blue-800' :
                    inst.status === 'EM MANUTENÇÃO' ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {inst.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-slate-900 text-base uppercase leading-tight">{inst.name}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase mt-0.5">
                    {inst.brand || 'Marca não informada'} {inst.serialNumber ? `• Nº Série: ${inst.serialNumber}` : ''}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs font-bold">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400 font-medium">Conservação:</span>
                    <span className={inst.condition === 'NECESSITA MANUTENÇÃO' ? 'text-rose-600' : 'text-slate-900'}>
                      {inst.condition}
                    </span>
                  </div>

                  {inst.status === 'CAUTELADO' && (
                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-1">
                        <User size={12} /> Cautelado para:
                      </p>
                      <p className="text-slate-900 font-black uppercase">{inst.loanedToName || 'Músico'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Desde: {inst.loanDate ? new Date(inst.loanDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                {inst.status === 'CAUTELADO' && (
                  <button
                    onClick={() => setSelectedForTerm(inst)}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                  >
                    <Printer size={12} /> Termo Cautela
                  </button>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={() => openEditModal(inst)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir instrumento ${inst.name}?`)) onDeleteInstrument(inst.id);
                    }}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-white rounded-[3rem] border border-slate-200">
            Nenhum instrumento encontrado
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-8 md:p-10 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {editingInst ? 'Editar Instrumento' : 'Novo Instrumento Musical'}
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase">Patrimônio da Banda André Maggi</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Instrumento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Trompete em Bb, Saxofone Alto, Tuba..."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Naipe</label>
                  <select
                    value={formData.naipe}
                    onChange={e => setFormData({ ...formData, naipe: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white cursor-pointer"
                  >
                    {NAIPES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marca / Modelo</label>
                  <input
                    type="text"
                    placeholder="Ex: Yamaha, Weril, Michael..."
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número de Série</label>
                  <input
                    type="text"
                    placeholder="Nº de Série gravado..."
                    value={formData.serialNumber}
                    onChange={e => setFormData({ ...formData, serialNumber: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Conservação</label>
                  <select
                    value={formData.condition}
                    onChange={e => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white cursor-pointer"
                  >
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* CAUTELA / EMPRÉSTIMO */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <p className="text-xs font-black text-amber-900 uppercase">Cautela / Empréstimo ao Aluno</p>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Aluno Responsável pelo Instrumento</label>
                  <select
                    value={formData.loanedToId}
                    onChange={e => setFormData({ ...formData, loanedToId: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                  >
                    <option value="">[ NENHUM - INSTRUMENTO NO ARMÁRIO DA ESCOLA ]</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.instrument})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20"
                >
                  Salvar Instrumento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TERMO DE CAUTELA OFICIAL PARA IMPRESSÃO */}
      {selectedForTerm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-amber-500" size={28} />
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase">Termo Oficial de Cautela e Guarda</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase">Projeto Educarte • E.E. André Maggi</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedForTerm(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* CONTEÚDO DO TERMO */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs text-slate-700 leading-relaxed font-medium">
              <p className="font-bold text-center uppercase tracking-widest text-slate-900">
                TERMO DE RESPONSABILIDADE E CAUTELA DE INSTRUMENTO MUSICAL
              </p>

              <p>
                Pelo presente termo, a <strong>Escola Estadual André Antônio Maggi</strong>, através do <strong>Projeto Educarte - Banda de Música Escolar</strong>, entrega em regime de cautela para uso pedagógico e ensaios o seguinte instrumento do patrimônio escolar:
              </p>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 font-bold">
                <p>• <strong>Instrumento:</strong> {selectedForTerm.name}</p>
                <p>• <strong>Marca / Modelo:</strong> {selectedForTerm.brand || 'Conforme cadastro'}</p>
                <p>• <strong>Nº de Série:</strong> {selectedForTerm.serialNumber || 'Identificado na carcaça'}</p>
                <p>• <strong>Estado de Conservação:</strong> {selectedForTerm.condition}</p>
              </div>

              <p>
                <strong>Estudante Beneficiário:</strong> {selectedForTerm.loanedToName}
              </p>

              <p>
                <strong>Compromisso do Responsável Legal:</strong> O estudante e seu responsável comprometem-se a zelar pela guarda, limpeza e conservação do instrumento, utilizando-o exclusivamente para os estudos musicais da escola e devolvendo-o imediatamente quando solicitado pela direção escolar ou em caso de desvinculação do projeto.
              </p>

              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs font-bold text-slate-800">
                <div className="space-y-1 border-t border-slate-400 pt-2">
                  <p>Assinatura do Pai / Mãe / Responsável</p>
                </div>
                <div className="space-y-1 border-t border-slate-400 pt-2">
                  <p>Maestro / Coordenação do Projeto Educarte</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedForTerm(null)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <Printer size={16} /> Imprimir Termo de Cautela
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EducarteInstruments;
