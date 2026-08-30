import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { generateAtaWithAI } from '../geminiService';
import { SchoolAta, AtaParticipant } from '../types';
import { 
  FileSpreadsheet, Plus, Search, Printer, Trash2, Calendar, User, Check, 
  Sparkles, Layers, Eye, X, Shield, BookOpen, Landmark, Filter, ArrowRight, Clock, Wand2,
  Users, MapPin, UserPlus, FileCheck, CheckCircle2, ChevronRight, AlertCircle, Edit3
} from 'lucide-react';

interface OfficialAtasManagerProps {
  moduleSource: 'SECRETARIA' | 'COORDENACAO' | 'CIVICO_MILITAR' | 'GESTAO';
  user?: any;
}

const LOCAL_STORAGE_KEY = 'portal_school_atas_v1';
const STARTING_SEQUENCE = 1;

const MODULE_LABELS: Record<'SECRETARIA' | 'COORDENACAO' | 'CIVICO_MILITAR' | 'GESTAO', { label: string, badgeColor: string, icon: any }> = {
  SECRETARIA: { label: 'Secretaria Escolar', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Landmark },
  COORDENACAO: { label: 'Coordenação Pedagógica', badgeColor: 'bg-purple-100 text-purple-800 border-purple-200', icon: BookOpen },
  CIVICO_MILITAR: { label: 'Cívico-Militar', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Shield },
  GESTAO: { label: 'Gestão Escolar', badgeColor: 'bg-blue-100 text-blue-800 border-blue-200', icon: Landmark }
};

