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
  }, []);

  const handleSaveCouncil = async (council: ClassCouncil) => {
    try {
      const councilData = {
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
          .update(councilData)
          .eq('id', council.id);

        if (error) throw error;
        addToast("Conselho de classe atualizado!", "success");
      } else {
        const { error } = await supabase
          .from('class_councils')
          .insert([councilData]);

        if (error) throw error;
        addToast("Conselho de classe registrado com sucesso!", "success");
      }

      await fetchCouncils();
      setView('list');
    } catch (error) {
      console.error("Erro ao salvar:", error);
      addToast("Erro ao salvar dados do conselho.", "error");
    }
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
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-100 text-indigo-700 rounded-2xl">
            <Users size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Conselho de Classe</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">Gestão de Resultados e Desempenho Escolar</p>
          </div>
        </div>
        <button 
          onClick={() => { setSelectedCouncil(undefined); setView('form'); }}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Novo Conselho
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Buscar por turma ou bimestre..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto custom-scrollbar">
          {['TODOS', '1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'].map(b => (
            <button 
              key={b}
              onClick={() => setFilterBimestre(b)}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                filterBimestre === b ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* LISTAGEM DE HISTÓRICO */}
      <div className="grid grid-cols-1 gap-3">
        {filteredCouncils.length > 0 ? filteredCouncils.map(council => (
          <div 
            key={council.id} 
            onClick={() => { setSelectedCouncil(council); setView('form'); }}
            className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                council.status === 'FINALIZADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-900'
              }`}>
                {council.status === 'FINALIZADO' ? <CheckCircle2 size={22} /> : <Clock size={22} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-slate-900 uppercase leading-none">{council.className}</h4>
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[9px] font-black uppercase">{council.bimestre}</span>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1"><Calendar size={12} className="text-slate-400" /> {new Date(council.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  <span className="flex items-center gap-1"><Users size={12} className="text-slate-400" /> {council.studentObservations?.length || 0} Alunos</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-auto">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                council.status === 'FINALIZADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
              }`}>
                {council.status}
              </span>
              <button 
                onClick={(e) => handlePrintCouncil(council, e)}
                disabled={isPrinting}
                className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-all"
                title="Imprimir Ata"
              >
                {isPrinting && printingCouncil?.id === council.id ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
              </button>
              <button 
                onClick={(e) => handleDelete(council.id, e)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-all"
                title="Excluir Registro"
              >
                <Trash2 size={16} />
              </button>
              <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-200 space-y-2">
            <History size={36} className="mx-auto text-slate-300" />
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum conselho registrado nesta categoria</p>
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
