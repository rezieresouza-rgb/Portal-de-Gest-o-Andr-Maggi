import React, { useState, useMemo } from 'react';
import { Printer, Users, RotateCcw, BookOpen, ShieldCheck, CheckCircle2, Info, Laptop, Headphones } from 'lucide-react';
import {
  CHROMEBOOK_STATIONS,
  ORIENTACOES_OFICIAIS,
  SchoolStudentOption
} from '../hooks/useChromebookControl';

interface ControlSheetProps {
  classrooms: { name: string; shift: string }[];
  students: SchoolStudentOption[];
  defaultTeacher?: string;
}

const DEFAULT_SHEET_ROWS = 35;

export const ChromebookControlSheetTab: React.FC<ControlSheetProps> = ({
  classrooms,
  students,
  defaultTeacher = ''
}) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [shift, setShift] = useState('MATUTINO');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [stationId, setStationId] = useState(CHROMEBOOK_STATIONS[0].id);
  const [teacher, setTeacher] = useState(defaultTeacher);
  const [leader, setLeader] = useState('');
  const [viceLeader, setViceLeader] = useState('');
  const [useBlankRows, setUseBlankRows] = useState(false);

  const classStudents = useMemo(() => {
    if (!selectedClass || useBlankRows) return [];
    return students.filter(s => s.className === selectedClass);
  }, [selectedClass, students, useBlankRows]);

  const rowsToRender = useMemo(() => {
    const count = Math.max(DEFAULT_SHEET_ROWS, classStudents.length);
    return Array.from({ length: count }, (_, idx) => ({
      num: idx + 1,
      studentName: classStudents[idx]?.name || ''
    }));
  }, [classStudents]);

  const formattedDate = useMemo(() => {
    if (!date) return '____/____/______';
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  }, [date]);

  const stationLocation = useMemo(() => {
    return CHROMEBOOK_STATIONS.find(s => s.id === stationId)?.defaultLocation || '';
  }, [stationId]);

  return (
    <div className="space-y-5 print:space-y-0 animate-in fade-in duration-300">
      {/* Regras de impressão calibradas para caber 35 linhas + logos + assinaturas em 1 única folha A4 */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 7mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #root .ficha-cb-a4 {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
          }
          #root .ficha-cb-a4 .ficha-title-bar {
            background-color: #1e3a8a !important;
            color: #ffffff !important;
            padding: 4px 10px !important;
            margin-top: 4px !important;
            margin-bottom: 5px !important;
            border-radius: 4px !important;
          }
          #root .ficha-cb-a4 .ficha-title-bar * {
            color: #ffffff !important;
            background: transparent !important;
          }
          #root .ficha-cb-a4 .ficha-header-logos img {
            height: 50px !important;
            max-height: 50px !important;
          }
          #root .ficha-cb-a4 .ficha-header-logos img.ficha-logo-escola {
            height: 54px !important;
            max-height: 54px !important;
          }
          #root .ficha-cb-a4 .ficha-meta-box {
            padding: 3px 8px !important;
            margin-bottom: 4px !important;
            border: 1px solid #334155 !important;
            border-radius: 4px !important;
            background-color: #f8fafc !important;
          }
          #root .ficha-cb-a4 .ficha-table {
            margin-top: 2px !important;
            margin-bottom: 4px !important;
            border-collapse: collapse !important;
            width: 100% !important;
          }
          #root .ficha-cb-a4 .ficha-table thead tr th {
            background-color: #1e3a8a !important;
            color: #ffffff !important;
            border: 1px solid #1e3a8a !important;
            padding: 2.5px 3px !important;
            font-size: 7.5px !important;
            line-height: 1.1 !important;
          }
          #root .ficha-cb-a4 .ficha-table tbody tr {
            height: 16.5px !important;
          }
          #root .ficha-cb-a4 .ficha-table tbody tr:nth-child(even) td {
            background-color: #f8fafc !important;
          }
          #root .ficha-cb-a4 .ficha-table tbody tr td {
            border: 1px solid #94a3b8 !important;
            padding: 0.5px 4px !important;
            font-size: 8px !important;
            line-height: 1.1 !important;
            color: #0f172a !important;
          }
          #root .ficha-cb-a4 .ficha-summary-box {
            padding: 4px 8px !important;
            margin-bottom: 4px !important;
            border: 1px solid #334155 !important;
            border-radius: 4px !important;
            background-color: #f8fafc !important;
          }
          #root .ficha-cb-a4 .ficha-irreg-box {
            padding: 4px 8px !important;
            margin-bottom: 6px !important;
            border: 1px solid #334155 !important;
            border-radius: 4px !important;
          }
          #root .ficha-cb-a4 .ficha-signatures {
            padding-top: 8px !important;
            margin-bottom: 2px !important;
          }
          #root .ficha-cb-a4 .ficha-footer-notes {
            margin-top: 3px !important;
            padding-top: 3px !important;
            font-size: 7.5px !important;
            line-height: 1.2 !important;
          }
        }
      `}</style>

      {/* Controles de preparação da Ficha (ocultos na impressão) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Ficha de Controle Oficial — 35 Linhas (1 Folha A4)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Layout institucional com Brasão de MT e Logo da EECM André Antônio Maggi. Selecione uma turma para preencher os estudantes automaticamente ou imprima em branco (35 linhas).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setUseBlankRows(prev => !prev)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all"
            >
              {useBlankRows ? <Users size={14} /> : <RotateCcw size={14} />}
              {useBlankRows ? 'Usar Alunos da Turma' : `Ficha em Branco (${DEFAULT_SHEET_ROWS} linhas)`}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
            >
              <Printer size={14} /> Imprimir Ficha A4
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Turma (pré-preenche estudantes)</label>
            <select
              value={selectedClass}
              onChange={e => {
                const val = e.target.value;
                setSelectedClass(val);
                setUseBlankRows(false);
                const found = classrooms.find(c => c.name === val);
                if (found?.shift) setShift(found.shift);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
            >
              <option value="">(Deixar em branco — 35 linhas)</option>
              {classrooms.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.shift})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Estação (01 a 05)</label>
            <select
              value={stationId}
              onChange={e => setStationId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
            >
              {CHROMEBOOK_STATIONS.map(st => (
                <option key={st.id} value={st.id}>
                  {st.id} ({st.defaultLocation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Turno</label>
            <select
              value={shift}
              onChange={e => setShift(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
            >
              <option value="MATUTINO">MATUTINO</option>
              <option value="VESPERTINO">VESPERTINO</option>
              <option value="NOTURNO">NOTURNO</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Data</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Professor(a)</label>
            <input
              type="text"
              value={teacher}
              onChange={e => setTeacher(e.target.value)}
              placeholder="Nome do(a) professor(a) responsável pela aula..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Líder de Turma</label>
            <input
              type="text"
              value={leader}
              onChange={e => setLeader(e.target.value)}
              placeholder="Opcional..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Vice-líder</label>
            <input
              type="text"
              value={viceLeader}
              onChange={e => setViceLeader(e.target.value)}
              placeholder="Opcional..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
            />
          </div>
        </div>
      </div>

      {/* FOLHA A4 INSTITUCIONAL IMPRIMÍVEL */}
      <div className="ficha-cb-a4 bg-white rounded-3xl border border-slate-300 shadow-lg p-6 sm:p-8 max-w-[210mm] mx-auto print-document">
        {/* Cabeçalho Institucional com Brasão MT + Dados SEDUC + Logo Oficial EECM */}
        <div className="ficha-header-logos flex items-center justify-between gap-3 pb-2.5 border-b-2 border-blue-950">
          <div className="shrink-0 w-16 flex items-center justify-start">
            <img
              src="/brasao_mt.png"
              alt="Brasão do Estado de Mato Grosso"
              className="h-14 w-auto object-contain"
              onError={e => {
                (e.currentTarget as HTMLImageElement).src = '/SEDUC 2.jpg';
              }}
            />
          </div>

          <div className="text-center flex-1 leading-tight">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
              Governo do Estado de Mato Grosso • Secretaria de Estado de Educação (SEDUC-MT)
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
              Diretoria Regional de Educação de Sinop — Colíder-MT
            </p>
            <h1 className="text-sm sm:text-base font-black uppercase tracking-tight text-blue-950 mt-0.5">
              Escola Estadual Cívico-Militar André Antônio Maggi
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-blue-800">
              Controle Patrimonial e Operacional de Recursos Tecnológicos
            </p>
          </div>

          <div className="shrink-0 w-16 flex items-center justify-end">
            <img
              src="/logo-escola-oficial.png"
              alt="Logo EECM André Antônio Maggi"
              className="ficha-logo-escola h-16 w-auto object-contain"
              onError={e => {
                (e.currentTarget as HTMLImageElement).src = '/logo-escola.png';
              }}
            />
          </div>
        </div>

        {/* Faixa de Título do Documento */}
        <div className="ficha-title-bar bg-blue-900 text-white rounded-xl px-4 py-2 my-3 flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <Laptop size={14} className="no-print" /> FICHA DE CONTROLE DE CHROMEBOOKS E FONES DE OUVIDO
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-90 flex items-center gap-1">
            <Headphones size={12} className="no-print" /> Pares Individuais • {rowsToRender.length} Posições
          </span>
        </div>

        {/* Quadro de Identificação da Aula */}
        <div className="ficha-meta-box grid grid-cols-12 gap-x-3 gap-y-1.5 text-[11px] border border-slate-400 rounded-xl p-3 mb-3 bg-slate-50/70">
          <div className="col-span-3">
            <span className="font-black uppercase text-[8.5px] text-blue-900 tracking-wider block">Turma</span>
            <span className="font-black text-slate-900 block border-b border-slate-300 pb-0.5 min-h-[16px]">
              {selectedClass || '\u00A0'}
            </span>
          </div>
          <div className="col-span-2">
            <span className="font-black uppercase text-[8.5px] text-blue-900 tracking-wider block">Turno</span>
            <span className="font-bold text-slate-900 block border-b border-slate-300 pb-0.5 min-h-[16px]">
              {shift || '\u00A0'}
            </span>
          </div>
          <div className="col-span-3">
            <span className="font-black uppercase text-[8.5px] text-blue-900 tracking-wider block">Data</span>
            <span className="font-bold text-slate-900 block border-b border-slate-300 pb-0.5 min-h-[16px]">
              {formattedDate}
            </span>
          </div>
          <div className="col-span-4">
            <span className="font-black uppercase text-[8.5px] text-blue-900 tracking-wider block">Estação de Guarda (01 a 05)</span>
            <span className="font-black text-slate-900 block border-b border-slate-300 pb-0.5 min-h-[16px]">
              {stationId} {stationLocation ? `— ${stationLocation}` : ''}
            </span>
          </div>

          <div className="col-span-6">
            <span className="font-black uppercase text-[8.5px] text-blue-900 tracking-wider block">Professor(a) Responsável</span>
            <span className="font-bold text-slate-900 uppercase block border-b border-slate-300 pb-0.5 min-h-[16px]">
              {teacher || '\u00A0'}
            </span>
          </div>
          <div className="col-span-3">
            <span className="font-black uppercase text-[8.5px] text-blue-900 tracking-wider block">Líder de Turma (Apoio)</span>
            <span className="font-bold text-slate-900 uppercase block border-b border-slate-300 pb-0.5 min-h-[16px]">
              {leader || '\u00A0'}
            </span>
          </div>
          <div className="col-span-3">
            <span className="font-black uppercase text-[8.5px] text-blue-900 tracking-wider block">Vice-líder (Apoio)</span>
            <span className="font-bold text-slate-900 uppercase block border-b border-slate-300 pb-0.5 min-h-[16px]">
              {viceLeader || '\u00A0'}
            </span>
          </div>
        </div>

        {/* Tabela Individual com 35 Linhas */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9.5px] font-black uppercase tracking-wider text-blue-950">
              Registro Individual de Retirada e Devolução
            </p>
            <p className="text-[8.5px] font-semibold text-slate-500">
              Preencher um estudante por linha • Conferir par completo na devolução
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="ficha-table w-full border-collapse border border-slate-400 text-[10.5px]">
              <thead>
                <tr className="bg-blue-900 text-white font-black uppercase text-[9px]">
                  <th className="border border-blue-900 px-1.5 py-1.5 w-7 text-center">Nº</th>
                  <th className="border border-blue-900 px-2 py-1.5 text-left">Nome do Estudante</th>
                  <th className="border border-blue-900 px-1.5 py-1.5 w-20 text-center">Nº Chrome.</th>
                  <th className="border border-blue-900 px-1.5 py-1.5 w-16 text-center">Nº Fone</th>
                  <th className="border border-blue-900 px-1.5 py-1.5 w-16 text-center">Retirada</th>
                  <th className="border border-blue-900 px-1.5 py-1.5 w-16 text-center">Devolução</th>
                  <th className="border border-blue-900 px-2 py-1.5 w-36 text-left">Condição / Observação</th>
                  <th className="border border-blue-900 px-1.5 py-1.5 w-12 text-center">Conf.</th>
                </tr>
              </thead>
              <tbody>
                {rowsToRender.map(row => (
                  <tr key={row.num} className="even:bg-slate-50/70 h-[21px]">
                    <td className="border border-slate-400 px-1 py-0.5 text-center font-black text-slate-600 text-[9.5px]">
                      {String(row.num).padStart(2, '0')}
                    </td>
                    <td className="border border-slate-400 px-2 py-0.5 font-semibold uppercase text-slate-900 truncate max-w-[220px]">
                      {row.studentName}
                    </td>
                    <td className="border border-slate-400 px-1 py-0.5"></td>
                    <td className="border border-slate-400 px-1 py-0.5"></td>
                    <td className="border border-slate-400 px-1 py-0.5"></td>
                    <td className="border border-slate-400 px-1 py-0.5"></td>
                    <td className="border border-slate-400 px-1 py-0.5"></td>
                    <td className="border border-slate-400 px-1 py-0.5 text-center text-slate-400 font-bold">☐</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fechamento e Conferência Final */}
        <div className="ficha-summary-box border border-slate-400 rounded-xl p-2.5 mb-2.5 bg-slate-50/60 space-y-2 text-[10px]">
          <div className="grid grid-cols-4 gap-3">
            <div className="flex items-end gap-1.5">
              <span className="font-black uppercase text-[8.5px] text-blue-950 whitespace-nowrap">CB Retirados:</span>
              <span className="flex-1 border-b border-slate-500" />
            </div>
            <div className="flex items-end gap-1.5">
              <span className="font-black uppercase text-[8.5px] text-blue-950 whitespace-nowrap">CB Devolvidos:</span>
              <span className="flex-1 border-b border-slate-500" />
            </div>
            <div className="flex items-end gap-1.5">
              <span className="font-black uppercase text-[8.5px] text-blue-950 whitespace-nowrap">Fones Retirados:</span>
              <span className="flex-1 border-b border-slate-500" />
            </div>
            <div className="flex items-end gap-1.5">
              <span className="font-black uppercase text-[8.5px] text-blue-950 whitespace-nowrap">Fones Devolvidos:</span>
              <span className="flex-1 border-b border-slate-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200 text-[9.5px] font-bold text-slate-800">
            <div>
              Conferência final dos equipamentos:&nbsp;&nbsp; ☐ Sim &nbsp;&nbsp;&nbsp; ☐ Não
            </div>
            <div>
              Irregularidade / avaria / falta registrada:&nbsp;&nbsp; ☐ Sim &nbsp;&nbsp;&nbsp; ☐ Não
            </div>
          </div>
        </div>

        {/* Descrição da Irregularidade */}
        <div className="ficha-irreg-box border border-slate-400 rounded-xl p-2.5 mb-4">
          <p className="text-[8.5px] font-black uppercase tracking-wider text-blue-950 mb-3.5">
            Descrição da Irregularidade / Providência (se houver)
          </p>
          <div className="border-b border-slate-300 mb-3.5" />
          <div className="border-b border-slate-300" />
        </div>

        {/* Assinaturas */}
        <div className="ficha-signatures grid grid-cols-2 gap-10 pt-4 text-center">
          <div>
            <div className="border-t border-slate-800 pt-1 font-black uppercase text-[9px] text-slate-900">
              Conferência do(a) Professor(a)
            </div>
            <p className="text-[8px] text-slate-500 font-semibold">Assinatura e matrícula / nome legível</p>
          </div>
          <div>
            <div className="border-t border-slate-800 pt-1 font-black uppercase text-[9px] text-slate-900">
              Vigia (Guarda Física da Estação)
            </div>
            <p className="text-[8px] text-slate-500 font-semibold">Conferência de fechamento e segurança</p>
          </div>
        </div>

        {/* Rodapé de Diretrizes */}
        <div className="ficha-footer-notes mt-3 pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[8.5px] text-slate-500 font-medium">
          <span>• Líder e vice-líder auxiliam na organização; a conferência final compete ao professor.</span>
          <span>• Cada Chromebook e fone deve possuir número individual (ex.: CB 01 + Fone 01).</span>
        </div>
      </div>
    </div>
  );
};

export const ChromebookOrientationsTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
            <BookOpen size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Orientações Oficiais — Controle Operacional e Patrimonial (EECM)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Diretrizes da planilha <strong>Controle_Chromebooks_Fones_EECM_2027_Atualizada</strong> integradas ao Inventário Patrimonial.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ORIENTACOES_OFICIAIS.map(item => (
            <div
              key={item.code}
              className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:shadow-sm transition-all flex items-start gap-3.5"
            >
              <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                {item.code}
              </span>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
          <ShieldCheck size={18} className="text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 space-y-1">
            <p className="font-black uppercase">Resumo de Responsabilidades & Patrimônio</p>
            <p className="font-medium leading-relaxed">
              • <strong>Gestão / Patrimônio:</strong> cadastra tombamentos, números de série, pares Chromebook+Fone e mantém o espelhamento com o Inventário Oficial (SEDUC/DRE).<br />
              • <strong>Professor(a):</strong> registra retirada/devolução na aba <em>Utilizações</em> ou na <em>Ficha de Controle</em> e realiza a conferência final.<br />
              • <strong>Líder e Vice-líder:</strong> apoiam a entrega e organização sem responsabilidade automática por danos de terceiros.<br />
              • <strong>Vigia:</strong> registra o <em>Checklist de Guarda</em> das 5 estações (fechamento dos compartimentos e integridade física).
            </p>
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <Info size={18} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 font-medium leading-relaxed">
            <strong>Importante sobre a diferença entre pares:</strong> conforme a diretriz oficial do Painel, uma diferença entre a quantidade de Chromebooks e Fones cadastrados <strong>não comprova extravio</strong> — indica apenas cadastros ainda em preenchimento ou estação com composição diferente.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700">
          <CheckCircle2 size={14} /> Você pode importar e exportar a planilha Excel (.xlsx) completa com todas as 7 abas a qualquer momento pelos botões no topo.
        </div>
      </div>
    </div>
  );
};
