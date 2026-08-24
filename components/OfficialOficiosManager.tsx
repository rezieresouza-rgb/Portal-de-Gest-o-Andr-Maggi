import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { generateOficioBodyWithAI } from '../geminiService';
import { 
  FileText, Plus, Search, Printer, Trash2, Building2, Calendar, User, Check, 
  Sparkles, Layers, Eye, X, Shield, BookOpen, Landmark, Filter, ArrowRight, Clock, Wand2
} from 'lucide-react';

export interface SchoolOficio {
  id: string;
  number: number;
  year: number;
  formatted_number: string;
  module_source: 'SECRETARIA' | 'COORDENACAO' | 'CIVICO_MILITAR';
  title_subject: string;
  recipient_name: string;
  recipient_role?: string;
  recipient_org?: string;
  city_date: string;
  salutation: string;
  body_text: string;
  closure_text: string;
  signatory_name: string;
  signatory_role: string;
  created_at: string;
}

interface OfficialOficiosManagerProps {
  moduleSource: 'SECRETARIA' | 'COORDENACAO' | 'CIVICO_MILITAR';
  user?: any;
}

const LOCAL_STORAGE_KEY = 'portal_school_oficios_v1';
const STARTING_SEQUENCE = 23; // Sequence starts at 23 as per official directive

const MODULE_LABELS: Record<'SECRETARIA' | 'COORDENACAO' | 'CIVICO_MILITAR', { label: string, badgeColor: string, icon: any }> = {
  SECRETARIA: { label: 'Secretaria Escolar', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Landmark },
  COORDENACAO: { label: 'Coordenação Pedagógica', badgeColor: 'bg-purple-100 text-purple-800 border-purple-200', icon: BookOpen },
  CIVICO_MILITAR: { label: 'Cívico-Militar', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Shield }
};

const TEMPLATES = [
  {
    id: 'solicitacao_geral',
    title: 'Solicitação Geral de Serviços / Infraestrutura',
    subject: 'Solicitação de Reparos e Manutenção Predial',
    salutation: 'Prezado(a) Senhor(a),',
    body: 'Vimos por meio deste solicitar a realização de reparos e manutenção técnica nas dependências desta Unidade Escolar, visando garantir a segurança, integridade física e o adequado desenvolvimento das atividades letivas com a nossa comunidade escolar.\n\nContamos com a presteza de vossas providências e renovamos nossos protestos de elevada estima e consideração.',
    closure: 'Atenciosamente,'
  },
  {
    id: 'convocacao_pais',
    title: 'Convocação de Pais / Responsável Legal',
    subject: 'Convocação para Reunião Presencial com a Gestão Escolar',
    salutation: 'Prezado(a) Responsável,',
    body: 'Solicitamos o seu comparecimento a esta Unidade Escolar para tratarmos de assuntos pertinentes ao acompanhamento pedagógico e comportamental do(a) estudante matriculado(a) nesta instituição.\n\nPedimos a gentileza de comparecer munido de documento de identificação oficial com foto para atendimento junto à equipe gestora.',
    closure: 'Atenciosamente,'
  },
  {
    id: 'notificacao_conselho',
    title: 'Notificação ao Conselho Tutelar (Infrequência / Evasão)',
    subject: 'Notificação de Infrequência Escolar e Risco de Evasão',
    salutation: 'Ilustríssimos(as) Senhores(as) Conselheiros(as),',
    body: 'Encaminhamos a Vossas Senhorias o relatório de acompanhamento de frequência escolar do(a) estudante citado(a), tendo em vista o esgotamento dos recursos escolares e tentativas de contato direto com a família.\n\nSolicitamos a intervenção deste ilustre Conselho Tutelar para a garantia dos direitos fundamentais da criança e do adolescente e o imediato retorno do estudante à sala de aula.',
    closure: 'Respeitosamente,'
  },
  {
    id: 'comunicacao_dre',
    title: 'Encaminhamento à DRE / SEDUC-MT',
    subject: 'Encaminhamento de Documentação e Relatórios Oficiais',
    salutation: 'Excelentíssimo(a) Senhor(a) Diretor(a) Regional,',
    body: 'Cumprimentando-o(a) cordialmente, vimos apresentar a Vossa Excelência os relatórios e documentações anexas referentes às demandas administrativas e pedagógicas da Escola Estadual Cívico-Militar André Antônio Maggi.\n\nColocamo-nos à inteira disposição para prestar quaisquer esclarecimentos complementares que se façam necessários.',
    closure: 'Respeitosamente,'
  }
];

