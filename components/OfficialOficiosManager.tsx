import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { generateOficioBodyWithAI } from '../geminiService';
import { 
  FileText, Plus, Search, Printer, Trash2, Building2, Calendar, User, Check, 
  Sparkles, Layers, Eye, X, Shield, BookOpen, Landmark, Filter, ArrowRight, Clock, Wand2,
  ShieldCheck, Award, KeyRound, Pencil
} from 'lucide-react';
import { ElectronicSignatureProof } from '../types';
import ElectronicSignatureStamp from './ElectronicSignatureStamp';
import ElectronicSignatureModal from './ElectronicSignatureModal';
import { registerSignatureProof } from '../utils/signatureService';

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
  signatures?: ElectronicSignatureProof[];
  is_signed?: boolean;
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
  const [editingOficioId, setEditingOficioId] = useState<string | null>(null);
  const [printingOficio, setPrintingOficio] = useState<SchoolOficio | null>(null);
  const [customSequenceNumber, setCustomSequenceNumber] = useState<string>('');
  const [staffRoleMap, setStaffRoleMap] = useState<Record<string, string>>({});

  // Electronic Signature Modal states
  const [signingOficio, setSigningOficio] = useState<SchoolOficio | null>(null);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState<boolean>(false);

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
    const maxNum = oficios.reduce((max, o) => {
      let num = o.number || 0;
      if (!num && o.formatted_number) {
        const match = o.formatted_number.match(/^(\d+)/);
        if (match) num = parseInt(match[1], 10);
      }
      return Math.max(max, num);
    }, 0);
    const nextNum = maxNum >= STARTING_SEQUENCE ? maxNum + 1 : STARTING_SEQUENCE;
    const formatted = `${String(nextNum).padStart(3, '0')}/${currentYear}/EECAAMCOL/SEDUC/MT`;
    return { number: nextNum, formatted };
  }, [oficios, currentYear]);

  // Carregar quadro de servidores para sincronização de cargo
  useEffect(() => {
    const fetchStaffRoles = async () => {
      try {
        const { data } = await supabase.from('staff').select('name, role, job_title');
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((s: any) => {
            if (s.name) {
              const cleanName = s.name.trim().toUpperCase();
              map[cleanName] = s.job_title || s.role || 'Servidor(a) Público(a)';
            }
          });
          setStaffRoleMap(map);
        }
      } catch (err) {
        console.warn('Erro ao carregar cargos do staff:', err);
      }
    };
    fetchStaffRoles();
  }, []);

  // Fetch ofícios from Supabase (with fallback to localStorage)
  const fetchOficios = async () => {
    setLoading(true);
    let localOficios: SchoolOficio[] = [];
    let dbOficios: SchoolOficio[] = [];

    // 1. Ler do localStorage primeiro
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        localOficios = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Erro ao ler localStorage de ofícios:', e);
    }

    // 2. Buscar da tabela school_oficios no Supabase
    try {
      const { data: primaryData, error: primaryError } = await supabase
        .from('school_oficios')
        .select('*')
        .order('year', { ascending: false })
        .order('number', { ascending: false });

      if (!primaryError && primaryData) {
        dbOficios = primaryData as SchoolOficio[];
      } else if (primaryError) {
        console.warn('Tabela school_oficios não disponível ou vazia:', primaryError.message);
      }
    } catch (err) {
      console.warn('Erro na conexão com Supabase para ofícios:', err);
    }

    // 3. Auto-sync: se existirem ofícios salvos no localStorage que ainda não estão no Supabase, subir para a nuvem
    if (localOficios.length > 0) {
      const dbIds = new Set(dbOficios.map(o => o.id));
      const dbFormatted = new Set(dbOficios.map(o => o.formatted_number));
      const toUpload = localOficios.filter(o => !dbIds.has(o.id) && !dbFormatted.has(o.formatted_number) && !o.id?.startsWith('seed-'));
      
      if (toUpload.length > 0) {
        try {
          for (const item of toUpload) {
            await supabase.from('school_oficios').upsert([{
              number: item.number,
              year: item.year,
              formatted_number: item.formatted_number,
              module_source: item.module_source || 'SECRETARIA',
              title_subject: item.title_subject,
              recipient_name: item.recipient_name,
              recipient_role: item.recipient_role,
              recipient_org: item.recipient_org,
              city_date: item.city_date,
              salutation: item.salutation,
              body_text: item.body_text,
              closure_text: item.closure_text,
              signatory_name: item.signatory_name,
              signatory_role: item.signatory_role,
              signatures: item.signatures || [],
              is_signed: item.is_signed || false
            }]);
          }
        } catch (syncErr) {
          console.warn('Erro ao subir ofícios locais para o Supabase:', syncErr);
        }
      }
    }

    // 4. Mesclar dados garantindo unicidade por número e ano (ou formatted_number)
    const map = new Map<string, SchoolOficio>();
    [...dbOficios, ...localOficios].forEach(o => {
      const key = o.number && o.year ? `${o.number}_${o.year}` : (o.formatted_number || o.id);
      if (!map.has(key)) {
        map.set(key, o);
      } else {
        const existing = map.get(key)!;
        if ((!existing.id || existing.id.startsWith('seed-')) && o.id && !o.id.startsWith('seed-')) {
          map.set(key, o);
        } else if (!existing.is_signed && o.is_signed) {
          map.set(key, o);
        }
      }
    });

    const merged = Array.from(map.values()).sort((a, b) => {
      if (b.year !== a.year) return (b.year || 0) - (a.year || 0);
      return (b.number || 0) - (a.number || 0);
    });

    // Se a lista estiver vazia, criar o histórico inicial padrão a partir do número 023
    if (merged.length === 0) {
      const initialSeed: SchoolOficio[] = [
        {
          id: 'seed-ofi-23',
          number: 23,
          year: currentYear,
          formatted_number: `023/${currentYear}/EECAAMCOL/SEDUC/MT`,
          module_source: 'CIVICO_MILITAR',
          title_subject: 'Encaminhamento de Diretrizes Disciplinares e Frequência Escolar',
          recipient_name: 'Superintendência de Gestão Regional - SEDUC/MT',
          recipient_role: 'Diretoria Regional de Educação',
          recipient_org: 'DRE Sinop',
          city_date: `Colíder - MT, 15 de Fevereiro de ${currentYear}`,
          salutation: 'Excelentíssimo(a) Senhor(a) Diretor(a) Regional,',
          body_text: 'Cumprimentando-o(a) cordialmente, vimos apresentar a Vossa Excelência o relatório de conformidade do modelo Cívico-Militar e as ações integradas de Busca Ativa Discente desenvolvidas nesta unidade de ensino.\n\nReiteramos nosso compromisso com a excelência pedagógica e a proteção integral aos estudantes.',
          closure_text: 'Respeitosamente,',
          signatory_name: 'Direção Escolar',
          signatory_role: 'Diretor Escolar',
          created_at: new Date().toISOString()
        }
      ];
      setOficios(initialSeed);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialSeed));
    } else {
      setOficios(merged);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchOficios();

    const channel = supabase.channel('school_oficios_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'school_oficios' }, () => {
        fetchOficios();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleApplyTemplate = (template: typeof TEMPLATES[0]) => {
    setFormData(prev => ({
      ...prev,
      title_subject: template.subject,
      salutation: template.salutation,
      body_text: template.body,
      closure_text: template.closure
    }));
  };

  const handleEditOficio = (oficio: SchoolOficio) => {
    setEditingOficioId(oficio.id);
    setFormData({
      title_subject: oficio.title_subject || '',
      recipient_name: oficio.recipient_name || '',
      recipient_role: oficio.recipient_role || '',
      recipient_org: oficio.recipient_org || '',
      city_date: oficio.city_date || `Colíder - MT, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      salutation: oficio.salutation || 'Prezado(a) Senhor(a),',
      body_text: oficio.body_text || '',
      closure_text: oficio.closure_text || 'Atenciosamente,',
      signatory_name: oficio.signatory_name || user?.name || (moduleSource === 'SECRETARIA' ? 'Secretaria Escolar' : moduleSource === 'COORDENACAO' ? 'Coordenação Pedagógica' : 'Gestão Cívico-Militar'),
      signatory_role: oficio.signatory_role || (moduleSource === 'SECRETARIA' ? 'Secretário(a) Escolar' : moduleSource === 'COORDENACAO' ? 'Coordenador(a) Pedagógico(a)' : 'Gestor Cívico-Militar')
    });
    setCustomSequenceNumber(String(oficio.number || ''));
    setAiPromptInput('');
    setPrintingOficio(null);
    setIsModalOpen(true);
  };

  const handleSaveOficio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title_subject.trim() || !formData.recipient_name.trim() || !formData.body_text.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios (Assunto, Destinatário e Corpo do Texto)!');
      return;
    }

    let nextNum = nextSequenceInfo.number;
    if (customSequenceNumber && !isNaN(parseInt(customSequenceNumber, 10))) {
      nextNum = parseInt(customSequenceNumber, 10);
    }
    const formattedNum = `${String(nextNum).padStart(3, '0')}/${currentYear}/EECAAMCOL/SEDUC/MT`;

    // Atualizar o cargo dinâmico com base no staff
    const cleanSignatory = (formData.signatory_name || '').trim().toUpperCase();
    const resolvedRole = staffRoleMap[cleanSignatory] || formData.signatory_role;

    if (editingOficioId) {
      // MODO EDIÇÃO: Atualizar ofício existente
      const existing = oficios.find(o => o.id === editingOficioId);
      const updatedOficio: SchoolOficio = {
        ...(existing || {} as SchoolOficio),
        id: editingOficioId,
        number: nextNum,
        year: existing?.year || currentYear,
        formatted_number: formattedNum,
        module_source: existing?.module_source || moduleSource,
        title_subject: formData.title_subject.trim(),
        recipient_name: formData.recipient_name.trim(),
        recipient_role: formData.recipient_role.trim(),
        recipient_org: formData.recipient_org.trim(),
        city_date: formData.city_date.trim(),
        salutation: formData.salutation.trim(),
        body_text: formData.body_text.trim(),
        closure_text: formData.closure_text.trim(),
        signatory_name: formData.signatory_name.trim(),
        signatory_role: resolvedRole,
        created_at: existing?.created_at || new Date().toISOString(),
        signatures: existing?.signatures || [],
        is_signed: existing?.is_signed || false
      };

      const updatedList = oficios.map(o => o.id === editingOficioId ? updatedOficio : o);
      setOficios(updatedList);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

      try {
        await supabase.from('school_oficios').update({
          number: updatedOficio.number,
          formatted_number: updatedOficio.formatted_number,
          title_subject: updatedOficio.title_subject,
          recipient_name: updatedOficio.recipient_name,
          recipient_role: updatedOficio.recipient_role,
          recipient_org: updatedOficio.recipient_org,
          city_date: updatedOficio.city_date,
          salutation: updatedOficio.salutation,
          body_text: updatedOficio.body_text,
          closure_text: updatedOficio.closure_text,
          signatory_name: updatedOficio.signatory_name,
          signatory_role: updatedOficio.signatory_role
        }).eq('id', editingOficioId);
      } catch (err) {
        console.warn('Erro ao atualizar ofício no Supabase:', err);
      }

      setEditingOficioId(null);
      setIsModalOpen(false);
      setPrintingOficio(updatedOficio);
      return;
    }

    // MODO CRIAÇÃO: Novo ofício
    const newOficio: SchoolOficio = {
      id: crypto.randomUUID ? crypto.randomUUID() : `ofi-${Date.now()}`,
      number: nextNum,
      year: currentYear,
      formatted_number: formattedNum,
      module_source: moduleSource,
      title_subject: formData.title_subject.trim(),
      recipient_name: formData.recipient_name.trim(),
      recipient_role: formData.recipient_role.trim(),
      recipient_org: formData.recipient_org.trim(),
      city_date: formData.city_date.trim(),
      salutation: formData.salutation.trim(),
      body_text: formData.body_text.trim(),
      closure_text: formData.closure_text.trim(),
      signatory_name: formData.signatory_name.trim(),
      signatory_role: resolvedRole,
      created_at: new Date().toISOString(),
      signatures: [],
      is_signed: false
    };

    // 1. Salvar no estado
    const updatedList = [newOficio, ...oficios];
    setOficios(updatedList);

    // 2. Salvar no localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

    // 3. Salvar no Supabase
    try {
      await supabase.from('school_oficios').insert([{
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
        signatures: [],
        is_signed: false
      }]);
    } catch (err) {
      console.warn('Erro ao salvar ofício no banco do Supabase:', err);
    }

    // Limpar formulário e fechar modal
    setFormData({
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
    setCustomSequenceNumber('');
    setAiPromptInput('');
    setIsModalOpen(false);

    // Abrir imediatamente para visualização e opção de assinatura
    setPrintingOficio(newOficio);
  };

  const handleDeleteOficio = async (oficio: SchoolOficio) => {
    if (!window.confirm(`Deseja realmente excluir o Ofício Nº ${oficio.formatted_number}?`)) return;

    const filtered = oficios.filter(o => o.id !== oficio.id);
    setOficios(filtered);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));

    try {
      await supabase.from('school_oficios').delete().eq('id', oficio.id);
    } catch (err) {
      console.warn('Erro ao deletar no Supabase:', err);
    }
  };

  const handlePrintOficio = (oficio: SchoolOficio) => {
    setPrintingOficio(oficio);
  };

  const handleOpenSignModal = (oficio: SchoolOficio) => {
    setSigningOficio(oficio);
    setIsSigningModalOpen(true);
  };

  const handleSignatureComplete = async (proof: ElectronicSignatureProof) => {
    if (!signingOficio) return;

    const existingSignatures = signingOficio.signatures || [];
    const updatedSignatures = [...existingSignatures, proof];

    const updatedOficio: SchoolOficio = {
      ...signingOficio,
      signatures: updatedSignatures,
      is_signed: true
    };

    // 1. Atualizar no estado
    setOficios(prev => prev.map(o => o.id === updatedOficio.id ? updatedOficio : o));
    if (printingOficio && printingOficio.id === updatedOficio.id) {
      setPrintingOficio(updatedOficio);
    }

    // 2. Atualizar no localStorage
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: SchoolOficio[] = JSON.parse(saved);
        const updatedList = parsed.map(o => o.id === updatedOficio.id ? updatedOficio : o);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
      } catch (e) {
        console.warn('Erro ao atualizar localStorage:', e);
      }
    }

    // 3. Atualizar no Supabase
    try {
      await supabase
        .from('school_oficios')
        .update({
          signatures: updatedSignatures,
          is_signed: true
        })
        .eq('id', updatedOficio.id);
    } catch (err) {
      console.warn('Erro ao salvar assinatura no Supabase:', err);
    }

    // 4. Registrar prova na base de auditoria pública
    await registerSignatureProof(proof);

    setIsSigningModalOpen(false);
    setSigningOficio(null);
  };

  // Filtragem de busca e módulo
  const filteredOficios = useMemo(() => {
    return oficios.filter(o => {
      const matchSearch = (
        o.formatted_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.title_subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.body_text?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchModule = moduleFilter === 'ALL' || o.module_source === moduleFilter;
      return matchSearch && matchModule;
    });
  }, [oficios, searchTerm, moduleFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* HEADER PRINCIPAL */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <FileText size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Numeração Oficial Contínua (Início Nº 023)
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck size={11} /> Lei nº 14.063/2020
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Emissão de Ofícios Escolares</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Expedição oficial unificada para Secretaria, Coordenação Pedagógica e Gestão Cívico-Militar com Assinatura Eletrônica.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingOficioId(null);
              setFormData({
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
              setCustomSequenceNumber('');
              setAiPromptInput('');
              setIsModalOpen(true);
            }}
            className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus size={18} /> Novo Ofício
          </button>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center print:hidden">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por número, assunto ou destinatário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setModuleFilter('ALL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              moduleFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({oficios.length})
          </button>
          <button
            onClick={() => setModuleFilter('SECRETARIA')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              moduleFilter === 'SECRETARIA' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            Secretaria
          </button>
          <button
            onClick={() => setModuleFilter('COORDENACAO')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              moduleFilter === 'COORDENACAO' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            Coordenação
          </button>
          <button
            onClick={() => setModuleFilter('CIVICO_MILITAR')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              moduleFilter === 'CIVICO_MILITAR' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Cívico-Militar
          </button>
        </div>
      </div>

      {/* TABELA DE OFÍCIOS EXPEDIDOS (AJUSTADA PARA CABER 100% NA TELA SEM BARRA DE ROLAGEM) */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden print:hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs">
            Carregando livros de ofícios...
          </div>
        ) : filteredOficios.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto">
              <FileText size={32} />
            </div>
            <h3 className="text-sm font-black uppercase text-slate-700 tracking-wider">Nenhum Ofício Registrado</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Utilize o botão "Novo Ofício" acima para gerar e emitir o documento oficial a partir de <strong className="text-indigo-600 font-mono">OFÍCIO Nº 023/{currentYear}/EECAAMCOL/SEDUC/MT</strong>.
            </p>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="py-4 pl-6 pr-3">Nº & Origem</th>
                  <th className="py-4 px-3">Assunto & Destinatário</th>
                  <th className="py-4 px-3 text-center">Autenticidade & Data</th>
                  <th className="py-4 pl-3 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOficios.map((oficio) => {
                  const moduleMeta = MODULE_LABELS[oficio.module_source] || MODULE_LABELS.SECRETARIA;
                  const ModuleIcon = moduleMeta.icon;
                  const hasSignature = oficio.is_signed || (oficio.signatures && oficio.signatures.length > 0);

                  // Formatação compacta e elegante do número
                  const cleanNum = oficio.number ? String(oficio.number).padStart(3, '0') : (oficio.formatted_number?.split('/')[0] || '023');
                  const compactDisplay = `OF. Nº ${cleanNum}/${oficio.year || currentYear}`;

                  return (
                    <tr key={oficio.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* COLUNA 1: Nº E MÓDULO */}
                      <td className="py-4 pl-6 pr-3 align-middle">
                        <div className="space-y-1">
                          <span 
                            className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100 inline-block"
                            title={oficio.formatted_number}
                          >
                            {compactDisplay}
                          </span>
                          <div>
                            <span className={`px-2 py-0.5 text-[8px] font-black rounded-md border uppercase inline-flex items-center gap-1 ${moduleMeta.badgeColor}`}>
                              <ModuleIcon size={10} /> {moduleMeta.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* COLUNA 2: ASSUNTO E DESTINATÁRIO */}
                      <td className="py-4 px-3 align-middle max-w-xs sm:max-w-md md:max-w-lg">
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-900 uppercase leading-snug truncate" title={oficio.title_subject}>
                            {oficio.title_subject}
                          </p>
                          <p className="text-[11px] text-slate-600 font-medium truncate" title={`${oficio.recipient_name} ${oficio.recipient_org ? `(${oficio.recipient_org})` : ''}`}>
                            <strong className="text-slate-800 uppercase">{oficio.recipient_name}</strong>
                            {oficio.recipient_role ? ` • ${oficio.recipient_role}` : ''}
                            {oficio.recipient_org ? ` • ${oficio.recipient_org}` : ''}
                          </p>
                        </div>
                      </td>

                      {/* COLUNA 3: AUTENTICIDADE E DATA */}
                      <td className="py-4 px-3 align-middle text-center">
                        <div className="inline-flex flex-col items-center space-y-1">
                          {hasSignature ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[8px] font-black uppercase inline-flex items-center gap-1 shadow-xs">
                              <ShieldCheck size={10} /> Assinado Digitalmente
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenSignModal(oficio)}
                              className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg text-[8px] font-black uppercase inline-flex items-center gap-1 transition-all active:scale-95 shadow-xs"
                              title="Assinar com Senha/PIN Institucional"
                            >
                              <KeyRound size={10} /> Assinar com Senha
                            </button>
                          )}
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(oficio.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>

                      {/* COLUNA 4: AÇÕES */}
                      <td className="py-4 pl-3 pr-6 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditOficio(oficio)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs active:scale-95"
                            title="Editar Informações do Ofício"
                          >
                            <Pencil size={13} /> Editar
                          </button>
                          <button
                            onClick={() => handlePrintOficio(oficio)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs active:scale-95"
                            title="Visualizar e Imprimir Ofício A4"
                          >
                            <Printer size={13} /> Visualizar
                          </button>
                          <button
                            onClick={() => handleDeleteOficio(oficio)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Excluir Registro"
                          >
                            <Trash2 size={15} />
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

      {/* MODAL DE NOVO / EDITAR OFÍCIO */}
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
                  <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">
                    {editingOficioId ? 'Editar Documento Oficial' : 'Novo Documento Oficial'}
                  </span>
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
              
              {/* Opção de Ajuste Manual de Sequencial */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase">Sequencial Automático do Ofício</p>
                  <p className="text-[10px] text-slate-500 font-medium">Controle contínuo iniciando a partir de 023 para o ano letivo.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Nº:</span>
                  <input
                    type="number"
                    min="1"
                    placeholder={String(nextSequenceInfo.number)}
                    value={customSequenceNumber}
                    onChange={(e) => setCustomSequenceNumber(e.target.value)}
                    className="w-20 p-2 bg-white border border-slate-300 rounded-xl text-center text-xs font-mono font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Modelos Prontos */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Modelos Prontos Sugeridos</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TEMPLATES.map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="p-3 text-left bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-xl transition-all group"
                    >
                      <p className="text-xs font-black uppercase text-slate-800 group-hover:text-indigo-600">{tmpl.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{tmpl.subject}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Assunto */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Assunto do Ofício *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Solicitação de Reparos na Sala de Informática"
                  value={formData.title_subject}
                  onChange={(e) => setFormData({ ...formData, title_subject: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Destinatário */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Nome do Destinatário *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Secretário Municipal"
                    value={formData.recipient_role}
                    onChange={(e) => setFormData({ ...formData, recipient_role: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Órgão / Instituição
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Prefeitura Municipal de Colíder"
                    value={formData.recipient_org}
                    onChange={(e) => setFormData({ ...formData, recipient_org: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Data e Vocativo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Local e Data *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city_date}
                    onChange={(e) => setFormData({ ...formData, city_date: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Vocativo Inicial
                  </label>
                  <input
                    type="text"
                    value={formData.salutation}
                    onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Assistente IA de Redação Oficial */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-indigo-600 animate-pulse" size={16} />
                    <span className="text-xs font-black uppercase text-indigo-900 tracking-wider">
                      Redação Inteligente por IA (Padrão SEDUC-MT)
                    </span>
                  </div>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value as any)}
                    className="p-1.5 bg-white border border-indigo-200 rounded-lg text-[10px] font-black uppercase text-indigo-700 outline-none cursor-pointer"
                  >
                    <option value="SOLICITACAO">Tom: Solicitação</option>
                    <option value="CONVOCACAO">Tom: Convocação</option>
                    <option value="NOTIFICACAO">Tom: Notificação</option>
                    <option value="INFORMATIVO">Tom: Informativo</option>
                    <option value="ENCAMINHAMENTO">Tom: Encaminhamento</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite resumidamente o que você deseja redigir no ofício..."
                    value={aiPromptInput}
                    onChange={(e) => setAiPromptInput(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    disabled={isGeneratingAI}
                    onClick={handleGenerateAI}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0"
                  >
                    {isGeneratingAI ? (
                      <>Gerando...</>
                    ) : (
                      <><Wand2 size={14} /> Redigir com IA</>
                    )}
                  </button>
                </div>
              </div>

              {/* Corpo do Texto */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Corpo do Texto do Ofício *
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.body_text}
                  onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                  placeholder="Redija aqui os parágrafos do documento oficial..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-normal leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all custom-scrollbar"
                />
              </div>

              {/* Fecho e Signatário */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Fecho de Cortesia
                  </label>
                  <input
                    type="text"
                    value={formData.closure_text}
                    onChange={(e) => setFormData({ ...formData, closure_text: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Nome do Signatário *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.signatory_name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const cleanName = name.trim().toUpperCase();
                      const matchedRole = staffRoleMap[cleanName] || formData.signatory_role;
                      setFormData({ ...formData, signatory_name: name, signatory_role: matchedRole });
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Cargo / Função Oficial
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.signatory_role}
                    onChange={(e) => setFormData({ ...formData, signatory_role: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
                >
                  <Check size={16} /> {editingOficioId ? 'Salvar Alterações' : 'Gerar e Salvar Ofício'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE IMPRESSÃO / VISUALIZAÇÃO DO OFÍCIO FORMAL (TIMBRADO SEDUC/MT) */}
      {printingOficio && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-start print:hidden">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 my-4">
            
            {/* Header de Controle (Fixo no Topo do Modal) */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-20 shadow-md">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black bg-indigo-600 px-3 py-1 rounded-lg">
                  OFÍCIO Nº {printingOficio.formatted_number}
                </span>
                <span className="text-xs font-bold uppercase text-slate-300 hidden sm:inline">Visualização Oficial A4</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleEditOficio(printingOficio)}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-amber-600/20 active:scale-95"
                  title="Editar Texto e Dados do Ofício"
                >
                  <Pencil size={14} /> Editar
                </button>

                {(!printingOficio.signatures || printingOficio.signatures.length === 0) && (
                  <button
                    onClick={() => handleOpenSignModal(printingOficio)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
                  >
                    <KeyRound size={14} /> Assinar
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95"
                >
                  <Printer size={16} /> Imprimir (PDF)
                </button>
                
                <button
                  onClick={() => setPrintingOficio(null)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* FOLHA A4 VISUALIZADA NA TELA */}
            <div className="p-8 sm:p-14 bg-white text-black min-h-[275mm] flex flex-col justify-between" style={{ fontFamily: 'Times New Roman, Georgia, serif' }}>
              
              <div className="flex-1 flex flex-col justify-start pb-6">
                
                {/* Cabeçalho Oficial com Brasão MT à Esquerda e Logo Cívico-Militar à Direita */}
                <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                  <img 
                    src="/brasao_mt.png" 
                    alt="Brasão do Estado de Mato Grosso" 
                    className="h-20 sm:h-24 w-auto object-contain shrink-0 max-h-[95px]" 
                    onError={(e) => (e.currentTarget.src = '/SEDUC 2.jpg')} 
                  />
                  <div className="text-center flex-1 mx-2 space-y-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
                    <h1 className="text-[11px] font-bold uppercase text-black leading-tight">Governo do Estado de Mato Grosso</h1>
                    <h2 className="text-[10px] font-bold uppercase text-black leading-tight">Secretaria de Estado de Educação</h2>
                    <h3 className="text-[10px] font-bold uppercase text-black leading-tight">Secretaria Adjunta de Gestão Regional</h3>
                    <h4 className="text-[9px] font-bold uppercase text-black leading-tight">Superintendência de Gestão das Diretorias Regionais</h4>
                    <h5 className="text-[9px] font-bold uppercase text-black leading-tight">Diretoria Regional de Educação de Sinop</h5>
                    <h6 className="text-[11px] font-black uppercase text-black leading-tight pt-0.5">Escola Estadual Cívico-Militar André Antônio Maggi</h6>
                  </div>
                  <img 
                    src="/logo-escola-oficial.png" 
                    alt="Escola Cívico-Militar" 
                    className="h-20 sm:h-24 w-auto object-contain shrink-0 max-h-[105px]" 
                    onError={(e) => (e.currentTarget.src = '/logo-escola.png')} 
                  />
                </div>

                {/* Número do Ofício Formatado (Alinhado à ESQUERDA) */}
                <div className="text-left mb-3">
                  <p className="text-sm font-bold uppercase font-mono text-black">
                    OFÍCIO Nº {printingOficio.formatted_number}
                  </p>
                </div>

                {/* Cidade e Data (Alinhado à Direita) */}
                <div className="text-right mb-4 text-sm text-black">
                  <p>{printingOficio.city_date}</p>
                </div>

                {/* Dados do Destinatário */}
                <div className="mb-4 text-sm space-y-0.5 text-black font-normal">
                  <p className="font-bold">Ao(À) Senhor(a):</p>
                  <p className="uppercase text-base font-bold">{printingOficio.recipient_name}</p>
                  {printingOficio.recipient_role && <p className="uppercase font-normal">{printingOficio.recipient_role}</p>}
                  {printingOficio.recipient_org && <p className="uppercase font-normal">{printingOficio.recipient_org}</p>}
                </div>

                {/* Assunto */}
                <div className="mb-4 text-sm text-black">
                  <p className="font-bold">
                    Assunto: <span className="underline">{printingOficio.title_subject}</span>
                  </p>
                </div>

                {/* Vocativo Inicial */}
                <div className="mb-3 text-sm font-normal text-black">
                  <p>{printingOficio.salutation}</p>
                </div>

                {/* Corpo do Texto Principal */}
                <div className="mb-6 text-[14px] leading-relaxed text-justify space-y-3 text-black font-normal">
                  {printingOficio.body_text.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} style={{ textIndent: '1.5rem' }}>
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Fecho de Cortesia */}
                <div className="mb-6 text-sm text-black font-normal">
                  <p>{printingOficio.closure_text}</p>
                </div>

                {/* ASSINATURA ELETRÔNICA OFICIAL / CARIMBO OU LINHA FÍSICA */}
                {printingOficio.signatures && printingOficio.signatures.length > 0 ? (
                  <div className="my-6 space-y-4">
                    {printingOficio.signatures.map((sig, idx) => (
                      <ElectronicSignatureStamp key={idx} signature={sig} />
                    ))}
                  </div>
                ) : (
                  (() => {
                    const cleanSignatoryName = (printingOficio.signatory_name || '').trim().toUpperCase();
                    const matchedRole = staffRoleMap[cleanSignatoryName] || printingOficio.signatory_role;
                    return (
                      <div className="text-center w-2/3 mx-auto pt-6 text-black" style={{ color: '#000000' }}>
                        <div className="border-t border-black pt-1.5">
                          <p className="font-bold uppercase text-sm text-black" style={{ color: '#000000' }}>{printingOficio.signatory_name}</p>
                          <p className="text-xs uppercase text-black font-medium" style={{ color: '#000000' }}>{matchedRole}</p>
                          <p className="text-[10px] text-black font-medium uppercase mt-0.5" style={{ color: '#000000' }}>EE Cívico-Militar André Antônio Maggi</p>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Rodapé Oficial SEDUC-MT / EE Cívico-Militar */}
              <div className="mt-auto border-t border-black/40 pt-2 grid grid-cols-2 gap-4 text-[8.5px] leading-tight text-black" style={{ color: '#000000', fontFamily: 'Arial, sans-serif' }}>
                <div className="text-left space-y-0.5">
                  <p>Rua Engenheiro Edgar Prado Arze, Quadra 01, Lote 05, Setor A, Centro Político Administrativo,</p>
                  <p>CEP: 78049-906 – Cuiabá-MT Fone (65) 3613-6300</p>
                  <p>Site: www.seduc.mt.gov.br</p>
                </div>
                <div className="text-left space-y-0.5 pl-6">
                  <p>Rua Borba Gato, nº 80, Bairro Torre</p>
                  <p>CEP: 78500-000 – Colíder-MT Fones +55 (66) 99682-7608</p>
                  <p>Email: escola.158330@edu.mt.gov.br</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ÁREA DE IMPRESSÃO PURA (Ativada exclusivamente no @media print) */}
      {printingOficio && (
        <div className="print-oficio-area">
          <div className="pdf-oficio-page p-8 sm:p-14 bg-white text-black min-h-[275mm] flex flex-col justify-between" style={{ fontFamily: 'Times New Roman, Georgia, serif' }}>
            
            <div className="flex-1 flex flex-col justify-start pb-6">
              
              {/* Cabeçalho Oficial com Brasão MT à Esquerda e Logo Cívico-Militar à Direita */}
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                <img 
                  src="/brasao_mt.png" 
                  alt="Brasão do Estado de Mato Grosso" 
                  className="h-20 sm:h-24 w-auto object-contain shrink-0 max-h-[95px]" 
                  onError={(e) => (e.currentTarget.src = '/SEDUC 2.jpg')} 
                />
                <div className="text-center flex-1 mx-2 space-y-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
                  <h1 className="text-[11px] font-bold uppercase text-black leading-tight">Governo do Estado de Mato Grosso</h1>
                  <h2 className="text-[10px] font-bold uppercase text-black leading-tight">Secretaria de Estado de Educação</h2>
                  <h3 className="text-[10px] font-bold uppercase text-black leading-tight">Secretaria Adjunta de Gestão Regional</h3>
                  <h4 className="text-[9px] font-bold uppercase text-black leading-tight">Superintendência de Gestão das Diretorias Regionais</h4>
                  <h5 className="text-[9px] font-bold uppercase text-black leading-tight">Diretoria Regional de Educação de Sinop</h5>
                  <h6 className="text-[11px] font-black uppercase text-black leading-tight pt-0.5">Escola Estadual Cívico-Militar André Antônio Maggi</h6>
                </div>
                <img 
                  src="/logo-escola-oficial.png" 
                  alt="Escola Cívico-Militar" 
                  className="h-20 sm:h-24 w-auto object-contain shrink-0 max-h-[105px]" 
                  onError={(e) => (e.currentTarget.src = '/logo-escola.png')} 
                />
              </div>

              {/* Número do Ofício Formatado (Alinhado à ESQUERDA) */}
              <div className="text-left mb-3">
                <p className="text-sm font-bold uppercase font-mono text-black">
                  OFÍCIO Nº {printingOficio.formatted_number}
                </p>
              </div>

              {/* Cidade e Data (Alinhado à Direita) */}
              <div className="text-right mb-4 text-sm text-black">
                <p>{printingOficio.city_date}</p>
              </div>

              {/* Dados do Destinatário */}
              <div className="mb-4 text-sm space-y-0.5 text-black font-normal">
                <p className="font-bold">Ao(À) Senhor(a):</p>
                <p className="uppercase text-base font-bold">{printingOficio.recipient_name}</p>
                {printingOficio.recipient_role && <p className="uppercase font-normal">{printingOficio.recipient_role}</p>}
                {printingOficio.recipient_org && <p className="uppercase font-normal">{printingOficio.recipient_org}</p>}
              </div>

              {/* Assunto */}
              <div className="mb-4 text-sm text-black">
                <p className="font-bold">
                  Assunto: <span className="underline">{printingOficio.title_subject}</span>
                </p>
              </div>

              {/* Vocativo Inicial */}
              <div className="mb-3 text-sm font-normal text-black">
                <p>{printingOficio.salutation}</p>
              </div>

              {/* Corpo do Texto Principal */}
              <div className="mb-6 text-[14px] leading-relaxed text-justify space-y-3 text-black font-normal">
                {printingOficio.body_text.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} style={{ textIndent: '1.5rem' }}>
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Fecho de Cortesia */}
              <div className="mb-6 text-sm text-black font-normal">
                <p>{printingOficio.closure_text}</p>
              </div>

              {/* ASSINATURA ELETRÔNICA OFICIAL / CARIMBO OU LINHA FÍSICA */}
              {printingOficio.signatures && printingOficio.signatures.length > 0 ? (
                <div className="my-6 space-y-4">
                  {printingOficio.signatures.map((sig, idx) => (
                    <ElectronicSignatureStamp key={idx} signature={sig} />
                  ))}
                </div>
              ) : (
                (() => {
                  const cleanSignatoryName = (printingOficio.signatory_name || '').trim().toUpperCase();
                  const matchedRole = staffRoleMap[cleanSignatoryName] || printingOficio.signatory_role;
                  return (
                    <div className="text-center w-2/3 mx-auto pt-6 text-black" style={{ color: '#000000' }}>
                      <div className="border-t border-black pt-1.5">
                        <p className="font-bold uppercase text-sm text-black" style={{ color: '#000000' }}>{printingOficio.signatory_name}</p>
                        <p className="text-xs uppercase text-black font-medium" style={{ color: '#000000' }}>{matchedRole}</p>
                        <p className="text-[10px] text-black font-medium uppercase mt-0.5" style={{ color: '#000000' }}>EE Cívico-Militar André Antônio Maggi</p>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Rodapé Oficial SEDUC-MT / EE Cívico-Militar Fixado no Fundo da Folha A4 */}
            <div className="print-oficio-footer mt-auto border-t border-black/40 pt-2 grid grid-cols-2 gap-4 text-[8.5px] leading-tight text-black" style={{ color: '#000000', fontFamily: 'Arial, sans-serif' }}>
              <div className="text-left space-y-0.5">
                <p>Rua Engenheiro Edgar Prado Arze, Quadra 01, Lote 05, Setor A, Centro Político Administrativo,</p>
                <p>CEP: 78049-906 – Cuiabá-MT Fone (65) 3613-6300</p>
                <p>Site: www.seduc.mt.gov.br</p>
              </div>
              <div className="text-left space-y-0.5 pl-6">
                <p>Rua Borba Gato, nº 80, Bairro Torre</p>
                <p>CEP: 78500-000 – Colíder-MT Fones +55 (66) 99682-7608</p>
                <p>Email: escola.158330@edu.mt.gov.br</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Estilos CSS de Impressão Oficial do Ofício */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media screen {
          .print-oficio-area { display: none !important; }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 12mm 10mm 12mm !important;
          }
          html, body {
            height: 100% !important;
            width: 100% !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
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
            box-sizing: border-box !important;
            padding: 0 0 22mm 0 !important;
            margin: 0 !important;
          }
          .pdf-oficio-page { 
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-oficio-footer {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            background: white !important;
            padding-top: 6px !important;
            border-top: 1px solid rgba(0, 0, 0, 0.4) !important;
            z-index: 9999 !important;
          }
        }
      `}} />

      {/* MODAL DE ASSINATURA ELETRÔNICA POR SENHA / PIN */}
      {isSigningModalOpen && signingOficio && (
        <ElectronicSignatureModal
          isOpen={isSigningModalOpen}
          onClose={() => {
            setIsSigningModalOpen(false);
            setSigningOficio(null);
          }}
          documentTitle={`OFÍCIO Nº ${signingOficio.formatted_number}`}
          documentType="OFÍCIO ESCOLAR"
          documentContentText={`OFÍCIO Nº ${signingOficio.formatted_number}\nASSUNTO: ${signingOficio.title_subject}\nDESTINATÁRIO: ${signingOficio.recipient_name}\n${signingOficio.body_text}`}
          allowedRoles={['DIRETOR', 'SECRETARIO', 'COORDENADOR', 'GESTOR_MILITAR', 'ADMIN']}
          defaultSignerRole={moduleSource === 'SECRETARIA' ? 'SECRETÁRIO(A) ESCOLAR' : moduleSource === 'COORDENACAO' ? 'COORDENADOR(A) PEDAGÓGICO(A)' : 'DIRETOR ESCOLAR'}
          onSignatureComplete={handleSignatureComplete}
        />
      )}

    </div>
  );
};

export default OfficialOficiosManager;
