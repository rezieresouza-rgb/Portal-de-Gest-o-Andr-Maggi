
import React, { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Printer,
  Download,
  X,
  Camera,
  User,
  Calendar,
  FileText,
  Send,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Mail,
  Phone,
  FileSearch,
  Loader2,
  Building2,
  PackageX,
  Scale,
  Gavel,
  ClipboardList,
  UserCheck,
  FileBadge
} from 'lucide-react';
import { SupplierOccurrence, OccurrenceType, OccurrenceStatus, Contract, Order } from '../types';
import { INITIAL_CONTRACTS } from '../constants/initialData';

const DIRECTOR_DATA = {
  name: "REZIERE DE SOUZA",
  cpf: "024.375.561-92"
};

const SupplierNotifications: React.FC = () => {
  const [activeView, setActiveView] = useState<'occurrences' | 'suppliers'>('occurrences');

  // Carrega ocorrências
  const [occurrences, setOccurrences] = useState<SupplierOccurrence[]>(() => {
    const saved = localStorage.getItem('merenda_supplier_occurrences_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);

  // PUXA DOS CONTRATOS (Fonte de verdade solicitada)
  const contracts: Contract[] = useMemo(() => {
    const saved = localStorage.getItem('merenda_contracts');
    return saved ? JSON.parse(saved) : INITIAL_CONTRACTS;
  }, []);

  // Consolida dados de fornecedores a partir dos contratos
  const suppliersFromContracts = useMemo(() => {
    const map = new Map();
    contracts.forEach(c => {
      if (!map.has(c.supplierId)) {
        map.set(c.supplierId, {
          id: c.supplierId,
          name: c.supplierName,
          category: c.type,
          contractNumbers: [c.number],
          totalItems: c.items.length,
          cnpj: '---', // Estes dados viriam do registro de fornecedores se cruzados
          email: 'escola.gestao@edu.mt.gov.br'
        });
      } else {
        const existing = map.get(c.supplierId);
        if (!existing.contractNumbers.includes(c.number)) {
          existing.contractNumbers.push(c.number);
          existing.totalItems += c.items.length;
        }
      }
    });
    return Array.from(map.values());
  }, [contracts]);

  const orders: Order[] = useMemo(() => {
    const saved = localStorage.getItem('merenda_order_history');
    return saved ? JSON.parse(saved) : [];
  }, []);

  const [form, setForm] = useState<Omit<SupplierOccurrence, 'id' | 'notificationSent'>>({
    supplierId: '',
    supplierName: '',
    type: 'PRODUTO_ESTRAGADO',
    status: 'PENDENTE',
    description: '',
    itemsAffected: [],
    issueDate: new Date().toISOString().split('T')[0],
    orderDate: new Date().toISOString().split('T')[0],
    deadlineDate: new Date().toISOString().split('T')[0],
    responsible: 'Gestor André',
    orderNumber: ''
  });

  useEffect(() => {
    localStorage.setItem('merenda_supplier_occurrences_v1', JSON.stringify(occurrences));
  }, [occurrences]);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierId || !form.description) return alert("Preencha os campos obrigatórios.");

    const supplier = suppliersFromContracts.find(s => s.id === form.supplierId);

    const newOcc: SupplierOccurrence = {
      id: `occ-${Date.now()}`,
      ...form,
      supplierName: supplier?.name || "Desconhecido",
      notificationSent: false
    };

    setOccurrences([newOcc, ...occurrences]);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      supplierId: '',
      supplierName: '',
      type: 'PRODUTO_ESTRAGADO',
      status: 'PENDENTE',
      description: '',
      itemsAffected: [],
      issueDate: new Date().toISOString().split('T')[0],
      orderDate: new Date().toISOString().split('T')[0],
      deadlineDate: new Date().toISOString().split('T')[0],
      responsible: 'Gestor André',
      orderNumber: ''
    });
    setImagePreview(null);
  };

  const generateOccurrencePDF = async (occ: SupplierOccurrence) => {
    setIsGeneratingPDF(occ.id);

    setTimeout(async () => {
      const element = document.getElementById(`notif-pdf-${occ.id}`);
      if (!element) {
        setIsGeneratingPDF(null);
        return alert("Erro ao localizar template do documento.");
      }

      try {
        const opt = {
          margin: 10,
          filename: `Notificacao_Extrajudicial_${occ.supplierName}_${occ.issueDate}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        // @ts-ignore
        await window.html2pdf().set(opt).from(element).save();

        setOccurrences(prev => prev.map(o => o.id === occ.id ? { ...o, notificationSent: true } : o));
      } catch (e) {
        console.error(e);
      } finally {
        setIsGeneratingPDF(null);
      }
    }, 300);
  };

  const updateStatus = (id: string, status: OccurrenceStatus) => {
    setOccurrences(prev => prev.map(o => o.id === id ? {
      ...o,
      status,
      resolutionDate: status === 'RESOLVIDO' ? new Date().toISOString().split('T')[0] : o.resolutionDate
    } : o));
  };

  const deleteOccurrence = (id: string) => {
    if (window.confirm("Deseja excluir este registro de ocorrência?")) {
      setOccurrences(prev => prev.filter(o => o.id !== id));
    }
  };

  const filteredOccurrences = useMemo(() => {
    return occurrences.filter(o =>
      o.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.type.includes(searchTerm.toUpperCase())
    );
  }, [occurrences, searchTerm]);

  const stats = useMemo(() => {
    return {
      pending: occurrences.filter(o => o.status === 'PENDENTE').length,
      resolved: occurrences.filter(o => o.status === 'RESOLVIDO').length,
      critical: occurrences.filter(o => o.type === 'PRODUTO_ESTRAGADO' && o.status === 'PENDENTE').length,
      logistic: occurrences.filter(o => o.type === 'NÃO_ENTREGA' && o.status === 'PENDENTE').length
    };
  }, [occurrences]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* DASHBOARD DE ALERTAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Notificações</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-gray-900">{occurrences.length}</p>
            <FileSearch size={24} className="text-gray-300" />
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Atenção Qualidade</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-red-700">{stats.critical}</p>
            <AlertTriangle size={24} className="text-red-500" />
          </div>
        </div>
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Atrasos/Faltas</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-amber-700">{stats.logistic}</p>
            <PackageX size={24} className="text-amber-500" />
          </div>
        </div>
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Resoluções</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-emerald-700">{stats.resolved}</p>
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
        </div>
      </div>

      {/* FERRAMENTAS DE GESTÃO E SWITCHER DE VISUALIZAÇÃO */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl shadow-lg">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">Fiscalização de Contratos</h3>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">Monitoramento Legal e Qualidade Alimentar PNAE</p>
            </div>
          </div>
          <div className="flex items-center gap-3 no-print">
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button
                onClick={() => setActiveView('occurrences')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeView === 'occurrences' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}
              >
                <ClipboardList size={14} /> Histórico de Falhas
              </button>
              <button
                onClick={() => setActiveView('suppliers')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeView === 'suppliers' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}
              >
                <Building2 size={14} /> Fornecedores do PNAE
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center border-t border-gray-50 pt-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input
              type="text"
              placeholder={activeView === 'occurrences' ? "Filtrar histórico por fornecedor ou falha..." : "Pesquisar fornecedor nos contratos..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
          </div>
          {activeView === 'occurrences' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2 shrink-0"
            >
              <Plus size={16} /> Nova Notificação
            </button>
          )}
        </div>
      </div>

      {activeView === 'occurrences' ? (
        /* LISTA DE OCORRÊNCIAS / LAUDOS */
        <div className="grid grid-cols-1 gap-4">
          {filteredOccurrences.length > 0 ? filteredOccurrences.map(occ => {
            return (
              <div key={occ.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:border-emerald-200 transition-all group flex flex-col lg:flex-row gap-8 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${occ.type === 'PRODUTO_ESTRAGADO' ? 'bg-red-500' : 'bg-amber-500'
                  }`}></div>

                <div className="w-24 h-24 rounded-3xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100 shadow-inner group-hover:scale-105 transition-transform">
                  {occ.photo ? (
                    <img src={occ.photo} alt="Evidência" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={32} className="text-gray-200" />
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">{occ.supplierName}</h4>
                        <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase border-2 ${occ.status === 'RESOLVIDO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100 animate-pulse'
                          }`}>{occ.status}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase mt-2">
                        <span className="flex items-center gap-1.5"><AlertCircle size={14} className={occ.type === 'PRODUTO_ESTRAGADO' ? 'text-red-500' : 'text-amber-500'} /> {occ.type.replace('_', ' ')}</span>
                        <span className="flex items-center gap-1.5"><Calendar size={14} /> Fato: {new Date(occ.issueDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {occ.status !== 'RESOLVIDO' && (
                        <button onClick={() => updateStatus(occ.id, 'RESOLVIDO')} className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm" title="Marcar como Resolvido"><CheckCircle2 size={20} /></button>
                      )}
                      <button onClick={() => deleteOccurrence(occ.id)} className="p-3 bg-gray-50 text-gray-300 hover:text-red-500 rounded-xl transition-all"><Trash2 size={20} /></button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed font-medium italic border-l-4 border-gray-100 pl-4 py-1">"{occ.description}"</p>

                  <div className="flex flex-wrap gap-2">
                    {occ.itemsAffected.map((item, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-50 text-[9px] font-black text-gray-500 rounded-lg border border-gray-100 uppercase tracking-widest">{item}</span>
                    ))}
                  </div>
                </div>

                <div className="lg:w-64 flex flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-8 no-print">
                  <button
                    onClick={() => generateOccurrencePDF(occ)}
                    disabled={isGeneratingPDF === occ.id}
                    className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${occ.notificationSent
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                  >
                    {isGeneratingPDF === occ.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Scale size={16} />
                    )}
                    {occ.notificationSent ? 'Reemitir Notificação' : 'Gerar Notificação Legal'}
                  </button>
                  <button className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                    <Mail size={16} /> Enviar Formalmente
                  </button>
                </div>

                {/* TEMPLATE DE NOTIFICAÇÃO EXTRAJUDICIAL */}
                <div className="hidden">
                  <div id={`notif-pdf-${occ.id}`} className="p-16 space-y-10 text-gray-900 font-sans border-[1px] border-gray-200 bg-white min-h-[297mm]">
                    <div className="text-center border-b-2 border-black pb-8 space-y-2">
                      <h1 className="text-lg font-black uppercase">NOTIFICAÇÃO POR IRREGULARIDADES NO FORNECIMENTO</h1>
                    </div>

                    <div className="text-sm space-y-4">
                      <p><strong>Assunto:</strong> Notificação Extrajudicial Nº {new Date().getFullYear()}/{occ.id.split('-')[1]} C/C Solicitação de Regularização Urgente e Abertura de Processo Administrativo Sancionador</p>

                      <div className="space-y-1">
                        <p><strong>Prezada Empresa:</strong> {occ.supplierName}</p>
                        <p><strong>Recurso:</strong> Alimentação Escolar (PNAE)</p>
                      </div>

                      <p className="text-justify leading-relaxed">
                        Pelo presente instrumento, a Unidade Escolar, representada neste ato por seu gestor, vem apresentar <strong>NOTIFICAÇÃO EXTRAJUDICIAL</strong> em face de Vossa Senhoria, acerca do <strong>NÃO CUMPRIMENTO DAS OBRIGAÇÕES CONTRATUAIS</strong>, conforme detalhado a seguir:
                      </p>

                      <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                        <p><strong>1. Infração Específica:</strong> Ocorrência de {occ.type.replace('_', ' ')} dos gêneros alimentícios, referente ao pedido nº {occ.orderNumber || '---'} formulado em {new Date(occ.orderDate || '').toLocaleDateString('pt-BR')}, com data limite para entrega em {new Date(occ.deadlineDate || '').toLocaleDateString('pt-BR')}.</p>

                        <div className="space-y-2">
                          <p><strong>2. Cláusulas Violadas:</strong></p>
                          <p className="text-xs italic text-gray-700">"Tal falha configura o descumprimento da Cláusula Quinta do Contrato, em especial no que concerne à obrigação de entregar os produtos em no máximo 05 (cinco) dias, devidamente embalados, identificados e acompanhados da Nota Fiscal."</p>
                          <p className="text-xs text-gray-700">A conduta viola o <strong>Art. 7º, § 1º da Instrução Normativa nº 009/2024/GS/SEDUC/MT</strong> e as obrigações de fornecimento previstas na <strong>Instrução Normativa nº 011/2024/GS/SEDUC/MT</strong>.</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p><strong>3. Sanções Aplicáveis (Lei 14.133/2021):</strong> O descumprimento contratual sujeita a Contratada às penalidades de:</p>
                        <ul className="list-disc pl-10 text-xs space-y-1">
                          <li>Advertência;</li>
                          <li>Multa (conforme item 13.6 do contrato);</li>
                          <li>Suspensão Temporária de participar em licitações;</li>
                          <li>Declaração de Inidoneidade;</li>
                          <li>Rescisão Contratual (conforme Cláusula 13.8).</li>
                        </ul>
                      </div>

                      <div className="p-6 bg-gray-50 border-2 border-black rounded-xl space-y-4">
                        <h4 className="font-black uppercase text-xs text-center">Solicitação de Regularização Imediata</h4>
                        <p className="text-xs text-justify">
                          Viemos solicitar a imediata regularização da entrega e o estrito cumprimento das obrigações, devendo ocorrer no prazo de: <strong>02 (dois) dias úteis para produtos perecíveis</strong> e <strong>05 (cinco) dias úteis para produtos não perecíveis</strong>. Fica Vossa Senhoria <strong>NOTIFICADA</strong> para apresentar defesa prévia no prazo de 05 (cinco) dias úteis.
                        </p>
                      </div>
                    </div>

                    <div className="pt-24 grid grid-cols-1 gap-20 text-center">
                      <div className="text-center space-y-2">
                        <p className="text-sm font-bold">Colíder/MT, {new Date().toLocaleDateString('pt-BR')}</p>
                        <div className="pt-10 border-t border-black max-w-sm mx-auto">
                          <p className="text-xs font-black uppercase">{DIRECTOR_DATA.name}</p>
                          <p className="text-[9px] uppercase text-gray-500 font-bold">DIRETOR / PRESIDENTE DO CDCE</p>
                          <p className="text-[8px] text-gray-400">CPF: {DIRECTOR_DATA.cpf}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-10 flex items-center justify-center gap-2 opacity-40">
                      <ShieldCheck size={16} />
                      <p className="text-[8px] font-black uppercase tracking-[0.3em]">Documento Gerado pelo Portal Gestão André Maggi - Auditoria SEDUC-MT</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          }) : (
            <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
              <PackageX size={64} className="mx-auto mb-4 text-emerald-100" />
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhuma irregularidade registrada no período</p>
            </div>
          )}
        </div>
      ) : (
        /* VISUALIZAÇÃO DE DIRETÓRIO DE FORNECEDORES (Puxando dos Contratos) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {suppliersFromContracts.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(supplier => {
            const supplierOccurrences = occurrences.filter(o => o.supplierId === supplier.id);
            const pendingOccurrences = supplierOccurrences.filter(o => o.status === 'PENDENTE');

            return (
              <div key={supplier.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:border-emerald-200 hover:shadow-xl transition-all flex flex-col justify-between group h-full">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-[1.5rem] ${supplier.category.includes('Agricultura') ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                      <Building2 size={24} />
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Contratos Ativos</p>
                      <p className="text-xl font-black text-gray-900">{supplier.contractNumbers.length}</p>
                    </div>
                  </div>

                  <h4 className="text-lg font-black text-gray-900 uppercase leading-tight">{supplier.name}</h4>

                  <div className="mt-4 space-y-2">
                    {supplier.contractNumbers.map(cn => (
                      <div key={cn} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 w-fit">
                        <FileBadge size={12} /> CT {cn}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-6 border-t border-gray-50 pt-4">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase">Itens em Atendimento</p>
                      <p className="text-sm font-black text-gray-700">{supplier.totalItems} Produtos</p>
                    </div>
                    <div className="text-right flex-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase">Histórico Falhas</p>
                      <p className={`text-sm font-black ${supplierOccurrences.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {supplierOccurrences.length} Registros
                      </p>
                    </div>
                  </div>

                  {pendingOccurrences.length > 0 && (
                    <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                      <AlertCircle size={20} className="text-red-500 animate-pulse" />
                      <div>
                        <p className="text-[9px] font-black text-red-600 uppercase leading-none">Atenção Crítica</p>
                        <p className="text-[10px] font-bold text-red-700 uppercase mt-1">{pendingOccurrences.length} Notificações Pendentes</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-6">
                  <button
                    onClick={() => {
                      setForm(prev => ({ ...prev, supplierId: supplier.id, supplierName: supplier.name }));
                      setIsModalOpen(true);
                    }}
                    className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Notificar Falha
                  </button>
                  <button className="p-3 bg-gray-50 text-gray-400 hover:text-emerald-600 rounded-xl transition-all">
                    <History size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CADASTRO DE OCORRÊNCIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-8 bg-red-50 flex justify-between items-center border-b border-red-100 shrink-0">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-red-600 text-white rounded-3xl shadow-xl shadow-red-600/20">
                  <Gavel size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Processo Administrativo</h3>
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mt-1">Notificação de Inexecução ou Falha Qualitativa</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl shadow-sm transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fornecedor / Contratado</label>
                    <select
                      required
                      value={form.supplierId}
                      onChange={e => {
                        const selected = suppliersFromContracts.find(s => s.id === e.target.value);
                        setForm({ ...form, supplierId: e.target.value, supplierName: selected?.name || '' });
                      }}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all"
                    >
                      <option value="">Selecione o fornecedor...</option>
                      {suppliersFromContracts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Irregularidade</label>
                    <select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value as any })}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all"
                    >
                      <option value="PRODUTO_ESTRAGADO">Produto Estragado/Impróprio (Qualidade)</option>
                      <option value="NÃO_ENTREGA">Não Entrega de Produtos (Logística)</option>
                      <option value="FORA_DO_PADRÃO">Fora do Padrão/Especificação do CT</option>
                      <option value="ENTREGA_PARCIAL">Entrega Parcial/Quantitativo Insuficiente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vincular Ordem de Pedido</label>
                    <select
                      value={form.orderNumber}
                      onChange={e => setForm({ ...form, orderNumber: e.target.value })}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all"
                    >
                      <option value="">Opcional: Selecione o pedido...</option>
                      {orders.map(o => <option key={o.id} value={o.orderNumber}>Pedido #{o.orderNumber} ({o.supplierName})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data da Ocorrência (Fato)</label>
                    <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data do Pedido (OF)</label>
                    <input type="date" value={form.orderDate} onChange={e => setForm({ ...form, orderDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-1">Data Limite p/ Entrega</label>
                    <input type="date" value={form.deadlineDate} onChange={e => setForm({ ...form, deadlineDate: e.target.value })} className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl font-bold text-sm outline-none" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição Circunstanciada do Fato</label>
                    <textarea
                      required
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Ex: No momento da entrega, verificou-se que o lote de FRANGO apresentava odor forte e coloração amarelada..."
                      className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2.5rem] font-medium text-sm h-32 resize-none outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Evidência Fotográfica do Lote</label>
                    <div
                      onClick={() => document.getElementById('occ-photo')?.click()}
                      className="w-full h-32 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-red-300 transition-all relative overflow-hidden"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <>
                          <Camera size={32} className="text-gray-300" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Clique para Anexar Foto</p>
                        </>
                      )}
                      <input id="occ-photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Itens afetados (Separe por vírgula)</label>
                  <input
                    type="text"
                    placeholder="Ex: FRANGO, COUVE, BANANA"
                    onChange={e => setForm({ ...form, itemsAffected: e.target.value.split(',').map(s => s.trim().toUpperCase()) })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all"
                  />
                </div>

                <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-3">
                  <ShieldAlert size={24} /> Efetivar Registro e Notificar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierNotifications;
