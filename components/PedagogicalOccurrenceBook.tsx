import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  History,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  Clock,
  FileText,
  User,
  Users,
  MapPin,
  Sparkles,
  ArrowLeft,
  Loader2,
  Send,
  X,
  Printer,
  ArrowRightLeft,
  MessageSquare,
  Eye,
  Shield,
  HeartHandshake,
  BrainCircuit,
  GraduationCap,
  Calendar,
  Layers,
  ChevronDown,
  PhoneCall,
  Scale
} from 'lucide-react';
import { useToast } from './Toast';
import { supabase } from '../supabaseClient';
import PsychosocialCircumstantiatedReportManager from './PsychosocialCircumstantiatedReportManager';

interface PedagogicalOccurrenceBookProps {
  user?: any;
}

export type SectorType = 'COORDENACAO_PEDAGOGICA' | 'CIVICO_MILITAR' | 'PSICOSSOCIAL_MEDIACAO' | 'BUSCA_ATIVA' | 'AEE_SPECIAL_ED';

export interface OccurrenceItem {
  id: string;
  date: string;
  time: string;
  studentName: string;
  className: string;
  location?: string;
  description: string;
  responsibleName: string;
  category: string;
  severity: 'LEVE' | 'MÉDIA' | 'ALTA' | 'CRÍTICA';
  status: 'PENDENTE' | 'EM_ATENDIMENTO' | 'RESOLVIDO' | 'TRAMITADO';
  targetDept: SectorType;
  feedback?: string;
  actionTaken?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  timestamp: number;
}