const OfficialOficiosManager: React.FC<OfficialOficiosManagerProps> = ({ moduleSource, user }) => {
  const [oficios, setOficios] = useState<SchoolOficio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [printingOficio, setPrintingOficio] = useState<SchoolOficio | null>(null);
  const [customSequenceNumber, setCustomSequenceNumber] = useState<string>('');

  // Form fields
  const [formData, setFormData] = useState({
    title_subject: '',
    recipient_name: '',
    recipient_role: '',
    recipient_org: '',
    city_date: `Colíder - MT, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    salutation: 'Prezado(a) Senhor(a),',
    body_text: '',
    closure_text: 'Atenciosamente,',
    signatory_name: user?.name || (moduleSource === 'SECRETARIA' ? 'Secretaria Escolar' : moduleSource === 'COORDENACAO' ? 'Coordenação Pedagógica' : 'Gestão Cívico-Militar'),
    signatory_role: moduleSource === 'SECRETARIA' ? 'Secretário(a) Escolar' : moduleSource === 'COORDENACAO' ? 'Coordenador(a) Pedagógico(a)' : 'Gestor Cívico-Militar'
  });

  // AI Redaction Assistant States
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiPromptInput, setAiPromptInput] = useState<string>('');
  const [aiTone, setAiTone] = useState<'SOLICITACAO' | 'CONVOCACAO' | 'NOTIFICACAO' | 'INFORMATIVO' | 'ENCAMINHAMENTO'>('SOLICITACAO');

  const handleGenerateAI = async () => {
    if (!aiPromptInput.trim() && !formData.body_text.trim()) {
      alert('Por favor, informe a ideia principal do ofício no campo de IA!');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const generatedText = await generateOficioBodyWithAI({
        promptText: aiPromptInput.trim() || formData.body_text.trim(),
        subject: formData.title_subject,
        recipient: `${formData.recipient_name} ${formData.recipient_org ? `- ${formData.recipient_org}` : ''}`,
        tone: aiTone
      });

      if (generatedText) {
        setFormData(prev => ({
          ...prev,
          body_text: generatedText
        }));
      }
    } catch (e) {
      console.error('Erro ao gerar redação por IA:', e);
      alert('Erro ao comunicar com a IA. Tente novamente.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Calculate next global sequential number for the current year (starts at 23)
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const nextSequenceInfo = useMemo(() => {
    const oficiosThisYear = oficios.filter(o => o.year === currentYear);
    const maxNum = oficiosThisYear.reduce((max, o) => Math.max(max, o.number || 0), 0);
    const nextNum = maxNum >= STARTING_SEQUENCE ? maxNum + 1 : STARTING_SEQUENCE;
    const formatted = `${String(nextNum).padStart(3, '0')}/${currentYear}/EECAAMCOL/SEDUC/MT`;
    return { number: nextNum, formatted };
  }, [oficios, currentYear]);

  // Sync customSequenceNumber when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setCustomSequenceNumber(String(nextSequenceInfo.number));
    }
  }, [isModalOpen, nextSequenceInfo.number]);

  // Load oficios from Supabase with resilient localStorage & dual-table cloud sync
  const loadOficios = async () => {
    setLoading(true);
    let localOficios: SchoolOficio[] = [];
    let dbOficios: SchoolOficio[] = [];

    // 1. Read from localStorage first so no local ofício is EVER lost
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        localOficios = JSON.parse(local);
      }
    } catch (e) {
      console.warn('Erro ao carregar ofícios locais:', e);
    }

    // 2. Fetch from Supabase (primary table school_oficios, with automatic fallback to civic_documents)
    try {
      const { data: primaryData, error: primaryErr } = await supabase
        .from('school_oficios')
        .select('*')
        .order('year', { ascending: false })
        .order('number', { ascending: false });

      if (!primaryErr && primaryData && primaryData.length > 0) {
        dbOficios = primaryData as SchoolOficio[];
      } else {
        // Fallback: Query civic_documents table (active on Supabase for cross-device/login sync!)
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('civic_documents')
          .select('*')
          .eq('template', 'official_oficio');

        if (!fallbackErr && fallbackData && fallbackData.length > 0) {
          dbOficios = fallbackData.map((d: any) => ({
            id: d.id,
            number: d.content?.number || 0,
            year: d.content?.year || new Date().getFullYear(),
            formatted_number: d.content?.formatted_number || d.student_name,
            module_source: d.content?.module_source || d.student_class || 'SECRETARIA',
            title_subject: d.content?.title_subject || '',
            recipient_name: d.content?.recipient_name || '',
            recipient_role: d.content?.recipient_role || '',
            recipient_org: d.content?.recipient_org || '',
            city_date: d.content?.city_date || '',
            salutation: d.content?.salutation || '',
            body_text: d.content?.body_text || '',
            closure_text: d.content?.closure_text || '',
            signatory_name: d.content?.signatory_name || '',
            signatory_role: d.content?.signatory_role || '',
            created_at: d.date || new Date().toISOString()
          }));
        }
      }
    } catch (e) {
      console.warn('Erro ao conectar com Supabase para ofícios:', e);
    }

    // 3. Merge Local + DB by ID so no ofício is ever lost
    const map = new Map<string, SchoolOficio>();
    localOficios.forEach(o => map.set(o.id, o));
    dbOficios.forEach(o => map.set(o.id, o));

    const mergedList = Array.from(map.values()).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return (b.number || 0) - (a.number || 0);
    });

    setOficios(mergedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedList));

    // 4. Background sync: Push local-only oficios to Supabase (both tables)
    if (mergedList.length > 0) {
      const dbIds = new Set(dbOficios.map(d => d.id));
      const missingInDb = mergedList.filter(l => !dbIds.has(l.id));

      if (missingInDb.length > 0) {
        for (const oficio of missingInDb) {
          try {
            // Try primary insert
            const { error } = await supabase.from('school_oficios').insert([oficio]);
            if (error) {
              // Sync to active fallback table so other logins/devices see it instantly!
              await supabase.from('civic_documents').upsert([{
                id: oficio.id,
                template: 'official_oficio',
                date: oficio.created_at,
                timestamp: Date.now(),
                student_name: oficio.formatted_number,
                student_class: oficio.module_source,
                content: oficio
              }], { onConflict: 'id' });
            }
          } catch (err) {}
        }
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadOficios();
  }, []);

  const handleApplyTemplate = (templateId: string) => {
    const tmpl = TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setFormData(prev => ({
        ...prev,
        title_subject: tmpl.subject,
        salutation: tmpl.salutation,
        body_text: tmpl.body,
        closure_text: tmpl.closure
      }));
    }
  };

  const handleSaveOficio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title_subject.trim() || !formData.recipient_name.trim() || !formData.body_text.trim()) {
      alert('Por favor, preencha o assunto, o destinatário e o texto do ofício!');
      return;
    }

    const seqNum = customSequenceNumber ? parseInt(customSequenceNumber) || nextSequenceInfo.number : nextSequenceInfo.number;
    const formattedNum = `${String(seqNum).padStart(3, '0')}/${currentYear}/EECAAMCOL/SEDUC/MT`;

    const newOficio: SchoolOficio = {
      id: crypto.randomUUID(),
      number: seqNum,
      year: currentYear,
      formatted_number: formattedNum,
      module_source: moduleSource,
      title_subject: formData.title_subject.trim(),
      recipient_name: formData.recipient_name.trim(),
      recipient_role: formData.recipient_role.trim(),
      recipient_org: formData.recipient_org.trim(),
      city_date: formData.city_date.trim(),
      salutation: formData.salutation.trim() || 'Prezado(a) Senhor(a),',
      body_text: formData.body_text.trim(),
      closure_text: formData.closure_text.trim() || 'Atenciosamente,',
      signatory_name: formData.signatory_name.trim() || 'Gestão Escolar',
      signatory_role: formData.signatory_role.trim() || 'Responsável',
      created_at: new Date().toISOString()
    };

    // Update local state and localStorage immediately
    const updatedList = [newOficio, ...oficios];
    setOficios(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

    // Persist to Supabase in background (dual sync to ensure ALL logins/devices see it instantly!)
    try {
      const { error: primaryErr } = await supabase.from('school_oficios').insert([{
        id: newOficio.id,
        number: newOficio.number,
        year: newOficio.year,
        formatted_number: newOficio.formatted_number,
        module_source: newOficio.module_source,
        title_subject: newOficio.title_subject,
        recipient_name: newOficio.recipient_name,
        recipient_role: newOficio.recipient_role,
        recipient_org: newOficio.recipient_org,
        city_date: newOficio.city_date,
        salutation: newOficio.salutation,
        body_text: newOficio.body_text,
        closure_text: newOficio.closure_text,
        signatory_name: newOficio.signatory_name,
        signatory_role: newOficio.signatory_role,
        created_at: newOficio.created_at
      }]);

      // Always also save to active civic_documents table as secondary cloud sync
      await supabase.from('civic_documents').upsert([{
        id: newOficio.id,
        template: 'official_oficio',
        date: newOficio.created_at,
        timestamp: Date.now(),
        student_name: newOficio.formatted_number,
        student_class: newOficio.module_source,
        content: newOficio
      }], { onConflict: 'id' });

    } catch (e) {
      console.warn('Persistindo em localStorage e nuvem:', e);
    }

    setIsModalOpen(false);
    alert(`OFÍCIO Nº ${newOficio.formatted_number} gerado com sucesso!`);
  };

  const handleDeleteOficio = async (oficio: SchoolOficio) => {
    const confirmDel = window.confirm(`Tem certeza que deseja excluir permanentemente o OFÍCIO Nº ${oficio.formatted_number}?`);
    if (!confirmDel) return;

    const updatedList = oficios.filter(o => o.id !== oficio.id);
    setOficios(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

    try {
      await supabase.from('school_oficios').delete().eq('id', oficio.id);
      await supabase.from('civic_documents').delete().eq('id', oficio.id);
    } catch (e) {
      console.error('Erro ao excluir no Supabase:', e);
    }
  };

  const handlePrintOficio = (oficio: SchoolOficio) => {
    setPrintingOficio(oficio);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Filtered list
  const filteredOficios = useMemo(() => {
    return oficios.filter(o => {
      const matchModule = moduleFilter === 'ALL' || o.module_source === moduleFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term ||
        o.formatted_number.toLowerCase().includes(term) ||
        o.title_subject.toLowerCase().includes(term) ||
        o.recipient_name.toLowerCase().includes(term) ||
        (o.recipient_org && o.recipient_org.toLowerCase().includes(term));
      return matchModule && matchSearch;
    });
  }, [oficios, moduleFilter, searchTerm]);

  const CurrentModuleInfo = MODULE_LABELS[moduleSource];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Quick Action */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
            <FileText size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Emissão de Ofícios Escolares</h2>
              <span className={`px-3 py-1 text-[9px] font-black rounded-full border uppercase ${CurrentModuleInfo.badgeColor}`}>
                {CurrentModuleInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Contagem e registro sequencial unificado entre Secretaria, Coordenação e Cívico-Militar.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-100 px-4 py-2.5 rounded-2xl border border-slate-200 text-center flex-1 md:flex-initial">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Próximo Sequencial</span>
            <span className="text-xs font-black text-indigo-700 font-mono">OFÍCIO Nº {nextSequenceInfo.formatted}</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 flex-1 md:flex-initial"
          >
            <Plus size={18} /> Novo Ofício
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center print:hidden">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por número, assunto ou destinatário..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden md:inline">Filtrar Origem:</span>
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black uppercase text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">Todos os Módulos ({oficios.length})</option>
            <option value="SECRETARIA">Secretaria Escolar</option>
            <option value="COORDENACAO">Coordenação Pedagógica</option>
            <option value="CIVICO_MILITAR">Cívico-Militar</option>
          </select>
        </div>
      </div>

      {/* List / Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px] print:hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-indigo-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredOficios.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400 text-center">
            <FileText size={48} className="mb-4 text-slate-200" />
            <h3 className="text-sm font-black uppercase text-slate-700 tracking-wider">Nenhum Ofício Registrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Utilize o botão "Novo Ofício" acima para gerar e emitir o primeiro documento oficial a partir de <strong className="text-indigo-600 font-mono">OFÍCIO Nº 023/{currentYear}/EECAAMCOL/SEDUC/MT</strong>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-6">Nº do Ofício</th>
                  <th className="p-4">Módulo Emissor</th>
                  <th className="p-4">Assunto / Título</th>
                  <th className="p-4">Destinatário</th>
                  <th className="p-4">Data de Emissão</th>
                  <th className="p-4 pr-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOficios.map((oficio) => {
                  const moduleMeta = MODULE_LABELS[oficio.module_source] || MODULE_LABELS.SECRETARIA;
                  const ModuleIcon = moduleMeta.icon;

                  return (
                    <tr key={oficio.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 pl-6 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 block max-w-max">
                          OFÍCIO Nº {oficio.formatted_number}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border uppercase inline-flex items-center gap-1.5 ${moduleMeta.badgeColor}`}>
                          <ModuleIcon size={12} /> {moduleMeta.label}
                        </span>
                      </td>

                      <td className="p-4">
                        <p className="text-xs font-black text-slate-900 uppercase leading-snug line-clamp-1">{oficio.title_subject}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 truncate max-w-xs">{oficio.salutation}</p>
                      </td>

                      <td className="p-4">
                        <p className="text-xs font-bold text-slate-800 uppercase">{oficio.recipient_name}</p>
                        {(oficio.recipient_role || oficio.recipient_org) && (
                          <p className="text-[9px] font-semibold text-slate-400 uppercase truncate max-w-xs">
                            {oficio.recipient_role} {oficio.recipient_org ? `• ${oficio.recipient_org}` : ''}
                          </p>
                        )}
                      </td>

                      <td className="p-4 whitespace-nowrap text-xs font-bold text-slate-500">
                        {new Date(oficio.created_at).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="p-4 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePrintOficio(oficio)}
                            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                            title="Imprimir Ofício A4"
                          >
                            <Printer size={14} /> Imprimir (PDF)
                          </button>
                          <button
                            onClick={() => handleDeleteOficio(oficio)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Excluir Registro"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* MODAL DE NOVO OFÍCIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <FileText size={24} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Novo Documento Oficial</span>
                  <h3 className="text-base font-black uppercase tracking-tight font-mono">
                    OFÍCIO Nº {customSequenceNumber ? String(customSequenceNumber).padStart(3, '0') : String(nextSequenceInfo.number).padStart(3, '0')}/{currentYear}/EECAAMCOL/SEDUC/MT
                  </h3>
                </div>
              </div>

              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveOficio} className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {/* Manual Sequence Number Override Bar */}
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[9px] font-black text-indigo-900 uppercase tracking-widest block">Número Sequencial de Emissão</span>
                  <p className="text-xs font-semibold text-slate-600">Altere o número se precisar ajustar a sequência manual.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-900 font-mono">Nº</span>
                  <input
                    type="number"
                    min="1"
                    value={customSequenceNumber}
                    onChange={e => setCustomSequenceNumber(e.target.value)}
                    className="w-24 p-2 bg-white border border-indigo-200 rounded-xl text-center font-mono font-black text-sm text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <span className="text-xs font-mono font-bold text-slate-500">/{currentYear}</span>
                </div>
              </div>

              {/* Templates Quick Select */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> Modelos Rápidos de Texto (Opcional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleApplyTemplate(t.id)}
                      className="p-3 text-left bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl transition-all group"
                    >
                      <p className="text-xs font-black text-slate-800 uppercase group-hover:text-indigo-600">{t.title}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase truncate mt-0.5">{t.subject}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Assunto do Ofício *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Solicitação de Manutenção na Quadra de Esportes"
                    value={formData.title_subject}
                    onChange={e => setFormData({ ...formData, title_subject: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Nome do Destinatário *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva / Conselho Tutelar"
                    value={formData.recipient_name}
                    onChange={e => setFormData({ ...formData, recipient_name: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Cargo / Função do Destinatário
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Secretário Municipal de Obras"
                    value={formData.recipient_role}
                    onChange={e => setFormData({ ...formData, recipient_role: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Órgão / Empresa / Instituição
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Prefeitura Municipal de Colíder"
                    value={formData.recipient_org}
                    onChange={e => setFormData({ ...formData, recipient_org: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Cidade e Data
                  </label>
                  <input
                    type="text"
                    value={formData.city_date}
                    onChange={e => setFormData({ ...formData, city_date: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Vocativo Inicial
                  </label>
                  <input
                    type="text"
                    value={formData.salutation}
                    onChange={e => setFormData({ ...formData, salutation: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Fecho de Cortesia
                  </label>
                  <input
                    type="text"
                    value={formData.closure_text}
                    onChange={e => setFormData({ ...formData, closure_text: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* ASSISTENTE DE REDAÇÃO DE OFÍCIOS POR IA */}
              <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-5 rounded-3xl border border-indigo-500/20 text-white space-y-3 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30 shrink-0">
                      <Sparkles size={18} className="text-amber-400 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-200 flex items-center gap-2">
                        Redação Inteligente por IA <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">SEDUC-MT IA</span>
                      </h4>
                      <p className="text-[10px] text-slate-300 font-medium">Digite o resumo da solicitação e a IA redige o texto formal completo no padrão oficial.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <select
                      value={aiTone}
                      onChange={e => setAiTone(e.target.value as any)}
                      className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase text-indigo-200 outline-none focus:bg-slate-900"
                    >
                      <option value="SOLICITACAO" className="bg-slate-900 text-white">Tom: Solicitação</option>
                      <option value="CONVOCACAO" className="bg-slate-900 text-white">Tom: Convocação</option>
                      <option value="NOTIFICACAO" className="bg-slate-900 text-white">Tom: Notificação</option>
                      <option value="ENCAMINHAMENTO" className="bg-slate-900 text-white">Tom: Encaminhamento</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Ex: solicitar reparo no telhado da quadra devido às fortes chuvas da semana"
                    value={aiPromptInput}
                    onChange={e => setAiPromptInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleGenerateAI(); } }}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-xs text-white placeholder-slate-400 outline-none focus:bg-white/20 focus:border-indigo-400 transition-all font-medium"
                  />

                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI || (!aiPromptInput.trim() && !formData.body_text.trim())}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap shrink-0 active:scale-95"
                  >
                    {isGeneratingAI ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Redigindo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Redigir com IA
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    Corpo do Texto do Ofício *
                  </label>
                  {formData.body_text.trim() && (
                    <button
                      type="button"
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI}
                      className="text-[9px] font-black text-indigo-600 hover:underline uppercase flex items-center gap-1"
                    >
                      <Wand2 size={12} /> Refinar Texto Atual com IA
                    </button>
                  )}
                </div>
                <textarea
                  required
                  rows={6}
                  value={formData.body_text}
                  onChange={e => setFormData({ ...formData, body_text: e.target.value })}
                  placeholder="Escreva a mensagem oficial aqui ou utilize o assistente de IA acima..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 leading-relaxed"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Nome do Emissor / Assinante *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.signatory_name}
                    onChange={e => setFormData({ ...formData, signatory_name: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Cargo / Função do Assinante *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.signatory_role}
                    onChange={e => setFormData({ ...formData, signatory_role: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-2xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-600/20"
                >
                  Gerar e Salvar Ofício
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ÁREA DE IMPRESSÃO DO OFÍCIO (PDF / A4) */}
      {printingOficio && (
        <div className="print-oficio-area">
          <div className="pdf-page p-12" style={{ fontFamily: 'Times New Roman, Georgia, serif', color: '#000000' }}>
            
            {/* Cabeçalho Oficial com Logo Cívico-Militar e Brasão MT do Mesmo Tamanho */}
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-8">
              <img 
                src="/logo-escola-oficial.png" 
                alt="Escola Cívico-Militar" 
                className="h-28 w-auto object-contain shrink-0 max-h-[112px]" 
                onError={(e) => (e.currentTarget.src = '/logo-escola.png')} 
              />
              <div className="text-center flex-1 mx-3 space-y-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
                <h1 className="text-xs font-bold uppercase text-black leading-tight">Governo do Estado de Mato Grosso</h1>
                <h2 className="text-[11px] font-bold uppercase text-black leading-tight">Secretaria de Estado de Educação</h2>
                <h3 className="text-[11px] font-bold uppercase text-black leading-tight">Secretaria Adjunta de Gestão Regional</h3>
                <h4 className="text-[10px] font-bold uppercase text-black leading-tight">Superintendência de Gestão das Diretorias Regionais</h4>
                <h5 className="text-[10px] font-bold uppercase text-black leading-tight">Diretoria Regional de Educação de Sinop</h5>
                <h6 className="text-xs font-black uppercase text-black leading-tight pt-0.5">Escola Estadual Cívico-Militar André Antônio Maggi</h6>
              </div>
              <img 
                src="/brasao_mt.png" 
                alt="Brasão do Estado de Mato Grosso" 
                className="h-28 w-auto object-contain shrink-0 max-h-[112px]" 
                onError={(e) => (e.currentTarget.src = '/SEDUC 2.jpg')} 
              />
            </div>

            {/* Número do Ofício Formatado (Alinhado à ESQUERDA conforme pedido) */}
            <div className="text-left mb-6">
              <p className="text-sm font-bold uppercase font-mono text-black">
                OFÍCIO Nº {printingOficio.formatted_number}
              </p>
            </div>

            {/* Cidade e Data (Alinhado à Direita) */}
            <div className="text-right mb-8 text-sm text-black">
              <p>{printingOficio.city_date}</p>
            </div>

            {/* Dados do Destinatário */}
            <div className="mb-8 text-sm space-y-1 text-black font-normal">
              <p className="font-bold">Ao(À) Senhor(a):</p>
              <p className="uppercase text-base font-normal">{printingOficio.recipient_name}</p>
              {printingOficio.recipient_role && <p className="uppercase font-normal">{printingOficio.recipient_role}</p>}
              {printingOficio.recipient_org && <p className="uppercase font-normal">{printingOficio.recipient_org}</p>}
            </div>

            {/* Assunto */}
            <div className="mb-8 text-sm text-black">
              <p className="font-bold">
                Assunto: <span className="underline">{printingOficio.title_subject}</span>
              </p>
            </div>

            {/* Vocativo Inicial */}
            <div className="mb-6 text-sm font-normal text-black">
              <p>{printingOficio.salutation}</p>
            </div>

            {/* Corpo do Texto */}
            <div className="mb-12 text-sm leading-relaxed text-justify space-y-4 text-black">
              {printingOficio.body_text.split('\n\n').map((paragraph, idx) => (
                <p key={idx} style={{ textIndent: '2rem' }}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Fecho de Cortesia */}
            <div className="mb-16 text-sm text-black font-normal">
              <p>{printingOficio.closure_text}</p>
            </div>

            {/* Assinatura (100% COR PRETA conforme pedido) */}
            <div className="text-center w-3/4 mx-auto pt-8 text-black" style={{ color: '#000000' }}>
              <div className="border-t border-black pt-2">
                <p className="font-bold uppercase text-sm text-black" style={{ color: '#000000' }}>{printingOficio.signatory_name}</p>
                <p className="text-xs uppercase text-black font-medium" style={{ color: '#000000' }}>{printingOficio.signatory_role}</p>
                <p className="text-[10px] text-black font-medium uppercase mt-0.5" style={{ color: '#000000' }}>EE Cívico-Militar André Antônio Maggi</p>
              </div>
            </div>

            {/* Rodapé do Documento */}
            <div className="mt-16 text-center text-[9px] text-black font-normal uppercase tracking-widest border-t border-gray-400 pt-3">
              Documento expedido eletronicamente pelo Portal de Gestão Escolar — EE André Maggi
            </div>

          </div>
        </div>
      )}

      {/* Estilos CSS para Impressão */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media screen {
          .print-oficio-area { display: none !important; }
        }
        @media print {
          body * { visibility: hidden !important; }
          .print-oficio-area, .print-oficio-area * { visibility: visible !important; }
          .print-oficio-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            display: block !important;
            background: white !important;
            color: black !important;
          }
          .pdf-page { 
            page-break-after: always !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
        }
      `}} />

    </div>
  );
};

export default OfficialOficiosManager;
