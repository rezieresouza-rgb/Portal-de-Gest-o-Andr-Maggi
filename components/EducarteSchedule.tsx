import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  MapPin,
  Clock,
  Shirt,
  Bus,
  Edit2,
  Trash2,
  X,
  Flag,
  Award,
  Users,
  CheckCircle2
} from 'lucide-react';

interface EducarteScheduleProps {
  events: any[];
  onSaveEvent: (evt: any) => void;
  onDeleteEvent: (id: string) => void;
}

const EVENT_TYPES = [
  'ENSAIO GERAL',
  'APRESENTACAO',
  'DESFILE CIVICO',
  'FESTIVAL / CONCURSO',
  'REUNIÃO COM PAIS'
];

const EducarteSchedule: React.FC<EducarteScheduleProps> = ({
  events,
  onSaveEvent,
  onDeleteEvent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    type: 'APRESENTACAO',
    date: new Date().toLocaleDateString('sv-SE'),
    time: '14:00',
    location: 'Escola André Maggi',
    targetGroup: 'Toda a Banda',
    uniform: 'Uniforme Oficial de Gala da Banda',
    transport: 'Não necessário (Na escola)',
    notes: ''
  });

  const openNewModal = () => {
    setEditingEvent(null);
    setFormData({
      id: crypto.randomUUID(),
      title: '',
      type: 'APRESENTACAO',
      date: new Date().toLocaleDateString('sv-SE'),
      time: '14:00',
      location: 'Escola André Maggi',
      targetGroup: 'Toda a Banda',
      uniform: 'Uniforme Oficial de Gala da Banda',
      transport: 'Não necessário (Na escola)',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (evt: any) => {
    setEditingEvent(evt);
    setFormData({
      id: evt.id,
      title: evt.title,
      type: evt.type || 'APRESENTACAO',
      date: evt.date || new Date().toLocaleDateString('sv-SE'),
      time: evt.time || '14:00',
      location: evt.location || 'Escola André Maggi',
      targetGroup: evt.targetGroup || 'Toda a Banda',
      uniform: evt.uniform || '',
      transport: evt.transport || '',
      notes: evt.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Informe o título do evento.");
      return;
    }
    onSaveEvent(formData);
    setIsModalOpen(false);
  };

  const filteredEvents = events
    .filter(e => filterType === 'TODOS' || e.type === filterType)
    .filter(e =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.location || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* CABEÇALHO */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
            <Calendar className="text-amber-500" size={26} /> Agenda de Ensaios & Apresentações
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Desfiles Cívicos, Festivais e Apresentações Públicas • Banda André Maggi
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Agendar Apresentação / Ensaio
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['TODOS', ...EVENT_TYPES].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filterType === t
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t === 'TODOS' ? 'TODOS OS EVENTOS' : t}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Buscar evento..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* LISTA DE EVENTOS */}
      <div className="space-y-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map(evt => {
            const isPast = new Date(evt.date + 'T23:59:59') < new Date();

            return (
              <div
                key={evt.id}
                className={`p-6 md:p-8 rounded-[3rem] border transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 ${
                  isPast ? 'bg-slate-50/70 border-slate-200 opacity-75' : 'bg-white border-slate-200/80 shadow-sm hover:border-amber-300'
                }`}
              >
                <div className="flex items-start gap-5">
                  <div className={`w-16 h-16 rounded-3xl flex flex-col items-center justify-center font-black shrink-0 border ${
                    isPast ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}>
                    <span className="text-[10px] leading-none uppercase">
                      {new Date(evt.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                    <span className="text-2xl leading-none mt-1">
                      {new Date(evt.date + 'T12:00:00').getDate()}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                        evt.type === 'APRESENTACAO' || evt.type === 'DESFILE CIVICO' ? 'bg-amber-100 text-amber-900' :
                        evt.type === 'FESTIVAL / CONCURSO' ? 'bg-purple-100 text-purple-900' : 'bg-blue-100 text-blue-900'
                      }`}>
                        {evt.type}
                      </span>
                      {isPast && (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-bold uppercase">
                          Realizado
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{evt.title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-bold">
                      <span className="flex items-center gap-1"><Clock size={14} className="text-slate-400" /> {evt.time || '14:00'}</span>
                      <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-400" /> {evt.location || 'Escola André Maggi'}</span>
                      <span className="flex items-center gap-1"><Users size={14} className="text-slate-400" /> {evt.targetGroup || 'Toda a Banda'}</span>
                    </div>

                    {(evt.uniform || evt.transport) && (
                      <div className="pt-2 flex flex-wrap gap-3 text-[11px] text-slate-600 font-medium">
                        {evt.uniform && <span className="flex items-center gap-1"><Shirt size={12} className="text-amber-600" /> {evt.uniform}</span>}
                        {evt.transport && <span className="flex items-center gap-1"><Bus size={12} className="text-blue-600" /> {evt.transport}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <button
                    onClick={() => openEditModal(evt)}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir evento ${evt.title}?`)) onDeleteEvent(evt.id);
                    }}
                    className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-white rounded-[3rem] border border-slate-200">
            Nenhum evento agendado nesta categoria
          </div>
        )}
      </div>

      {/* MODAL DE AGENDAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-8 md:p-10 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {editingEvent ? 'Editar Evento' : 'Novo Evento / Apresentação'}
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título do Evento / Desfile</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Desfile Cívico de 7 de Setembro, Mostra Cultural SEDUC..."
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Evento</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white cursor-pointer text-amber-900"
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local do Evento</label>
                  <input
                    type="text"
                    placeholder="Ex: Avenida dos Jacarandás, Ginásio Olímpico..."
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Público / Naipes Escalados</label>
                  <input
                    type="text"
                    placeholder="Ex: Toda a Banda, Apenas Percussão e Balizas..."
                    value={formData.targetGroup}
                    onChange={e => setFormData({ ...formData, targetGroup: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uniforme / Figurino</label>
                  <input
                    type="text"
                    placeholder="Ex: Farda de Gala Completa, Camiseta Educarte..."
                    value={formData.uniform}
                    onChange={e => setFormData({ ...formData, uniform: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transporte & Alimentação</label>
                  <input
                    type="text"
                    placeholder="Ex: Ônibus escolar cedido pela DRE Sinop..."
                    value={formData.transport}
                    onChange={e => setFormData({ ...formData, transport: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:bg-white"
                  />
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
                  Salvar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EducarteSchedule;
