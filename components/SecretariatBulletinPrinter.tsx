
import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';

const SecretariatBulletinPrinter: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('9º ANO A');
  const [selectedBimestre, setSelectedBimestre] = useState('1º BIMESTRE');
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock de dados para demonstração. Em produção, buscaria de assessmets e students.
  const demoStudents = [
    { id: '1', name: 'ADRIANO OLIVEIRA SANTOS', grades: { 'Matemática': 8.5, 'Português': 7.0, 'História': 9.0, 'Geografia': 6.5, 'Ciências': 8.0 }, frequency: 95 },
    { id: '2', name: 'ANA CLARA MENDES', grades: { 'Matemática': 9.5, 'Português': 8.5, 'História': 10.0, 'Geografia': 9.0, 'Ciências': 9.5 }, frequency: 100 },
    { id: '3', name: 'BRUNO HENRIQUE SILVA', grades: { 'Matemática': 6.0, 'Português': 5.5, 'História': 7.0, 'Geografia': 5.0, 'Ciências': 6.5 }, frequency: 75 },
    { id: '4', name: 'CARLA BEATRIZ SOUZA', grades: { 'Matemática': 7.5, 'Português': 7.5, 'História': 8.0, 'Geografia': 8.5, 'Ciências': 7.0 }, frequency: 92 },
  ];

  const handlePrint = async () => {
    setIsGenerating(true);
    // Simula tempo de processamento para renderizar o layout de impressão
    setTimeout(() => {
      window.print();
      setIsGenerating(false);
    }, 800);
  };

  const BulletinCard = ({ student }: { student: any }) => (
    <div className="bulletin-card p-6 border-2 border-black bg-white space-y-4">
      <div className="flex justify-between items-start border-b border-black pb-4">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black rounded">AM</div>
            <div>
               <h1 className="text-xs font-black uppercase tracking-tight leading-none">E.E. André Antônio Maggi</h1>
               <p className="text-[7px] font-bold uppercase text-gray-500 mt-1">Colíder - Mato Grosso | CDCE: 11.906.357/0001-50</p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-[9px] font-black uppercase text-indigo-700">{selectedBimestre} / 2024</p>
            <p className="text-[7px] font-bold uppercase text-gray-400">Boletim Escolar Oficial</p>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase">
         <div className="p-2 bg-gray-50 border border-gray-200 rounded">
            <p className="text-gray-400 text-[6px] mb-0.5">Aluno(a):</p>
            <p className="truncate">{student.name}</p>
         </div>
         <div className="p-2 bg-gray-50 border border-gray-200 rounded">
            <p className="text-gray-400 text-[6px] mb-0.5">Turma:</p>
            <p>{selectedClass}</p>
         </div>
      </div>

      <table className="w-full text-left border-collapse text-[8px]">
         <thead>
            <tr className="bg-gray-100 border border-black">
               <th className="p-2 uppercase font-black">Componente Curricular</th>
               <th className="p-2 text-center uppercase font-black w-16">Média Bim.</th>
               <th className="p-2 text-center uppercase font-black w-16">Freq. (%)</th>
               <th className="p-2 text-center uppercase font-black w-16">Situação</th>
            </tr>
         </thead>
         <tbody className="border border-black">
            {Object.entries(student.grades).map(([subj, grade]: [any, any]) => (
               <tr key={subj} className="border-b border-gray-200">
                  <td className="p-2 font-bold uppercase">{subj}</td>
                  <td className="p-2 text-center font-black">{grade.toFixed(1)}</td>
                  <td className="p-2 text-center font-bold">{student.frequency}%</td>
                  <td className="p-2 text-center">
                     <span className={`font-black ${grade >= 6 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {grade >= 6 ? 'Apto' : 'Recuperação'}
                     </span>
                  </td>
               </tr>
            ))}
         </tbody>
      </table>

      <div className="pt-8 grid grid-cols-2 gap-10 text-center">
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
               <option>6º ANO A</option>
               <option>7º ANO A</option>
               <option>8º ANO A</option>
               <option>9º ANO A</option>
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
               Gerar Lote de Impressão
            </button>
         </div>
      </div>

      {/* Visualização de Pré-impressão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 no-print">
         {demoStudents.map(student => (
           <div key={student.id} className="opacity-80 hover:opacity-100 transition-opacity">
              <BulletinCard student={student} />
           </div>
         ))}
      </div>

      {/* ÁREA DE IMPRESSÃO (ESTILIZADA PARA 2 POR PÁGINA) */}
      <div className="print-area hidden">
         <div className="bulletin-print-layout">
            {Array.from({ length: Math.ceil(demoStudents.length / 2) }).map((_, pageIdx) => (
              <div key={pageIdx} className="print-page h-[297mm] flex flex-col p-[10mm] space-y-[10mm]">
                 <BulletinCard student={demoStudents[pageIdx * 2]} />
                 {demoStudents[pageIdx * 2 + 1] && (
                   <BulletinCard student={demoStudents[pageIdx * 2 + 1]} />
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
            height: 297mm;
            background: white !important;
          }
          .bulletin-card {
            height: calc(50% - 15mm); 
            border: 1px solid black !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          body { background: white !important; }
        }
      `}</style>

    </div>
  );
};

export default SecretariatBulletinPrinter;
