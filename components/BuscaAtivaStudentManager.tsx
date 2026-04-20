
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
  MessageSquare,
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
      const active = dbStudents.filter(s => s.status === 'ATIVO' || s.status === 'RECLASSIFICADO');
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
    // Fetch all attendance records
    // Optimization: In a real app, we would aggregate on server or use specific query
    // For now, fetching all is acceptable for 450 students * ~N days
    const { data, error } = await supabase
      .from('class_attendance_students')
      .select('student_id, is_present');

    if (data) {
      const stats: Record<string, { total: number, present: number }> = {};
      data.forEach(record => {
        const sid = record.student_id;
        if (!stats[sid]) stats[sid] = { total: 0, present: 0 };
        stats[sid].total++;
        if (record.is_present) stats[sid].present++;
      });
      setAttendanceStats(stats);
    }
  };

  const fetchReferrals = async () => {
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .order('date', { ascending: false });

    if (data) {
      const mapped: Referral[] = data.map(r => ({
        id: r.id,
        studentId: r.student_code || r.student_id, // Fallback
        studentName: r.student_name || 'Desconhecido',
        date: r.date,
        type: r.type,
        reason: r.reason,
        status: r.status,
        responsible: r.responsible,
        feedback: r?.feedback
      }));
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

        return {
          ...s,
          attendance: Math.round(attendancePercent),
          absences: totalDays - presentDays,
          status,
          name: s.name,
          class: s.class,
          id: s.id,
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

  const filtered = useMemo(() => {
    return studentData.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [studentData, searchTerm]);

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

      const fullDescription = `[ENCAMINHAMENTO BUSCA ATIVA]
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
        involved_parties: [newReferral.responsible],
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input type="text" placeholder="Filtrar por nome do aluno..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
        </div>
        <button className="p-3 bg-gray-50 text-gray-400 hover:text-emerald-600 rounded-xl transition-all border border-gray-100"><Filter size={20} /></button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-24 text-center"><Loader2 className="animate-spin text-emerald-600 mx-auto" /></div>
        ) : filtered.length > 0 ? filtered.map(s => {
          const studentReferrals = referrals.filter(r => r.studentId === s.id);
          return (
            <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-emerald-200 hover:shadow-xl transition-all flex flex-col lg:flex-row items-center justify-between gap-6 group">
              <div className="flex items-center gap-6 flex-1">
                <div className={`w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center font-black ${s.attendance < 85 ? 'bg-red-50 text-red-600' : s.attendance < 90 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <span className="text-xl leading-none">{s.attendance}%</span>
                  <span className="text-[7px] uppercase tracking-tighter mt-1">Presença</span>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-black text-gray-900 uppercase leading-none">{s.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getStatusColor(s.status)}`}>{s.status}</span>
                    <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest border border-gray-100 px-1.5 py-0.5 rounded">v1.2.1-DEBUG</span>
                    <div className={`flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full border italic tracking-widest ${
                      s.totalInterventions > 0 
                        ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm' 
                        : 'bg-gray-50 text-gray-400 border-gray-100'
                    }`}>
                      <MessageSquare size={10} /> {s.totalInterventions > 0 ? `${s.totalInterventions} REGISTROS NO HISTÓRICO` : 'NENHUM REGISTRO NO HISTÓRICO'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><User size={12} /> {s.class} ({s.shift || 'MATUTINO'})</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><User size={12} /> Código: {s.id}</span>
                    {s.lastInterventionDate ? (
                      <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                        <Clock size={10} /> Último: {new Date(s.lastInterventionDate + 'T12:00:00').toLocaleDateString('pt-BR')} ({s.lastInterventionType})
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-300 uppercase flex items-center gap-1 italic">
                        <Clock size={10} /> Sem interações recentes
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={() => setViewingProfile(s)} 
                  className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase border border-gray-800 hover:bg-black transition-all shadow-lg flex items-center gap-2"
                >
                  <History size={16} /> Acompanhamento
                </button>
                <button onClick={() => setSelectedStudent({ id: s.id, name: s.name, class: s.class })} className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-[11px] font-black uppercase flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Scale size={16} /> Encaminhar</button>
              </div>
            </div>
          );
        }) : <div className="py-24 text-center"><AlertCircle size={48} className="mx-auto mb-4 text-gray-100" /><p className="text-gray-300 font-black uppercase text-xs">Nenhum aluno encontrado.</p></div>}
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