const CATEGORY_LABELS: Record<string, { label: string, color: string }> = {
  DISCIPLINAR: { label: 'Alinhamento Disciplinar', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PEDAGOGICO: { label: 'Acompanhamento Pedagógico', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  PAIS_RESPONSAVEIS: { label: 'Atendimento a Pais / Família', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONSELHO_CLASSE: { label: 'Conselho de Classe', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  GESTAO_ALINHAMENTO: { label: 'Alinhamento de Gestão', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  GERAL: { label: 'Reunião Geral / Administrativa', color: 'bg-gray-100 text-gray-700 border-gray-200' }
};

const ATA_TEMPLATES = [
  {
    id: 'disciplinar_militar',
    title: 'Alinhamento Disciplinar e Conduta Cívico-Militar',
    category: 'DISCIPLINAR' as const,
    pauta: 'Alinhamento Disciplinar e Apresentação Pessoal do Estudante',
    location: 'Gabinete da Gestão Cívico-Militar • EE Cívico-Militar André Maggi',
    objectives: 'Orientar o(a) estudante e seus responsáveis legais acerca do cumprimento das normas do Regulamento Disciplinar da Escola Cívico-Militar, conduta e apresentação pessoal.',
    content: 'Reuniram-se a equipe de gestão cívico-militar, o(a) estudante e seus responsáveis para análise dos relatórios de conduta e ocorrências registradas em livro de registros da escola.\n\nForam apresentadas detalhadamente as situações observadas, oportunizando a fala ao discente e aos familiares para esclarecimento dos fatos.\n\nA gestão reiterou a importância dos valores de hierarquia, disciplina, respeito aos professores e assiduidade que norteiam a proposta pedagógica da instituição.',
    forwarding: '1. Assinatura do Termo de Ciência e Compromisso Disciplinar pelos responsáveis.\n2. Acompanhamento semanal de assiduidade e apresentação pelo monitor cívico-militar.\n3. Encaminhamento para apoio psicossocial e pedagógico caso haja reincidência.'
  },
  {
    id: 'atendimento_pais',
    title: 'Atendimento a Pais e Responsáveis / Termo de Compromisso',
    category: 'PAIS_RESPONSAVEIS' as const,
    pauta: 'Atendimento Individualizado aos Responsáveis Legais',
    location: 'Sala de Atendimento aos Pais • EE Cívico-Militar André Maggi',
    objectives: 'Apresentar aos familiares o panorama do desenvolvimento pedagógico, atitudinal e de frequência do(a) estudante, alinhando estratégias conjuntas de apoio escolar.',
    content: 'Iniciada a reunião com os pais/responsáveis legais, foram compartilhados os relatórios bimestrais de notas, tarefas entregues e frequência escolar.\n\nOs responsáveis manifestaram suas ponderações e comprometeram-se a acompanhar diariamente as tarefas de casa e as rotinas de estudo do estudante no contraturno escolar.\n\nA equipe escolar colocou os canais de atendimento à inteira disposição para suporte contínuo.',
    forwarding: '1. Estabelecer rotina diária de verificação da agenda e cadernos escolares.\n2. Comparecer aos plantões pedagógicos bimestrais.\n3. Comunicação imediata em caso de faltas ou necessidades de saúde.'
  },
  {
    id: 'conselho_classe',
    title: 'Conselho de Classe e Avaliação Pedagógica',
    category: 'CONSELHO_CLASSE' as const,
    pauta: 'Conselho de Classe Bimestral e Diagnóstico de Rendimento',
    location: 'Sala dos Professores • EE Cívico-Militar André Maggi',
    objectives: 'Analisar coletivamente os resultados de aprendizagem, diagnosticar turmas e alunos com defasagem e deliberar sobre intervenções pedagógicas e nivelamento.',
    content: 'Reuniram-se a Coordenação Pedagógica, Direção Escolar e corpo docente para a realização do Conselho de Classe.\n\nForam analisadas as médias das turmas, o engajamento discente e as avaliações diagnósticas aplicadas no período. Identificaram-se os principais pontos de atenção e as habilidades prioritárias a serem consolidadas.\n\nOs professores compartilharam boas práticas e sugeriram projetos interdisciplinares de recuperação paralela.',
    forwarding: '1. Aplicação imediata do cronograma de intervenção e reforço pedagógico.\n2. Convocação dos pais dos estudantes com rendimento abaixo da média.\n3. Monitoramento quinzenal do índice de recuperação pela coordenação.'
  },
  {
    id: 'formacao_docente',
    title: 'Reunião de Formação e Planejamento Pedagógico',
    category: 'PEDAGOGICO' as const,
    pauta: 'Planejamento e Alinhamento Pedagógico Docente',
    location: 'Auditório / Sala Multiuso • EE Cívico-Militar André Maggi',
    objectives: 'Alinhar as diretrizes curriculares da SEDUC-MT, projetos pedagógicos bimestrais e estratégias de avaliação contínua com o corpo docente.',
    content: 'Sob a condução da Coordenação Pedagógica, realizou-se a sessão de planejamento e estudos curriculares.\n\nForam discutidas as metas educacionais da escola, o uso integrado de tecnologias educacionais e o acompanhamento dos planos de aula semanais.\n\nFicou estabelecido o cronograma das avaliações formativas e das atividades comemorativas cívicas e culturais.',
    forwarding: '1. Entrega dos planos de aula alinhados à BNCC/DRC-MT até a data estipulada.\n2. Lançamento tempestivo das frequências e avaliações no sistema oficial.\n3. Execução das semanas de nivelamento pedagógico.'
  },
  {
    id: 'mediacao_conflitos',
    title: 'Comissão de Mediação Escolar / Resolução de Conflitos',
    category: 'DISCIPLINAR' as const,
    pauta: 'Sessão de Mediação e Restauração de Vínculos de Convivência',
    location: 'Sala de Mediação Escolar • EE Cívico-Militar André Maggi',
    objectives: 'Promover a escuta ativa, reflexão restaurativa e o acordo pacífico entre os envolvidos em situação de conflito escolar.',
    content: 'Reuniram-se sob a facilitação da equipe mediadora os envolvidos para diálogo orientado e resolução pacífica de desentendimento ocorrido nas dependências da escola.\n\nAs partes puderam expor suas perspectivas de forma respeitosa, reconhecendo os impactos de suas atitudes e demonstrando disposição para restabelecer o respeito mútuo e a convivência harmônica.\n\nFoi formalizado o compromisso de não reincidência e cultivo de atitudes colaborativas.',
    forwarding: '1. Assinatura do Termo de Acordo Mútuo entre as partes envolvidas.\n2. Acompanhamento pela equipe de mediação durante o bimestre.\n3. Ciência arquivada em prontuário restrito de mediação.'
  },
  {
    id: 'gestao_colegiado',
    title: 'Reunião da Equipe Gestora e Colegiado Escolar',
    category: 'GESTAO_ALINHAMENTO' as const,
    pauta: 'Alinhamento Administrativo, Financeiro e Estrutural da Unidade',
    location: 'Gabinete da Direção • EE Cívico-Militar André Maggi',
    objectives: 'Deliberar sobre prioridades de infraestrutura, prestação de contas, organização de eventos institucionais e alinhamento com a DRE/SEDUC-MT.',
    content: 'Reunida a equipe gestora ampla para tratar dos encaminhamentos estruturais e administrativos da unidade escolar.\n\nForam avaliadas as necessidades de manutenção física, aquisição de suprimentos didáticos e cumprimento das metas pactuadas com a Diretoria Regional de Educação.\n\nDefiniram-se os planos de ação prioritários para o período subsequente.',
    forwarding: '1. Expedição de ofícios aos órgãos competentes com as demandas levantadas.\n2. Acompanhamento dos prazos de execução das manutenções prediais.\n3. Próxima reunião ordinária agendada para 30 dias.'
  }
];

const numberToWordsPtBr = (n: number): string => {
  const units = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  if (n < 20) return units[n];
  if (n < 100) {
    const u = n % 10;
    const t = Math.floor(n / 10);
    return u === 0 ? tens[t] : `${tens[t]} e ${units[u]}`;
  }
  return n.toString();
};

const OfficialAtasManager: React.FC<OfficialAtasManagerProps> = ({ moduleSource, user }) => {
  const [atas, setAtas] = useState<SchoolAta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  
  // Modals & States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [viewingAta, setViewingAta] = useState<SchoolAta | null>(null);
  const [printingAta, setPrintingAta] = useState<SchoolAta | null>(null);
  const [customSequenceNumber, setCustomSequenceNumber] = useState<string>('');
  const [staffList, setStaffList] = useState<Array<{ name: string; role: string }>>([]);
  const [selectedStaffToAdd, setSelectedStaffToAdd] = useState<string>('');

  // Form fields
  const [formData, setFormData] = useState<{
    category: SchoolAta['category'];
    pauta_assunto: string;
    meeting_date: string;
    meeting_time_start: string;
    meeting_time_end: string;
    location: string;
    participants: AtaParticipant[];
    objectives: string;
    content_deliberations: string;
    forwarding_actions: string;
    signatory_name: string;
    signatory_role: string;
  }>({
    category: moduleSource === 'CIVICO_MILITAR' ? 'DISCIPLINAR' : moduleSource === 'COORDENACAO' ? 'PEDAGOGICO' : 'GERAL',
    pauta_assunto: '',
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_time_start: '08:00',
    meeting_time_end: '09:30',
    location: 'Escola Estadual Cívico-Militar André Antônio Maggi • Colíder/MT',
    participants: [
      { name: user?.name || (moduleSource === 'CIVICO_MILITAR' ? 'Gestão Cívico-Militar' : moduleSource === 'COORDENACAO' ? 'Coordenação Pedagógica' : 'Secretaria Escolar'), role: moduleSource === 'CIVICO_MILITAR' ? 'Gestor Cívico-Militar' : moduleSource === 'COORDENACAO' ? 'Coordenador(a) Pedagógico(a)' : 'Secretário(a) Escolar' }
    ],
    objectives: '',
    content_deliberations: '',
    forwarding_actions: '',
    signatory_name: user?.name || (moduleSource === 'CIVICO_MILITAR' ? 'Gestão Cívico-Militar' : moduleSource === 'COORDENACAO' ? 'Coordenação Pedagógica' : 'Secretaria Escolar'),
    signatory_role: moduleSource === 'CIVICO_MILITAR' ? 'Gestor Cívico-Militar' : moduleSource === 'COORDENACAO' ? 'Coordenador(a) Pedagógico(a)' : 'Secretário(a) Escolar'
  });

  // Participant input state for custom manual additions
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantRole, setNewParticipantRole] = useState('Professor(a)');

  // AI Redaction Assistant States
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiPromptInput, setAiPromptInput] = useState<string>('');
  const [aiTone, setAiTone] = useState<'PADRAO' | 'DISCIPLINAR' | 'PEDAGOGICO' | 'CONCILIADOR' | 'DELIBERATIVO'>('PADRAO');

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Compute next sequential number for current year
  const nextSequenceInfo = useMemo(() => {
    const maxNum = atas.reduce((max, a) => {
      let num = a.number || 0;
      if (!num && a.formatted_number) {
        const match = a.formatted_number.match(/^(\d+)/);
        if (match) num = parseInt(match[1], 10);
      }
      return Math.max(max, num);
    }, 0);
    const nextNum = maxNum >= STARTING_SEQUENCE ? maxNum + 1 : STARTING_SEQUENCE;
    const formatted = `${String(nextNum).padStart(3, '0')}/${currentYear}/EECAAMCOL/SEDUC/MT`;
    return { number: nextNum, formatted };
  }, [atas, currentYear]);

  // Sync sequence number when modal opens
  useEffect(() => {
    if (isModalOpen && !customSequenceNumber) {
      setCustomSequenceNumber(String(nextSequenceInfo.number));
    }
  }, [isModalOpen, nextSequenceInfo.number]);

  // Load Atas from Supabase with localStorage backup & dual-table cloud sync
  const loadAtas = async () => {
    setLoading(true);
    let localAtas: SchoolAta[] = [];
    let dbAtas: SchoolAta[] = [];

    // 1. Read from localStorage
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        localAtas = JSON.parse(local);
      }
    } catch (e) {
      console.warn('Erro ao carregar atas locais:', e);
    }

    // 2. Fetch from Supabase (primary table school_atas, with fallback to civic_documents)
    try {
      const { data: primaryData, error: primaryErr } = await supabase
        .from('school_atas')
        .select('*')
        .order('year', { ascending: false })
        .order('number', { ascending: false });

      if (!primaryErr && primaryData && primaryData.length > 0) {
        dbAtas = primaryData.map((d: any) => ({
          ...d,
          participants: Array.isArray(d.participants) ? d.participants : typeof d.participants === 'string' ? JSON.parse(d.participants || '[]') : [],
          signatories: Array.isArray(d.signatories) ? d.signatories : typeof d.signatories === 'string' ? JSON.parse(d.signatories || '[]') : []
        })) as SchoolAta[];
      } else {
        // Fallback: Query civic_documents table
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('civic_documents')
          .select('*')
          .eq('template', 'official_ata');

        if (!fallbackErr && fallbackData && fallbackData.length > 0) {
          dbAtas = fallbackData.map((d: any) => ({
            id: d.id,
            number: d.content?.number || 0,
            year: d.content?.year || new Date().getFullYear(),
            formatted_number: d.content?.formatted_number || d.student_name,
            module_source: d.content?.module_source || d.student_class || 'CIVICO_MILITAR',
            category: d.content?.category || 'GERAL',
            pauta_assunto: d.content?.pauta_assunto || '',
            meeting_date: d.content?.meeting_date || d.date?.split('T')[0] || new Date().toISOString().split('T')[0],
            meeting_time_start: d.content?.meeting_time_start || '08:00',
            meeting_time_end: d.content?.meeting_time_end || '09:30',
            location: d.content?.location || 'Escola Estadual Cívico-Militar André Antônio Maggi',
            participants: d.content?.participants || [],
            objectives: d.content?.objectives || '',
            content_deliberations: d.content?.content_deliberations || '',
            forwarding_actions: d.content?.forwarding_actions || '',
            signatory_name: d.content?.signatory_name || '',
            signatory_role: d.content?.signatory_role || '',
            signatories: d.content?.signatories || [],
            created_at: d.date || new Date().toISOString()
          }));
        }
      }
    } catch (e) {
      console.warn('Erro ao conectar com Supabase para atas:', e);
    }

    // 3. Merge Local + DB by ID
    const map = new Map<string, SchoolAta>();
    localAtas.forEach(a => map.set(a.id, a));
    dbAtas.forEach(a => map.set(a.id, a));

    const mergedList = Array.from(map.values()).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return (b.number || 0) - (a.number || 0);
    });

    setAtas(mergedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedList));

    // 4. Fetch Staff members to easily populate participants
    try {
      const { data: staffData } = await supabase.from('staff').select('name, function_role, role').order('name');
      if (staffData && staffData.length > 0) {
        setStaffList(staffData.map((s: any) => ({
          name: (s.name || '').trim().toUpperCase(),
          role: s.function_role || s.role || 'Servidor(a)'
        })));
      }
    } catch (e) {
      console.warn('Erro ao buscar lista de servidores:', e);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAtas();
  }, []);

  // Handle AI generation for Minutes
  const handleGenerateAI = async () => {
    if (!aiPromptInput.trim() && !formData.content_deliberations.trim() && !formData.pauta_assunto.trim()) {
      alert('Por favor, digite os tópicos ou fatos da reunião no campo da IA!');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const result = await generateAtaWithAI({
        promptText: aiPromptInput.trim() || formData.content_deliberations.trim(),
        pauta: formData.pauta_assunto,
        category: formData.category,
        location: formData.location,
        date: formData.meeting_date,
        participants: formData.participants.map(p => `${p.name} (${p.role})`),
        tone: aiTone
      });

      if (result) {
        setFormData(prev => ({
          ...prev,
          objectives: result.objectives || prev.objectives,
          content_deliberations: result.deliberations || prev.content_deliberations,
          forwarding_actions: result.forwarding || prev.forwarding_actions
        }));
      }
    } catch (e) {
      console.error('Erro ao gerar redação da ata por IA:', e);
      alert('Erro na comunicação com a IA. Tente novamente.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const tmpl = ATA_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setFormData(prev => ({
        ...prev,
        category: tmpl.category,
        pauta_assunto: tmpl.pauta,
        location: tmpl.location,
        objectives: tmpl.objectives,
        content_deliberations: tmpl.content,
        forwarding_actions: tmpl.forwarding
      }));
    }
  };

  const handleAddParticipant = () => {
    if (!newParticipantName.trim()) return;
    setFormData(prev => ({
      ...prev,
      participants: [
        ...prev.participants,
        { name: newParticipantName.trim().toUpperCase(), role: newParticipantRole.trim() }
      ]
    }));
    setNewParticipantName('');
  };

  const handleAddStaffParticipant = (staffName: string) => {
    if (!staffName) return;
    const staff = staffList.find(s => s.name === staffName);
    if (staff) {
      const alreadyExists = formData.participants.some(p => p.name.toUpperCase() === staff.name.toUpperCase());
      if (!alreadyExists) {
        setFormData(prev => ({
          ...prev,
          participants: [
            ...prev.participants,
            { name: staff.name, role: staff.role }
          ]
        }));
      }
    }
    setSelectedStaffToAdd('');
  };

  const handleRemoveParticipant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  const handleSaveAta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pauta_assunto.trim() || !formData.content_deliberations.trim()) {
      alert('Por favor, preencha a pauta/assunto e as deliberações da ata!');
      return;
    }

    const seqNum = customSequenceNumber ? parseInt(customSequenceNumber) || nextSequenceInfo.number : nextSequenceInfo.number;
    const formattedNum = `${String(seqNum).padStart(3, '0')}/${currentYear}/EECAAMCOL/SEDUC/MT`;

    const newAta: SchoolAta = {
      id: crypto.randomUUID(),
      number: seqNum,
      year: currentYear,
      formatted_number: formattedNum,
      module_source: moduleSource,
      category: formData.category,
      pauta_assunto: formData.pauta_assunto.trim(),
      meeting_date: formData.meeting_date,
      meeting_time_start: formData.meeting_time_start,
      meeting_time_end: formData.meeting_time_end,
      location: formData.location.trim(),
      participants: formData.participants,
      objectives: formData.objectives.trim(),
      content_deliberations: formData.content_deliberations.trim(),
      forwarding_actions: formData.forwarding_actions.trim(),
      signatory_name: formData.signatory_name.trim() || 'Gestão Escolar',
      signatory_role: formData.signatory_role.trim() || 'Responsável',
      signatories: formData.participants,
      created_at: new Date().toISOString()
    };

    // Update local state and localStorage
    const updatedList = [newAta, ...atas];
    setAtas(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

    // Save to Supabase in background (dual sync)
    try {
      const { error: primaryErr } = await supabase.from('school_atas').insert([{
        id: newAta.id,
        number: newAta.number,
        year: newAta.year,
        formatted_number: newAta.formatted_number,
        module_source: newAta.module_source,
        category: newAta.category,
        pauta_assunto: newAta.pauta_assunto,
        meeting_date: newAta.meeting_date,
        meeting_time_start: newAta.meeting_time_start,
        meeting_time_end: newAta.meeting_time_end,
        location: newAta.location,
        participants: newAta.participants,
        objectives: newAta.objectives,
        content_deliberations: newAta.content_deliberations,
        forwarding_actions: newAta.forwarding_actions,
        signatory_name: newAta.signatory_name,
        signatory_role: newAta.signatory_role,
        signatories: newAta.signatories,
        created_at: newAta.created_at
      }]);

      // Always also save to active civic_documents table as secondary cloud sync
      await supabase.from('civic_documents').upsert([{
        id: newAta.id,
        template: 'official_ata',
        date: newAta.created_at,
        timestamp: Date.now(),
        student_name: newAta.formatted_number,
        student_class: newAta.module_source,
        content: newAta
      }], { onConflict: 'id' });

    } catch (e) {
      console.warn('Persistindo ata em localStorage e nuvem:', e);
    }

    setIsModalOpen(false);
    alert(`ATA Nº ${newAta.formatted_number} registrada e arquivada com sucesso!`);
  };

  const handleDeleteAta = async (ata: SchoolAta) => {
    const confirmDel = window.confirm(`Tem certeza que deseja excluir permanentemente a ATA Nº ${ata.formatted_number}?`);
    if (!confirmDel) return;

    const updatedList = atas.filter(a => a.id !== ata.id);
    setAtas(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

    try {
      await supabase.from('school_atas').delete().eq('id', ata.id);
      await supabase.from('civic_documents').delete().eq('id', ata.id);
    } catch (e) {
      console.error('Erro ao excluir ata no Supabase:', e);
    }
  };

  const handlePrintAta = (ata: SchoolAta) => {
    setPrintingAta(ata);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Filtered List
  const filteredAtas = useMemo(() => {
    return atas.filter(a => {
      const matchModule = moduleFilter === 'ALL' || a.module_source === moduleFilter;
      const matchCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term ||
        a.formatted_number.toLowerCase().includes(term) ||
        a.pauta_assunto.toLowerCase().includes(term) ||
        (a.participants && a.participants.some(p => p.name.toLowerCase().includes(term))) ||
        a.signatory_name.toLowerCase().includes(term);
      return matchModule && matchCategory && matchSearch;
    });
  }, [atas, moduleFilter, categoryFilter, searchTerm]);

  const CurrentModuleInfo = MODULE_LABELS[moduleSource] || MODULE_LABELS.CIVICO_MILITAR;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Quick Action */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
            <FileSpreadsheet size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Registro e Lavratura de Atas</h2>
              <span className={`px-3 py-1 text-[9px] font-black rounded-full border uppercase ${CurrentModuleInfo.badgeColor}`}>
                {CurrentModuleInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Escrituração oficial de deliberações, conselhos de classe, atendimentos a pais e alinhamentos cívico-militares.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-100 px-4 py-2.5 rounded-2xl border border-slate-200 text-center flex-1 md:flex-initial">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Próxima Sequencial</span>
            <span className="text-xs font-black text-indigo-700 font-mono">ATA Nº {nextSequenceInfo.formatted}</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 flex-1 md:flex-initial"
          >
            <Plus size={18} /> Lavrar Nova Ata
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center print:hidden">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por número, pauta ou participante..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black uppercase text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="DISCIPLINAR">Alinhamento Disciplinar</option>
            <option value="PEDAGOGICO">Pedagógico</option>
            <option value="PAIS_RESPONSAVEIS">Atendimento a Pais</option>
            <option value="CONSELHO_CLASSE">Conselho de Classe</option>
            <option value="GESTAO_ALINHAMENTO">Alinhamento de Gestão</option>
            <option value="GERAL">Geral / Administrativa</option>
          </select>

          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black uppercase text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">Todos os Módulos ({atas.length})</option>
            <option value="CIVICO_MILITAR">Cívico-Militar</option>
            <option value="COORDENACAO">Coordenação Pedagógica</option>
            <option value="SECRETARIA">Secretaria Escolar</option>
          </select>
        </div>
      </div>

      {/* List / Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px] print:hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-blue-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAtas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400 text-center">
            <FileSpreadsheet size={48} className="mb-4 text-slate-200" />
            <h3 className="text-sm font-black uppercase text-slate-700 tracking-wider">Nenhuma Ata Registrada</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Utilize o botão "Lavrar Nova Ata" acima para redigir o primeiro documento oficial a partir de <strong className="text-blue-600 font-mono">ATA Nº 001/{currentYear}/EECAAMCOL/SEDUC/MT</strong>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-6">Nº da Ata</th>
                  <th className="p-4">Categoria & Origem</th>
                  <th className="p-4">Pauta / Assunto</th>
                  <th className="p-4">Participantes</th>
                  <th className="p-4">Data / Local</th>
                  <th className="p-4 pr-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAtas.map((ata) => {
                  const moduleMeta = MODULE_LABELS[ata.module_source] || MODULE_LABELS.CIVICO_MILITAR;
                  const catMeta = CATEGORY_LABELS[ata.category] || CATEGORY_LABELS.GERAL;
                  const ModuleIcon = moduleMeta.icon;

                  return (
                    <tr key={ata.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 pl-6 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 block max-w-max">
                          ATA Nº {ata.formatted_number}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-lg border uppercase inline-flex items-center gap-1 max-w-max ${catMeta.color}`}>
                            {catMeta.label}
                          </span>
                          <span className={`px-2 py-0.5 text-[8px] font-black rounded-md border uppercase inline-flex items-center gap-1 max-w-max ${moduleMeta.badgeColor}`}>
                            <ModuleIcon size={10} /> {moduleMeta.label}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="text-xs font-black text-slate-900 uppercase leading-snug line-clamp-1">{ata.pauta_assunto}</p>
                        <p className="text-[10px] font-medium text-slate-500 line-clamp-1 mt-0.5">{ata.objectives || ata.content_deliberations}</p>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Users size={14} className="text-blue-500" />
                          <span>{ata.participants?.length || 0} Presentes</span>
                        </div>
                        <p className="text-[9px] font-semibold text-slate-400 uppercase truncate max-w-xs mt-0.5">
                          {ata.participants?.map(p => p.name).slice(0, 2).join(', ')}
                          {(ata.participants?.length || 0) > 2 ? ` (+${(ata.participants?.length || 0) - 2})` : ''}
                        </p>
                      </td>

                      <td className="p-4 whitespace-nowrap text-xs font-bold text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(ata.meeting_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium truncate max-w-[120px] mt-0.5">
                          {ata.meeting_time_start} - {ata.meeting_time_end}
                        </p>
                      </td>

                      <td className="p-4 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingAta(ata)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Visualizar Ata Completa"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handlePrintAta(ata)}
                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                            title="Imprimir Ata Oficial A4"
                          >
                            <Printer size={14} /> Imprimir (PDF)
                          </button>
                          <button
                            onClick={() => handleDeleteAta(ata)}
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

      {/* MODAL DE LAVRATURA DE NOVA ATA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest">Escrituração Oficial SEDUC-MT</span>
                  <h3 className="text-base font-black uppercase tracking-tight font-mono">
                    ATA Nº {customSequenceNumber ? String(customSequenceNumber).padStart(3, '0') : String(nextSequenceInfo.number).padStart(3, '0')}/{currentYear}/EECAAMCOL/SEDUC/MT
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
            <form onSubmit={handleSaveAta} className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {/* Manual Sequence Number Override Bar */}
              <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[9px] font-black text-blue-900 uppercase tracking-widest block">Número Sequencial da Ata</span>
                  <p className="text-xs font-semibold text-slate-600">Altere o número sequencial caso queira ajustar o controle numérico manual.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-900 font-mono">ATA Nº</span>
                  <input
                    type="number"
                    min="1"
                    value={customSequenceNumber}
                    onChange={e => setCustomSequenceNumber(e.target.value)}
                    className="w-24 p-2 bg-white border border-blue-200 rounded-xl text-center font-mono font-black text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <span className="text-xs font-mono font-bold text-slate-500">/{currentYear}</span>
                </div>
              </div>

              {/* Templates Quick Select */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> Modelos Rápidos de Reunião e Atas (Opcional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {ATA_TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleApplyTemplate(t.id)}
                      className="p-3 text-left bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl transition-all group"
                    >
                      <p className="text-xs font-black text-slate-800 uppercase group-hover:text-blue-600 line-clamp-1">{t.title}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase truncate mt-0.5">{t.pauta}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ASSISTENTE DE REDAÇÃO DE ATAS POR IA */}
              <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-5 rounded-3xl border border-blue-500/20 text-white space-y-3 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30 shrink-0">
                      <Sparkles size={18} className="text-amber-400 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-blue-200 flex items-center gap-2">
                        Redação Inteligente de Ata por IA <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">SEDUC-MT IA</span>
                      </h4>
                      <p className="text-[10px] text-slate-300 font-medium">Digite os tópicos ou resumo do que foi dito e a IA gera a redação formal, deliberações e encaminhamentos.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <select
                      value={aiTone}
                      onChange={e => setAiTone(e.target.value as any)}
                      className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase text-blue-200 outline-none focus:bg-slate-900"
                    >
                      <option value="PADRAO" className="bg-slate-900 text-white">Tom: Padrão Oficial</option>
                      <option value="DISCIPLINAR" className="bg-slate-900 text-white">Tom: Cívico-Disciplinar</option>
                      <option value="PEDAGOGICO" className="bg-slate-900 text-white">Tom: Pedagógico</option>
                      <option value="CONCILIADOR" className="bg-slate-900 text-white">Tom: Conciliador / Mediação</option>
                      <option value="DELIBERATIVO" className="bg-slate-900 text-white">Tom: Deliberativo</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Ex: reunião com o pai do aluno Pedro do 9º A sobre faltas e indisciplina; pai se comprometeu a acompanhar tarefas diárias"
                    value={aiPromptInput}
                    onChange={e => setAiPromptInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleGenerateAI(); } }}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-xs text-white placeholder-slate-400 outline-none focus:bg-white/20 focus:border-blue-400 transition-all font-medium"
                  />

                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI || (!aiPromptInput.trim() && !formData.content_deliberations.trim())}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap shrink-0 active:scale-95"
                  >
                    {isGeneratingAI ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Lavrando Ata...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Redigir Ata c/ IA
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Informações Básicas da Sessão */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Pauta / Assunto Principal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Reunião de Alinhamento Disciplinar com Responsáveis Legais"
                    value={formData.pauta_assunto}
                    onChange={e => setFormData({ ...formData, pauta_assunto: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Categoria da Sessão *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 uppercase"
                  >
                    <option value="DISCIPLINAR">Alinhamento Disciplinar</option>
                    <option value="PEDAGOGICO">Acompanhamento Pedagógico</option>
                    <option value="PAIS_RESPONSAVEIS">Atendimento a Pais / Família</option>
                    <option value="CONSELHO_CLASSE">Conselho de Classe</option>
                    <option value="GESTAO_ALINHAMENTO">Alinhamento de Gestão</option>
                    <option value="GERAL">Geral / Administrativa</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Data da Reunião *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.meeting_date}
                    onChange={e => setFormData({ ...formData, meeting_date: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Horário de Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.meeting_time_start}
                    onChange={e => setFormData({ ...formData, meeting_time_start: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Horário de Término *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.meeting_time_end}
                    onChange={e => setFormData({ ...formData, meeting_time_end: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Local de Realização *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sala de Coordenação / Gabinete Cívico-Militar • EE Cívico-Militar André Maggi"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* GESTÃO DE PARTICIPANTES / PRESENTES */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Users size={16} className="text-blue-600" /> Participantes Presentes ({formData.participants.length})
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">Todos os participantes terão linha de assinatura individual gerada na Ata oficial.</p>
                  </div>

                  {staffList.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-400">Add Servidor RH:</span>
                      <select
                        value={selectedStaffToAdd}
                        onChange={e => handleAddStaffParticipant(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase text-slate-700 outline-none"
                      >
                        <option value="">Selecionar Servidor...</option>
                        {staffList.map(s => (
                          <option key={s.name} value={s.name}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Manual Add Participant */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Nome completo do participante (ex: Maria da Silva / Aluno / Responsável)"
                    value={newParticipantName}
                    onChange={e => setNewParticipantName(e.target.value)}
                    className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-900 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Cargo / Relação (ex: Mãe / Pai / Prof. Matemática / Aluno)"
                    value={newParticipantRole}
                    onChange={e => setNewParticipantRole(e.target.value)}
                    className="w-full sm:w-56 p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddParticipant}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 shrink-0"
                  >
                    <UserPlus size={16} /> Adicionar
                  </button>
                </div>

                {/* Participants Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                  {formData.participants.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                      <div className="truncate pr-2">
                        <p className="text-xs font-black uppercase text-slate-800 truncate">{p.name}</p>
                        <p className="text-[9px] font-bold uppercase text-blue-600">{p.role}</p>
                      </div>
                      {formData.participants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(idx)}
                          className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Objetivos */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Objetivos e Finalidade da Reunião
                </label>
                <textarea
                  rows={2}
                  value={formData.objectives}
                  onChange={e => setFormData({ ...formData, objectives: e.target.value })}
                  placeholder="Descreva brevemente a finalidade pela qual a sessão foi convocada..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 leading-relaxed"
                ></textarea>
              </div>

              {/* Discussões e Deliberações */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    Registro dos Fatos, Discussões e Deliberações *
                  </label>
                  {formData.content_deliberations.trim() && (
                    <button
                      type="button"
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI}
                      className="text-[9px] font-black text-blue-600 hover:underline uppercase flex items-center gap-1"
                    >
                      <Wand2 size={12} /> Refinar Redação com IA
                    </button>
                  )}
                </div>
                <textarea
                  required
                  rows={6}
                  value={formData.content_deliberations}
                  onChange={e => setFormData({ ...formData, content_deliberations: e.target.value })}
                  placeholder="Escreva detalhadamente o que foi tratado, manifestações dos presentes e deliberações..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 leading-relaxed"
                ></textarea>
              </div>

              {/* Encaminhamentos e Prazos */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  Encaminhamentos, Prazos e Responsabilidades
                </label>
                <textarea
                  rows={3}
                  value={formData.forwarding_actions}
                  onChange={e => setFormData({ ...formData, forwarding_actions: e.target.value })}
                  placeholder="Ex: 1. Acompanhamento semanal de tarefas pela coordenação; 2. Retorno com a família em 15 dias..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 leading-relaxed"
                ></textarea>
              </div>

              {/* Responsável pela Lavratura */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Quem Presidiu / Lavrou a Ata *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.signatory_name}
                    onChange={e => setFormData({ ...formData, signatory_name: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Cargo / Função do Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.signatory_role}
                    onChange={e => setFormData({ ...formData, signatory_role: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100"
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
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-600/20"
                >
                  Efetivar e Registrar Ata
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DETALHADA DA ATA */}
      {viewingAta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest">Documento Arquivado</span>
                  <h3 className="text-base font-black uppercase tracking-tight font-mono">
                    ATA Nº {viewingAta.formatted_number}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    handlePrintAta(viewingAta);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Printer size={14} /> Imprimir A4
                </button>
                <button 
                  onClick={() => setViewingAta(null)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar text-slate-800">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Data</span>
                  <span className="font-bold">{new Date(viewingAta.meeting_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Horário</span>
                  <span className="font-bold">{viewingAta.meeting_time_start} às {viewingAta.meeting_time_end}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Categoria</span>
                  <span className="font-bold uppercase">{CATEGORY_LABELS[viewingAta.category]?.label || viewingAta.category}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Módulo</span>
                  <span className="font-bold uppercase">{MODULE_LABELS[viewingAta.module_source]?.label || viewingAta.module_source}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pauta / Assunto</h4>
                <p className="text-sm font-black uppercase text-slate-900 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {viewingAta.pauta_assunto}
                </p>
              </div>

              {viewingAta.objectives && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Objetivos</h4>
                  <p className="text-xs font-medium text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 leading-relaxed">
                    {viewingAta.objectives}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Participantes Presentes</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingAta.participants?.map((p, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-100 rounded-xl text-xs font-bold uppercase">
                      {p.name} <span className="text-[9px] font-medium text-blue-600">({p.role})</span>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Discussões e Deliberações</h4>
                <div className="text-xs font-medium text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                  {viewingAta.content_deliberations}
                </div>
              </div>

              {viewingAta.forwarding_actions && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Encaminhamentos e Prazos</h4>
                  <div className="text-xs font-medium text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                    {viewingAta.forwarding_actions}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Lavrado por</span>
                  <span className="font-bold uppercase text-slate-900">{viewingAta.signatory_name}</span>
                  <span className="text-slate-500 block text-[10px] uppercase">{viewingAta.signatory_role}</span>
                </div>
                <button
                  onClick={() => setViewingAta(null)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ÁREA DE IMPRESSÃO OFICIAL DA ATA (PDF / A4 COM TIMBRES ESTADUAIS) */}
      {printingAta && (
        <div className="print-ata-area">
          <div className="pdf-page p-6 sm:p-8 flex flex-col justify-between" style={{ fontFamily: 'Times New Roman, Georgia, serif', color: '#000000' }}>
            
            <div className="flex-1 flex flex-col justify-start">
              {/* Cabeçalho Oficial com Brasão MT à Esquerda e Logo Cívico-Militar à Direita */}
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                <img 
                  src="/brasao_mt.png" 
                  alt="Brasão do Estado de Mato Grosso" 
                  className="h-24 w-auto object-contain shrink-0 max-h-[90px]" 
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
                  className="h-28 w-auto object-contain shrink-0 max-h-[110px]" 
                  onError={(e) => (e.currentTarget.src = '/logo-escola.png')} 
                />
              </div>

              {/* Título Oficial Centralizado */}
              <div className="text-center mb-4">
                <p className="text-sm font-bold uppercase font-mono text-black tracking-wider">
                  ATA DE REUNIÃO Nº {printingAta.formatted_number}
                </p>
                <p className="text-xs font-bold uppercase text-black mt-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {CATEGORY_LABELS[printingAta.category]?.label || 'REGISTRO DE DELIBERAÇÃO ESCOLAR'}
                </p>
              </div>

              {/* Preâmbulo Formal em Extenso */}
              {(() => {
                const dateObj = new Date(printingAta.meeting_date + 'T00:00:00');
                const day = dateObj.getDate();
                const dayStr = numberToWordsPtBr(day);
                const month = dateObj.toLocaleDateString('pt-BR', { month: 'long' });
                const year = dateObj.getFullYear();
                const yearStr = numberToWordsPtBr(year);

                return (
                  <div className="mb-3 text-[13px] leading-relaxed text-justify text-black font-normal" style={{ textIndent: '1.5rem' }}>
                    Aos {dayStr} ({day}) dias do mês de {month} do ano de dois mil e vinte e seis ({year}), às {printingAta.meeting_time_start} horas, reuniram-se nas dependências da {printingAta.location}, sob a condução de {printingAta.signatory_name} ({printingAta.signatory_role}), os membros e interessados abaixo nominados, a fim de deliberar acerca da seguinte pauta: <strong>{printingAta.pauta_assunto}</strong>.
                  </div>
                );
              })()}

              {/* Finalidade e Objetivos */}
              {printingAta.objectives && (
                <div className="mb-3 text-[13px] leading-relaxed text-justify text-black font-normal">
                  <p className="font-bold text-[12px] uppercase mb-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>1. DA FINALIDADE E OBJETIVOS:</p>
                  <p style={{ textIndent: '1.5rem' }}>{printingAta.objectives}</p>
                </div>
              )}

              {/* Presentes */}
              <div className="mb-3 text-[13px] leading-relaxed text-black font-normal">
                <p className="font-bold text-[12px] uppercase mb-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>2. DOS PARTICIPANTES PRESENTES:</p>
                <p style={{ textIndent: '1.5rem' }}>
                  {printingAta.participants?.map((p, idx) => `${p.name} (${p.role})`).join('; ') || 'Participantes registrados em folha anexa.'}.
                </p>
              </div>

              {/* Discussões e Deliberações */}
              <div className="mb-3 text-[13px] leading-relaxed text-justify text-black font-normal">
                <p className="font-bold text-[12px] uppercase mb-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>3. DO RELATO DOS FATOS, DISCUSSÕES E DELIBERAÇÕES:</p>
                <div className="space-y-2">
                  {printingAta.content_deliberations.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} style={{ textIndent: '1.5rem' }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Encaminhamentos */}
              {printingAta.forwarding_actions && (
                <div className="mb-3 text-[13px] leading-relaxed text-justify text-black font-normal">
                  <p className="font-bold text-[12px] uppercase mb-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>4. DOS ENCAMINHAMENTOS E COMPROMISSOS FIRMADOS:</p>
                  <div className="space-y-1">
                    {printingAta.forwarding_actions.split('\n').filter(l => l.trim()).map((line, idx) => (
                      <p key={idx} style={{ textIndent: '1.5rem' }}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Fecho Formal da Ata */}
              <div className="mb-4 text-[13px] leading-relaxed text-justify text-black font-normal" style={{ textIndent: '1.5rem' }}>
                Nada mais havendo a tratar, a sessão foi dada por encerrada às {printingAta.meeting_time_end} horas. Eu, <strong>{printingAta.signatory_name}</strong> ({printingAta.signatory_role}), lavrei a presente ata que, após lida e achada conforme por todos os presentes, vai por estes devidamente assinada.
              </div>

              {/* Bloco de Assinaturas Estruturado */}
              <div className="mt-4 pt-2 border-t border-black/30">
                <p className="text-[10px] font-bold uppercase text-center mb-4 tracking-wider" style={{ fontFamily: 'Arial, sans-serif' }}>
                  ASSINATURAS DOS PARTICIPANTES PRESENTES
                </p>

                <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-center text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {/* Responsável Principal */}
                  <div className="border-t border-black pt-1">
                    <p className="font-bold uppercase text-[11px]">{printingAta.signatory_name}</p>
                    <p className="text-[9px] uppercase font-medium">{printingAta.signatory_role}</p>
                    <p className="text-[8px] uppercase text-black/70">EE Cívico-Militar André Antônio Maggi</p>
                  </div>

                  {/* Demais Participantes */}
                  {printingAta.participants
                    ?.filter(p => p.name.toUpperCase() !== printingAta.signatory_name.toUpperCase())
                    .map((p, idx) => (
                      <div key={idx} className="border-t border-black pt-1">
                        <p className="font-bold uppercase text-[11px] truncate">{p.name}</p>
                        <p className="text-[9px] uppercase font-medium truncate">{p.role}</p>
                        <p className="text-[8px] uppercase text-black/70">Participante Presente</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Rodapé Oficial SEDUC-MT / EE Cívico-Militar */}
            <div className="print-footer-address mt-auto pt-3 border-t border-black/40 grid grid-cols-2 gap-4 text-[8.5px] leading-tight text-black" style={{ color: '#000000', fontFamily: 'Arial, sans-serif' }}>
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

      {/* Estilos CSS de Impressão Oficial */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media screen {
          .print-ata-area { display: none !important; }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 12mm 12mm !important;
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
          .print-ata-area, .print-ata-area * { visibility: visible !important; }
          .print-ata-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            min-height: 275mm !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: white !important;
            color: black !important;
            box-sizing: border-box !important;
            padding: 0 !important;
          }
          .pdf-page { 
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            min-height: 275mm !important;
            height: 100% !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 0 0 5mm 0 !important;
            margin: 0 !important;
            position: relative !important;
          }
          .print-footer-address {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            background: white !important;
          }
        }
      `}} />

    </div>
  );
};

export default OfficialAtasManager;
