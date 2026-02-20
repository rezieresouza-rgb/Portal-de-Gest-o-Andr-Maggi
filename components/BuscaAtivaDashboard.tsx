
import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Users,
  TrendingDown,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Send,
  MessageCircle,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { INITIAL_STUDENTS } from '../constants/initialData';
import BuscaAtivaActionsModal from './BuscaAtivaActionsModal';

const BuscaAtivaDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: INITIAL_STUDENTS.length,
    criticalCount: 0,
    recoveredCount: 0,
    ficaiCount: 0
  });

  const [chartData, setChartData] = useState<{ name: string, faltas: number }[]>([]);
  const [criticalCases, setCriticalCases] = useState<any[]>([]);
  const [selectedActionStudent, setSelectedActionStudent] = useState<{ id: string, name: string, class: string } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // 1. Fetch Attendance to calculate Critical Cases
    const { data: attendanceData } = await supabase
      .from('class_attendance_students')
      .select('student_id, is_present, class_attendance_records(classroom_name)'); // Join to get class name if needed

    // 2. Fetch Referrals to count Recovered and FICAI
    const { data: referralsData } = await supabase
      .from('referrals')
      .select('*');

    // Process Attendance
    const studentStats: Record<string, { total: number, present: number, class?: string }> = {};
    if (attendanceData) {
      attendanceData.forEach(r => {
        const sid = r.student_id;
        if (!studentStats[sid]) studentStats[sid] = { total: 0, present: 0 };
        studentStats[sid].total++;
        if (r.is_present) studentStats[sid].present++;
        // @ts-ignore
        if (r.class_attendance_records?.classroom_name && !studentStats[sid].class) {
          // @ts-ignore
          studentStats[sid].class = r.class_attendance_records.classroom_name;
        }
      });
    }

    let critical = 0;
    const criticalList: any[] = [];
    const infrequencyByYear: Record<string, number> = {};

    INITIAL_STUDENTS.forEach((s: any) => {
      const stat = studentStats[s.CodigoAluno] || { total: 0, present: 0 };
      const percent = stat.total > 0 ? (stat.present / stat.total) * 100 : 100;

      if (percent <= 90) { // 10% Absences Threshold
        critical++;
        criticalList.push({
          id: s.id || s.CodigoAluno, // Ensure ID is passed
          name: s.Nome,
          class: s.Turma,
          absences: `${Math.round(100 - percent)}%`,
          status: 'Risco Evasão'
        });
      }

      // Aggregate for chart (Infrequência count per class)
      // Assuming 'class' field in student e.g. "6º Ano A"
      // We can group by Year e.g. "6º Ano"
      const year = s.Turma.split(' ')[0] + ' ' + s.Turma.split(' ')[1]; // "6º Ano"
      if (!infrequencyByYear[year]) infrequencyByYear[year] = 0;
      if (percent < 90) infrequencyByYear[year]++;
    });

    // Process Referrals
    let recovered = 0;
    let ficai = 0;
    if (referralsData) {
      recovered = referralsData.filter(r => r.status === 'CONCLUÍDO').length;
      ficai = referralsData.filter(r => r.type === 'CONSELHO_TUTELAR' && r.status !== 'CONCLUÍDO').length; // Approximation for FICAI
    }

    setStats({
      totalStudents: INITIAL_STUDENTS.length,
      criticalCount: critical,
      recoveredCount: recovered,
      ficaiCount: ficai
    });

    // Chart Data
    const chart = Object.keys(infrequencyByYear).map(key => ({
      name: key,
      faltas: infrequencyByYear[key]
    }));
    setChartData(chart);

    // Critical Cases (Top 5)
    setCriticalCases(criticalList.slice(0, 5));
  };

  const handleForwardToMediation = async (student: any) => {
    if (!window.confirm(`Deseja encaminhar ${student.name} para a Equipe de Mediação devido à infrequência crítica?`)) return;

    // Check if already exists to avoid duplicates (optional but good)
    const { data: existing } = await supabase
      .from('psychosocial_referrals')
      .select('id')
      .eq('student_name', student.name)
      .eq('status', 'AGUARDANDO_TRIAGEM')
      .single();

    if (existing) {
      return alert("Este aluno já possui um encaminhamento pendente.");
    }

    const { error } = await supabase.from('psychosocial_referrals').insert([{
      student_name: student.name,
      class_name: student.class,
      teacher_name: 'BUSCA ATIVA',
      school_unit: 'ESCOLA ANDRÉ MAGGI',
      date: new Date().toISOString().split('T')[0],
      report: `[VIA BUSCA ATIVA] Aluno apresenta ${student.absences} de infrequência. Risco iminente de evasão.`,
      status: 'AGUARDANDO_TRIAGEM',
      student_age: 'Não informado',
      attendance_frequency: student.absences,
      previous_strategies: 'Monitoramento de Frequência',
      adopted_procedures: ['BUSCA_ATIVA'],
      observations: { learning: [], behavioral: [], emotional: [] }
    }]);

    if (error) {
      console.error(error);
      alert("Erro ao encaminhar.");
    } else {
      alert("Encaminhamento realizado com sucesso!");
      // Notify
      await supabase.from('psychosocial_notifications').insert([{
        title: 'Alerta de Busca Ativa',
        message: `A Busca Ativa encaminhou ${student.name} por infrequência crítica (${student.absences}).`,
        is_read: false
      }]);
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Alunos</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{stats.totalStudents}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Infrequentes (&gt;15%)</p>
          <p className="text-3xl font-black text-red-700 mt-1">{stats.criticalCount}</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Casos Resgatados</p>
          <p className="text-3xl font-black text-emerald-700 mt-1">{stats.recoveredCount}</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">FICAis em Aberto</p>
          <p className="text-3xl font-black text-amber-700 mt-1">{stats.ficaiCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GRÁFICO DE INFREQUÊNCIA */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-8">Alunos em Alerta por Ano</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="faltas" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.faltas > 20 ? '#ef4444' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CASOS CRÍTICOS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-red-500" /> Casos de Urgência
          </h3>
          <div className="space-y-4">
            {criticalCases.length > 0 ? criticalCases.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-red-100 transition-all group cursor-pointer" onClick={() => setSelectedActionStudent(c)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black text-xs">
                    {c.absences}
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase leading-tight">{c.name}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{c.class} • {c.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedActionStudent(c); }}
                    className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    title="Abrir Protocolos"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleForwardToMediation(c); }}
                    className="p-2 bg-white text-red-600 border border-red-100 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    title="Encaminhar para Mediação"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )) : (
              <p className="text-center py-8 text-gray-300 font-bold uppercase text-xs">Nenhum caso crítico detectado</p>
            )}
          </div>
          <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all">Ver Painel Completo de Risco</button>
        </div>
      </div>

      {/* PLANO DE AÇÃO BUSCA ATIVA */}
      <div className="bg-emerald-900 p-10 rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10"><Users size={180} /></div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><Send size={24} /></div>
            <h4 className="text-lg font-black uppercase tracking-tight">Encaminhamentos</h4>
            <p className="text-emerald-100/70 text-xs font-medium leading-relaxed">Fluxo ágil para envio de casos críticos aos conselhos e redes de apoio psicossocial.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><MessageCircle size={24} /></div>
            <h4 className="text-lg font-black uppercase tracking-tight">Canais de Contato</h4>
            <p className="text-emerald-100/70 text-xs font-medium leading-relaxed">Integração com WhatsApp para avisos automáticos de faltas aos responsáveis após 3 dias.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><FileCheck size={24} /></div>
            <h4 className="text-lg font-black uppercase tracking-tight">Rede de Proteção</h4>
            <p className="text-emerald-100/70 text-xs font-medium leading-relaxed">Acompanhamento compartilhado com CRAS/CREAS e Unidade de Saúde da família.</p>
          </div>
        </div>
      </div>

      {selectedActionStudent && <BuscaAtivaActionsModal student={selectedActionStudent} onClose={() => setSelectedActionStudent(null)} />}

    </div>
  );
};

export default BuscaAtivaDashboard;
