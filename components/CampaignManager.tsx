import React, { useState, useEffect, useMemo } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Calendar, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  Users, 
  Star, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Clock, 
  Upload,
  MessageSquare,
  BarChart3,
  Sparkles,
  ArrowRight,
  Info,
  Download,
  MapPin,
  User,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Campaign, CampaignStatus, CampaignMaterial, CampaignActivity, CampaignFeedback, PsychosocialRole } from '../types';

interface CampaignManagerProps {
  role: PsychosocialRole;
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ role }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('school_campaigns_v2026');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'materials' | 'schedule' | 'feedback' | 'report'>('info');

  // Novos estados para o formulário de criação
  const [newName, setNewName] = useState('');
  const [newTheme, setNewTheme] = useState('CONVIVÊNCIA PACÍFICA E MEDIAÇÃO');

  useEffect(() => {
    localStorage.setItem('school_campaigns_v2026', JSON.stringify(campaigns));
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.theme.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [campaigns, searchTerm]);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'PROFESSOR') {
      alert("Professores têm apenas permissão de consulta.");
      return;
    }

    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      name: newName,
      theme: newTheme,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias de duração padrão
      status: 'PLANEJAMENTO',
      responsibleTeam: [role],
      materials: [],
      schedule: [],
      feedbacks: [],
      relatedCasesIds: [],
      targetClasses: ['9º Ano A', '9º Ano B', '9º Ano C', '9º Ano D']
    };

    setCampaigns(prev => [...prev, newCampaign]);
    setNewName('');
    setIsCreateModalOpen(false);
    alert("Campanha criada com sucesso e adicionada ao cronograma!");
  };

  const getStatusStyle = (status: CampaignStatus) => {
    switch (status) {
      case 'PLANEJAMENTO': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'ATIVO': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'CONCLUÍDO': return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER GESTÃO CAMPANHAS */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-6">
            <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl">
               <Megaphone size={32} />
            </div>
            <div>
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Cronograma de Campanhas 2026</h3>
               <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Planejamento Estratégico SEDUC/MT</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
               <input 
                  type="text" 
                  placeholder="Pesquisar por mês ou tema..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none w-64 focus:ring-2 focus:ring-rose-100" 
               />
            </div>
            {role !== 'PROFESSOR' && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-2"
              >
                <Plus size={16} /> Nova Campanha
              </button>
            )}
         </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-3xl flex items-center gap-4">
         <Info size={20} className="text-blue-500 shrink-0" />
         <p className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">
            As informações abaixo foram importadas do Calendário do Núcleo de Mediação Escolar 2026. Siga as orientações específicas de cada mês.
         </p>
      </div>

      {/* GRID DE CAMPANHAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {filteredCampaigns.map(camp => (
           <div 
             key={camp.id} 
             onClick={() => setSelectedCampaign(camp)}
             className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:border-rose-200 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
           >
              <div className="flex justify-between items-start mb-6">
                 <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${getStatusStyle(camp.status)}`}>
                    {camp.status}
                 </div>
                 <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-gray-300" />
                    <span className="text-[10px] font-black text-gray-900 uppercase">
                        {new Date(camp.startDate).toLocaleDateString('pt-BR', { month: 'long' })}
                    </span>
                 </div>
              </div>

              <h4 className="text-xl font-black text-gray-900 uppercase leading-tight mb-2 group-hover:text-rose-600 transition-colors">{camp.name}</h4>
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                 <Sparkles size={12} /> {camp.theme}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-gray-50 p-3 rounded-2xl">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Início</p>
                    <p className="text-xs font-black text-gray-800">{new Date(camp.startDate).toLocaleDateString('pt-BR')}</p>
                 </div>
                 <div className="bg-gray-50 p-3 rounded-2xl">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Término</p>
                    <p className="text-xs font-black text-gray-800">{new Date(camp.endDate).toLocaleDateString('pt-BR')}</p>
                 </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                 <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-gray-400 uppercase">Orientativo SEDUC</span>
                 </div>
                 <div className="flex items-center gap-1 text-[10px] font-black text-rose-600 uppercase tracking-widest">
                    Detalhar <ArrowRight size={14} />
                 </div>
              </div>
           </div>
         ))}
      </div>

      {/* MODAL DETALHES DA CAMPANHA */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-rose-950/40 backdrop-blur-sm animate-in fade-in duration-300 p-4 md:p-8">
           <div className="bg-white rounded-[3.5rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 h-full max-h-[90vh]">
              
              {/* HEADER MODAL */}
              <div className="p-8 bg-rose-900 text-white shrink-0 relative">
                 <div className="absolute top-0 right-0 p-8 opacity-10"><Megaphone size={120} /></div>
                 <div className="flex justify-between items-start mb-6 relative z-10">
                    <button onClick={() => setSelectedCampaign(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={28}/></button>
                    <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">Calendário 2026</span>
                 </div>
                 <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl font-black">📣</div>
                    <div>
                       <h3 className="text-2xl font-black uppercase tracking-tight leading-none">{selectedCampaign.name}</h3>
                       <p className="text-rose-300 font-bold uppercase text-[10px] tracking-widest mt-2">{selectedCampaign.theme}</p>
                    </div>
                 </div>
              </div>

              {/* NAV TABS INTERNAS */}
              <div className="flex bg-gray-50 border-b border-gray-100 px-8 no-print shrink-0 overflow-x-auto custom-scrollbar">
                 {[
                   { id: 'info', label: 'Estratégia', icon: FileText },
                   { id: 'materials', label: 'Base Legal e Materiais', icon: Upload },
                   { id: 'schedule', label: 'Agenda Local', icon: Calendar },
                   { id: 'feedback', label: 'Relatos e Impacto', icon: MessageSquare },
                 ].map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveDetailTab(tab.id as any)}
                     className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                       activeDetailTab === tab.id 
                       ? 'border-rose-600 text-rose-600 bg-white' 
                       : 'border-transparent text-gray-400 hover:text-gray-600'
                     }`}
                   >
                     <tab.icon size={14} /> {tab.label}
                   </button>
                 ))}
              </div>

              {/* CONTEÚDO SCROLL */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
                 
                 {activeDetailTab === 'info' && (
                   <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                               <Users size={14} className="text-rose-600" /> Alcance Previsto
                            </h4>
                            <div className="flex flex-wrap gap-2">
                               {selectedCampaign.targetClasses.map((c, i) => (
                                 <span key={i} className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-700 border border-gray-100">{c}</span>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                               <Clock size={14} className="text-rose-600" /> Período de Atuação
                            </h4>
                            <div className="flex items-center gap-4">
                               <div className="p-3 bg-rose-50 rounded-xl">
                                  <p className="text-[8px] font-black text-rose-600 uppercase">Mês de Referência</p>
                                  <p className="text-sm font-black text-rose-800 uppercase">{new Date(selectedCampaign.startDate).toLocaleDateString('pt-BR', { month: 'long' })}</p>
                               </div>
                               <ArrowRight size={16} className="text-gray-300" />
                               <div className="p-3 bg-gray-50 rounded-xl">
                                  <p className="text-[8px] font-black text-gray-400 uppercase">Ano</p>
                                  <p className="text-sm font-black text-gray-800">2026</p>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 space-y-4">
                         <h4 className="text-[10px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={14} /> Objetivos do Orientativo
                         </h4>
                         <p className="text-xs text-rose-800 leading-relaxed font-medium">
                            Ação coordenada para fortalecer o diálogo sobre violências escolares e promover ambientes acolhedores. O foco deve ser a prevenção e o enfrentamento dialógico de conflitos conforme diretrizes da SEDUC-MT.
                         </p>
                      </div>
                   </div>
                 )}

                 {activeDetailTab === 'materials' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                       <div className="flex justify-between items-center">
                          <h4 className="text-sm font-black text-gray-900 uppercase">Base Legal e Documentação</h4>
                          {role !== 'PROFESSOR' && (
                             <button className="px-4 py-2 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-2 shadow-md">
                                <Upload size={14} /> Anexar Guia Prático
                             </button>
                          )}
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedCampaign.materials.map(m => (
                             <div key={m.id} className="p-5 bg-gray-50 rounded-[2rem] border border-transparent hover:border-rose-200 transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                   <div className={`p-3 rounded-2xl ${m.type === 'VÍDEO' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                      {m.type === 'VÍDEO' ? <Video size={20}/> : m.type === 'PDF' ? <FileText size={20}/> : <LinkIcon size={20}/>}
                                   </div>
                                   <div>
                                      <p className="text-xs font-black text-gray-900 uppercase">{m.name}</p>
                                      <p className="text-[9px] text-gray-400 font-bold uppercase">{m.type}</p>
                                   </div>
                                </div>
                                <button className="p-2 bg-white text-gray-300 hover:text-rose-600 rounded-lg shadow-sm group-hover:scale-110 transition-all">
                                   <Download size={16} />
                                </button>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {activeDetailTab === 'schedule' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                       <div className="flex justify-between items-center">
                          <h4 className="text-sm font-black text-gray-900 uppercase">Cronograma Escolar</h4>
                          <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-2">
                             <Plus size={14} /> Lançar Ação Local
                          </button>
                       </div>
                       {selectedCampaign.schedule.length > 0 ? (
                          <div className="space-y-4">
                            {selectedCampaign.schedule.map(act => (
                               <div key={act.id} className="flex gap-6 items-start group">
                                  <div className="w-20 shrink-0 text-center space-y-1">
                                     <p className="text-[10px] font-black text-rose-600 uppercase">{new Date(act.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'})}</p>
                                     <p className="text-[8px] font-bold text-gray-400">{act.time}</p>
                                  </div>
                                  <div className="flex-1 p-5 bg-gray-50 rounded-[2rem] border border-gray-100 group-hover:border-rose-200 group-hover:bg-white transition-all shadow-sm">
                                     <h5 className="text-sm font-black text-gray-900 uppercase mb-1">{act.title}</h5>
                                     <div className="flex items-center gap-4 text-[9px] font-bold text-gray-400 uppercase">
                                        <span className="flex items-center gap-1"><MapPin size={10} /> {act.location}</span>
                                        <span className="flex items-center gap-1"><User size={10} /> {act.responsible}</span>
                                     </div>
                                  </div>
                               </div>
                            ))}
                          </div>
                       ) : (
                          <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                             <Calendar size={32} className="mx-auto mb-4 text-gray-100" />
                             <p className="text-[10px] font-black text-gray-400 uppercase">Nenhuma ação local agendada para esta campanha</p>
                          </div>
                       )}
                    </div>
                 )}

                 {activeDetailTab === 'feedback' && (
                   <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                         <MessageSquare size={48} className="mx-auto mb-4 text-gray-100" />
                         <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Os relatos e feedbacks serão habilitados após o início da vigência em 2026.</p>
                      </div>
                   </div>
                 )}
              </div>

              {/* FOOTER MODAL */}
              <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4 shrink-0 no-print">
                 <button className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all">Imprimir Plano 2026</button>
                 <button onClick={() => setSelectedCampaign(null)} className="px-8 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 transition-all">Fechar</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL SIMULADO DE CRIAÇÃO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-rose-950/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500">
              <div className="p-8 bg-rose-600 text-white flex justify-between items-center">
                 <h3 className="text-xl font-black uppercase tracking-tight">Nova Campanha Socioeducativa</h3>
                 <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24}/></button>
              </div>
               <form onSubmit={handleCreateCampaign} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título da Campanha</label>
                    <input 
                      type="text" 
                      required 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Título oficial ou projeto local..." 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rose-100 transition-all" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Eixo Temático</label>
                    <select 
                      value={newTheme}
                      onChange={(e) => setNewTheme(e.target.value)}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-[10px] uppercase outline-none focus:bg-white transition-all"
                    >
                       <option value="SAÚDE MENTAL E BEM-ESTAR">SAÚDE MENTAL E BEM-ESTAR</option>
                       <option value="CONVIVÊNCIA PACÍFICA E MEDIAÇÃO">CONVIVÊNCIA PACÍFICA E MEDIAÇÃO</option>
                       <option value="COMBATE ÀS VIOLÊNCIAS">COMBATE ÀS VIOLÊNCIAS</option>
                       <option value="DIREITOS HUMANOS E CIDADANIA">DIREITOS HUMANOS E CIDADANIA</option>
                    </select>
                 </div>
                 <button type="submit" className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-rose-700 active:scale-95 transition-all">Salvar no Planejamento</button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default CampaignManager;