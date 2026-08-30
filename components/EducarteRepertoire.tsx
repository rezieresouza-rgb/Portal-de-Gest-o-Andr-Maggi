import React, { useState } from 'react';
import {
  Music,
  Plus,
  Search,
  Filter,
  FileText,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Archive,
  X,
  Play,
  Volume2
} from 'lucide-react';

interface EducarteRepertoireProps {
  repertoire: any[];
  onSavePiece: (piece: any) => void;
  onDeletePiece: (id: string) => void;
}

const GENRES = [
  'HINOS CÍVICOS',
  'DOBRADOS MARCIONAIS',
  'MARCHAS DE DESFILE',
  'MPB / MÚSICA POPULAR',
  'POP / ROCK ADAPTADO',
  'TEMAS DE FILMES / SÉRIES'
];

const STATUSES = ['EM ESTUDO', 'PRONTA P/ APRESENTAÇÃO', 'ARQUIVADA'];
const DIFFICULTIES = ['FÁCIL (INICIANTE)', 'MÉDIO (INTERMEDIÁRIO)', 'AVANÇADO'];

const EducarteRepertoire: React.FC<EducarteRepertoireProps> = ({
  repertoire,
  onSavePiece,
  onDeletePiece
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('TODOS');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPiece, setEditingPiece] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    composer: '',
    genre: 'HINOS CÍVICOS',
    status: 'EM ESTUDO',
    difficulty: 'MÉDIO (INTERMEDIÁRIO)',
    scoreLink: '',
    audioLink: '',
    notes: ''
  });

  const openNewModal = () => {
    setEditingPiece(null);
    setFormData({
      id: crypto.randomUUID(),
      title: '',
      composer: '',
      genre: 'HINOS CÍVICOS',
      status: 'EM ESTUDO',
      difficulty: 'MÉDIO (INTERMEDIÁRIO)',
      scoreLink: '',
      audioLink: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingPiece(p);
    setFormData({
      id: p.id,
      title: p.title,
      composer: p.composer || '',
      genre: p.genre || 'HINOS CÍVICOS',
      status: p.status || 'EM ESTUDO',
      difficulty: p.difficulty || 'MÉDIO (INTERMEDIÁRIO)',
      scoreLink: p.scoreLink || '',
      audioLink: p.audioLink || '',
      notes: p.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Informe o título da música.");
      return;
    }
    onSavePiece(formData);
    setIsModalOpen(false);
  };

  const filteredRepertoire = repertoire
    .filter(p => filterGenre === 'TODOS' || p.genre === filterGenre)
    .filter(p => filterStatus === 'TODOS' || p.status === filterStatus)
    .filter(p =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.composer || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* CABEÇALHO COM CONTROLES */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
            <Music className="text-amber-500" size={26} /> Repertório & Partituras
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Hinos Cívicos, Dobrados, Marchas e Arranjos Musicais • Banda André Maggi
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Adicionar Música
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={filterGenre}
            onChange={e => setFilterGenre(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer text-amber-900"
          >
            <option value="TODOS">TODOS OS GÊNEROS</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
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
            placeholder="Buscar música, compositor..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* GRADE DE REPERTÓRIO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRepertoire.length > 0 ? (
          filteredRepertoire.map(piece => (
            <div
              key={piece.id}
              className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-4 hover:border-amber-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200/60 rounded-full text-[9px] font-black uppercase tracking-wider">
                    {piece.genre}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                    piece.status === 'PRONTA P/ APRESENTAÇÃO' ? 'bg-emerald-100 text-emerald-800' :
                    piece.status === 'EM ESTUDO' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {piece.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-slate-900 text-base uppercase leading-tight">{piece.title}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase mt-0.5">
                    {piece.composer || 'Tradicional / Arranjo Escolar'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl space-y-1 text-xs text-slate-600 font-bold">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Dificuldade:</span>
                    <span className="text-slate-900">{piece.difficulty}</span>
                  </div>
                  {piece.notes && (
                    <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 font-medium">
                      {piece.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {piece.scoreLink && (
                    <a
                      href={piece.scoreLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"
                    >
                      <FileText size={12} /> Partitura
                    </a>
                  )}
                  {piece.audioLink && (
                    <a
                      href={piece.audioLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"
                    >
                      <Play size={12} /> Áudio Ref
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={() => openEditModal(piece)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir peça ${piece.title}?`)) onDeletePiece(piece.id);
                    }}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all"
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
            Nenhuma música cadastrada no repertório
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
                  {editingPiece ? 'Editar Música' : 'Nova Música para o Repertório'}
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase">Banda André Maggi • SEDUC-MT</p>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título da Música</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hino da Independência, Dobrado Batista de Melo..."
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compositor / Arranjador</label>
                  <input
                    type="text"
                    placeholder="Ex: Evaristo da Veiga, Manoel Alves..."
                    value={formData.composer}
                    onChange={e => setFormData({ ...formData, composer: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gênero Musical</label>
                  <select
                    value={formData.genre}
                    onChange={e => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white cursor-pointer text-amber-900"
                  >
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Peça</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white cursor-pointer"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grau de Dificuldade</label>
                  <select
                    value={formData.difficulty}
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white cursor-pointer"
                  >
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link da Partitura (Google Drive / PDF)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.scoreLink}
                    onChange={e => setFormData({ ...formData, scoreLink: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link de Áudio / YouTube de Estudo</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/..."
                    value={formData.audioLink}
                    onChange={e => setFormData({ ...formData, audioLink: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações Pedagógicas para os Naipes</label>
                <textarea
                  placeholder="Orientações de dinâmica, andamento e articulação..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs outline-none focus:bg-white h-20"
                />
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
                  Salvar Peça
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EducarteRepertoire;
