
import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Filter,
  UserCircle,
  User,
  MessageSquare as MessageSquareIcon,
  Scale,
  Loader2,
  Clock,
  History
} from 'lucide-react';
import { Referral, AttendanceRecord } from '../types';
import BuscaAtivaReferralModal from './BuscaAtivaReferralModal';
import BuscaAtivaStudentProfile from './BuscaAtivaStudentProfile';
import BuscaAtivaAddLogModal from './BuscaAtivaAddLogModal';
import { supabase } from '../supabaseClient';
import { useStudents } from '../hooks/useStudents';

import { extractPhoneNumbers, buildWhatsAppUrl, generateBuscaAtivaMessage } from '../utils/phoneUtils';

const BuscaAtivaStudentManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<{ id: string, name: string, class: string } | null>(null);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Data Sources
  const { students: dbStudents, loading: studentsLoading } = useStudents();
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<Record<string, { total: number, present: number }>>({});
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [monitoringLogs, setMonitoringLogs] = useState<any[]>([]);

  useEffect(() => {
    if (dbStudents) {
      const active = dbStudents.filter(s => {
        const statusUpper = (s.status || '').toUpperCase();
        if (statusUpper.startsWith('TRANSFERIDO') || statusUpper === 'INATIVO' || statusUpper === 'ABANDONO' || statusUpper === 'FALECIDO' || statusUpper === 'CANCELADO' || statusUpper === 'DESISTENTE') {
          return false;
        }
        const turma = (s.Turma || s.className || '').toUpperCase();
        if (turma.includes('TRANSFERIDO') || turma === 'SEM TURMA') return false;
        return true;
      });
      setStudents(active);
    }
  }, [dbStudents]);


  const fetchData = async () => {
    // We already have student loading from useStudents, so we focus on attendance/referrals
    // Use a local loading state to avoid flickering if needed, but the main list is handled by dbStudents
    await Promise.all([fetchAttendance(), fetchReferrals(), fetchMonitoringLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('busca-ativa-student-list-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
        console.log('Referrals changed, updating list...');
        fetchReferrals();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_attendance_students' }, () => {
        console.log('Attendance changed, updating list stats...');
        fetchAttendance();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences', filter: "category=eq.BUSCA_ATIVA" }, () => {
        console.log('Monitoring logs changed, updating list...');
        fetchMonitoringLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAttendance = async () => {
    try {
      // 1. Get the total count of attendance records
      const { count, error: countError } = await supabase
        .from('class_attendance_students')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      const total = count || 0;
      const pageSize = 1000;
      const pageCount = Math.ceil(total / pageSize);
      const promises = [];

      // 2. Queue up all ranges in parallel
      for (let i = 0; i < pageCount; i++) {
        const start = i * pageSize;
        const end = start + pageSize - 1;
        promises.push(
          supabase
            .from('class_attendance_students')
            .select('student_id, is_present')
            .range(start, end)
        );
      }

      // 3. Resolve all promises
      const results = await Promise.all(promises);
      const stats: Record<string, { total: number, present: number }> = {};

      results.forEach(({ data, error }) => {
        if (error) {
          console.error("Error fetching attendance page:", error);
          return;
        }
        if (data) {
          data.forEach(record => {
            const sid = record.student_id;
            if (!stats[sid]) stats[sid] = { total: 0, present: 0 };
            stats[sid].total++;
            if (record.is_present) stats[sid].present++;
          });
        }
      });

      setAttendanceStats(stats);
    } catch (e) {
      console.error("Error in fetchAttendance:", e);
    }
  };

  const fetchReferrals = async () => {
    const { data: refData } = await supabase
      .from('referrals')
      .select('*')
      .order('date', { ascending: false });

    const { data: psychoData } = await supabase
      .from('psychosocial_referrals')
      .select('student_name, date, report, feedback')
      .not('feedback', 'is', null);

    if (refData) {
      const mapped: Referral[] = refData.map(r => {
        const pRef = psychoData?.find(p => p.student_name === r.student_name && p.report.includes(r.reason));
        return {
          id: r.id,
          studentId: r.student_code || r.student_id, // Fallback
          studentName: r.student_name || 'Desconhecido',
          date: r.date,
          type: r.type,
          priority: r.priority || 'MÉDIA',
          reason: r.reason,
          status: r.status,
          responsible: r.responsible,
          feedback: r?.feedback || pRef?.feedback
        };
      });
      setReferrals(mapped);
    }
  };

  const fetchMonitoringLogs = async () => {
    const { data } = await supabase
      .from('occurrences')
      .select('*')
      .eq('category', 'BUSCA_ATIVA')
      .order('date', { ascending: false });

    if (data) setMonitoringLogs(data);
  };

  // Process Student List
  const studentData = useMemo(() => {
    const processed = students.map(s => {
      const stats = attendanceStats[s.registration_number] || attendanceStats[s.id] || { total: 0, present: 0 };
      const totalDays = stats.total;
      const presentDays = stats.present;

      // Default to 100% if no records
      const attendancePercent = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

      let status: 'NORMAL' | 'ALERTA' | 'CRÍTICO' = 'NORMAL';
      if (attendancePercent <= 85) status = 'CRÍTICO';
      else if (attendancePercent <= 90) status = 'ALERTA';

      // Aggregate Interventions
      const studentReferrals = referrals.filter(r => r.studentId === s.id);
      const studentLogs = monitoringLogs.filter(log => log.student_id === s.id);
      
      const allActions = [
        ...studentReferrals.map(r => ({ date: r.date, type: r.type })),
        ...studentLogs.map(l => ({ date: l.date, type: 'CONTATO' }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastInt = allActions.length > 0 ? allActions[0] : null;
      const guardian = s.guardian_name || s.guardianName || s.NomeMae || 'Responsável Legal';
      const phone = s.contact_phone || s.contactPhone || s.Telefone || '';
      const address = s.address || s.Endereco || '';

        return {
          ...s,
          attendance: Math.round(attendancePercent),
          absences: totalDays - presentDays,
          status,
          name: s.name,
          class: s.class,
          id: s.id,
          guardian_name: guardian,
          guardianName: guardian,
          contact_phone: phone,
          contactPhone: phone,
          address: address,
          parsedPhones: extractPhoneNumbers(phone),
          totalInterventions: allActions.length,
          lastInterventionDate: lastInt?.date,
          lastInterventionType: lastInt?.type
        };
    });

    // Sort by lowest attendance first, then alphabetically
    return processed.sort((a, b) => {
      if (a.attendance !== b.attendance) return a.attendance - b.attendance;
      return a.name.localeCompare(b.name);
    });
  }, [students, attendanceStats]);

  const handleSaveReferral = async (newReferral: Omit<Referral, 'id'>) => {
    // Find student info
    const student = students.find(s => s.id === newReferral.studentId);
    if (!student) return alert("Aluno não encontrado.");

    // Mapeamento de prioridade para severidade da mediação
    const severityMap: Record<string, string> = {
      'URGENTE': 'CRÍTICA',
      'ALTA': 'ALTA',
      'MÉDIA': 'MÉDIA',
      'BAIXA': 'BAIXA'
    };

    try {
      setLoading(true);
      const now = new Date();
      const currentDate = now.toLocaleDateString('sv-SE');
      const currentTime = now.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' });

      // 1. Salvar no controle de encaminhamentos (Busca Ativa)
      console.log("Tentando salvar em 'referrals'...");
      const { error: refError } = await supabase.from('referrals').insert([{
        student_code: newReferral.studentId,
        student_name: student.name,
        class_name: student.class,
        date: newReferral.date || currentDate,
        type: newReferral.type,
        reason: newReferral.reason,
        status: newReferral.status,
        responsible: newReferral.responsible,
      }]);

      if (refError) {
        console.error("Erro na tabela 'referrals':", refError);
        // Não jogamos erro aqui ainda para tentar salvar na tabela secundária
      }

      // [NOVO] 1.1 Dual-write: Salvar em psychosocial_referrals e obter ID para vínculo
      console.log("Tentando salvar em 'psychosocial_referrals'...");
      const { data: psychoData, error: psychoError } = await supabase.from('psychosocial_referrals').insert([{
        student_name: student.name,
        class_name: student.class,
        teacher_name: `BUSCA ATIVA (${newReferral.responsible})`,
        school_unit: 'ESCOLA ANDRÉ MAGGI',
        date: newReferral.date || currentDate,
        report: `[VIA BUSCA ATIVA] ${newReferral.reason}`,
        priority: newReferral.priority || 'MEDIA',
        status: 'AGUARDANDO_TRIAGEM'
      }]).select('id').single();

      if (psychoError) {
        console.error("Erro na tabela 'psychosocial_referrals':", psychoError);
      }

      if (refError && psychoError) {
        throw new Error(`Falha em ambas as tabelas (Referrals: ${refError.message} | Psycho: ${psychoError.message})`);
      }

      const linkedReferralId = psychoData?.id;

      // 2. Registrar no Diário de Acompanhamento (History)
      const { error: logError } = await supabase.from('occurrences').insert([{
        student_id: student.id,
        student_name: student.name,
        classroom_name: student.class,
        date: newReferral.date || currentDate,
        time: currentTime,
        description: `[ENCAMINHAMENTO: ${newReferral.type}] ${newReferral.reason} (Prioridade: ${newReferral.priority}) (Resp: ${newReferral.responsible})`,
        category: 'BUSCA_ATIVA',
        severity: severityMap[newReferral.priority || 'MÉDIA'] as any,
        responsible_name: newReferral.responsible,
        status: 'REGISTRADO'
      }]);

      if (logError) {
        console.error("Erro na tabela 'occurrences':", logError);
      }

      // 3. Preparar histórico completo para enviar à Mediação
      // ... (histórico mantido igual)
      const studentLogs = monitoringLogs
        .filter(log => log.student_id === student.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const studentInfo = studentData.find(s => s.id === student.id);

      const historySummary = studentLogs.map(log => 
        `• ${new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR')}: ${log.description}`
      ).join('\n');

      const activeResponsible = newReferral.responsible ? `BUSCA ATIVA (${newReferral.responsible})` : 'BUSCA ATIVA ESCOLAR';
      const fullDescription = `[ENCAMINHAMENTO BUSCA ATIVA] [Enviado por: ${activeResponsible}]
TIPO: ${newReferral.type}
URGÊNCIA: ${newReferral.priority}
FALTAS NO ANO: ${studentInfo?.absences || 0}
RELATO: ${newReferral.reason}

--- HISTÓRICO DE ACOMPANHAMENTO ---
${historySummary || 'Nenhum registro anterior no sistema.'}`;

      // 5. Abrir Caso no Módulo de Mediação com o histórico completo
      const { error: mediationError } = await supabase.from('mediation_cases').insert([{
        student_id: student.id,
        student_name: student.name,
        class_name: student.class,
        type: 'OUTRO',
        severity: severityMap[newReferral.priority || 'MEDIA'] as any,
        status: 'ABERTURA',
        opened_at: newReferral.date || currentDate,
        description: fullDescription,
        involved_parties: [activeResponsible],
        origin_referral_id: linkedReferralId,
        steps: [
          { id: '1', label: 'Análise de Busca Ativa', completed: true, date: currentDate },
          { id: '2', label: 'Escuta das Partes', completed: false },
          { id: '3', label: 'Círculo de Mediação / Paz', completed: false },
          { id: '4', label: 'Acordo / Finalização', completed: false }
        ],
      }]);

      if (mediationError) {
        console.error("Erro na tabela 'mediation_cases':", mediationError);
        // Diferente das tabelas de log, erro aqui é crítico para o fluxo
        throw new Error(`Mediação: ${mediationError.message}`);
      }

      // 6. Gerar Notificação para a equipe técnica
      const { error: notifyError } = await supabase.from('psychosocial_notifications').insert([{
        title: 'Encaminhamento: Busca Ativa',
        message: `O aluno ${student.name} foi encaminhado para a Mediação pela Busca Ativa (Motivo: ${newReferral.type}).`,
        is_read: false
      }]);

      if (notifyError) {
        console.error("Erro na tabela 'psychosocial_notifications':", notifyError);
      }

      alert("Encaminhamento realizado com sucesso!");
      setSelectedStudent(null);
      await Promise.all([fetchReferrals(), fetchMonitoringLogs()]);
    } catch (e: any) {
      console.error("Erro geral no salvamento:", e);
      alert(`[FALHA TÉCNICA] ${e.message || 'Erro desconhecido. Verifique o console do navegador.'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRÍTICO': return 'bg-red-100 text-red-700 border-red-200';
      case 'ALERTA': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const [selectedYear, setSelectedYear] = useState<string>('TODOS');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('TODOS');

  // Filtered List
  const filtered = useMemo(() => {
    return studentData.filter(s => {
      const matchesSearch =
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.class || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.id || '').includes(searchTerm);

      const turmaUpper = (s.class || '').toUpperCase();
      let matchesYear = true;
      if (selectedYear === '6') matchesYear = turmaUpper.includes('6º') || turmaUpper.includes('6');
      else if (selectedYear === '7') matchesYear = turmaUpper.includes('7º') || turmaUpper.includes('7');
      else if (selectedYear === '8') matchesYear = turmaUpper.includes('8º') || turmaUpper.includes('8');
      else if (selectedYear === '9') matchesYear = turmaUpper.includes('9º') || turmaUpper.includes('9');

      const matchesStatus = selectedStatusFilter === 'TODOS' || s.status === selectedStatusFilter;

      return matchesSearch && matchesYear && matchesStatus;
    });
  }, [studentData, searchTerm, selectedYear, selectedStatusFilter]);

  const handleWhatsApp = (s: any) => {
    const phones = s.parsedPhones && s.parsedPhones.length > 0
      ? s.parsedPhones
      : extractPhoneNumbers(s.contact_phone || s.contactPhone || s.Telefone);

    if (phones.length === 0) {
      const manualPhone = prompt(
        `Nenhum telefone cadastrado na Secretaria para ${s.guardian_name || 'o responsável'} de ${s.name}.\n\nDigite o número com DDD para abrir o WhatsApp:`
      );
      if (manualPhone) {
        const parsed = extractPhoneNumbers(manualPhone);
        if (parsed.length > 0) {
          const msg = generateBuscaAtivaMessage('GENERAL_CHECK', {
            studentName: s.name,
            className: s.class,
            guardianName: s.guardian_name || s.guardianName,
            absencesCount: s.absences,
            attendanceRate: s.attendance
          });
          window.open(buildWhatsAppUrl(parsed[0].cleaned, msg), '_blank');
        }
      }
      return;
    }

    const message = generateBuscaAtivaMessage('GENERAL_CHECK', {
      studentName: s.name,
      className: s.class,
      guardianName: s.guardian_name || s.guardianName,
      absencesCount: s.absences,
      attendanceRate: s.attendance
    });

    window.open(buildWhatsAppUrl(phones[0].cleaned, message), '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* BARRA DE CONTROLE & FILTROS 6º AO 9º */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Filtrar por nome do aluno, código ou turma..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none cursor-pointer focus:bg-white"
          >
            <option value="TODOS">Todos os Níveis de Risco</option>
            <option value="CRÍTICO">🚨 Risco Crítico (≤ 85%)</option>
            <option value="ALERTA">⚠️ Alerta Amarelo (86% a 90%)</option>
            <option value="NORMAL">🟢 Frequência Normal (&gt; 90%)</option>
          </select>
        </div>

        {/* ABAS RÁPIDAS POR ANO (6º AO 9º) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { id: 'TODOS', label: 'Todos os Anos' },
            { id: '6', label: '6º Ano Fundamental' },
            { id: '7', label: '7º Ano Fundamental' },
            { id: '8', label: '8º Ano Fundamental' },
            { id: '9', label: '9º Ano Fundamental' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedYear(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedYear === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-auto shrink-0">
            {filtered.length} discentes
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-24 text-center"><Loader2 className="animate-spin text-emerald-600 mx-auto" /></div>
        ) : filtered.length > 0 ? filtered.map(s => {
          return (
            <div key={s.id} className="bg-white p-5 sm:p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-xl transition-all flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 sm:gap-6 group w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1 min-w-0 w-full">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.5rem] flex flex-col items-center justify-center font-black shrink-0 ${s.attendance < 85 ? 'bg-red-50 text-red-600 border border-red-200' : s.attendance < 90 ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                  <span className="text-lg sm:text-xl leading-none">{s.attendance}%</span>
                  <span className="text-[7px] uppercase tracking-tighter mt-1 font-bold">Presença</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase leading-tight break-words">{s.name}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border shrink-0 ${getStatusColor(s.status)}`}>{s.status}</span>
                    <div className={`flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full border italic tracking-widest shrink-0 ${
                      s.totalInterventions > 0 
                        ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm' 
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      <MessageSquareIcon size={10} /> {s.totalInterventions > 0 ? `${s.totalInterventions} INTERVENÇÕES` : 'SEM REGISTROS'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><User size={12} /> Turma: <strong className="text-slate-800">{s.class}</strong> ({s.shift || 'MATUTINO'})</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">• Faltas: <strong className="text-rose-600">{s.absences || 0} aulas</strong></span>
                    {s.lastInterventionDate ? (
                      <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                        <Clock size={10} /> Último Contato: {new Date(s.lastInterventionDate + 'T12:00:00').toLocaleDateString('pt-BR')} ({s.lastInterventionType})
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1 italic">
                        <Clock size={10} /> Sem interações recentes
                      </span>
                    )}
                  </div>
                  {/* DADOS DA SECRETARIA */}
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                    <span className="font-medium">
                      Resp: <strong className="text-slate-700 uppercase">{s.guardian_name || 'Não informado'}</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium flex items-center gap-1">
                      <Phone size={11} className="text-emerald-600" />
                      {s.contact_phone || 'Telefone não cadastrado'}
                    </span>
                    {s.address && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-400 truncate max-w-md" title={s.address}>
                          <MapPin size={11} className="inline mr-0.5 text-slate-400" /> {s.address}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 w-full xl:w-auto justify-end mt-2 xl:mt-0">
                <button
                  onClick={() => handleWhatsApp(s)}
                  className="px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                  title="WhatsApp para o Responsável"
                >
                  <Phone size={14} /> WhatsApp
                </button>
                <button 
                  onClick={() => setViewingProfile(s)} 
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-slate-800 transition-all shadow-md flex items-center gap-1.5"
                >
                  <History size={14} /> Prontuário 360°
                </button>
                <button 
                  onClick={() => setSelectedStudent({ id: s.id, name: s.name, class: s.class })} 
                  className="px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Scale size={14} /> Encaminhar
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <AlertCircle size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-400 font-black uppercase text-xs">Nenhum estudante localizado nos filtros selecionados.</p>
          </div>
        )}
      </div>

      {selectedStudent && (
        <BuscaAtivaReferralModal 
          student={selectedStudent} 
          absences={studentData.find(s => s.id === selectedStudent.id)?.absences || 0}
          studentHistory={monitoringLogs.filter(log => log.student_id === selectedStudent.id)}
          onClose={() => setSelectedStudent(null)} 
          onSave={handleSaveReferral} 
        />
      )}
      {viewingProfile && <BuscaAtivaStudentProfile student={viewingProfile} referrals={referrals} onClose={() => setViewingProfile(null)} />}
    </div>
  );
};

export default BuscaAtivaStudentManager;
