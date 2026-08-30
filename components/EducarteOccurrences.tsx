import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  FileText,
  User,
  Music,
  Shield,
  Volume2,
  Award,
  BookOpen,
  ArrowRightLeft,
  X,
  Loader2,
  Sparkles,
  MessageSquare,
  Send
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from './Toast';
import { User as UserType } from '../types';

export interface EducarteOccurrence {
  id: string;
  studentName: string;
  className: string;
  naipe: string;
  instrument?: string;
  category: 'INSTRUMENTO_ZELLO' | 'FALTA_ENSAIO' | 'DISCIPLINA_POSTURA' | 'MERITO_ELOGIO' | 'PEDAGOGICO';
  severity: 'LEVE' | 'MÉDIA' | 'ALTA' | 'CRÍTICA';
  date: string;
  time: string;
  description: string;
  actionTaken?: string;
  feedback?: string;
  status: 'PENDENTE' | 'EM_ATENDIMENTO' | 'RESOLVIDO' | 'TRAMITADO';
  forwardedTo?: 'COORDENACAO_PEDAGOGICA' | 'CIVICO_MILITAR' | 'PSICOSSOCIAL_MEDIACAO' | 'INTERNO_EDUCARTE';
  responsibleName: string;
  timestamp: number;
}

interface EducarteOccurrencesProps {
  user: UserType;
  members: any[];
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  INSTRUMENTO_ZELLO: { label: 'Cuidado c/ Instrumento / Avaria', icon: Volume2, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  FALTA_ENSAIO: { label: 'Falta Não Justificada / Pontualidade', icon: Clock, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  DISCIPLINA_POSTURA: { label: 'Indisciplina / Postura em Ensaio', icon: Shield, color: 'text-orange-700 bg-orange-50 border-orange-200' },
  MERITO_ELOGIO: { label: 'Mérito Musical / Elogio de Destaque', icon: Award, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  PEDAGOGICO: { label: 'Acompanhamento Escolar / Rendimento', icon: BookOpen, color: 'text-blue-700 bg-blue-50 border-blue-200' },
};

const INITIAL_EDUCARTE_OCCS: EducarteOccurrence[] = [
  {
    id: 'edu-occ-1',
    studentName: 'MATHEUS PEREIRA SILVA',
    className: '8º ANO B',
    naipe: 'PERCUSSÃO',
    instrument: 'Bumbo Marcial 22x14',
    category: 'MERITO_ELOGIO',
    severity: 'LEVE',
    date: '2026-08-25',
    time: '16:30',
    description: 'Estudante demonstrou excelente liderança de naipe auxiliando os novos alunos na divisão rítmica do Dobrado Batista de Melo.',
    actionTaken: 'Elogio registrado em ficha e indicação para monitoria de percussão.',
    feedback: 'Aluno exemplar no contraturno.',
    status: 'RESOLVIDO',
    forwardedTo: 'INTERNO_EDUCARTE',
    responsibleName: 'Maestro / Regente Educarte',
    timestamp: Date.now() - 3600000 * 48
  },
  {
    id: 'edu-occ-2',
    studentName: 'LUCAS OLIVEIRA SANTOS',
    className: '9º ANO B',
    naipe: 'METAIS',
    instrument: 'Trombone de Vara',
    category: 'FALTA_ENSAIO',
    severity: 'MÉDIA',
    date: '2026-08-28',
    time: '14:15',
    description: 'Faltou a 2 ensaios consecutivos da linha de metais sem apresentar justificativa prévia do responsável.',
    actionTaken: 'Contato com o responsável via telefone e advertência verbal.',
    status: 'EM_ATENDIMENTO',
    forwardedTo: 'INTERNO_EDUCARTE',
    responsibleName: 'Instrutor de Metais',
    timestamp: Date.now() - 3600000 * 24
  }
];

const EducarteOccurrences: React.FC<EducarteOccurrencesProps> = ({ user, members }) => {
  const { addToast } = useToast();
  
  const [occurrences, setOccurrences] = useState<EducarteOccurrence[]>(() => {
    const saved = localStorage.getItem('educarte_occurrences_v1');
    return saved ? JSON.parse(saved) : INITIAL_EDUCARTE_OCCS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('TODAS');
  const [filterNaipe, setFilterNaipe] = useState<string>('TODOS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [actionModalOcc, setActionModalOcc] = useState<EducarteOccurrence | null>(null);
  const [actionFeedback, setActionFeedback] = useState('');
  const [actionStatus, setActionStatus] = useState<'RESOLVIDO' | 'EM_ATENDIMENTO'>('RESOLVIDO');
  
  // Modal de Tramitação Setorial (Coordenação, Militar, Psicossocial)
  const [tramitateModalOcc, setTramitateModalOcc] = useState<EducarteOccurrence | null>(null);
  const [tramitateTarget, setTramitateTarget] = useState<'COORDENACAO_PEDAGOGICA' | 'CIVICO_MILITAR' | 'PSICOSSOCIAL_MEDIACAO'>('COORDENACAO_PEDAGOGICA');
  const [tramitateReason, setTramitateReason] = useState('');
  const [isSubmittingTramitate, setIsSubmittingTramitate] = useState(false);

  const [printingDoc, setPrintingDoc] = useState<EducarteOccurrence | null>(null);

  // Form de Novo Registro
  const [formStudent, setFormStudent] = useState('');
  const [formClass, setFormClass] = useState('');
  const [formNaipe, setFormNaipe] = useState('METAIS');
  const [formInstrument, setFormInstrument] = useState('');
  const [formCategory, setFormCategory] = useState<EducarteOccurrence['category']>('INSTRUMENTO_ZELLO');
  const [formSeverity, setFormSeverity] = useState<EducarteOccurrence['severity']>('LEVE');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('14:30');
  const [formDescription, setFormDescription] = useState('');
  const [formActionTaken, setFormActionTaken] = useState('');
  const [formDestination, setFormDestination] = useState<'INTERNO_EDUCARTE' | 'COORDENACAO_PEDAGOGICA' | 'CIVICO_MILITAR' | 'PSICOSSOCIAL_MEDIACAO'>('INTERNO_EDUCARTE');

  // Salvar no LocalStorage sempre que alterar
  useEffect(() => {
    localStorage.setItem('educarte_occurrences_v1', JSON.stringify(occurrences));
  }, [occurrences]);

  // Carregar ocorrências do Supabase também (se existirem)
  const fetchSupabaseOccurrences = async () => {
    try {
      const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .order('date', { ascending: false });

      if (error) return;

      if (data) {
        const educarteFromDb: EducarteOccurrence[] = data
          .filter(o => (o.description || '').includes('[ORIGEM: PROJETO EDUCARTE') || (o.description || '').includes('[SETOR: EDUCARTE]') || (o.category || '').toUpperCase().includes('EDUCARTE') || (o.category || '').toUpperCase().includes('BANDA'))
          .map(o => {
            let cat: EducarteOccurrence['category'] = 'DISCIPLINA_POSTURA';
            const catUp = (o.category || '').toUpperCase();
            if (catUp.includes('INSTRUMENTO') || catUp.includes('ZELLO')) cat = 'INSTRUMENTO_ZELLO';
            else if (catUp.includes('FALTA') || catUp.includes('ENSAIO')) cat = 'FALTA_ENSAIO';
            else if (catUp.includes('MERITO') || catUp.includes('ELOGIO')) cat = 'MERITO_ELOGIO';
            else if (catUp.includes('PEDAGOGICO')) cat = 'PEDAGOGICO';

            const rawDesc = o.description || '';
            let fwd: EducarteOccurrence['forwardedTo'] = 'INTERNO_EDUCARTE';
            if (rawDesc.includes('[SETOR: COORDENACAO_PEDAGOGICA]') || rawDesc.includes('COORDENAÇÃO')) fwd = 'COORDENACAO_PEDAGOGICA';
            else if (rawDesc.includes('[SETOR: CIVICO_MILITAR]')) fwd = 'CIVICO_MILITAR';
            else if (rawDesc.includes('[SETOR: PSICOSSOCIAL]')) fwd = 'PSICOSSOCIAL_MEDIACAO';

            let parsedFeedback: string | undefined = undefined;
            if (rawDesc.includes('[DEVOLUTIVA')) {
              const match = rawDesc.match(/\[DEVOLUTIVA (?:DA COORDENAÇÃO|DO REGENTE|DA GESTÃO)?\s*(?:-\s*([^\]]+))?\]:?([\s\S]*)/i);
              if (match) parsedFeedback = (match[2] || '').trim();
            }

            return {
              id: `db-${o.id}`,
              studentName: o.student_name || 'Estudante',
              className: o.classroom_name || 'Banda',
              naipe: 'BANDA EDUCARTE',
              category: cat,
              severity: (o.severity || 'LEVE') as any,
              date: o.date || new Date().toISOString().split('T')[0],
              time: o.time || '14:00',
              description: rawDesc.replace(/\[(?:SETOR|ORIGEM|DEVOLUTIVA|TRAMITADO)[^\]]*\]/gi, '').trim(),
              feedback: parsedFeedback,
              status: (o.status === 'RESOLVIDO' ? 'RESOLVIDO' : (o.status === 'TRAMITADO' ? 'TRAMITADO' : (o.status === 'EM_ATENDIMENTO' ? 'EM_ATENDIMENTO' : 'PENDENTE'))),
              forwardedTo: fwd,
              responsibleName: o.responsible_name || 'Instrutor Educarte',
              timestamp: new Date((o.date || '2026-08-29') + 'T' + (o.time || '10:00')).getTime()
            };
          });

        if (educarteFromDb.length > 0) {
          setOccurrences(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const merged = [...prev];
            educarteFromDb.forEach(item => {
              if (!existingIds.has(item.id)) merged.push(item);
            });
            return merged;
          });
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSupabaseOccurrences();
  }, []);

  // Quando seleciona um integrante no formulário
  const handleSelectMember = (memberName: string) => {
    setFormStudent(memberName);
    const member = members.find(m => m.name === memberName);
    if (member) {
      setFormClass(member.classroomName || 'TURMA N/A');
      setFormNaipe(member.naipe || 'METAIS');
      setFormInstrument(member.instrument || '');
    }
  };

  // Cadastrar Novo Registro
  const handleCreateOccurrence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudent.trim()) {
      alert('Por favor, selecione ou informe o nome do estudante.');
      return;
    }
    if (!formDescription.trim()) {
      alert('Por favor, descreva o relato dos fatos.');
      return;
    }

    const isForwarded = formDestination !== 'INTERNO_EDUCARTE';
    const newOcc: EducarteOccurrence = {
      id: `edu-${Date.now()}`,
      studentName: formStudent.toUpperCase().trim(),
      className: formClass || 'PROJETO EDUCARTE',
      naipe: formNaipe,
      instrument: formInstrument,
      category: formCategory,
      severity: formSeverity,
      date: formDate,
      time: formTime,
      description: formDescription.trim(),
      actionTaken: formActionTaken.trim() || undefined,
      status: isForwarded ? 'TRAMITADO' : 'PENDENTE',
      forwardedTo: formDestination,
      responsibleName: user.name || 'Regente Educarte',
      timestamp: Date.now()
    };

    // Sincronizar com Supabase: entra diretamente no livro da coordenação / gestão!
    try {
      let targetTag = '[SETOR: EDUCARTE]';
      let categoryName = `EDUCARTE_${formCategory}`;

      if (formDestination === 'COORDENACAO_PEDAGOGICA') {
        targetTag = '[SETOR: COORDENACAO_PEDAGOGICA]\n[ORIGEM: PROJETO EDUCARTE - REGENTE]';
        categoryName = 'ACOMPANHAMENTO PEDAGÓGICO';
      } else if (formDestination === 'CIVICO_MILITAR') {
        targetTag = '[SETOR: CIVICO_MILITAR]\n[ORIGEM: PROJETO EDUCARTE - REGENTE]';
        categoryName = 'FATO OBSERVADO';

        // Sincronizar com Gestão Cívico-Militar
        try {
          const savedDocs = localStorage.getItem('civico_militar_documentos_v2');
          let docsList = [];
          if (savedDocs) {
            try { docsList = JSON.parse(savedDocs); } catch (e) {}
          }
          docsList.unshift({
            id: `doc-edu-${Date.now()}`,
            studentId: 'AUTO_EDUCARTE',
            studentName: newOcc.studentName,
            className: newOcc.className,
            shiftName: 'VESPERTINO (CONTRATURNO)',
            template: 'fato_observado',
            templateLabel: 'Fato Observado (Via Projeto Educarte)',
            date: formDate,
            fields: {
              date: formDate,
              teacher: `${user.name || 'Regente'} (Educarte)`,
              series: newOcc.className,
              discipline: `Banda / Naipe ${formNaipe}`,
              achado: formDescription.trim(),
              city: 'Colíder - MT'
            },
            timestamp: Date.now()
          });
          localStorage.setItem('civico_militar_documentos_v2', JSON.stringify(docsList));
        } catch (e) {}
      } else if (formDestination === 'PSICOSSOCIAL_MEDIACAO') {
        targetTag = '[SETOR: PSICOSSOCIAL]\n[ORIGEM: PROJETO EDUCARTE - REGENTE]';
        categoryName = 'MEDIAÇÃO / PSICOSSOCIAL';

        // Sincronizar com AMBOS: 1. Módulo Psicossocial e 2. Módulo de Mediação Escolar
        try {
          const fullReport = `[ENCAMINHAMENTO PROJETO EDUCARTE / BANDA]\nEstudante: ${newOcc.studentName} (${newOcc.className})\nNaipe: ${formNaipe} | Instrumento: ${formInstrument || 'N/A'}\nRegente/Instrutor: ${user.name || 'Educarte'}\n\nRelato:\n${formDescription.trim()}`;

          // 1. Módulo Psicossocial (psychosocial_referrals)
          await supabase.from('psychosocial_referrals').insert([{
            student_name: newOcc.studentName,
            class_name: newOcc.className,
            teacher_name: `${user.name || 'Regente'} (Educarte)`,
            school_unit: 'ESCOLA ANDRÉ MAGGI',
            date: formDate,
            report: fullReport,
            status: 'AGUARDANDO_TRIAGEM',
            student_age: 'Não informado',
            attendance_frequency: '0',
            previous_strategies: 'Acolhimento no Projeto Educarte / Banda',
            adopted_procedures: ['ENCAMINHAMENTO_EDUCARTE'],
            observations: { learning: [], behavioral: [`Encaminhado pelo Projeto Educarte - Naipe ${formNaipe}`], emotional: [] }
          }]);

          // 2. Módulo de Mediação Escolar (mediation_cases)
          await supabase.from('mediation_cases').insert([{
            student_id: 'N/A',
            student_name: newOcc.studentName,
            class_name: newOcc.className,
            type: formCategory === 'DISCIPLINA_POSTURA' ? 'DISCIPLINAR' : 'CONFLITO',
            severity: formSeverity === 'CRÍTICA' ? 'CRÍTICA' : (formSeverity === 'ALTA' ? 'ALTA' : 'MÉDIA'),
            status: 'ABERTURA',
            opened_at: formDate,
            description: fullReport,
            involved_parties: [`Regente ${user.name || 'Educarte'}`],
            steps: [
              { id: '1', label: 'Encaminhamento pelo Projeto Educarte', completed: true, date: formDate },
              { id: '2', label: 'Escuta das Partes / Aluno', completed: false },
              { id: '3', label: 'Círculo de Mediação / Acordo', completed: false },
              { id: '4', label: 'Conclusão e Devolutiva ao Educarte', completed: false }
            ]
          }]);

          // 3. Notificação para a Equipe
          await supabase.from('psychosocial_notifications').insert([{
            title: 'Novo Encaminhamento • Projeto Educarte',
            message: `O regente(a) ${user.name || 'Educarte'} encaminhou o aluno ${newOcc.studentName} (${newOcc.className} - Banda) para acompanhamento.`,
            is_read: false
          }]);
        } catch (e) {
          console.warn('Erro ao sincronizar módulos psicossocial e mediação:', e);
        }
      }

      const dbDescription = `[PROJETO EDUCARTE - NAIPE: ${formNaipe} | INSTRUMENTO: ${formInstrument || 'N/A'}]\n${formDescription.trim()}\n${targetTag}`;
      
      await supabase.from('occurrences').insert([{
        date: formDate,
        time: formTime,
        student_name: newOcc.studentName,
        classroom_name: newOcc.className,
        category: categoryName,
        severity: formSeverity,
        description: dbDescription,
        status: isForwarded ? 'TRAMITADO' : 'PENDENTE',
        responsible_name: `${user.name || 'Regente'} (Educarte)`,
        location: 'PROJETO EDUCARTE / BANDA'
      }]);
    } catch (e) {
      console.warn('Registro mantido localmente:', e);
    }

    setOccurrences(prev => [newOcc, ...prev]);
    addToast({
      title: isForwarded ? 'Encaminhado com Sucesso!' : 'Registro Realizado!',
      message: isForwarded ? 'A ocorrência foi sincronizada em todos os módulos de destino!' : 'Ocorrência registrada no Projeto Educarte.',
      type: 'success'
    });

    // Reset Form
    setIsNewModalOpen(false);
    setFormStudent('');
    setFormClass('');
    setFormInstrument('');
    setFormDescription('');
    setFormActionTaken('');
    setFormDestination('INTERNO_EDUCARTE');
  };

  // Salvar Tramitação de Setor a partir de Card Existente
  const handleSaveTramitate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tramitateModalOcc) return;
    if (!tramitateReason.trim()) {
      alert('Por favor, informe a justificativa da tramitação.');
      return;
    }

    setIsSubmittingTramitate(true);
    const nowStr = new Date().toLocaleString('pt-BR');
    const targetLabel = tramitateTarget === 'COORDENACAO_PEDAGOGICA' 
      ? 'COORDENAÇÃO PEDAGÓGICA' 
      : tramitateTarget === 'CIVICO_MILITAR' 
        ? 'CORPO DE ALUNOS (MILITAR)' 
        : 'MEDIAÇÃO PSICOSSOCIAL';

    try {
      const targetTag = tramitateTarget === 'COORDENACAO_PEDAGOGICA' 
        ? '[SETOR: COORDENACAO_PEDAGOGICA]' 
        : tramitateTarget === 'CIVICO_MILITAR' 
          ? '[SETOR: CIVICO_MILITAR]' 
          : '[SETOR: PSICOSSOCIAL]';

      let newCategory = 'ACOMPANHAMENTO PEDAGÓGICO';
      if (tramitateTarget === 'CIVICO_MILITAR') newCategory = 'FATO OBSERVADO';
      if (tramitateTarget === 'PSICOSSOCIAL_MEDIACAO') newCategory = 'MEDIAÇÃO / PSICOSSOCIAL';

      const tramitationBlock = `\n\n[TRAMITADO DO EDUCARTE EM ${nowStr} PARA ${targetLabel}]: ${tramitateReason.trim()}\n${targetTag}`;
      const newDescription = `${tramitateModalOcc.description}${tramitationBlock}`;

      // Envia para o Supabase
      if (tramitateModalOcc.id.startsWith('db-')) {
        const rawId = tramitateModalOcc.id.replace('db-', '');
        await supabase.from('occurrences').update({
          category: newCategory,
          status: 'TRAMITADO',
          description: newDescription
        }).eq('id', rawId);
      } else {
        await supabase.from('occurrences').insert([{
          date: tramitateModalOcc.date,
          time: tramitateModalOcc.time,
          student_name: tramitateModalOcc.studentName,
          classroom_name: tramitateModalOcc.className,
          category: newCategory,
          severity: tramitateModalOcc.severity,
          description: `[PROJETO EDUCARTE - NAIPE: ${tramitateModalOcc.naipe}]\n${newDescription}`,
          status: 'TRAMITADO',
          responsible_name: `${user.name || 'Regente'} (Educarte)`,
          location: 'PROJETO EDUCARTE'
        }]);
      }

      // Sincronizar com Psicossocial e Mediação Escolar se o destino for PSICOSSOCIAL_MEDIACAO
      if (tramitateTarget === 'PSICOSSOCIAL_MEDIACAO') {
        try {
          const fullReport = `[TRAMITAÇÃO DO PROJETO EDUCARTE]\nEstudante: ${tramitateModalOcc.studentName} (${tramitateModalOcc.className})\nNaipe: ${tramitateModalOcc.naipe} | Instrumento: ${tramitateModalOcc.instrument || 'N/A'}\nJustificativa do Regente: ${tramitateReason.trim()}\n\nRelato Original:\n${tramitateModalOcc.description}`;

          // 1. Módulo Psicossocial
          await supabase.from('psychosocial_referrals').insert([{
            student_name: tramitateModalOcc.studentName,
            class_name: tramitateModalOcc.className,
            teacher_name: `${user.name || 'Regente'} (Educarte)`,
            school_unit: 'ESCOLA ANDRÉ MAGGI',
            date: new Date().toISOString().split('T')[0],
            report: fullReport,
            status: 'AGUARDANDO_TRIAGEM',
            student_age: 'Não informado',
            attendance_frequency: '0',
            previous_strategies: 'Acolhimento no Projeto Educarte / Banda',
            adopted_procedures: ['TRAMITACAO_PROJETO_EDUCARTE'],
            observations: { learning: [], behavioral: [`Tramitado pelo Projeto Educarte - Naipe ${tramitateModalOcc.naipe}`], emotional: [] }
          }]);

          // 2. Módulo de Mediação Escolar
          await supabase.from('mediation_cases').insert([{
            student_id: 'N/A',
            student_name: tramitateModalOcc.studentName,
            class_name: tramitateModalOcc.className,
            type: 'CONFLITO',
            severity: tramitateModalOcc.severity === 'CRÍTICA' ? 'CRÍTICA' : (tramitateModalOcc.severity === 'ALTA' ? 'ALTA' : 'MÉDIA'),
            status: 'ABERTURA',
            opened_at: new Date().toISOString().split('T')[0],
            description: fullReport,
            involved_parties: [`Regente ${user.name || 'Educarte'}`],
            steps: [
              { id: '1', label: 'Encaminhamento pelo Projeto Educarte', completed: true, date: new Date().toISOString().split('T')[0] },
              { id: '2', label: 'Escuta das Partes / Aluno', completed: false },
              { id: '3', label: 'Círculo de Mediação / Acordo', completed: false },
              { id: '4', label: 'Conclusão e Devolutiva ao Educarte', completed: false }
            ]
          }]);
        } catch (e) {
          console.warn('Erro ao sincronizar tabelas de mediação/psicossocial:', e);
        }
      }

      // Sincronizar com Gestão Cívico-Militar se for CIVICO_MILITAR
      if (tramitateTarget === 'CIVICO_MILITAR') {
        try {
          const savedDocs = localStorage.getItem('civico_militar_documentos_v2');
          let docsList = [];
          if (savedDocs) {
            try { docsList = JSON.parse(savedDocs); } catch (e) {}
          }
          docsList.unshift({
            id: `doc-edu-tram-${Date.now()}`,
            studentId: 'AUTO_EDUCARTE',
            studentName: tramitateModalOcc.studentName,
            className: tramitateModalOcc.className,
            shiftName: 'VESPERTINO (CONTRATURNO)',
            template: 'fato_observado',
            templateLabel: 'Fato Observado (Via Projeto Educarte)',
            date: new Date().toISOString().split('T')[0],
            fields: {
              date: new Date().toISOString().split('T')[0],
              teacher: `${user.name || 'Regente'} (Educarte)`,
              series: tramitateModalOcc.className,
              discipline: `Banda / Naipe ${tramitateModalOcc.naipe}`,
              achado: newDescription,
              city: 'Colíder - MT'
            },
            timestamp: Date.now()
          });
          localStorage.setItem('civico_militar_documentos_v2', JSON.stringify(docsList));
        } catch (e) {}
      }

      // Atualiza estado local
      setOccurrences(prev => prev.map(o => {
        if (o.id === tramitateModalOcc.id) {
          return {
            ...o,
            status: 'TRAMITADO',
            forwardedTo: tramitateTarget
          };
        }
        return o;
      }));

      addToast({
        title: 'Tramitado com Sucesso!',
        message: `Caso encaminhado para ${targetLabel}. A equipe já tem acesso no sistema!`,
        type: 'success'
      });

      setTramitateModalOcc(null);
      setTramitateReason('');
    } catch (err) {
      console.error(err);
      addToast({ title: 'Erro', message: 'Falha ao tramitar ocorrência.', type: 'error' });
    } finally {
      setIsSubmittingTramitate(false);
    }
  };

  // Salvar Devolutiva / Parecer Interno
  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModalOcc) return;
    if (!actionFeedback.trim()) {
      alert('Por favor, insira o parecer ou providência adotada.');
      return;
    }

