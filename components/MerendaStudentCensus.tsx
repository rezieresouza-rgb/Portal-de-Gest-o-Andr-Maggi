
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ChevronRight, 
  GraduationCap, 
  ShieldCheck, 
  Filter, 
  ArrowRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { INITIAL_STUDENTS } from '../constants/initialData';

const MerendaStudentCensus: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('TODAS');

  useEffect(() => {
    const saved = localStorage.getItem('secretariat_detailed_students_v1');
    setStudents(saved ? JSON.parse(saved) : INITIAL_STUDENTS);
  }, []);

  const classes = useMemo(() => {
    const unique = Array.from(new Set(students.map(s => s.Turma))).filter(Boolean);
    return ['TODAS', ...unique.sort()];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.Nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.CodigoAluno.includes(searchTerm);
      const matchClass = filterClass === 'TODAS' || s.Turma === filterClass;
      return matchSearch && matchClass;
    });
  }, [students, searchTerm, filterClass]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-6">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl">
               <GraduationCap size={32} />
            </div>
            <div>
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Censo Discente (Merenda)</h3>
               <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Alunos Beneficiários do PNAE sincronizados com a Secretaria</p>
            </div>
         </div>
         <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
               <input 
                 type="text" 
                 placeholder="Buscar aluno ou código..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
               />
            </div>
            <select 
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="p-4 bg-gray-50 rounded-2xl font-black text-[10px] uppercase outline-none focus:ring-2 focus:ring-emerald-100"
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredStudents.map((s, idx) => (
           <div key={s.CodigoAluno} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:border-emerald-200 transition-all group">
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                    {s.Nome[0]}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cód. {s.CodigoAluno}</p>
                    <h4 className="text-sm font-black text-gray-900 uppercase truncate leading-tight">{s.Nome}</h4>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-emerald-100">{s.Turma}</span>
                       <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-blue-100">{s.Turno}</span>
                    </div>
                 </div>
              </div>
           </div>
         ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
           <Users size={64} className="mx-auto mb-4 text-gray-200" />
           <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhum aluno encontrado nesta busca</p>
        </div>
      )}

      <div className="bg-emerald-900 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><ShieldCheck size={140} /></div>
         <div className="flex items-center gap-6 relative z-10">
            <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
               <Users size={32} className="text-emerald-400" />
            </div>
            <div>
               <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1">Beneficiários do PNAE</p>
               <h4 className="text-xl font-black uppercase">Sincronização em Tempo Real</h4>
               <p className="text-emerald-200/60 text-xs font-medium uppercase tracking-tight">O cálculo da lista de compras agora reflete os {students.length} alunos cadastrados.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default MerendaStudentCensus;