const PedagogicalOccurrenceBook: React.FC<PedagogicalOccurrenceBookProps> = ({ user }) => {
  const { addToast } = useToast();
  
  // Abas Principais
  const [activeTab, setActiveTab] = useState<'RESOLUTION' | 'OTHER_SECTORS' | 'RADAR' | 'METRICS' | 'CIRCUMSTANTIATED_REPORTS'>('RESOLUTION');
  
  // Dados
  const [occurrences, setOccurrences] = useState<OccurrenceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('TODAS');
  const [filterSeverity, setFilterSeverity] = useState('TODAS');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [filterSector, setFilterSector] = useState<string>('TODOS');

  // Modais de Ação
  const [actionModalOcc, setActionModalOcc] = useState<OccurrenceItem | null>(null);
  const [actionStatus, setActionStatus] = useState<'RESOLVIDO' | 'EM_ATENDIMENTO'>('RESOLVIDO');
  const [actionType, setActionType] = useState('Escuta Pedagógica com o Estudante');
  const [actionFeedback, setActionFeedback] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Modal de Tramitação
  const [tramitateModalOcc, setTramitateModalOcc] = useState<OccurrenceItem | null>(null);
  const [tramitateTarget, setTramitateTarget] = useState<SectorType>('CIVICO_MILITAR');
  const [tramitateReason, setTramitateReason] = useState('');
  const [isSubmittingTramitate, setIsSubmittingTramitate] = useState(false);

  // Modal de Impressão Oficial (Convocação de Pais ou Termo de Compromisso)
  const [printingDoc, setPrintingDoc] = useState<{
    type: 'CONVOCACAO_PAIS' | 'TERMO_COMPROMISSO';
    occ: OccurrenceItem;
  } | null>(null);

  // Aluno inicial para Dossiê Circunstanciado
  const [circumstantiatedInitialStudent, setCircumstantiatedInitialStudent] = useState<string | null>(null);

  // Carregar Ocorrências do Supabase
  const fetchOccurrences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: OccurrenceItem[] = data.map(o => {
          let dept: SectorType = 'COORDENACAO_PEDAGOGICA';
          const catUpper = (o.category || '').toUpperCase();
          const descUpper = (o.description || '').toUpperCase();
          
          if (descUpper.includes('[SETOR: CIVICO_MILITAR]') || catUpper.includes('MILITAR') || catUpper.includes('FATO OBSERVADO') || ['INDISCIPLINA', 'DESCUMPRIMENTO_REGRAS'].includes(catUpper)) {
            dept = 'CIVICO_MILITAR';
          } else if (descUpper.includes('[SETOR: PSICOSSOCIAL]') || catUpper.includes('PSICOSSOCIAL') || catUpper.includes('MEDIAÇÃO') || catUpper.includes('VULNERABILIDADE') || catUpper.includes('CONFLITO')) {
            dept = 'PSICOSSOCIAL_MEDIACAO';
          } else if (descUpper.includes('[SETOR: BUSCA_ATIVA]') || catUpper.includes('BUSCA') || catUpper.includes('FALTA')) {
            dept = 'BUSCA_ATIVA';
          } else if (descUpper.includes('[SETOR: AEE]') || catUpper.includes('AEE') || catUpper.includes('ESPECIAL')) {
            dept = 'AEE_SPECIAL_ED';
          }

          let itemStatus: OccurrenceItem['status'] = 'PENDENTE';
          const rawStatus = (o.status || '').toUpperCase();
          if (rawStatus === 'RESOLVIDO' || rawStatus === 'CONCLUÍDO' || rawStatus === 'RESOLVIDA') {
            itemStatus = 'RESOLVIDO';
          } else if (rawStatus === 'EM_ATENDIMENTO' || rawStatus === 'EM ANDAMENTO') {
            itemStatus = 'EM_ATENDIMENTO';
          } else if (rawStatus === 'TRAMITADO' || rawStatus === 'ENCAMINHADO') {
            itemStatus = 'TRAMITADO';
          }

          // Extrair Devolutiva e Metadados do Description
          let parsedFeedback: string | undefined = undefined;
          let parsedResolvedBy = 'Coordenação Pedagógica';
          let parsedResolvedAt = '';
          let cleanDescription = o.description || '';

          if (o.description && o.description.includes('[DEVOLUTIVA')) {
            const match = o.description.match(/\[DEVOLUTIVA (?:DA COORDENAÇÃO|DA GESTÃO)?\s*(?:-\s*([^\]]+))?\]:?([\s\S]*)/i);
            if (match) {
              cleanDescription = (o.description.split(/\[DEVOLUTIVA/i)[0] || '').trim();
              parsedResolvedAt = match[1] ? match[1].trim() : '';
              parsedFeedback = (match[2] || '').trim();
            }
          }

          return {
            id: o.id,
            date: o.date,
            time: o.time || '10:00',
            studentName: o.student_name || 'Estudante',
            className: o.classroom_name || 'N/A',
            location: o.location || 'SALA DE AULA',
            description: cleanDescription,
            responsibleName: o.responsible_name || 'Professor(a)',
            category: o.category || 'ACOMPANHAMENTO PEDAGÓGICO',
            severity: (o.severity || 'LEVE') as any,
            status: itemStatus,
            targetDept: dept,
            feedback: parsedFeedback,
            actionTaken: undefined,
            resolvedBy: parsedResolvedBy,
            resolvedAt: parsedResolvedAt || 'Concluído',
            timestamp: new Date((o.date || '2026-08-29') + 'T' + (o.time || '10:00')).getTime()
          };
        });

        setOccurrences(mapped);
      }
    } catch (e) {
      console.error('Erro ao buscar ocorrências:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOccurrences();

    const sub = supabase.channel('occurrences_book_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, () => {
        fetchOccurrences();
      })
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, []);

  // Lista de Turmas Únicas
  const uniqueClasses = useMemo(() => {
    const set = new Set(occurrences.map(o => o.className).filter(Boolean));
    return Array.from(set).sort();
  }, [occurrences]);

  // Separação por Competência: Fila da Coordenação vs Outros Setores
  const coordinationOccurrences = useMemo(() => {
    return occurrences.filter(o => o.targetDept === 'COORDENACAO_PEDAGOGICA');
  }, [occurrences]);

  const otherSectorsOccurrences = useMemo(() => {
    return occurrences.filter(o => o.targetDept !== 'COORDENACAO_PEDAGOGICA');
  }, [occurrences]);

  // Alunos Reincidentes (2 ou mais ocorrências no total)
  const reincidenteStudents = useMemo(() => {
    const map: Record<string, { studentName: string; className: string; occurrences: OccurrenceItem[] }> = {};
    occurrences.forEach(o => {
      const key = `${o.studentName.trim().toUpperCase()}_${o.className}`;
      if (!map[key]) {
        map[key] = { studentName: o.studentName, className: o.className, occurrences: [] };
      }
      map[key].occurrences.push(o);
    });

    return Object.values(map)
      .filter(item => item.occurrences.length >= 2)
      .sort((a, b) => b.occurrences.length - a.occurrences.length);
  }, [occurrences]);

  // Filtragem dos Cards da Fila da Coordenação
  const filteredCoordinationList = useMemo(() => {
    return coordinationOccurrences.filter(o => {
      const matchSearch = !searchTerm ||
        o.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.responsibleName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = filterClass === 'TODAS' || o.className === filterClass;
      const matchSev = filterSeverity === 'TODAS' || o.severity === filterSeverity;
      const matchStat = filterStatus === 'TODOS' || o.status === filterStatus;
      return matchSearch && matchClass && matchSev && matchStat;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [coordinationOccurrences, searchTerm, filterClass, filterSeverity, filterStatus]);

  // Filtragem dos Cards de Outros Setores
  const filteredOtherSectorsList = useMemo(() => {
    return otherSectorsOccurrences.filter(o => {
      const matchSearch = !searchTerm ||
        o.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.responsibleName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = filterClass === 'TODAS' || o.className === filterClass;
      const matchSev = filterSeverity === 'TODAS' || o.severity === filterSeverity;
      const matchStat = filterStatus === 'TODOS' || o.status === filterStatus;
      const matchSector = filterSector === 'TODOS' || o.targetDept === filterSector;
      return matchSearch && matchClass && matchSev && matchStat && matchSector;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [otherSectorsOccurrences, searchTerm, filterClass, filterSeverity, filterStatus, filterSector]);

  // Ação: Salvar Devolutiva e Intervenção da Coordenação
  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModalOcc) return;
    if (!actionFeedback.trim()) {
      alert('Por favor, descreva a providência tomada ou parecer para registrar a devolutiva.');
      return;
    }

    setIsSubmittingAction(true);
    const nowStr = new Date().toLocaleString('pt-BR');
    const coordName = user?.name || 'Coordenação Pedagógica';

    try {
      const feedbackBlock = `\n\n[DEVOLUTIVA DA COORDENAÇÃO - ${nowStr} por ${coordName.toUpperCase()}]:\n[${actionType.toUpperCase()}]\n${actionFeedback.trim()}`;
      const baseDesc = (actionModalOcc.description || '').split('\n\n[DEVOLUTIVA')[0];
      const newFullDescription = `${baseDesc}${feedbackBlock}`;

      const { error } = await supabase
        .from('occurrences')
        .update({
          status: actionStatus,
          description: newFullDescription
        })
        .eq('id', actionModalOcc.id);

      if (error) throw error;

      addToast({
        title: 'Sucesso!',
        message: 'Devolutiva registrada com sucesso e enviada ao professor!',
        type: 'success'
      });

      setActionModalOcc(null);
      setActionFeedback('');
      fetchOccurrences();
    } catch (err) {
      console.error(err);
      addToast({ title: 'Erro', message: 'Erro ao salvar devolutiva da ocorrência.', type: 'error' });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Ação: Tramitar para Outro Setor
  const handleSaveTramitate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tramitateModalOcc) return;
    if (!tramitateReason.trim()) {
      alert('Por favor, informe a justificativa da tramitação setorial.');
      return;
    }

    setIsSubmittingTramitate(true);
    const coordName = user?.name || 'Coordenação Pedagógica';
    const nowStr = new Date().toLocaleString('pt-BR');

    try {
      const tramitationLog = `\n\n[TRAMITADO PELA COORDENAÇÃO - ${nowStr} por ${coordName.toUpperCase()} para ${getSectorLabel(tramitateTarget).toUpperCase()}]: ${tramitateReason.trim()}`;
      const baseDesc = (tramitateModalOcc.description || '').split('\n\n[TRAMITADO')[0];
      const newDescription = `${baseDesc}\n[SETOR: ${tramitateTarget}]${tramitationLog}`;

      let newCategory = tramitateModalOcc.category;
      if (tramitateTarget === 'CIVICO_MILITAR') newCategory = 'FATO OBSERVADO';
      else if (tramitateTarget === 'PSICOSSOCIAL_MEDIACAO') newCategory = 'MEDIAÇÃO / PSICOSSOCIAL';
      else if (tramitateTarget === 'BUSCA_ATIVA') newCategory = 'BUSCA_ATIVA';
      else if (tramitateTarget === 'AEE_SPECIAL_ED') newCategory = 'EDUCAÇÃO ESPECIAL / PAEDE';

      const { error } = await supabase
        .from('occurrences')
        .update({
          category: newCategory,
          status: 'TRAMITADO',
          description: newDescription
        })
        .eq('id', tramitateModalOcc.id);

      if (error) throw error;

      // Integração Direta EXCLUSIVA com Módulo de Mediação Escolar (Triagem e Escuta)
      if (tramitateTarget === 'PSICOSSOCIAL_MEDIACAO') {
        try {
          await supabase.from('mediation_cases').insert([{
            student_id: 'N/A',
            student_name: tramitateModalOcc.studentName,
            class_name: tramitateModalOcc.className,
            type: 'CONFLITO',
            severity: tramitateModalOcc.severity === 'CRÍTICA' ? 'CRÍTICA' : (tramitateModalOcc.severity === 'ALTA' ? 'ALTA' : 'MÉDIA'),
            status: 'ABERTURA',
            opened_at: new Date().toISOString().split('T')[0],
            description: newDescription,
            involved_parties: [coordName, tramitateModalOcc.responsibleName],
            steps: [
              { id: '1', label: 'Encaminhado pela Coordenação Pedagógica', completed: true, date: new Date().toISOString().split('T')[0] },
              { id: '2', label: 'Escuta das Partes / Aluno', completed: false },
              { id: '3', label: 'Círculo de Mediação / Paz', completed: false },
              { id: '4', label: 'Acordo / Finalização', completed: false }
            ]
          }]);
        } catch (e) {
          console.warn('Erro ao sincronizar caso de mediação:', e);
        }
      }

      // Integração Direta com Gestão Cívico-Militar
      if (tramitateTarget === 'CIVICO_MILITAR') {
        try {
          const savedDocs = localStorage.getItem('civico_militar_documentos_v2');
          let docsList = [];
          if (savedDocs) {
            try { docsList = JSON.parse(savedDocs); } catch (e) {}
          }
          docsList.unshift({
            id: `doc-tram-${Date.now()}`,
            studentId: 'AUTO',
            studentName: tramitateModalOcc.studentName,
            className: tramitateModalOcc.className,
            shiftName: 'MATUTINO/VESPERTINO',
            template: 'fato_observado',
            templateLabel: 'Fato Observado (Via Coordenação)',
            date: new Date().toISOString().split('T')[0],
            fields: {
              date: new Date().toISOString().split('T')[0],
              teacher: coordName,
              series: tramitateModalOcc.className,
              discipline: tramitateModalOcc.category,
              achado: newDescription,
              city: 'Colíder - MT'
            },
            timestamp: Date.now()
          });
          localStorage.setItem('civico_militar_documentos_v2', JSON.stringify(docsList));
        } catch (e) {}
      }

      addToast({
        title: 'Tramitado com Sucesso!',
        message: `Ocorrência transferida para ${getSectorLabel(tramitateTarget)}.`,
        type: 'info'
      });

      setTramitateModalOcc(null);
      setTramitateReason('');
      fetchOccurrences();
    } catch (err) {
      console.error(err);
      addToast({ title: 'Erro', message: 'Erro ao tramitar ocorrência.', type: 'error' });
    } finally {
      setIsSubmittingTramitate(false);
    }
  };

  // Deletar Ocorrência
  const handleDeleteOcc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir permanentemente esta ocorrência?')) return;
    try {
      const { error } = await supabase.from('occurrences').delete().eq('id', id);
      if (error) throw error;
      addToast({ title: 'Excluído', message: 'Registro de ocorrência removido.', type: 'info' });
      fetchOccurrences();
    } catch (err) {
      console.error(err);
      addToast({ title: 'Erro', message: 'Falha ao excluir ocorrência.', type: 'error' });
    }
  };

  const getSectorLabel = (dept: SectorType) => {
    switch (dept) {
      case 'COORDENACAO_PEDAGOGICA': return 'Coordenação Pedagógica';
      case 'CIVICO_MILITAR': return 'Corpo Militar (Disciplina)';
      case 'PSICOSSOCIAL_MEDIACAO': return 'Equipe Psicossocial';
      case 'BUSCA_ATIVA': return 'Secretaria / Busca Ativa';
      case 'AEE_SPECIAL_ED': return 'Educação Especial (AEE)';
      default: return 'Coordenação';
    }
  };

  const getSectorBadge = (dept: SectorType) => {
    switch (dept) {
      case 'COORDENACAO_PEDAGOGICA':
        return <span className="px-3 py-1 bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5"><GraduationCap size={13} /> Coordenação Pedagógica</span>;
      case 'CIVICO_MILITAR':
        return <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5"><Shield size={13} /> Gestão Cívico-Militar</span>;
      case 'PSICOSSOCIAL_MEDIACAO':
        return <span className="px-3 py-1 bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5"><HeartHandshake size={13} /> Mediação / Psicossocial</span>;
      case 'BUSCA_ATIVA':
        return <span className="px-3 py-1 bg-rose-100 text-rose-900 border border-rose-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5"><PhoneCall size={13} /> Secretaria / Busca Ativa</span>;
      case 'AEE_SPECIAL_ED':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5"><BrainCircuit size={13} /> Sala de Recursos (AEE)</span>;
    }
  };

  const getStatusBadge = (status: OccurrenceItem['status']) => {
    switch (status) {
      case 'PENDENTE':
        return <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><Clock size={12} /> Aguardando Ação</span>;
      case 'EM_ATENDIMENTO':
        return <span className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><User size={12} /> Em Atendimento</span>;
      case 'RESOLVIDO':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><CheckCircle2 size={12} /> Resolvido / Devolutiva Pronta</span>;
      case 'TRAMITADO':
        return <span className="px-3 py-1 bg-purple-50 text-purple-900 border border-purple-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><ArrowRightLeft size={12} /> Tramitado de Setor</span>;
    }
  };

  const getSeverityBadge = (sev: OccurrenceItem['severity']) => {
    switch (sev) {
      case 'LEVE':
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[9px] font-black uppercase">Leve</span>;
      case 'MÉDIA':
        return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-lg text-[9px] font-black uppercase">Média</span>;
      case 'ALTA':
        return <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-lg text-[9px] font-black uppercase">Alta</span>;
      case 'CRÍTICA':
        return <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase animate-pulse">Crítica</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* CABEÇALHO DO LIVRO DE OCORRÊNCIAS */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Livro de Ocorrências & Acompanhamento Integrado
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                Triagem pedagógica, resoluções, devolutivas docentes e monitoramento multissetorial
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl text-right">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Fila da Coordenação</p>
            <p className="text-xl font-black text-slate-900 leading-tight">
              {coordinationOccurrences.filter(o => o.status === 'PENDENTE').length} Pendentes
            </p>
          </div>
        </div>
      </div>

      {/* ABAS SUPERIORES DE NAVEGAÇÃO ESTRATÉGICA */}
      <div className="flex flex-wrap gap-2.5 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveTab('RESOLUTION')}
          className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 ${
            activeTab === 'RESOLUTION'
              ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <GraduationCap size={16} className={activeTab === 'RESOLUTION' ? 'text-indigo-400' : 'text-slate-400'} />
          🎯 Minha Fila de Resolução (Coordenação)
          <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black">
            {coordinationOccurrences.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('OTHER_SECTORS')}
          className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 ${
            activeTab === 'OTHER_SECTORS'
              ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Shield size={16} className={activeTab === 'OTHER_SECTORS' ? 'text-amber-400' : 'text-slate-400'} />
          🏛️ Acompanhamento de Outros Setores
          <span className="px-2 py-0.5 bg-slate-700 text-white rounded-lg text-[10px] font-black">
            {otherSectorsOccurrences.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('RADAR')}
          className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 ${
            activeTab === 'RADAR'
              ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <AlertTriangle size={16} className={activeTab === 'RADAR' ? 'text-rose-400' : 'text-slate-400'} />
          ⚠️ Radar de Alunos Reincidentes
          <span className="px-2 py-0.5 bg-rose-600 text-white rounded-lg text-[10px] font-black">
            {reincidenteStudents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('METRICS')}
          className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 ${
            activeTab === 'METRICS'
              ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Sparkles size={16} className={activeTab === 'METRICS' ? 'text-purple-400' : 'text-slate-400'} />
          📈 Indicadores & Análise
        </button>

        <button
          onClick={() => setActiveTab('CIRCUMSTANTIATED_REPORTS')}
          className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 ${
            activeTab === 'CIRCUMSTANTIATED_REPORTS'
              ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg shadow-rose-600/20'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <Scale size={16} className={activeTab === 'CIRCUMSTANTIATED_REPORTS' ? 'text-white' : 'text-rose-600'} />
          ⚖️ Relatórios Circunstanciados (Conselho/MP)
        </button>
      </div>

      {/* BARRA DE FILTROS RÁPIDOS */}
      {(activeTab === 'RESOLUTION' || activeTab === 'OTHER_SECTORS') && (
        <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por estudante, professor ou relato..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Turma:</span>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
            >
              <option value="TODAS">Todas as Turmas</option>
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="PENDENTE">Aguardando Ação</option>
              <option value="EM_ATENDIMENTO">Em Atendimento</option>
              <option value="RESOLVIDO">Resolvido</option>
              <option value="TRAMITADO">Tramitado</option>
            </select>
          </div>

          {activeTab === 'OTHER_SECTORS' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor:</span>
              <select
                value={filterSector}
                onChange={e => setFilterSector(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:bg-white cursor-pointer text-indigo-900"
              >
                <option value="TODOS">Todos os Setores</option>
                <option value="CIVICO_MILITAR">Corpo Militar (Disciplina)</option>
                <option value="PSICOSSOCIAL_MEDIACAO">Equipe Psicossocial</option>
                <option value="BUSCA_ATIVA">Secretaria / Busca Ativa</option>
                <option value="AEE_SPECIAL_ED">Educação Especial (AEE)</option>
              </select>
            </div>
          )}

          {(searchTerm || filterClass !== 'TODAS' || filterStatus !== 'TODOS' || filterSector !== 'TODOS') && (
            <button
              onClick={() => { setSearchTerm(''); setFilterClass('TODAS'); setFilterStatus('TODOS'); setFilterSector('TODOS'); }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      )}

      {/* ABA 1: MINHA FILA DE RESOLUÇÃO (COORDENAÇÃO PEDAGÓGICA) */}
      {activeTab === 'RESOLUTION' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <GraduationCap className="text-indigo-600" size={18} /> Ocorrências Pedagógicas sob Gestão da Coordenação ({filteredCoordinationList.length})
            </h3>
            <span className="text-xs text-slate-400 font-bold uppercase">
              Clique em "Atender & Devolutiva" para agir e dar retorno ao professor
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <Loader2 className="animate-spin mx-auto mb-2" size={28} />
              <p className="text-xs font-bold uppercase">Carregando Fila de Ocorrências...</p>
            </div>
          ) : filteredCoordinationList.length > 0 ? (
            <div className="grid grid-cols-1 gap-5">
              {filteredCoordinationList.map(occ => (
                <div
                  key={occ.id}
                  className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all space-y-6"
                >
                  {/* Topo do Card */}
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-900 text-base">
                        {occ.studentName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-black text-slate-900 text-base uppercase leading-tight">
                            {occ.studentName}
                          </h4>
                          <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase">
                            {occ.className}
                          </span>
                          {getSeverityBadge(occ.severity)}
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">
                          Relatado por <strong className="text-slate-800">Prof. {occ.responsibleName}</strong> • {occ.date} às {occ.time} • Local: {occ.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(occ.status)}
                    </div>
                  </div>

                  {/* Relato do Professor */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <MessageSquare size={13} className="text-indigo-600" /> Relato Registrado em Sala de Aula:
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                      {occ.description}
                    </div>
                  </div>

                  {/* Bloco de Devolutiva / Parecer da Coordenação (Se Já Atendido) */}
                  {occ.feedback && (
                    <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600" /> Devolutiva Pedagógica Registrada (Visível ao Professor):
                        </span>
                        <span>{occ.resolvedAt} • Por: {occ.resolvedBy}</span>
                      </div>
                      <p className="text-xs text-emerald-950 font-medium leading-relaxed whitespace-pre-line">
                        {occ.feedback}
                      </p>
                    </div>
                  )}

                  {/* Barra de Ações Rápidas da Coordenação */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setActionModalOcc(occ);
                          setActionFeedback(occ.feedback || '');
                          setActionStatus(occ.status === 'RESOLVIDO' ? 'RESOLVIDO' : 'RESOLVIDO');
                        }}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95"
                      >
                        <CheckCircle2 size={15} /> Atender & Devolutiva
                      </button>

                      <button
                        onClick={() => {
                          setTramitateModalOcc(occ);
                          setTramitateReason('');
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <ArrowRightLeft size={14} /> Tramitar Setor
                      </button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setPrintingDoc({ type: 'CONVOCACAO_PAIS', occ })}
                        className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <Printer size={13} /> Convocação de Pais
                      </button>

                      <button
                        onClick={() => setPrintingDoc({ type: 'TERMO_COMPROMISSO', occ })}
                        className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <FileText size={13} /> Termo de Compromisso
                      </button>

                      <button
                        onClick={(e) => handleDeleteOcc(occ.id, e)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Excluir Ocorrência"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest bg-white rounded-[3rem] border border-slate-200">
              Nenhuma ocorrência pedagógica pendente nesta busca
            </div>
          )}
        </div>
      )}

      {/* ABA 2: ACOMPANHAMENTO DE OUTROS SETORES (VISÃO MULTISSETORIAL) */}
      {activeTab === 'OTHER_SECTORS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Shield className="text-amber-500" size={18} /> Ocorrências Destinadas a Outros Setores ({filteredOtherSectorsList.length})
            </h3>
            <span className="text-xs text-slate-400 font-bold uppercase">
              Monitoramento pedagógico de conduta militar, psicossocial e busca ativa
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <Loader2 className="animate-spin mx-auto mb-2" size={28} />
              <p className="text-xs font-bold uppercase">Carregando Ocorrências Multissetoriais...</p>
            </div>
          ) : filteredOtherSectorsList.length > 0 ? (
            <div className="grid grid-cols-1 gap-5">
              {filteredOtherSectorsList.map(occ => (
                <div
                  key={occ.id}
                  className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-800 text-base">
                        {occ.studentName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-black text-slate-900 text-base uppercase leading-tight">
                            {occ.studentName}
                          </h4>
                          <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase">
                            {occ.className}
                          </span>
                          {getSeverityBadge(occ.severity)}
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">
                          Relatado por <strong className="text-slate-800">Prof. {occ.responsibleName}</strong> • {occ.date} às {occ.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {getSectorBadge(occ.targetDept)}
                      {getStatusBadge(occ.status)}
                    </div>
                  </div>

                  {/* Relato do Professor */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <MessageSquare size={13} className="text-amber-500" /> Relato Docente Encaminhado ao Setor:
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                      {occ.description}
                    </div>
                  </div>

                  {/* Providência do Outro Setor (Se Houver) */}
                  {occ.feedback && (
                    <div className="p-5 bg-purple-50 border border-purple-200/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black text-purple-900 uppercase tracking-wider">
                        <span>Parecer do Setor Responsável ({getSectorLabel(occ.targetDept)}):</span>
                        <span>{occ.resolvedAt} • Por: {occ.resolvedBy}</span>
                      </div>
                      <p className="text-xs text-purple-950 font-medium leading-relaxed whitespace-pre-line">
                        {occ.feedback}
                      </p>
                    </div>
                  )}

                  {/* Ações da Coordenação sobre o Caso de Outro Setor */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setTramitateModalOcc(occ);
                          setTramitateReason('');
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <ArrowRightLeft size={14} /> Puxar para Coordenação / Re-tramitar
                      </button>
                    </div>

                    <button
                      onClick={(e) => handleDeleteOcc(occ.id, e)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Excluir Ocorrência"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest bg-white rounded-[3rem] border border-slate-200">
              Nenhuma ocorrência multissetorial encontrada nesta busca
            </div>
          )}
        </div>
      )}

      {/* ABA 3: RADAR DE ALUNOS REINCIDENTES */}
      {activeTab === 'RADAR' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-950 p-8 rounded-[3rem] text-white space-y-2 shadow-xl">
            <span className="px-3.5 py-1 bg-white/10 text-rose-200 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">
              ⚠️ Alerta Preventivo de Reincidência
            </span>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white mt-1">
              Estudantes com Múltiplas Ocorrências ({reincidenteStudents.length} Alunos)
            </h3>
            <p className="text-rose-200 text-xs leading-relaxed max-w-2xl">
              Alunos que acumulam 2 ou mais registros na Coordenação, no Corpo Militar ou no Psicossocial demandam convocação urgente dos responsáveis e elaboração de Plano Individual de Acompanhamento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reincidenteStudents.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-rose-200 shadow-sm space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-black text-slate-900 uppercase leading-tight">
                        {item.studentName}
                      </h4>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">
                        Turma: <strong className="text-slate-700">{item.className}</strong>
                      </p>
                    </div>
                    <span className="px-3.5 py-1.5 bg-rose-100 text-rose-900 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider">
                      {item.occurrences.length} Ocorrências
                    </span>
                  </div>

                  {/* Linha do Tempo Resumida das Ocorrências do Aluno */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico Recente:</p>
                    <div className="space-y-2">
                      {item.occurrences.slice(0, 3).map((occ, oIdx) => (
                        <div key={oIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                            <span>{occ.date} • Prof. {occ.responsibleName}</span>
                            <span className="font-black text-slate-700">{getSectorLabel(occ.targetDept)}</span>
                          </div>
                          <p className="text-slate-800 font-medium line-clamp-2">{occ.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      setSearchTerm(item.studentName);
                      setActiveTab('RESOLUTION');
                    }}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <Eye size={15} /> Ver Ocorrências
                  </button>

                  <button
                    onClick={() => {
                      setCircumstantiatedInitialStudent(item.studentName);
                      setActiveTab('CIRCUMSTANTIATED_REPORTS');
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-600/20"
                  >
                    <Scale size={15} /> ⚡ Dossiê (Conselho/MP)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 4: MÉTRICAS E INDICADORES */}
      {activeTab === 'METRICS' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Ocorrências</p>
              <p className="text-3xl font-black text-slate-900">{occurrences.length}</p>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fila da Coordenação</p>
              <p className="text-3xl font-black text-indigo-600">{coordinationOccurrences.length}</p>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolvidas com Devolutiva</p>
              <p className="text-3xl font-black text-emerald-600">
                {occurrences.filter(o => o.status === 'RESOLVIDO').length}
              </p>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudantes Reincidentes</p>
              <p className="text-3xl font-black text-rose-600">{reincidenteStudents.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* ABA 5: RELATÓRIOS CIRCUNSTANCIADOS (CONSELHO TUTELAR & MINISTÉRIO PÚBLICO) */}
      {activeTab === 'CIRCUMSTANTIATED_REPORTS' && (
        <div className="space-y-6 animate-in fade-in">
          <PsychosocialCircumstantiatedReportManager
            user={user}
            role="COORDENADOR"
            initialStudentName={circumstantiatedInitialStudent || undefined}
          />
        </div>
      )}

      {/* MODAL 1: ATENDER & REGISTRAR DEVOLUTIVA AO PROFESSOR */}
      {actionModalOcc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-8 md:p-10 max-w-2xl w-full border border-slate-100 shadow-2xl space-y-6 animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase">
                  Atendimento da Coordenação Pedagógica
                </span>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-2">
                  {actionModalOcc.studentName} ({actionModalOcc.className})
                </h3>
                <p className="text-xs text-slate-500 font-bold uppercase mt-0.5">
                  Relatado por Prof. {actionModalOcc.responsibleName}
                </p>
              </div>
              <button
                onClick={() => setActionModalOcc(null)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Resumo do Relato */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
              <p className="font-black text-slate-700 uppercase text-[10px]">Relato em Sala:</p>
              <p className="text-slate-800 leading-relaxed font-medium">{actionModalOcc.description}</p>
            </div>

            <form onSubmit={handleSaveAction} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    Status do Atendimento:
                  </label>
                  <select
                    value={actionStatus}
                    onChange={e => setActionStatus(e.target.value as any)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:bg-white"
                  >
                    <option value="RESOLVIDO">Concluir / Resolvido</option>
                    <option value="EM_ATENDIMENTO">Em Atendimento / Em Acompanhamento</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    Tipo de Intervenção Realizada:
                  </label>
                  <select
                    value={actionType}
                    onChange={e => setActionType(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:bg-white"
                  >
                    <option value="Escuta Pedagógica com o Estudante">Escuta Pedagógica com o Estudante</option>
                    <option value="Convocação dos Pais / Responsáveis">Convocação dos Pais / Responsáveis</option>
                    <option value="Acordo de Recomposição de Tarefas">Acordo de Recomposição de Tarefas</option>
                    <option value="Encaminhamento para Reforço Escolar">Encaminhamento para Reforço Escolar</option>
                    <option value="Encaminhamento para Sala de Recursos (AEE)">Encaminhamento para Sala de Recursos (AEE)</option>
                    <option value="Mediação de Conflito em Sala">Mediação de Conflito em Sala</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                  Parecer / Devolutiva Pedagógica (Será visível no painel do Professor):
                </label>
                <textarea
                  rows={4}
                  value={actionFeedback}
                  onChange={e => setActionFeedback(e.target.value)}
                  placeholder="Descreva a providência tomada, combinados com o aluno ou data de reunião com os pais..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 leading-relaxed"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModalOcc(null)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingAction ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Salvar & Enviar Devolutiva ao Professor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TRAMITAR PARA OUTRO SETOR */}
      {tramitateModalOcc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-8 md:p-10 max-w-xl w-full border border-slate-100 shadow-2xl space-y-6 animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="px-3 py-1 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase">
                  Tramitação Multissetorial
                </span>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-2">
                  Transferir Ocorrência
                </h3>
                <p className="text-xs text-slate-500 font-bold uppercase mt-0.5">
                  Estudante: {tramitateModalOcc.studentName} ({tramitateModalOcc.className})
                </p>
              </div>
              <button
                onClick={() => setTramitateModalOcc(null)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTramitate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                  Setor de Destino:
                </label>
                <select
                  value={tramitateTarget}
                  onChange={e => setTramitateTarget(e.target.value as SectorType)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:bg-white"
                >
                  <option value="CIVICO_MILITAR">Corpo de Alunos / Gestão Cívico-Militar (Conduta e Disciplina)</option>
                  <option value="PSICOSSOCIAL_MEDIACAO">Equipe Psicossocial / Mediação Escolar (Vulnerabilidade)</option>
                  <option value="BUSCA_ATIVA">Secretaria Escolar / Busca Ativa (Evasão e Faltas)</option>
                  <option value="AEE_SPECIAL_ED">Sala de Recursos Multifuncionais (Educação Especial / AEE)</option>
                  <option value="COORDENACAO_PEDAGOGICA">Coordenação Pedagógica (Retornar para Gestão Curricular)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                  Motivo / Justificativa da Transferência de Setor:
                </label>
                <textarea
                  rows={4}
                  value={tramitateReason}
                  onChange={e => setTramitateReason(e.target.value)}
                  placeholder="Explique porque o caso requer atuação direta deste setor..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/10 leading-relaxed"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTramitateModalOcc(null)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTramitate}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingTramitate ? <Loader2 size={16} className="animate-spin" /> : <ArrowRightLeft size={16} />}
                  Confirmar Tramitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: IMPRESSÃO DE CONVOCAÇÃO DE PAIS OU TERMO DE COMPROMISSO */}
      {printingDoc && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-start print:hidden">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl w-full max-w-4xl overflow-hidden my-4">
            
            {/* Header Fixo */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-20 shadow-md">
              <div>
                <span className="font-mono text-xs font-black bg-indigo-600 px-3 py-1 rounded-lg uppercase">
                  {printingDoc.type === 'CONVOCACAO_PAIS' ? 'CONVOCAÇÃO DE PAIS' : 'TERMO DE COMPROMISSO'}
                </span>
                <span className="text-xs font-bold uppercase text-slate-300 ml-3">
                  {printingDoc.occ.studentName} ({printingDoc.occ.className})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20"
                >
                  <Printer size={16} /> Imprimir Documento (PDF)
                </button>

                <button
                  onClick={() => setPrintingDoc(null)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* FOLHA A4 TIMBRADA */}
            <div className="p-8 sm:p-14 bg-white text-black min-h-[275mm] flex flex-col justify-between" style={{ fontFamily: 'Times New Roman, Georgia, serif' }}>
              <div className="flex-1 flex flex-col justify-start pb-6">
                
                {/* Cabeçalho SEDUC MT */}
                <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-6">
                  <img src="/brasao_mt.png" alt="Brasão MT" className="h-20 w-auto object-contain shrink-0" onError={(e) => (e.currentTarget.src = '/SEDUC 2.jpg')} />
                  <div className="text-center flex-1 mx-2 space-y-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
                    <h1 className="text-[11px] font-bold uppercase text-black leading-tight">Governo do Estado de Mato Grosso</h1>
                    <h2 className="text-[10px] font-bold uppercase text-black leading-tight">Secretaria de Estado de Educação</h2>
                    <h3 className="text-[10px] font-bold uppercase text-black leading-tight">Diretoria Regional de Educação de Sinop</h3>
                    <h4 className="text-[11px] font-black uppercase text-black leading-tight pt-0.5">Escola Estadual Cívico-Militar André Antônio Maggi</h4>
                  </div>
                  <img src="/logo-escola-oficial.png" alt="Escola Cívico-Militar" className="h-20 w-auto object-contain shrink-0" onError={(e) => (e.currentTarget.src = '/logo-escola.png')} />
                </div>

                {/* Título do Documento */}
                <div className="text-center my-4">
                  <h2 className="text-base font-bold uppercase tracking-wider underline">
                    {printingDoc.type === 'CONVOCACAO_PAIS'
                      ? 'CONVOCAÇÃO DE PAIS E RESPONSÁVEIS LEGAIS'
                      : 'TERMO DE COMPROMISSO E CONDUTA PEDAGÓGICA'}
                  </h2>
                </div>

                {/* Corpo do Documento */}
                <div className="my-6 text-sm leading-relaxed text-justify space-y-4 text-black">
                  {printingDoc.type === 'CONVOCACAO_PAIS' ? (
                    <>
                      <p style={{ textIndent: '2rem' }}>
                        A Coordenação Pedagógica da <strong>Escola Estadual Cívico-Militar André Antônio Maggi</strong>, no uso de suas atribuições legais e em conformidade com o Regimento Escolar e a Lei de Diretrizes e Bases da Educação Nacional (LDB nº 9.394/96), vem por meio deste instrumento <strong>CONVOCAR</strong> os pais e/ou responsáveis legais do(a) estudante <strong>{printingDoc.occ.studentName.toUpperCase()}</strong>, matriculado(a) na turma <strong>{printingDoc.occ.className}</strong>, para comparecerem a esta unidade escolar.
                      </p>
                      <p style={{ textIndent: '2rem' }}>
                        <strong>Pauta do Atendimento:</strong> Alinhamento referente ao acompanhamento pedagógico, rendimento e registros escolares da disciplina de <strong>{printingDoc.occ.category}</strong> relatados em data de <strong>{printingDoc.occ.date}</strong> pelo(a) professor(a) <strong>{printingDoc.occ.responsibleName}</strong>.
                      </p>
                      <p style={{ textIndent: '2rem' }}>
                        Solicitamos o comparecimento no prazo de até 48 (quarenta e oito) horas úteis junto à Coordenação Pedagógica para que possamos traçar conjuntamente o plano de apoio e intervenção para o sucesso educacional do estudante.
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ textIndent: '2rem' }}>
                        Pelo presente Termo de Compromisso, o(a) estudante <strong>{printingDoc.occ.studentName.toUpperCase()}</strong>, devidamente matriculado(a) na turma <strong>{printingDoc.occ.className}</strong>, juntamente com seus responsáveis e a Coordenação Pedagógica, assume formalmente o compromisso de empenho, assiduidade, realização das tarefas escolares e cumprimento das normas regimentais desta instituição de ensino cívico-militar.
                      </p>
                      <p style={{ textIndent: '2rem' }}>
                        <strong>Síntese do Ocorrido:</strong> {printingDoc.occ.description}
                      </p>
                      <p style={{ textIndent: '2rem' }}>
                        <strong>Acordos Pedagógicos Firmados:</strong> O estudante compromete-se a cumprir os prazos de recomposição de aprendizagem, entregar as atividades solicitadas e manter postura colaborativa em sala de aula, ciente de que a reincidência acarretará medidas formativas adicionais.
                      </p>
                    </>
                  )}

                  <p className="pt-4 text-right">
                    Colíder - MT, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
                  </p>
                </div>

                {/* Assinaturas */}
                <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
                  <div className="border-t border-black pt-2">
                    <p className="font-bold uppercase">{user?.name || 'Coordenação Pedagógica'}</p>
                    <p className="text-[10px] text-gray-700">Coordenação Pedagógica</p>
                  </div>
                  <div className="border-t border-black pt-2">
                    <p className="font-bold uppercase">Pai / Mãe / Responsável Legal</p>
                    <p className="text-[10px] text-gray-700">Assinatura do Responsável</p>
                  </div>
                  <div className="col-span-2 w-1/2 mx-auto border-t border-black pt-2 mt-4">
                    <p className="font-bold uppercase">{printingDoc.occ.studentName}</p>
                    <p className="text-[10px] text-gray-700">Assinatura do Estudante</p>
                  </div>
                </div>

              </div>

              {/* Rodapé Oficial A4 Fixado */}
              <div className="mt-auto border-t border-black/40 pt-2 grid grid-cols-2 gap-4 text-[8.5px] leading-tight text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
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

      {/* ÁREA DE IMPRESSÃO PURA DO DOCUMENTO */}
      {printingDoc && (
        <div className="print-doc-area">
          <div className="pdf-page p-8 sm:p-14 bg-white text-black min-h-[275mm] flex flex-col justify-between" style={{ fontFamily: 'Times New Roman, Georgia, serif' }}>
            <div className="flex-1 flex flex-col justify-start pb-6">
              
              {/* Cabeçalho */}
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-6">
                <img src="/brasao_mt.png" alt="Brasão MT" className="h-20 w-auto object-contain shrink-0" onError={(e) => (e.currentTarget.src = '/SEDUC 2.jpg')} />
                <div className="text-center flex-1 mx-2 space-y-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
                  <h1 className="text-[11px] font-bold uppercase text-black leading-tight">Governo do Estado de Mato Grosso</h1>
                  <h2 className="text-[10px] font-bold uppercase text-black leading-tight">Secretaria de Estado de Educação</h2>
                  <h3 className="text-[10px] font-bold uppercase text-black leading-tight">Diretoria Regional de Educação de Sinop</h3>
                  <h4 className="text-[11px] font-black uppercase text-black leading-tight pt-0.5">Escola Estadual Cívico-Militar André Antônio Maggi</h4>
                </div>
                <img src="/logo-escola-oficial.png" alt="Escola Cívico-Militar" className="h-20 w-auto object-contain shrink-0" onError={(e) => (e.currentTarget.src = '/logo-escola.png')} />
              </div>

              {/* Título */}
              <div className="text-center my-4">
                <h2 className="text-base font-bold uppercase tracking-wider underline">
                  {printingDoc.type === 'CONVOCACAO_PAIS'
                    ? 'CONVOCAÇÃO DE PAIS E RESPONSÁVEIS LEGAIS'
                    : 'TERMO DE COMPROMISSO E CONDUTA PEDAGÓGICA'}
                </h2>
              </div>

              {/* Texto */}
              <div className="my-6 text-sm leading-relaxed text-justify space-y-4 text-black">
                {printingDoc.type === 'CONVOCACAO_PAIS' ? (
                  <>
                    <p style={{ textIndent: '2rem' }}>
                      A Coordenação Pedagógica da <strong>Escola Estadual Cívico-Militar André Antônio Maggi</strong>, no uso de suas atribuições legais e em conformidade com o Regimento Escolar e a Lei de Diretrizes e Bases da Educação Nacional (LDB nº 9.394/96), vem por meio deste instrumento <strong>CONVOCAR</strong> os pais e/ou responsáveis legais do(a) estudante <strong>{printingDoc.occ.studentName.toUpperCase()}</strong>, matriculado(a) na turma <strong>{printingDoc.occ.className}</strong>, para comparecerem a esta unidade escolar.
                    </p>
                    <p style={{ textIndent: '2rem' }}>
                      <strong>Pauta do Atendimento:</strong> Alinhamento referente ao acompanhamento pedagógico, rendimento e registros escolares da disciplina de <strong>{printingDoc.occ.category}</strong> relatados em data de <strong>{printingDoc.occ.date}</strong> pelo(a) professor(a) <strong>{printingDoc.occ.responsibleName}</strong>.
                    </p>
                    <p style={{ textIndent: '2rem' }}>
                      Solicitamos o comparecimento no prazo de até 48 (quarenta e oito) horas úteis junto à Coordenação Pedagógica para que possamos traçar conjuntamente o plano de apoio e intervenção para o sucesso educacional do estudante.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ textIndent: '2rem' }}>
                      Pelo presente Termo de Compromisso, o(a) estudante <strong>{printingDoc.occ.studentName.toUpperCase()}</strong>, devidamente matriculado(a) na turma <strong>{printingDoc.occ.className}</strong>, juntamente com seus responsáveis e a Coordenação Pedagógica, assume formalmente o compromisso de empenho, assiduidade, realização das tarefas escolares e cumprimento das normas regimentais desta instituição de ensino cívico-militar.
                    </p>
                    <p style={{ textIndent: '2rem' }}>
                      <strong>Síntese do Ocorrido:</strong> {printingDoc.occ.description}
                    </p>
                    <p style={{ textIndent: '2rem' }}>
                      <strong>Acordos Pedagógicos Firmados:</strong> O estudante compromete-se a cumprir os prazos de recomposição de aprendizagem, entregar as atividades solicitadas e manter postura colaborativa em sala de aula, ciente de que a reincidência acarretará medidas formativas adicionais.
                    </p>
                  </>
                )}

                <p className="pt-4 text-right">
                  Colíder - MT, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
                </p>
              </div>

              {/* Assinaturas */}
              <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
                <div className="border-t border-black pt-2">
                  <p className="font-bold uppercase">{user?.name || 'Coordenação Pedagógica'}</p>
                  <p className="text-[10px] text-gray-700">Coordenação Pedagógica</p>
                </div>
                <div className="border-t border-black pt-2">
                  <p className="font-bold uppercase">Pai / Mãe / Responsável Legal</p>
                  <p className="text-[10px] text-gray-700">Assinatura do Responsável</p>
                </div>
                <div className="col-span-2 w-1/2 mx-auto border-t border-black pt-2 mt-4">
                  <p className="font-bold uppercase">{printingDoc.occ.studentName}</p>
                  <p className="text-[10px] text-gray-700">Assinatura do Estudante</p>
                </div>
              </div>

            </div>

            {/* Rodapé Fixo no Fundo */}
            <div className="print-footer-address mt-auto border-t border-black/40 pt-2 grid grid-cols-2 gap-4 text-[8.5px] leading-tight text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
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

      {/* ESTILOS CSS DE IMPRESSÃO */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media screen {
          .print-doc-area { display: none !important; }
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
          .print-doc-area, .print-doc-area * { visibility: visible !important; }
          .print-doc-area { 
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
          .pdf-page { 
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-footer-address {
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

    </div>
  );
};

export default PedagogicalOccurrenceBook;
