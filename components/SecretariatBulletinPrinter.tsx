
import React, { useState, useEffect } from 'react';
import {
   Printer,
   Download,
   Search,
   Filter,
   Users,
   GraduationCap,
   ShieldCheck,
   CheckCircle2,
   FileDown,
   X,
   Loader2,
   AlertCircle
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const SecretariatBulletinPrinter: React.FC = () => {
   const [selectedClass, setSelectedClass] = useState('');
   const [selectedBimestre, setSelectedBimestre] = useState('1º BIMESTRE');
   const [isGenerating, setIsGenerating] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [availableClassrooms, setAvailableClassrooms] = useState<any[]>([]);
   const [students, setStudents] = useState<any[]>([]);

   // Carregar turmas do Supabase
   const fetchClassrooms = async () => {
      try {
         const { data, error } = await supabase
            .from('classrooms')
            .select('id, name')
            .order('name');
         if (error) throw error;
         setAvailableClassrooms(data || []);
         if (data && data.length > 0 && !selectedClass) {
            setSelectedClass(data[0].name);
         }
      } catch (error) {
         console.error("Erro ao buscar turmas:", error);
      }
   };

   const fetchBulletinData = async () => {
      if (!selectedClass) return;
      setIsLoading(true);
      try {
         // 1. Buscar Alunos da Turma
         const { data: classData } = await supabase
            .from('classrooms')
            .select('id')
            .eq('name', selectedClass)
            .single();

         if (!classData) throw new Error("Turma não encontrada");

         const { data: enrollments } = await supabase
            .from('enrollments')
            .select(`
          students (
            id,
            name,
            registration_number
          )
        `)
            .eq('classroom_id', classData.id);

         if (!enrollments) {
            setStudents([]);
            return;
         }

         const studentCodes = enrollments.map((e: any) => e.students.registration_number);

         // 2. Definir Bimestres para busca (Acumulado)
         const BIMESTRES = ['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'];
         const targetIdx = BIMESTRES.indexOf(selectedBimestre);
         const activeBimestres = BIMESTRES.slice(0, targetIdx + 1);

         // 3. Buscar Notas (Grades) para os bimestres selecionados
         const { data: assessments } = await supabase
            .from('assessments')
            .select('id, subject, bimestre')
            .eq('classroom_id', classData.id)
            .in('bimestre', activeBimestres);

         let allGrades: any[] = [];
         if (assessments && assessments.length > 0) {
            const assessmentIds = assessments.map(a => a.id);
            const { data: gradeRecords } = await supabase
               .from('grades')
               .select('*')
               .in('assessment_id', assessmentIds)
               .in('student_code', studentCodes);
            allGrades = gradeRecords || [];
         }

         // 4. Buscar Frequência (Attendance)
         // Nota: Poderia ser filtrado por data do bimestre se tivéssemos essa info clara, 
         // mas vamos usar a frequência total do aluno até o momento como padrão.
         const { data: attendanceData } = await supabase
            .from('class_attendance_students')
            .select(`
          is_present,
          student_id
        `)
            .in('student_id', studentCodes);

         // Mapear dados para o formato do BulletinCard (CUMULATIVO)
         const subjects = Array.from(new Set(assessments?.map(a => a.subject) || []));

         const mappedStudents = enrollments.map((e: any) => {
            const student = e.students;

            // Estrutura: { 'Matemática': { '1º BIMESTRE': 8.5, '2º BIMESTRE': 7.0 }, ... }
            const studentGrades: Record<string, Record<string, number>> = {};

            subjects.forEach(subj => {
               studentGrades[subj] = {};
               activeBimestres.forEach(bim => {
                  const ass = assessments?.find(a => a.subject === subj && a.bimestre === bim);
                  if (ass) {
                     const g = allGrades.find(gr => gr.assessment_id === ass.id && gr.student_code === student.registration_number);
                     studentGrades[subj][bim] = g ? g.score : 0;
                  } else {
                     studentGrades[subj][bim] = 0;
                  }
               });
            });

            // Cálculo de frequência
            const studentAtt = attendanceData?.filter((a: any) => a.student_id === student.registration_number) || [];
            const totalClasses = studentAtt.length || 1;
            const presences = studentAtt.filter((a: any) => a.is_present).length;
            const frequency = Math.round((presences / totalClasses) * 100);

            return {
               id: student.id,
               name: student.name,
               grades: studentGrades,
               frequency: frequency
            };
         });

         setStudents(mappedStudents);
      } catch (error) {
         console.error("Erro ao carregar dados dos boletins:", error);
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchClassrooms();
   }, []);

   useEffect(() => {
      fetchBulletinData();
   }, [selectedClass, selectedBimestre]);

   const handlePrint = async () => {
      setIsGenerating(true);
      // Simula tempo de processamento para renderizar o layout de impressão
      setTimeout(() => {
         window.print();
         setIsGenerating(false);
      }, 800);
   };

   const BulletinCard = ({ student }: { student: any }) => {
      const BIMESTRES = ['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'];
      const targetIdx = BIMESTRES.indexOf(selectedBimestre);
      const activeBimestres = BIMESTRES.slice(0, targetIdx + 1);

      return (
         <div className="bulletin-card p-3 border border-black bg-white space-y-1">
            <div className="flex justify-between items-center border-b border-black pb-1 gap-4">
               <div className="flex items-center justify-start flex-1">
                  <img src="/logo-escola.png" alt="Escola Logo" className="h-12 w-auto object-contain" />
               </div>

               <div className="flex-[2] flex justify-center px-4">
                  <img src="/dados escola.jpeg" alt="Dados da Escola" className="h-14 w-full object-contain" />
               </div>

               <div className="flex items-center justify-end flex-1">
                  <img src="/SEDUC 2.jpg" alt="SEDUC MT" className="h-10 w-auto object-contain" />
               </div>
            </div>
            <div className="text-center text-[5px] text-gray-300 font-black uppercase tracking-widest no-print">
               Bulletin V3.0 - Stabilization Active
            </div>
            <div className="grid grid-cols-2 gap-2 text-[7px] font-black uppercase">
               <div className="p-1 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-gray-400 text-[5px] mb-0.5">Aluno(a):</p>
                  <p className="truncate">{student.name}</p>
               </div>
               <div className="p-1 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-gray-400 text-[5px] mb-0.5">Turma:</p>
                  <p>{selectedClass}</p>
               </div>
            </div>

            <table className="w-full text-left border-collapse text-[7px]">
               <thead>
                  <tr className="bg-gray-100 border border-black">
                     <th className="p-1 uppercase font-black">Componente Curricular</th>
                     {activeBimestres.map(bim => (
                        <th key={bim} className="p-1 text-center uppercase font-black w-10 border-l border-black">{bim.split(' ')[0]}</th>
                     ))}
                     <th className="p-1 text-center uppercase font-black w-12 border-l border-black bg-indigo-50/50">Média</th>
                     <th className="p-1 text-center uppercase font-black w-16 border-l border-black">Freq. (%)</th>
                     <th className="p-1 text-center uppercase font-black w-16 border-l border-black">Situação</th>
                  </tr>
               </thead>
               <tbody className="border border-black">
                  {Object.entries(student.grades).map(([subj, bims]: [any, any]) => {
                     const gradesArray = Object.values(bims) as number[];
                     const average = gradesArray.length > 0
                        ? gradesArray.reduce((a, b) => a + b, 0) / gradesArray.length
                        : 0;

                     return (
                        <tr key={subj} className="border-b border-gray-200">
                           <td className="p-1 font-bold uppercase">{subj}</td>
                           {activeBimestres.map(bim => (
                              <td key={bim} className="p-1 text-center font-black border-l border-black/10">
                                 {bims[bim] ? bims[bim].toFixed(1) : '-'}
                              </td>
                           ))}
                           <td className="p-1 text-center font-black border-l border-black bg-indigo-50/50">
                              {average.toFixed(1)}
                           </td>
                           <td className="p-1 text-center font-bold border-l border-black">{student.frequency}%</td>
                           <td className="p-1 text-center border-l border-black">
                              <span className={`font-black ${average >= 6 ? 'text-emerald-700' : 'text-red-700'}`}>
                                 {average >= 6 ? 'Apto' : 'Recuperação'}
                              </span>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>

            <div className="pt-2 grid grid-cols-2 gap-4 text-center">
               <div className="border-t border-black pt-1">
                  <p className="text-[6px] font-black uppercase">Direção / Secretaria</p>
                  <p className="text-[5px] text-gray-400">Assinatura Digital Auditada</p>
               </div>
               <div className="border-t border-black pt-1">
                  <p className="text-[6px] font-black uppercase">Responsável (Ciente)</p>
                  <p className="text-[5px] text-gray-400">____/____/2024</p>
               </div>
            </div>
         </div>
      );
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">

         {/* Opções de Impressão */}
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 no-print">
            <div className="flex items-center gap-6">
               <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl">
                  <Printer size={32} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">Emissão de Boletins</h3>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">Configurado para 2 unidades por folha (A4)</p>
               </div>
            </div>
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
               <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-black text-[10px] uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
               >
                  <option value="">Selecionar Turma...</option>
                  {availableClassrooms.map(c => (
                     <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
               </select>
               <select
                  value={selectedBimestre}
                  onChange={e => setSelectedBimestre(e.target.value)}
                  className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-black text-[10px] uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
               >
                  <option>1º BIMESTRE</option>
                  <option>2º BIMESTRE</option>
                  <option>3º BIMESTRE</option>
                  <option>4º BIMESTRE</option>
               </select>
               <button
                  onClick={handlePrint}
                  disabled={isGenerating}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
               >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                  Gerar Lote (V3)
               </button>
            </div>
         </div>

         {/* Visualização de Pré-impressão */}
         <div className="relative min-h-[400px]">
            {isLoading && (
               <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-[3rem]">
                  <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                  <p className="text-xs font-black uppercase text-indigo-950 tracking-widest">Processando Notas e Médias...</p>
               </div>
            )}

            {students.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 no-print">
                  {students.map(student => (
                     <div key={student.id} className="opacity-80 hover:opacity-100 transition-opacity">
                        <BulletinCard student={student} />
                     </div>
                  ))}
               </div>
            ) : (
               !isLoading && (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-300 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 no-print">
                     <GraduationCap size={64} className="mb-4 opacity-20" />
                     <p className="font-black uppercase text-xs tracking-widest">Nenhum dado encontrado para esta turma/bimestre</p>
                  </div>
               )
            )}
         </div>

         {/* ÁREA DE IMPRESSÃO (ESTILIZADA PARA 2 POR PÁGINA) */}
         <div className="print-area hidden">
            <div className="bulletin-print-layout">
               {Array.from({ length: Math.ceil(students.length / 2) }).map((_, pageIdx) => (
                  <div key={pageIdx} className="print-page h-[290mm] flex flex-col p-[10mm] space-y-[8mm] justify-start bg-white">
                     <BulletinCard student={students[pageIdx * 2]} />
                     {students[pageIdx * 2 + 1] && (
                        <BulletinCard student={students[pageIdx * 2 + 1]} />
                     )}
                  </div>
               ))}
            </div>
         </div>

         <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          .no-print { display: none !important; }
          .print-area { display: block !important; }
           .print-page { 
             page-break-after: always; 
             box-sizing: border-box;
             width: 210mm;
             height: 290mm;
             margin: 0 auto;
             background: white !important;
             overflow: hidden !important;
           }
           .bulletin-card {
             height: calc(50% - 15mm) !important; 
             border: 1px solid black !important;
             margin: 0 !important;
             box-shadow: none !important;
             overflow: hidden !important;
             display: flex;
             flex-direction: column;
           }
          body { background: white !important; }
        }
      `}</style>

      </div>
   );
};

export default SecretariatBulletinPrinter;
