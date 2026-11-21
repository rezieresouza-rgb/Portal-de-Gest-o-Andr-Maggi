import React, { useState, useMemo } from 'react';
import { Printer, Users, RotateCcw, BookOpen, ShieldCheck, CheckCircle2, Info } from 'lucide-react';
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
    const count = Math.max(20, classStudents.length);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Controles de preparação da Ficha (ocultos na impressão) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Ficha de Controle Oficial — Pronta para Impressão A4
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Modelo idêntico à planilha oficial da EECM. Selecione uma turma para pré-preencher a lista de estudantes automaticamente ou imprima em branco (20 linhas).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setUseBlankRows(prev => !prev)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all"
            >
              {useBlankRows ? <Users size={14} /> : <RotateCcw size={14} />}
              {useBlankRows ? 'Usar Alunos da Turma' : 'Ficha em Branco (20 linhas)'}
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
              <option value="">(Deixar em branco)</option>
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

      {/* FOLHA A4 IMPRIMÍVEL */}
      <div className="bg-white rounded-3xl border border-slate-300 shadow-sm p-6 sm:p-8 print:border-none print:shadow-none print:p-0 print:rounded-none print-document">
        {/* Cabeçalho Oficial */}
        <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
          <p className="text-xs font-black tracking-widest text-slate-700 uppercase">
            EECM ANDRÉ ANTÔNIO MAGGI • COLÍDER-MT • CONTROLE PATRIMONIAL E OPERACIONAL
          </p>
          <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tight mt-0.5">
            FICHA DE CONTROLE DE CHROMEBOOKS E FONES DE OUVIDO
          </h2>
        </div>

        {/* Metadados da Aula */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-400 rounded-xl p-3 mb-4 bg-slate-50/50 print:bg-white">
          <div>
            <span className="font-black uppercase text-[10px] text-slate-500 block">Turma</span>
            <span className="font-bold text-slate-900">{selectedClass || '__________________'}</span>
          </div>
          <div>
            <span className="font-black uppercase text-[10px] text-slate-500 block">Turno</span>
            <span className="font-bold text-slate-900">{shift || '____________'}</span>
          </div>
          <div>
            <span className="font-black uppercase text-[10px] text-slate-500 block">Data</span>
            <span className="font-bold text-slate-900">{formattedDate}</span>
          </div>
          <div>
            <span className="font-black uppercase text-[10px] text-slate-500 block">Estação (01 a 05)</span>
            <span className="font-bold text-slate-900">{stationId}</span>
          </div>
          <div className="col-span-2">
            <span className="font-black uppercase text-[10px] text-slate-500 block">Professor(a)</span>
            <span className="font-bold text-slate-900">{teacher || '____________________________________'}</span>
          </div>
          <div>
            <span className="font-black uppercase text-[10px] text-slate-500 block">Líder de turma</span>
            <span className="font-bold text-slate-900">{leader || '____________________'}</span>
          </div>
          <div>
            <span className="font-black uppercase text-[10px] text-slate-500 block">Vice-líder</span>
            <span className="font-bold text-slate-900">{viceLeader || '____________________'}</span>
          </div>
        </div>

        {/* Tabela Individual */}
        <div className="mb-4">
          <p className="text-[11px] font-black uppercase text-slate-800 mb-1.5">
            Registro Individual de Retirada e Devolução
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-400 text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-black uppercase text-[10px]">
                  <th className="border border-slate-400 px-2 py-1.5 w-8 text-center">Nº</th>
                  <th className="border border-slate-400 px-2 py-1.5 text-left">Nome do estudante</th>
                  <th className="border border-slate-400 px-2 py-1.5 w-24 text-center">Nº Chromebook</th>
                  <th className="border border-slate-400 px-2 py-1.5 w-20 text-center">Nº Fone</th>
                  <th className="border border-slate-400 px-2 py-1.5 w-20 text-center">Retirada</th>
                  <th className="border border-slate-400 px-2 py-1.5 w-20 text-center">Devolução</th>
                  <th className="border border-slate-400 px-2 py-1.5 w-36 text-left">Condição / observação</th>
                  <th className="border border-slate-400 px-2 py-1.5 w-16 text-center">Conferido</th>
                </tr>
              </thead>
              <tbody>
                {rowsToRender.map(row => (
                  <tr key={row.num} className="h-6">
                    <td className="border border-slate-400 px-2 py-1 text-center font-bold text-slate-700">{row.num}</td>
                    <td className="border border-slate-400 px-2 py-1 font-semibold uppercase text-slate-900">{row.studentName}</td>
                    <td className="border border-slate-400 px-2 py-1"></td>
                    <td className="border border-slate-400 px-2 py-1"></td>
                    <td className="border border-slate-400 px-2 py-1"></td>
                    <td className="border border-slate-400 px-2 py-1"></td>
                    <td className="border border-slate-400 px-2 py-1"></td>
                    <td className="border border-slate-400 px-2 py-1 text-center text-slate-400">( )</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fechamento e Conferência Final */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border border-slate-400 rounded-xl p-3 mb-3">
          <div>
            <span className="font-black text-[10px] uppercase text-slate-600">Chromebooks retirados:</span>
            <div className="border-b border-slate-400 mt-3" />
          </div>
          <div>
            <span className="font-black text-[10px] uppercase text-slate-600">Chromebooks devolvidos:</span>
            <div className="border-b border-slate-400 mt-3" />
          </div>
          <div>
            <span className="font-black text-[10px] uppercase text-slate-600">Fones retirados:</span>
            <div className="border-b border-slate-400 mt-3" />
          </div>
          <div>
            <span className="font-black text-[10px] uppercase text-slate-600">Fones devolvidos:</span>
            <div className="border-b border-slate-400 mt-3" />
          </div>
          <div className="col-span-2 pt-1 font-bold text-slate-800">
            Conferência final: &nbsp;&nbsp;( &nbsp; ) Sim &nbsp;&nbsp;&nbsp; ( &nbsp; ) Não
          </div>
          <div className="col-span-2 pt-1 font-bold text-slate-800">
            Irregularidade: &nbsp;&nbsp;( &nbsp; ) Sim &nbsp;&nbsp;&nbsp; ( &nbsp; ) Não
          </div>
        </div>

        {/* Descrição da Irregularidade */}
        <div className="border border-slate-400 rounded-xl p-3 mb-6">
          <p className="text-[10px] font-black uppercase text-slate-700 mb-6">
            Descrição da Irregularidade / Providência
          </p>
          <div className="border-b border-slate-300 mb-5" />
          <div className="border-b border-slate-300" />
        </div>

        {/* Assinaturas */}
        <div className="grid grid-cols-2 gap-8 pt-4 text-center text-xs">
          <div>
            <div className="border-t border-slate-800 pt-1.5 font-black uppercase text-[10px] text-slate-800">
              Conferência do Professor(a)
            </div>
          </div>
          <div>
            <div className="border-t border-slate-800 pt-1.5 font-black uppercase text-[10px] text-slate-800">
              Vigia (Guarda Física da Estação)
            </div>
          </div>
        </div>

        {/* Rodapé de Diretrizes */}
        <div className="mt-5 pt-3 border-t border-slate-200 text-[10px] text-slate-600 space-y-0.5">
          <p>• Líder e vice-líder auxiliam na organização; a conferência final compete ao professor.</p>
          <p>• Cada Chromebook e fone deve ter número individual. Ex.: Chromebook 01 + Fone 01.</p>
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
