
import React, { useState, useEffect, useMemo } from 'react';
import {
  Monitor,
  ArrowLeft,
  Plus,
  Search,
  History,
  FileDown,
  Camera,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  X,
  Image as ImageIcon,
  MapPin,
  ClipboardList,
  QrCode,
  Download,
  Maximize
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Asset, AssetCondition } from '../types';

interface AssetInventoryModuleProps {
  onExit: () => void;
}

import { supabase } from '../supabaseClient';

const AssetInventoryModule: React.FC<AssetInventoryModuleProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'history' | 'ambientes'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<Asset | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [form, setForm] = useState<Omit<Asset, 'id' | 'timestamp' | 'history' | 'isUnserviceable'>>({
    description: '',
    location: '',
    heritageNumber: '',
    condition: 'BOM',
    photo: '',
  });

  const [unserviceableForm, setUnserviceableForm] = useState({
    reason: '',
    responsible: 'GESTOR ANDRÉ'
  });

  const fetchAssets = async () => {
    try {
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;

      // Fetch histories for all assets (optimization: could happen on demand or with join if not too many)
      const { data: historyData, error: historyError } = await supabase
        .from('asset_history')
        .select('*');

      if (historyError) throw historyError;

      if (assetsData) {
        setAssets(assetsData.map(a => ({
          id: a.id,
          description: a.description,
          location: a.location,
          heritageNumber: a.heritage_number,
          condition: a.condition as any,
          isUnserviceable: a.is_unserviceable,
          photo: a.photo,
          unserviceableData: a.unserviceable_data,
          history: historyData?.filter(h => h.asset_id === a.id).map(h => ({
            id: h.id,
            date: h.date,
            action: h.action,
            responsible: h.responsible,
            notes: h.notes
          })) || [],
          timestamp: new Date(a.created_at).getTime()
        })));
      }
    } catch (error) {
      console.error("Erro ao buscar patrimônio:", error);
    }
  };

  useEffect(() => {
    fetchAssets();
    const sub = supabase.channel('assets_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, fetchAssets).subscribe();
    return () => { sub.unsubscribe(); };
  }, []);

  const uniqueLocations = useMemo(() => {
    const locs = assets.map(a => a.location);
    return Array.from(new Set(locs)).sort();
  }, [assets]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setForm(prev => ({ ...prev, photo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (assets.some(a => a.heritageNumber === form.heritageNumber)) {
      return alert("Erro: Número de patrimônio já cadastrado.");
    }

    const isPessimo = form.condition === 'PÉSSIMO';

    try {
      // 1. Insert Asset
      const { data: newAsset, error: assetError } = await supabase
        .from('assets')
        .insert([{
          description: form.description.toUpperCase(),
          location: form.location.toUpperCase(),
          heritage_number: form.heritageNumber,
          condition: form.condition,
          is_unserviceable: isPessimo,
          photo: form.photo,
          unserviceable_data: isPessimo ? {
            date: new Date().toISOString().split('T')[0],
            ...unserviceableForm
          } : null
        }])
        .select()
        .single();

      if (assetError) throw assetError;

      // 2. Insert History
      const { error: historyError } = await supabase
        .from('asset_history')
        .insert([{
          asset_id: newAsset.id,
          date: new Date().toISOString().split('T')[0],
          action: isPessimo ? 'CADASTRO COMO INSERVÍVEL' : 'CADASTRO INICIAL',
          responsible: 'GESTOR ANDRÉ',
          notes: isPessimo ? `Motivo: ${unserviceableForm.reason}` : 'Inclusão manual no inventário'
        }]);

      if (historyError) throw historyError;

      await fetchAssets();
      setIsModalOpen(false);
      resetForm();
      alert("Bem patrimonial salvo com sucesso!");

    } catch (error) {
      console.error("Erro ao salvar bem:", error);
      alert("Erro ao salvar bem patrimonial.");
    }
  };

  const resetForm = () => {
    setForm({ description: '', location: '', heritageNumber: '', condition: 'BOM', photo: '' });
    setUnserviceableForm({ reason: '', responsible: 'GESTOR ANDRÉ' });
    setImagePreview(null);
  };

  const deleteAsset = async (id: string) => {
    if (window.confirm("Deseja remover este bem do inventário?")) {
      try {
        const { error } = await supabase.from('assets').delete().eq('id', id);
        if (error) throw error;
        await fetchAssets();
        alert("Bem removido com sucesso!");
      } catch (error) {
        console.error("Erro ao remover bem:", error);
        alert("Erro ao remover bem.");
      }
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchSearch = a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.heritageNumber.includes(searchTerm) ||
        a.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLocation = locationFilter ? a.location === locationFilter : true;
      return matchSearch && matchLocation;
    });
  }, [assets, searchTerm, locationFilter]);

  const getConditionColor = (cond: AssetCondition) => {
    switch (cond) {
      case 'EXCELENTE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'BOM': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'REGULAR': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PÉSSIMO': return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const handleExportPDF = async (elementId: string = 'inventory-list', filename: string = 'Inventario') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // @ts-ignore
    await window.html2pdf().set({
      margin: 10,
      filename: `${filename}_${new Date().getFullYear()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    }).from(element).save();
  };

  const downloadQRCode = (location: string) => {
    const svg = document.getElementById(`qr-${location}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `Etiqueta_QR_${location}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <aside className="w-64 bg-blue-950 text-white flex flex-col no-print">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-blue-600 p-1.5 rounded-lg shadow-lg">📋</span>
            Bens Móveis
          </h1>
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto">
          <button onClick={() => { setActiveTab('inventory'); setLocationFilter(null); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'inventory' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}>
            <Monitor size={18} /> Inventário Ativo
          </button>
          <button onClick={() => setActiveTab('ambientes')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'ambientes' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}>
            <MapPin size={18} /> Ambientes (QR Code)
          </button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}>
            <History size={18} /> Baixas e Inservíveis
          </button>
        </nav>
        <div className="p-6 border-t border-blue-800">
          <button onClick={onExit} className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
            <ArrowLeft size={16} /> Voltar ao Hub
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ShieldCheck size={20} /></div>
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase">Inventário de Bens Móveis</h2>
              {locationFilter && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 uppercase">Local: {locationFilter}</span>
                  <button onClick={() => setLocationFilter(null)} className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase underline">Remover Filtro</button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 w-64"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Cadastrar Bem
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-6">

            {activeTab === 'ambientes' ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Gestão de Ambientes</h3>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">QR Codes vinculados à unidade física</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {uniqueLocations.map(loc => {
                    const itemsInLoc = assets.filter(a => a.location === loc);
                    const unserviceableInLoc = itemsInLoc.filter(a => a.condition === 'PÉSSIMO').length;

                    return (
                      <div key={loc} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-2xl transition-all group flex flex-col items-center">
                        <div className="p-4 bg-gray-50 rounded-[2.5rem] border border-gray-100 mb-6 group-hover:scale-105 transition-transform duration-300">
                          <QRCodeSVG
                            id={`qr-${loc}`}
                            value={`portal-gestao://patrimonio/local/${encodeURIComponent(loc)}`}
                            size={160}
                            level="H"
                            includeMargin={true}
                          />
                        </div>

                        <h4 className="text-xl font-black text-gray-900 uppercase mb-2 text-center leading-tight">{loc}</h4>
                        <div className="flex flex-wrap justify-center gap-3 mb-6">
                          <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-full uppercase border border-blue-100">
                            {itemsInLoc.length} Itens
                          </span>
                          {unserviceableInLoc > 0 && (
                            <span className="text-[10px] font-black bg-red-50 text-red-600 px-3 py-1 rounded-full uppercase border border-red-100 flex items-center gap-1">
                              <AlertTriangle size={10} /> {unserviceableInLoc} Inservíveis
                            </span>
                          )}
                        </div>

                        <div className="w-full grid grid-cols-1 gap-3">
                          <button
                            onClick={() => downloadQRCode(loc)}
                            className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg"
                          >
                            <Download size={14} /> Baixar Etiqueta QR
                          </button>
                          <button
                            onClick={() => { setLocationFilter(loc); setActiveTab('inventory'); }}
                            className="w-full py-4 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black uppercase border border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                          >
                            <Search size={14} /> Abrir Inventário
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                    {activeTab === 'inventory' ? 'Inventário de Bens Móveis Ativos' : 'Relatório de Itens Móveis Inservíveis'}
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-lg">{filteredAssets.length} Registros</span>
                  </h3>
                  <button onClick={() => handleExportPDF('inventory-list', activeTab === 'inventory' ? 'Inventario_Ativo' : 'Relatorio_Inserviveis')} className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-gray-50 transition-all">
                    <FileDown size={14} /> Exportar para PDF
                  </button>
                </div>

                <div id="inventory-list" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredAssets.filter(a => activeTab === 'inventory' ? !a.isUnserviceable : a.isUnserviceable).map(asset => {
                    const isPessimo = asset.condition === 'PÉSSIMO';
                    return (
                      <div key={asset.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-xl transition-all group flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100">
                              {asset.photo ? (
                                <img src={asset.photo} className="w-full h-full object-cover" alt="Bem" />
                              ) : (
                                <ImageIcon size={24} className="text-gray-300" />
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setShowHistoryModal(asset)} className="p-2 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all" title="Histórico"><History size={16} /></button>
                              <button onClick={() => deleteAsset(asset.id)} className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 rounded-lg transition-all" title="Excluir"><Trash2 size={16} /></button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-gray-900 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">PAT: {asset.heritageNumber}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getConditionColor(asset.condition)}`}>
                              {isPessimo ? 'INSERVÍVEL' : asset.condition}
                            </span>
                          </div>

                          <h4 className="font-black text-gray-900 uppercase tracking-tight text-sm leading-tight line-clamp-2">{asset.description}</h4>

                          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            <MapPin size={12} className="text-blue-500" /> {asset.location}
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(asset.timestamp).toLocaleDateString('pt-BR')}</span>
                          <button className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 hover:underline">Ficha Técnica <ChevronRight size={14} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL NOVO BEM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-8 bg-blue-50 border-b border-blue-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Monitor size={24} /></div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Novo Bem Móvel</h3>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">Cadastro de Patrimônio</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Evidência Fotográfica</label>
                    <div
                      onClick={() => document.getElementById('photo-input')?.click()}
                      className="aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-blue-300 transition-all group relative overflow-hidden"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <>
                          <div className="p-4 bg-white rounded-2xl text-gray-300 shadow-sm group-hover:text-blue-500 transition-colors"><Camera size={32} /></div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Carregar Foto</p>
                        </>
                      )}
                      <input id="photo-input" type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                      <textarea
                        required
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value.toUpperCase() })}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all h-24 resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ambiente</label>
                      <input
                        required
                        type="text"
                        list="locations-list"
                        value={form.location}
                        onChange={e => setForm({ ...form, location: e.target.value.toUpperCase() })}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all"
                      />
                      <datalist id="locations-list">
                        {uniqueLocations.map(l => <option key={l} value={l} />)}
                      </datalist>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nº Patrimônio</label>
                      <input
                        required
                        type="number"
                        value={form.heritageNumber}
                        onChange={e => setForm({ ...form, heritageNumber: e.target.value })}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-lg outline-none focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado de Conservação</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['EXCELENTE', 'BOM', 'REGULAR', 'PÉSSIMO'].map((cond) => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => setForm({ ...form, condition: cond as AssetCondition })}
                          className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${form.condition === cond
                            ? (cond === 'PÉSSIMO' ? 'bg-red-600 border-red-700 text-white' : 'bg-blue-600 border-blue-700 text-white')
                            : 'bg-gray-50 border-gray-100 text-gray-400'
                            }`}
                        >
                          {cond === 'PÉSSIMO' ? 'INSERVÍVEL' : cond}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.location && (
                    <div className="p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <QrCode className="text-gray-400" />
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase">QR Code Gerado</p>
                          <p className="text-xs font-bold uppercase">{form.location}</p>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                        <QRCodeSVG value={`patrimonio://local/${form.location}`} size={48} />
                      </div>
                    </div>
                  )}

                  {form.condition === 'PÉSSIMO' && (
                    <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 space-y-6 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center gap-3 text-red-600">
                        <AlertTriangle size={20} />
                        <h4 className="text-xs font-black uppercase tracking-widest">Laudo Automático de Inservibilidade</h4>
                      </div>
                      <div className="space-y-4">
                        <input
                          required
                          type="text"
                          placeholder="MOTIVO DA BAIXA"
                          value={unserviceableForm.reason}
                          onChange={e => setUnserviceableForm({ ...unserviceableForm, reason: e.target.value.toUpperCase() })}
                          className="w-full p-4 bg-white border border-red-100 rounded-xl text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-700 transition-all">Salvar no Inventário</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 bg-gray-100 text-gray-500 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AssetInventoryModule;
