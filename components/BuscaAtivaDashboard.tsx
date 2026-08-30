import React, { useMemo, useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Send,
  MessageCircle,
  CheckCircle2,
  Loader2,
  Clock,
  History,
  LayoutDashboard,
  Search,
  Plus,
  Filter,
  Calendar,
  AlertCircle,
  BarChart3,
  Sparkles,
  HeartHandshake,
  UserCheck,
  FileText,
  Phone,
  RefreshCw,
  School,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useStudents } from '../hooks/useStudents';
import BuscaAtivaStudentProfile from './BuscaAtivaStudentProfile';
import { extractPhoneNumbers, buildWhatsAppUrl, generateBuscaAtivaMessage } from '../utils/phoneUtils';

interface BuscaAtivaDashboardProps {
  onNavigate: (tab: 'dashboard' | 'students' | 'commitments' | 'ficai' | 'attendance' | 'reports') => void;
}

const BuscaAtivaDashboard: React.FC<BuscaAtivaDashboardProps> = ({ onNavigate }) => {
  const { students: dbStudents, loading: studentsLoading } = useStudents();
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAbsencesCount: 0,
    criticalCount: 0,
    bolsaFamiliaAlertCount: 0,
    ficaiCount: 0,
    termsCount: 0
  });

  const [todayAbsentees, setTodayAbsentees] = useState<any[]>([]);
  const [criticalCases, setCriticalCases] = useState<any[]>([]);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  // Filtrar apenas estudantes do 6º ao 9º Ano que estejam ATIVOS ou RECLASSIFICADOS (exclui TRANSFERIDOS, EVADIDOS, ETC)
  const fundamentalStudents = useMemo(() => {
    return dbStudents.filter(s => {
      const statusUpper = (s.status || '').toUpperCase();
      if (statusUpper.startsWith('TRANSFERIDO') || statusUpper === 'INATIVO' || statusUpper === 'ABANDONO' || statusUpper === 'FALECIDO' || statusUpper === 'CANCELADO' || statusUpper === 'DESISTENTE') {
        return false;
      }
      const turma = (s.Turma || s.className || '').toUpperCase();
      if (turma.includes('TRANSFERIDO') || turma === 'SEM TURMA') return false;
      return turma.includes('6º') || turma.includes('7º') || turma.includes('8º') || turma.includes('9º') ||
             turma.includes('6') || turma.includes('7') || turma.includes('8') || turma.includes('9');
    });
  }, [dbStudents]);

  const fetchDashboardData = async () => {
    setIsProcessing(true);
    try {
      const today = new Date().toLocaleDateString('sv-SE');

      // 1. Ausentes Hoje (apenas estudantes ativos no sistema)
      const { data: todayData } = await supabase
        .from('class_attendance_students')
        .select('student_id, student_name, class_attendance_records!inner(classroom_name, date)')
        .eq('is_present', false)
        .eq('class_attendance_records.date', today);

      const dailyAbsences: Record<string, any> = {};
      if (todayData) {
        todayData.forEach(r => {
          const sid = String(r.student_id);
          const studentObj = dbStudents.find(s => 
            String(s.id) === sid || 
            String(s.registration_number) === sid || 
            String(s.CodigoAluno) === sid ||
            (s.name && r.student_name && s.name.trim().toLowerCase() === r.student_name.trim().toLowerCase())
          );

          // Se o estudante foi transferido de escola ou turma antiga, NÃO constar como falta/ausente
          const statusUpper = (studentObj?.status || '').toUpperCase();
          if (statusUpper.startsWith('TRANSFERIDO') || statusUpper === 'INATIVO' || statusUpper === 'ABANDONO' || statusUpper === 'FALECIDO' || statusUpper === 'CANCELADO' || statusUpper === 'DESISTENTE') {
            return;
          }

          const guardian = studentObj?.guardian_name || studentObj?.guardianName || studentObj?.NomeMae || 'Responsável Legal';
          const phone = studentObj?.contact_phone || studentObj?.contactPhone || studentObj?.Telefone || '';

          dailyAbsences[sid] = {
            id: sid,
            name: r.student_name,
            class: (r.class_attendance_records as any)?.classroom_name || studentObj?.class || studentObj?.Turma || '6º ao 9º Ano',
            guardianName: guardian,
            guardianPhone: phone,
            address: studentObj?.address || studentObj?.Endereco || '',
            parsedPhones: extractPhoneNumbers(phone)
          };
        });
      }
      const absenteesList = Object.values(dailyAbsences);
      setTodayAbsentees(absenteesList);

      // 2. Histórico de presenças para cálculo do semáforo
      const { data: attendanceData } = await supabase
        .from('class_attendance_students')
        .select('student_id, is_present');

      const attendanceMap: Record<string, { present: number, total: number }> = {};
      if (attendanceData) {
        attendanceData.forEach(rec => {
          const sid = String(rec.student_id);
          if (!attendanceMap[sid]) attendanceMap[sid] = { present: 0, total: 0 };
          attendanceMap[sid].total += 1;
          if (rec.is_present) attendanceMap[sid].present += 1;
        });
      }

      // 3. FICAIs registradas
      const { count: ficaiTotal } = await supabase
        .from('ficai_records')
        .select('*', { count: 'exact', head: true });

      // 4. Termos de Compromisso
      const { count: termsTotal } = await supabase
        .from('parent_commitment_terms')
        .select('*', { count: 'exact', head: true });

      // Analisar estudantes críticos
      let criticals: any[] = [];
      let bolsaAlerts = 0;

      fundamentalStudents.forEach(s => {
        const sid = String(s.id);
        const sReg = String(s.registration_number || '');
        const stats = attendanceMap[sid] || attendanceMap[sReg] || { present: 18, total: 20 };
        const total = stats.total > 0 ? stats.total : 20;
        const present = stats.total > 0 ? stats.present : 18;
        const absences = total - present;
        const rate = Math.round((present / total) * 100);

        if (rate < 85) bolsaAlerts++;

        if (rate < 75 || absences >= 5) {
          const guardian = s.guardian_name || s.guardianName || s.NomeMae || 'Responsável Legal';
          const phone = s.contact_phone || s.contactPhone || s.Telefone || '';
          criticals.push({
            id: sid,
            name: s.Nome || s.name,
            class: s.Turma || s.class || s.className,
            guardianName: guardian,
            guardianPhone: phone,
            address: s.address || s.Endereco || '',
            parsedPhones: extractPhoneNumbers(phone),
            rate,
            absences,
            status: 'CRITICO'
          });
        }
      });

      // Ordenar os mais críticos primeiro
      criticals.sort((a, b) => b.absences - a.absences);
      setCriticalCases(criticals.slice(0, 10));

      setStats({
        totalStudents: fundamentalStudents.length,
        todayAbsencesCount: absenteesList.length,
        criticalCount: criticals.length,
        bolsaFamiliaAlertCount: bolsaAlerts,
        ficaiCount: ficaiTotal || 0,
        termsCount: termsTotal || 0
      });
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard Busca Ativa:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!studentsLoading) {
      fetchDashboardData();
    }
  }, [studentsLoading, fundamentalStudents]);

  const handleSendWhatsAppToday = (student: any) => {
    const phones = extractPhoneNumbers(student.rawContact || student.guardianPhone);
    if (phones.length === 0) {
      alert(`Nenhum telefone encontrado no cadastro da secretaria para ${student.name}.`);
      return;
    }

    const msg = generateBuscaAtivaMessage('ABSENCE_TODAY', {
      studentName: student.name,
      className: student.class,
      guardianName: student.guardianName
    });

    const targetPhone = phones[0].cleaned;
    const url = buildWhatsAppUrl(targetPhone, msg);
    window.open(url, '_blank');
  };

  const handleSendWhatsAppCritical = (student: any) => {
    const phones = extractPhoneNumbers(student.rawContact || student.guardianPhone);
    if (phones.length === 0) {
      alert(`Nenhum telefone encontrado no cadastro da secretaria para ${student.name}.`);
      return;
    }

    const msg = generateBuscaAtivaMessage('GENERAL_CHECK', {
      studentName: student.name,
      className: student.class,
      guardianName: student.guardianName,
      absencesCount: student.absencesCount,
      attendanceRate: student.attendanceRate
    });

    const targetPhone = phones[0].cleaned;
    const url = buildWhatsAppUrl(targetPhone, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* BANNER PRINCIPAL COM IDENTIDADE CÍVICO-MILITAR & SEDUC */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck size={14} className="text-emerald-400" />
              Ensino Fundamental • 6º ao 9º Ano • SEDUC/MT
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-tight">
              Central de Busca Ativa & Permanência Discente
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Monitoramento diário de chamadas, prevenção à infrequência escolar (Art. 56 do ECA), convocações presenciais e garantia do direito de aprender.
            </p>
          </div>

          {/* ATALHOS RÁPIDOS */}
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => onNavigate('students')}
              className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95"
            >
              <Users size={16} /> Monitoramento (6º ao 9º)
            </button>
            <button
              onClick={() => onNavigate('commitments')}
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <UserCheck size={16} /> Convocações & Termos
            </button>
            <button
              onClick={() => onNavigate('ficai')}
              className="px-5 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95"
            >
              <FileText size={16} /> Central FICAI
            </button>
          </div>
        </div>

        {/* CARDS DE KPI INTEGRADOS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-emerald-800/50">
          <div 
            onClick={() => onNavigate('students')}
            className="bg-white/5 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md p-4 rounded-2xl border border-white/10"
          >
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1">Total Alunos (6º ao 9º)</span>
            <span className="text-2xl font-black text-white">{stats.totalStudents}</span>
          </div>

          <div 
            onClick={() => onNavigate('students')}
            className="bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer backdrop-blur-md p-4 rounded-2xl border border-amber-500/20"
          >
            <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest block mb-1">Casos em Alerta Preventivo</span>
            <span className="text-2xl font-black text-amber-400">{stats.criticalCount}</span>
          </div>

          <div 
            onClick={() => onNavigate('commitments')}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 transition-all cursor-pointer backdrop-blur-md p-4 rounded-2xl border border-emerald-500/20"
          >
            <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest block mb-1">Termos de Compromisso</span>
            <span className="text-2xl font-black text-emerald-400">{stats.termsCount}</span>
          </div>

          <div 
            onClick={() => onNavigate('ficai')}
            className="bg-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer backdrop-blur-md p-4 rounded-2xl border border-red-500/20"
          >
            <span className="text-[9px] font-black text-rose-300 uppercase tracking-widest block mb-1">Fichas FICAI (Conselho)</span>
            <span className="text-2xl font-black text-rose-400">{stats.ficaiCount}</span>
          </div>
        </div>
      </div>

      {/* DUAS COLUNAS PRINCIPAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* RADAR DE AUSÊNCIAS DE HOJE (AÇÃO IMEDIATA) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    Radar de Ausências de Hoje ({todayAbsentees.length})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Discentes ausentes na chamada de hoje para contato preventivo com os pais</p>
                </div>
              </div>

              <button
                onClick={fetchDashboardData}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
                title="Atualizar Chamadas"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {/* LISTA DE AUSENTES HOJE */}
            <div className="space-y-3">
              {todayAbsentees.map(student => (
                <div 
                  key={student.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group"
                >
                  <div className="flex items-center gap-3.5 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs shrink-0">
                      {student.name.charAt(0)}
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-black text-slate-900 uppercase">{student.name}</p>
                        <span className="text-[9px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase">
                          {student.class}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Resp: <strong className="text-slate-700">{student.guardianName}</strong> • {student.guardianPhone}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendWhatsAppToday(student)}
                    className="ml-3 flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 shadow-sm active:scale-95"
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp Pais</span>
                  </button>
                </div>
              ))}

              {todayAbsentees.length === 0 && (
                <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-slate-600 uppercase">Nenhuma ausência crítica registrada nas chamadas de hoje!</p>
                </div>
              )}
            </div>
          </div>

          {/* FLUXO INSTITUCIONAL DA BUSCA ATIVA (3 PILARES) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => onNavigate('students')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all cursor-pointer space-y-2"
            >
              <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black text-xs">
                1
              </div>
              <h4 className="text-xs font-black uppercase text-slate-900">Monitoramento Diário</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Acompanhamento individual de assiduidade e contato ágil pelo WhatsApp da secretaria.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('commitments')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer space-y-2"
            >
              <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-black text-xs">
                2
              </div>
              <h4 className="text-xs font-black uppercase text-slate-900">Convocação na Escola</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Reunião presencial com os pais para assinatura do Termo de Compromisso e orientações.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('ficai')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-rose-300 transition-all cursor-pointer space-y-2"
            >
              <div className="w-9 h-9 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center font-black text-xs">
                3
              </div>
              <h4 className="text-xs font-black uppercase text-slate-900">Ficha FICAI (ECA)</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Encaminhamento formal ao Conselho Tutelar e Ministério Público em caso de reincidência.
              </p>
            </div>
          </div>
        </div>

        {/* CASOS COM RISCO CRÍTICO DE EVASÃO (ALERTA VERMELHO / ART. 56 ECA) */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Alerta Crítico ECA ({criticalCases.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">Casos que atingiram o limite de faltas (Art. 56)</p>
              </div>
            </div>

            <div className="space-y-3">
              {criticalCases.map(student => (
                <div 
                  key={student.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 hover:border-rose-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-900 uppercase">{student.name}</p>
                    <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase">
                      {student.absences} faltas ({student.rate}%)
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 font-medium">
                    Turma: <strong className="text-slate-700">{student.class}</strong> • Resp: {student.guardianName}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleSendWhatsAppCritical(student)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-sm"
                      title="WhatsApp para o Responsável"
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </button>
                    <button
                      onClick={() => onNavigate('commitments')}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                    >
                      Convocar Pais
                    </button>
                    <button
                      onClick={() => onNavigate('ficai')}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                    >
                      Emitir FICAI
                    </button>
                  </div>
                </div>
              ))}

              {criticalCases.length === 0 && (
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-1" />
                  <p className="text-xs font-bold text-slate-500 uppercase">Nenhum caso em nível crítico no momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE PERFIL INDIVIDUAL DO ALUNO */}
      {viewingProfile && (
        <BuscaAtivaStudentProfile
          student={viewingProfile}
          onClose={() => setViewingProfile(null)}
          onAddAction={() => {}}
        />
      )}
    </div>
  );
};

export default BuscaAtivaDashboard;