    const nowStr = new Date().toLocaleString('pt-BR');
    const updated = occurrences.map(o => {
      if (o.id === actionModalOcc.id) {
        return {
          ...o,
          feedback: `[PARECER DO REGENTE/INSTRUTOR - ${nowStr}]: ${actionFeedback.trim()}`,
          status: actionStatus
        };
      }
      return o;
    });

    setOccurrences(updated);
    addToast({
      title: 'Devolutiva Registrada!',
      message: 'Providência e status atualizados com sucesso.',
      type: 'success'
    });

    setActionModalOcc(null);
    setActionFeedback('');
  };

  // Excluir Registro
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Deseja realmente excluir este registro?')) return;
    setOccurrences(prev => prev.filter(o => o.id !== id));
    addToast({ title: 'Excluído', message: 'Registro removido do Educarte.', type: 'info' });
  };

  // Filtragem
  const filteredList = useMemo(() => {
    return occurrences.filter(o => {
      const matchSearch = !searchTerm ||
        o.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.instrument && o.instrument.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = filterCategory === 'TODAS' || o.category === filterCategory;
      const matchNaipe = filterNaipe === 'TODOS' || o.naipe === filterNaipe;
      const matchStatus = filterStatus === 'TODOS' || o.status === filterStatus;

      return matchSearch && matchCategory && matchNaipe && matchStatus;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [occurrences, searchTerm, filterCategory, filterNaipe, filterStatus]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = occurrences.length;
    const meritos = occurrences.filter(o => o.category === 'MERITO_ELOGIO').length;
    const faltas = occurrences.filter(o => o.category === 'FALTA_ENSAIO').length;
    const instrumentos = occurrences.filter(o => o.category === 'INSTRUMENTO_ZELLO').length;
    const tramitados = occurrences.filter(o => o.status === 'TRAMITADO' || o.forwardedTo !== 'INTERNO_EDUCARTE').length;
    const resolvidos = occurrences.filter(o => o.status === 'RESOLVIDO').length;
    return { total, meritos, faltas, instrumentos, tramitados, resolvidos };
  }, [occurrences]);

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* CABEÇALHO COM TÍTULO E AÇÕES */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Music size={260} />
        </div>

        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-300 text-xs font-black uppercase tracking-wider">
            <Sparkles size={14} /> Gestão de Conduta, Mérito & Tramitação
          </div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
            Livro de Ocorrências & Méritos • Educarte
          </h2>
          <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed font-medium">
            Registre faltas aos ensaios, zelo com instrumentos, postura e méritos musicais com opção de <strong>tramitação direta para a Coordenação Pedagógica ou Gestão Militar</strong>.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="z-10 px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all shrink-0 hover:scale-105 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Novo Registro / Ocorrência
        </button>
      </div>

      {/* CARDS DE ESTATÍSTICAS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Geral</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.total}</div>
          <span className="text-[10px] text-slate-500 font-bold mt-1">Registros no Educarte</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1">
            <Award size={12} /> Méritos / Elogios
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-2">{stats.meritos}</div>
          <span className="text-[10px] text-emerald-600 font-bold mt-1">Destaques musicais</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-1">
            <Clock size={12} /> Faltas aos Ensaios
          </span>
          <div className="text-2xl font-black text-rose-700 mt-2">{stats.faltas}</div>
          <span className="text-[10px] text-rose-600 font-bold mt-1">Pontualidade & frequência</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1">
            <Volume2 size={12} /> Zelo Instrumentos
          </span>
          <div className="text-2xl font-black text-amber-700 mt-2">{stats.instrumentos}</div>
          <span className="text-[10px] text-amber-600 font-bold mt-1">Avarias e cuidados</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest flex items-center gap-1">
            <ArrowRightLeft size={12} /> Tramitados
          </span>
          <div className="text-2xl font-black text-purple-700 mt-2">{stats.tramitados}</div>
          <span className="text-[10px] text-purple-600 font-bold mt-1">Coordenação & Militar</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-1">
            <CheckCircle2 size={12} /> Resolvidos
          </span>
          <div className="text-2xl font-black text-blue-700 mt-2">{stats.resolvidos}</div>
          <span className="text-[10px] text-blue-600 font-bold mt-1">Com parecer / atendido</span>
        </div>
      </div>

      {/* BARRA DE FILTROS & BUSCA */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por estudante, instrumento, naipe ou relato..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
          >
            <option value="TODAS">TODOS OS MOTIVOS</option>
            <option value="INSTRUMENTO_ZELLO">🎺 CUIDADO C/ INSTRUMENTO</option>
            <option value="FALTA_ENSAIO">⏱️ FALTA AO ENSAIO</option>
            <option value="DISCIPLINA_POSTURA">⚖️ DISCIPLINA EM ENSAIO</option>
            <option value="MERITO_ELOGIO">🏆 MÉRITO / ELOGIO</option>
            <option value="PEDAGOGICO">📚 DESEMPENHO ESCOLAR</option>
          </select>

          <select
            value={filterNaipe}
            onChange={(e) => setFilterNaipe(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
          >
            <option value="TODOS">TODOS OS NAIPES</option>
            <option value="METAIS">🎺 METAIS</option>
            <option value="MADEIRAS">🎷 MADEIRAS</option>
            <option value="PERCUSSÃO">🥁 PERCUSSÃO</option>
            <option value="LINHA DE FRENTE">🚩 LINHA DE FRENTE</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
          >
            <option value="TODOS">TODOS OS STATUS</option>
            <option value="PENDENTE">⏳ PENDENTE</option>
            <option value="EM_ATENDIMENTO">🔍 EM ATENDIMENTO</option>
            <option value="TRAMITADO">🔁 TRAMITADO P/ OUTRO SETOR</option>
            <option value="RESOLVIDO">✅ RESOLVIDO</option>
          </select>
        </div>
      </div>

      {/* LISTAGEM DOS REGISTROS */}
      <div className="space-y-4">
        {filteredList.length > 0 ? (
          filteredList.map((occ) => {
            const catInfo = CATEGORY_MAP[occ.category] || { label: 'Ocorrência Geral', icon: FileText, color: 'text-slate-700 bg-slate-50 border-slate-200' };
            const CatIcon = catInfo.icon;
            const isResolved = occ.status === 'RESOLVIDO';
            const isAttending = occ.status === 'EM_ATENDIMENTO';
            const isTramitated = occ.status === 'TRAMITADO' || occ.forwardedTo !== 'INTERNO_EDUCARTE';

            return (
              <div
                key={occ.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5 group"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${catInfo.color}`}>
                      <CatIcon size={22} />
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h4 className="font-black text-slate-900 uppercase text-base tracking-tight">{occ.studentName}</h4>
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase">
                          {occ.className}
                        </span>
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-black uppercase">
                          Naipe: {occ.naipe}
                        </span>
                        {occ.instrument && (
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase">
                            🎺 {occ.instrument}
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                        {occ.severity && (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            occ.severity === 'CRÍTICA' || occ.severity === 'ALTA' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            Grau: {occ.severity}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                        {occ.description}
                      </p>

                      {occ.actionTaken && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium">
                          <strong>Providência Inicial do Regente:</strong> {occ.actionTaken}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                        <span className="flex items-center gap-1"><Clock size={12} /> {occ.date} às {occ.time}</span>
                        <span>•</span>
                        <span>Registrado por: <strong>{occ.responsibleName}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* AÇÕES NO CARD */}
                  <div className="flex items-center gap-2 self-start shrink-0 flex-wrap">
                    {isResolved ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-emerald-600" /> Resolvido
                      </span>
                    ) : isTramitated ? (
                      <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                        <ArrowRightLeft size={13} className="text-purple-600" /> 
                        {occ.forwardedTo === 'COORDENACAO_PEDAGOGICA' 
                          ? 'Tramitado p/ Coordenação' 
                          : occ.forwardedTo === 'CIVICO_MILITAR' 
                            ? 'Tramitado p/ Militar' 
                            : 'Tramitado de Setor'}
                      </span>
                    ) : isAttending ? (
                      <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                        <User size={13} className="text-blue-600" /> Em Atendimento
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-orange-50 text-orange-800 border border-orange-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                        <Clock size={13} className="text-orange-600" /> Aguardando Ação
                      </span>
                    )}

                    {/* BOTÃO TRAMITAR SETOR */}
                    <button
                      onClick={() => {
                        setTramitateModalOcc(occ);
                        setTramitateReason('');
                        setTramitateTarget('COORDENACAO_PEDAGOGICA');
                      }}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-black text-xs uppercase rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                      title="Tramitar para Coordenação Pedagógica ou Gestão Cívico-Militar"
                    >
                      <ArrowRightLeft size={13} /> Tramitar Setor
                    </button>

                    {/* BOTÃO DEVOLUTIVA / PARECER */}
                    <button
                      onClick={() => {
                        setActionModalOcc(occ);
                        setActionFeedback('');
                        setActionStatus(occ.status === 'RESOLVIDO' ? 'RESOLVIDO' : 'RESOLVIDO');
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <MessageSquare size={13} /> Devolutiva
                    </button>

                    {/* BOTÃO IMPRIMIR NOTIFICAÇÃO A4 */}
                    <button
                      onClick={() => setPrintingDoc(occ)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                      title="Imprimir Notificação / Termo A4"
                    >
                      <Printer size={16} />
                    </button>

                    {/* BOTÃO EXCLUIR */}
                    <button
                      onClick={(e) => handleDelete(occ.id, e)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Excluir Registro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* BLOCO DE DEVOLUTIVA / PARECER */}
                {occ.feedback && (
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-1 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Parecer Conclusivo do Regente / Coordenação Educarte:
                    </div>
                    <p className="text-xs text-emerald-950 font-medium leading-relaxed whitespace-pre-line">
                      {occ.feedback}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-16 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-3">
              <Award size={32} />
            </div>
            <p className="text-slate-700 font-black uppercase tracking-wider text-xs">Nenhum registro encontrado</p>
            <p className="text-slate-400 text-xs mt-1">Utilize o botão "Novo Registro" para cadastrar méritos ou ocorrências da banda.</p>
          </div>
        )}
      </div>

      {/* MODAL: NOVO REGISTRO / OCORRÊNCIA */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                  <Music size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">Novo Registro de Ocorrência / Mérito</h3>
                  <p className="text-[10px] text-amber-300/80 font-bold uppercase">Projeto Educarte • Banda & Fanfarra</p>
                </div>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-xl">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOccurrence} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Seleção do Integrante */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Estudante Integrante da Banda *
                </label>
                <div className="space-y-2">
                  <select
                    value={formStudent}
                    onChange={(e) => handleSelectMember(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 uppercase outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                  >
                    <option value="">Selecione um integrante cadastrado...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.name}>
                        🎺 {m.name} ({m.classroomName} • {m.naipe})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={formStudent}
                    onChange={(e) => setFormStudent(e.target.value)}
                    placeholder="Ou digite o nome completo caso não esteja na lista..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 uppercase outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Turma, Naipe e Instrumento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Turma</label>
                  <input
                    type="text"
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    placeholder="Ex: 8º ANO A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Naipe</label>
                  <select
                    value={formNaipe}
                    onChange={(e) => setFormNaipe(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase"
                  >
                    <option value="METAIS">🎺 METAIS</option>
                    <option value="MADEIRAS">🎷 MADEIRAS</option>
                    <option value="PERCUSSÃO">🥁 PERCUSSÃO</option>
                    <option value="LINHA DE FRENTE">🚩 LINHA DE FRENTE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Instrumento</label>
                  <input
                    type="text"
                    value={formInstrument}
                    onChange={(e) => setFormInstrument(e.target.value)}
                    placeholder="Ex: Trompete em Bb"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase"
                  />
                </div>
              </div>

              {/* Categoria e Severidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Motivo / Tipo de Registro *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase"
                  >
                    <option value="INSTRUMENTO_ZELLO">🎺 Cuidado c/ Instrumento / Avaria</option>
                    <option value="FALTA_ENSAIO">⏱️ Falta ao Ensaio / Pontualidade</option>
                    <option value="DISCIPLINA_POSTURA">⚖️ Indisciplina / Postura em Ensaio</option>
                    <option value="MERITO_ELOGIO">🏆 Mérito Musical / Elogio de Destaque</option>
                    <option value="PEDAGOGICO">📚 Acompanhamento Escolar / Rendimento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Grau de Severidade</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase"
                  >
                    <option value="LEVE">LEVE (Avisos e orientações)</option>
                    <option value="MÉDIA">MÉDIA (Falta reiterada / avaria simples)</option>
                    <option value="ALTA">ALTA (Dano material / conduta grave)</option>
                    <option value="CRÍTICA">CRÍTICA (Suspensão de ensaios / convocação)</option>
                  </select>
                </div>
              </div>

              {/* ENCAMINHAMENTO SETORIAL */}
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                <label className="block text-[11px] font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRightLeft size={14} className="text-purple-700" />
                  Encaminhar / Tramitar para Outro Setor?
                </label>
                <select
                  value={formDestination}
                  onChange={(e) => setFormDestination(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-white border border-purple-200 rounded-xl text-xs font-black uppercase text-purple-900 outline-none cursor-pointer"
                >
                  <option value="INTERNO_EDUCARTE">🎺 APENAS INTERNO NO EDUCARTE (Acompanhamento da Banda)</option>
                  <option value="COORDENACAO_PEDAGOGICA">🎓 TRAMITAR P/ COORDENAÇÃO PEDAGÓGICA (Rendimento/BNCC)</option>
                  <option value="CIVICO_MILITAR">🛡️ TRAMITAR P/ CORPO DE ALUNOS (Cívico-Militar / Disciplina)</option>
                  <option value="PSICOSSOCIAL_MEDIACAO">🤝 TRAMITAR P/ MEDIAÇÃO ESCOLAR / PSICOSSOCIAL</option>
                </select>
                <p className="text-[10px] text-purple-700 font-medium">
                  {formDestination === 'COORDENACAO_PEDAGOGICA' && '✓ O caso entrará imediatamente na fila de resolução da Coordenação Pedagógica.'}
                  {formDestination === 'CIVICO_MILITAR' && '✓ O caso será encaminhado aos monitores cívico-militares para providência disciplinar.'}
                  {formDestination === 'PSICOSSOCIAL_MEDIACAO' && '✓ O caso será aberto na mediação para escuta e acolhimento.'}
                  {formDestination === 'INTERNO_EDUCARTE' && '✓ O caso fica sob gestão exclusiva do Regente e Instrutores do Educarte.'}
                </p>
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Data</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Hora</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* Descrição dos Fatos */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Relato Detalhado dos Fatos *
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descreva o ocorrido durante o ensaio, cuidado com o material ou motivo do elogio de destaque..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Providência Inicial */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Providência Inicial Adotada pelo Instrutor / Regente
                </label>
                <input
                  type="text"
                  value={formActionTaken}
                  onChange={(e) => setFormActionTaken(e.target.value)}
                  placeholder="Ex: Orientação verbal em naipe, comunicação à família, termo de cautela assinado..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Botões */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-5 py-3 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <CheckCircle2 size={16} /> Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRAMITAR SETOR */}
      {tramitateModalOcc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-purple-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-black">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">Tramitação Setorial</span>
                  <h3 className="text-base font-black uppercase">{tramitateModalOcc.studentName}</h3>
                </div>
              </div>
              <button onClick={() => setTramitateModalOcc(null)} className="p-2 text-purple-300 hover:text-white rounded-xl">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTramitate} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <strong>Relato do Educarte:</strong> {tramitateModalOcc.description}
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Selecione o Setor de Destino *
                </label>
                <select
                  value={tramitateTarget}
                  onChange={(e) => setTramitateTarget(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
                >
                  <option value="COORDENACAO_PEDAGOGICA">🎓 COORDENAÇÃO PEDAGÓGICA (Rendimento / Dificuldades / BNCC)</option>
                  <option value="CIVICO_MILITAR">🛡️ CORPO DE ALUNOS (Gestão Cívico-Militar / Disciplina Grave)</option>
                  <option value="PSICOSSOCIAL_MEDIACAO">🤝 EQUIPE PSICOSSOCIAL / MEDIAÇÃO ESCOLAR</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Justificativa do Encaminhamento *
                </label>
                <textarea
                  rows={4}
                  value={tramitateReason}
                  onChange={(e) => setTramitateReason(e.target.value)}
                  placeholder="Explique o motivo do encaminhamento para que a Coordenação ou Gestão Militar dê continuidade..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTramitateModalOcc(null)}
                  className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-black uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTramitate}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/20"
                >
                  {isSubmittingTramitate ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Confirmar Tramitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR DEVOLUTIVA / PARECER */}
      {actionModalOcc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Devolutiva Educarte</span>
                <h3 className="text-base font-black uppercase">{actionModalOcc.studentName}</h3>
              </div>
              <button onClick={() => setActionModalOcc(null)} className="p-2 text-slate-400 hover:text-white rounded-xl">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAction} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <strong>Relato do Registro:</strong> {actionModalOcc.description}
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Status da Resolução
                </label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase"
                >
                  <option value="RESOLVIDO">✅ CONCLUIR / RESOLVIDO</option>
                  <option value="EM_ATENDIMENTO">🔍 MANTER EM ACOMPANHAMENTO</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Parecer / Devolutiva Conclusiva do Regente *
                </label>
                <textarea
                  rows={4}
                  value={actionFeedback}
                  onChange={(e) => setActionFeedback(e.target.value)}
                  placeholder="Descreva o retorno dado ao estudante, acordo com a família ou providência final..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModalOcc(null)}
                  className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-black uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase rounded-xl flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Salvar Devolutiva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE IMPRESSÃO A4 (TERMO DE OCORRÊNCIA / NOTIFICAÇÃO EDUCARTE) */}
      {printingDoc && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-8 max-h-[95vh] overflow-y-auto print:p-0 print:m-0 print:shadow-none">
            
            <div className="flex items-center justify-between border-b pb-4 mb-6 no-print">
              <span className="text-xs font-black text-slate-500 uppercase">Visualização de Impressão A4</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs uppercase rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Printer size={16} /> Imprimir Agora
                </button>
                <button
                  onClick={() => setPrintingDoc(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* DOCUMENTO A4 TIMBRADO */}
            <div className="space-y-6 text-slate-900 border p-8 rounded-xl bg-white min-h-[750px] flex flex-col justify-between">
              
              {/* CABEÇALHO OFICIAL */}
              <div className="text-center border-b pb-4 space-y-1">
                <h3 className="font-black text-sm uppercase tracking-wide">ESTADO DE MATO GROSSO • SECRETARIA DE ESTADO DE EDUCAÇÃO</h3>
                <h4 className="font-bold text-xs uppercase text-slate-700">ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI</h4>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest pt-1">
                  PROJETO EDUCARTE • BANDA & FANFARRA ESCOLAR
                </p>
                <h2 className="text-base font-black uppercase text-slate-950 pt-2 tracking-wider">
                  TERMO DE REGISTRO E NOTIFICAÇÃO MUSICAL
                </h2>
              </div>

              {/* DADOS DO INTEGRANTE */}
              <div className="grid grid-cols-2 gap-4 text-xs border p-4 rounded-xl bg-slate-50/50">
                <div><strong>Estudante:</strong> {printingDoc.studentName}</div>
                <div><strong>Turma Escolar:</strong> {printingDoc.className}</div>
                <div><strong>Naipe Musical:</strong> {printingDoc.naipe}</div>
                <div><strong>Instrumento Utilizado:</strong> {printingDoc.instrument || 'Geral'}</div>
                <div><strong>Data do Ocorrido:</strong> {printingDoc.date} às {printingDoc.time}</div>
                <div><strong>Natureza:</strong> {CATEGORY_MAP[printingDoc.category]?.label || printingDoc.category}</div>
              </div>

              {/* RELATO DOS FATOS */}
              <div className="space-y-2 flex-1">
                <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">Relato Oficial do Instrutor / Regente:</h5>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line p-4 border rounded-xl bg-white">
                  {printingDoc.description}
                </p>
                {printingDoc.actionTaken && (
                  <div className="text-xs text-slate-700 p-3 border rounded-xl bg-slate-50">
                    <strong>Providência Adotada:</strong> {printingDoc.actionTaken}
                  </div>
                )}
                {printingDoc.feedback && (
                  <div className="text-xs text-emerald-950 p-3 border border-emerald-200 rounded-xl bg-emerald-50">
                    <strong>Parecer Final:</strong> {printingDoc.feedback}
                  </div>
                )}
              </div>

              {/* CAMPO DE ASSINATURAS */}
              <div className="grid grid-cols-3 gap-6 pt-10 text-center text-[10px] font-black uppercase border-t">
                <div>
                  <div className="border-t border-slate-900 pt-1">Estudante Integrante</div>
                </div>
                <div>
                  <div className="border-t border-slate-900 pt-1">Pai / Responsável Legal</div>
                </div>
                <div>
                  <div className="border-t border-slate-900 pt-1">Maestro / Regente Educarte</div>
                </div>
              </div>

              {/* RODAPÉ OFICIAL */}
              <div className="text-center text-[8px] text-slate-400 font-bold uppercase border-t pt-2">
                Escola Estadual Cívico-Militar André Antônio Maggi • Projeto Educarte • Colíder - MT
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default EducarteOccurrences;
