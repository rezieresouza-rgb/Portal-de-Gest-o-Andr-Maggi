import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  History, 
  ChevronRight, 
  ArrowLeft, 
  Users, 
  FileText, 
  Calendar,
  Filter,
  Trash2,
  CheckCircle2,
  Clock,
  Printer,
  Loader2
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from './Toast';
import { ClassCouncil, Classroom } from '../types';
import ClassCouncilForm from './ClassCouncilForm';

const ClassCouncilManager: React.FC = () => {
  const { addToast } = useToast();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [councils, setCouncils] = useState<ClassCouncil[]>([]);
  const [selectedCouncil, setSelectedCouncil] = useState<ClassCouncil | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBimestre, setFilterBimestre] = useState('TODOS');
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printingCouncil, setPrintingCouncil] = useState<ClassCouncil | null>(null);

  const fetchCouncils = async () => {
    const { data, error } = await supabase
      .from('class_councils')
      .select('*, classrooms(name)')
      .order('date', { ascending: false });

    if (error) {
      console.error("Error fetching councils:", error);
      return;
    }

    if (data) {
      setCouncils(data.map(c => ({
        id: c.id,
        classroomId: c.classroom_id,
        className: c.classrooms?.name || 'N/A',
        bimestre: c.bimestre,
        date: c.date,
        generalDiagnosis: c.general_diagnosis,
        studentObservations: c.student_observations,
        decisions: c.decisions,
        attendanceTeachers: c.attendance_teachers,
        status: c.status,
        timestamp: new Date(c.created_at).getTime()
      })));
    }
  };

  useEffect(() => {
    fetchCouncils();
    
    // Fetch classrooms for names
    const fetchClassrooms = async () => {
      const { data } = await supabase.from('classrooms').select('*');
      if (data) setClassrooms(data);
    };
    fetchClassrooms();
  }, []);

  const handleSaveCouncil = async (council: ClassCouncil) => {
    const dbData = {
      classroom_id: council.classroomId,
      bimestre: council.bimestre,
      date: council.date,
      general_diagnosis: council.generalDiagnosis,
      student_observations: council.studentObservations,
      decisions: council.decisions,
      attendance_teachers: council.attendanceTeachers,
      status: council.status
    };

    if (council.id) {
      const { error } = await supabase
        .from('class_councils')
        .update(dbData)
        .eq('id', council.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('class_councils')
        .insert([dbData]);
      if (error) throw error;
    }

    await fetchCouncils();
    setView('list');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Deseja excluir este registro de conselho permanentemente?")) {
      const { error } = await supabase.from('class_councils').delete().eq('id', id);
      if (error) {
        addToast("Erro ao excluir registro.", "error");
      } else {
        setCouncils(prev => prev.filter(c => c.id !== id));
        addToast("Registro excluído.", "success");
      }
    }
  };

  const handlePrintCouncil = async (council: ClassCouncil, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrintingCouncil(council);
    setIsPrinting(true);
    addToast("Gerando PDF...", "info");

    setTimeout(async () => {
      const element = document.getElementById('ata-conselho-externo');
      if (element) {
        try {
          // @ts-ignore
          const h2pdf = window.html2pdf;
          const filename = `Ata_Conselho_${council.className?.replace(/\s+/g, '_')}_${council.bimestre.replace(/\s+/g, '_')}.pdf`;
          
          await h2pdf().set({
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          }).from(element).save();
          
          addToast("PDF gerado com sucesso!", "success");
        } catch (err) {
          console.error("Erro ao gerar PDF:", err);
          addToast("Erro ao gerar PDF.", "error");
        }
      }
      setIsPrinting(false);
      setPrintingCouncil(null);
    }, 500);
  };

  const filteredCouncils = councils.filter(c => {
    const matchSearch = c.className?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       c.bimestre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBimestre = filterBimestre === 'TODOS' || c.bimestre === filterBimestre;
    return matchSearch && matchBimestre;
  });

  if (view === 'form') {
    return (
      <ClassCouncilForm 
        onCancel={() => setView('list')} 
        onSave={handleSaveCouncil}
        initialData={selectedCouncil}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 no-print">
      
      {/* HEADER GERAL */}
      <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-3xl border border-indigo-500/20 shadow-inner">
            <Users size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Conselho de Classe</h3>
            <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">Gestão de Resultados e Desempenho Escolar</p>
          </div>
        </div>
        <button 
          onClick={() => { setSelectedCouncil(undefined); setView('form'); }}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3 border border-indigo-500/30"
        >
          <Plus size={18} /> Novo Conselho
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white/5 p-4 rounded-3xl border border-white/5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input 
            type="text"
            placeholder="Buscar por turma ou período..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 scrollbar-hide">
          {['TODOS', '1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'].map(b => (
            <button 
              key={b}
              onClick={() => setFilterBimestre(b)}
              className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                filterBimestre === b ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* LISTAGEM DE HISTÓRICO */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCouncils.length > 0 ? filteredCouncils.map(council => (
          <div 
            key={council.id} 
            onClick={() => { setSelectedCouncil(council); setView('form'); }}
            className="group bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-lg hover:border-indigo-500/30 hover:bg-white/10 transition-all cursor-pointer flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-sm relative overflow-hidden"
          >
            <div className="flex items-center gap-8 flex-1">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner ${
                council.status === 'FINALIZADO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {council.status === 'FINALIZADO' ? <CheckCircle2 size={28} /> : <Clock size={28} />}
              </div>
              <div>
                <div className="flex items-center gap-4">
                  <h4 className="text-xl font-black text-white uppercase tracking-tight leading-none">{council.className}</h4>
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">{council.bimestre}</span>
                </div>
                <div className="flex items-center gap-6 mt-3">
                  <span className="text-[10px] font-bold text-white/40 uppercase flex items-center gap-2"><Calendar size={14} className="text-blue-400" /> {new Date(council.date).toLocaleDateString('pt-BR')}</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase flex items-center gap-2"><Users size={14} className="text-violet-400" /> {council.studentObservations?.length || 0} Alunos</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0 relative z-10">
              <div className="text-right mr-4">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Situação</p>
                <p className={`text-[10px] font-black uppercase mt-0.5 ${council.status === 'FINALIZADO' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {council.status}
                </p>
              </div>
              <button 
                onClick={(e) => handlePrintCouncil(council, e)}
                disabled={isPrinting}
                className="p-3.5 text-white/20 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all border border-transparent hover:border-blue-400/20"
                title="Imprimir Ata"
              >
                {isPrinting && printingCouncil?.id === council.id ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
              </button>
              <button 
                onClick={(e) => handleDelete(council.id, e)}
                className="p-3.5 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-transparent hover:border-red-400/20"
                title="Excluir Registro"
              >
                <Trash2 size={20} />
              </button>
              <div className="p-3.5 bg-white/5 text-white/20 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition-all shadow-sm border border-white/5">
                <ChevronRight size={24} />
              </div>
            </div>
          </div>
        )) : (
          <div className="py-32 text-center bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10 backdrop-blur-sm">
            <History size={64} className="mx-auto mb-6 text-white/10" />
            <p className="text-white/30 font-black uppercase text-xs tracking-[0.3em]">Nenhum conselho registrado nesta categoria</p>
          </div>
        )}
      </div>

      {/* ÁREA DE IMPRESSÃO OCULTA PARA O HISTÓRICO */}
      {printingCouncil && (
        <div style={{ position: 'absolute', top: -9999, left: -9999, width: '1000px' }}>
          <div id="ata-conselho-externo" className="bg-white text-black p-12 min-h-screen font-sans">
            <div className="flex justify-between items-center border-b-2 border-black pb-6 mb-8 gap-6">
              <div className="flex items-center justify-start flex-1">
                <img src="/logo-escola.png" alt="Escola Logo" className="h-44 w-auto object-contain" />
              </div>
              <div className="flex-[2] flex justify-center px-4">
                <img src="/dados escola.jpeg" alt="Dados da Escola" className="h-44 w-full object-contain" />
              </div>
              <div className="flex items-center justify-end flex-1">
                <img src="/SEDUC 2.jpg" alt="SEDUC MT" className="h-28 w-auto object-contain" />
              </div>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold uppercase tracking-tighter">Ata de Conselho de Classe</h1>
              <div className="flex justify-center gap-10 mt-4 text-xs font-bold uppercase">
                <span>Turma: {printingCouncil.className}</span>
                <span>Bimestre: {printingCouncil.bimestre}</span>
                <span>Data: {new Date(printingCouncil.date).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="space-y-10">
              <section>
                <h2 className="text-lg font-bold border-b border-black mb-3 uppercase tracking-tight">1. Diagnóstico Geral da Turma</h2>
                <p className="text-sm leading-relaxed text-justify">{printingCouncil.generalDiagnosis || 'Nenhuma observação registrada.'}</p>
              </section>

              <section>
                <h2 className="text-lg font-bold border-b border-black mb-3 uppercase tracking-tight">2. Deliberações e Ações Pedagógicas</h2>
                <p className="text-sm leading-relaxed text-justify">{printingCouncil.decisions || 'Nenhuma decisão registrada.'}</p>
              </section>

              <section>
                <h2 className="text-lg font-bold border-b border-black mb-6 uppercase tracking-tight">3. Análise Individual dos Estudantes</h2>
                <table className="w-full border-collapse border border-black text-[10px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black px-3 py-2 text-left w-1/4">ESTUDANTE</th>
                      <th className="border border-black px-2 py-2 text-center">DESEMPENHO</th>
                      <th className="border border-black px-2 py-2 text-center">COMPORT.</th>
                      <th className="border border-black px-3 py-2 text-left">OBSERVAÇÕES / RECOMENDAÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printingCouncil.studentObservations?.map((obs, idx) => (
                      <tr key={idx}>
                        <td className="border border-black px-3 py-2 font-bold uppercase">{obs.studentName}</td>
                        <td className="border border-black px-2 py-2 text-center">{obs.pedagogicalProgress}</td>
                        <td className="border border-black px-2 py-2 text-center">{obs.behavioralStatus}</td>
                        <td className="border border-black px-3 py-2">
                          {obs.notes && <p><strong>Obs:</strong> {obs.notes}</p>}
                          {obs.recommendations && <p><strong>Intervenção:</strong> {obs.recommendations}</p>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <div className="mt-20 pt-10 grid grid-cols-2 gap-20 px-10">
                <div className="text-center border-t border-black pt-4">
                  <p className="text-[10px] uppercase font-bold">Coordenação Pedagógica</p>
                </div>
                <div className="text-center border-t border-black pt-4">
                  <p className="text-[10px] uppercase font-bold">Direção Escolar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassCouncilManager;
