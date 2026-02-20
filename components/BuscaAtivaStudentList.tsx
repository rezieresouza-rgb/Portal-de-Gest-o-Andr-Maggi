
import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ChevronRight,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Filter,
  UserCircle,
  User,
  MessageSquare,
  Scale,
  Loader2
} from 'lucide-react';
import { Referral, AttendanceRecord } from '../types';
import BuscaAtivaReferralModal from './BuscaAtivaReferralModal';
import BuscaAtivaStudentProfile from './BuscaAtivaStudentProfile';
import BuscaAtivaActionsModal from './BuscaAtivaActionsModal';
import { supabase } from '../supabaseClient';
import { useStudents } from '../hooks/useStudents';

const BuscaAtivaStudentList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<{ id: string, name: string, class: string } | null>(null);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [viewingActions, setViewingActions] = useState<{ id: string, name: string, class: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Data Sources
  const { students: dbStudents, loading: studentsLoading } = useStudents();
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<Record<string, { total: number, present: number }>>({});
  const [referrals, setReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    if (dbStudents) {
      setStudents(dbStudents);
    }
  }, [dbStudents]);

  useEffect(() => {
    fetchData();

    const subs = supabase
      .channel('busca-ativa-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, fetchReferrals)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_attendance_students' }, fetchAttendance)
      .subscribe();

    return () => {
      subs.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchAttendance(), fetchReferrals()]);
    setLoading(false);
  };

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
        responsible: r.responsible
      }));
      setReferrals(mapped);
    }
  };

  // Process Student List
  const studentData = useMemo(() => {
    return students.map(s => {
      const stats = attendanceStats[s.id] || { total: 0, present: 0 };
      const totalDays = stats.total;
      const presentDays = stats.present;

      // Default to 100% if no records
      const attendancePercent = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

      let status: 'NORMAL' | 'ALERTA' | 'CRÍTICO' = 'NORMAL';
      if (attendancePercent < 85) status = 'CRÍTICO';
      else if (attendancePercent < 90) status = 'ALERTA';

      return {
        ...s,
        attendance: Math.round(attendancePercent),
        status,
        // Ensure properties match expected format
        name: s.name,
        class: s.class,
        id: s.id
      };
    });
  }, [students, attendanceStats]);

  const filtered = useMemo(() => {
    return studentData.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [studentData, searchTerm]);

  const handleSaveReferral = async (newReferral: Omit<Referral, 'id'>) => {
    // Find student info
    const student = students.find(s => s.id === newReferral.studentId);

    try {
      const { error } = await supabase.from('referrals').insert([{
        student_code: newReferral.studentId, // Using student_code as our ID reference
        student_name: student?.name,
        class_name: student?.class,
        date: newReferral.date || new Date().toISOString(),
        type: newReferral.type,
        reason: newReferral.reason,
        status: newReferral.status,
        responsible: newReferral.responsible,
        // notes: newReferral.notes // if we added it to types
      }]);

      if (error) throw error;

      alert("Intervenção de Busca Ativa registrada!");
      setSelectedStudent(null);
      fetchReferrals(); // Refresh
    } catch (e) {
      console.error(e);
      alert("Erro ao registrar intervenção.");
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
                    {studentReferrals.length > 0 && <div className="flex items-center gap-1 text-[8px] font-black bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full border border-violet-100"><MessageSquare size={10} /> {studentReferrals.length} Intervenções</div>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><User size={12} /> {s.class} ({s.shift || 'MATUTINO'})</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><User size={12} /> Código: {s.id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => setViewingActions({ id: s.id, name: s.name, class: s.class })} className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 shadow-sm"><CheckCircle2 size={14} /> Protocolos</button>
                <button onClick={() => setViewingProfile(s)} className="px-5 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black uppercase border border-gray-200">Ver Perfil</button>
                <button onClick={() => setSelectedStudent({ id: s.id, name: s.name, class: s.class })} className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Scale size={14} /> Encaminhar</button>
                <button className="p-3 bg-gray-50 text-gray-400 hover:text-emerald-600 rounded-xl transition-all"><ChevronRight size={20} /></button>
              </div>
            </div>
          );
        }) : <div className="py-24 text-center"><AlertCircle size={48} className="mx-auto mb-4 text-gray-100" /><p className="text-gray-300 font-black uppercase text-xs">Nenhum aluno encontrado.</p></div>}
      </div>

      {selectedStudent && <BuscaAtivaReferralModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onSave={handleSaveReferral} />}
      {viewingProfile && <BuscaAtivaStudentProfile student={viewingProfile} referrals={referrals} onClose={() => setViewingProfile(null)} />}
      {viewingActions && <BuscaAtivaActionsModal student={viewingActions} onClose={() => setViewingActions(null)} />}
    </div>
  );
};

export default BuscaAtivaStudentList;
