import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Award,
  Download,
  Users,
  CheckCircle2,
  Calendar,
  Volume2,
  Music,
  ShieldCheck
} from 'lucide-react';

interface EducarteReportsProps {
  members: any[];
  instruments: any[];
  attendanceRecords: any[];
  events: any[];
}

const EducarteReports: React.FC<EducarteReportsProps> = ({
  members,
  instruments,
  attendanceRecords,
  events
}) => {
  const [selectedReport, setSelectedReport] = useState<'attendance' | 'inventory' | 'certificate'>('attendance');
  const [selectedMemberForCert, setSelectedMemberForCert] = useState<any | null>(null);

  // Totais
  const activeMembers = members.filter(m => m.status === 'ATIVO');
  const loanedInstruments = instruments.filter(i => i.status === 'CAUTELADO');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* CABEÇALHO */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileText className="text-amber-500" size={26} /> Relatórios & Certificados Oficiais
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Documentos para Prestação de Contas SEDUC-MT e Certificação de Alunos • Banda André Maggi
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Printer size={16} /> Imprimir Documento Selecionado
        </button>
      </div>

      {/* SELEÇÃO DO TIPO DE RELATÓRIO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setSelectedReport('attendance')}
          className={`p-6 rounded-[2.5rem] border text-left transition-all ${
            selectedReport === 'attendance'
              ? 'bg-slate-950 text-white border-slate-950 shadow-xl'
              : 'bg-white text-slate-800 border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <CheckCircle2 size={24} className={selectedReport === 'attendance' ? 'text-amber-400' : 'text-slate-400'} />
          <h3 className="font-black text-sm uppercase tracking-tight mt-3">Relatório de Frequência & Atividades</h3>
          <p className={`text-xs mt-1 ${selectedReport === 'attendance' ? 'text-slate-400' : 'text-slate-500'}`}>
            Resumo bimestral de ensaios e assiduidade dos músicos para SEDUC-MT
          </p>
        </button>

        <button
          onClick={() => setSelectedReport('inventory')}
          className={`p-6 rounded-[2.5rem] border text-left transition-all ${
            selectedReport === 'inventory'
              ? 'bg-slate-950 text-white border-slate-950 shadow-xl'
              : 'bg-white text-slate-800 border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <Volume2 size={24} className={selectedReport === 'inventory' ? 'text-amber-400' : 'text-slate-400'} />
          <h3 className="font-black text-sm uppercase tracking-tight mt-3">Inventário de Instrumentos & Cautelas</h3>
          <p className={`text-xs mt-1 ${selectedReport === 'inventory' ? 'text-slate-400' : 'text-slate-500'}`}>
            Relação completa do patrimônio musical e instrumentos emprestados
          </p>
        </button>

        <button
          onClick={() => {
            setSelectedReport('certificate');
            if (activeMembers.length > 0 && !selectedMemberForCert) {
              setSelectedMemberForCert(activeMembers[0]);
            }
          }}
          className={`p-6 rounded-[2.5rem] border text-left transition-all ${
            selectedReport === 'certificate'
              ? 'bg-slate-950 text-white border-slate-950 shadow-xl'
              : 'bg-white text-slate-800 border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <Award size={24} className={selectedReport === 'certificate' ? 'text-amber-400' : 'text-slate-400'} />
          <h3 className="font-black text-sm uppercase tracking-tight mt-3">Certificado de Participação</h3>
          <p className={`text-xs mt-1 ${selectedReport === 'certificate' ? 'text-slate-400' : 'text-slate-500'}`}>
            Emissão de certificado oficial de formação musical para o estudante
          </p>
        </button>
      </div>

      {/* ÁREA DO DOCUMENTO FORMATADO PARA VISUALIZAÇÃO E IMPRESSÃO */}
      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-200/80 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">

        {selectedReport === 'attendance' && (
          <div className="space-y-6">
            <div className="text-center space-y-1 pb-6 border-b border-slate-200">
              <h2 className="text-lg font-black text-slate-900 uppercase">ESTADO DE MATO GROSSO • SEDUC-MT</h2>
              <p className="text-xs font-bold text-slate-600 uppercase">ESCOLA ESTADUAL ANDRÉ ANTÔNIO MAGGI • DRE SINOP</p>
              <p className="text-sm font-black text-amber-900 uppercase pt-2">
                RELATÓRIO OFICIAL DE FREQUÊNCIA E ATIVIDADES • PROJETO EDUCARTE (BANDA MUSICAL)
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold">
              <div>
                <p className="text-slate-400 font-medium">Total de Músicos:</p>
                <p className="text-slate-900 font-black">{activeMembers.length} Alunos</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Ensaios Realizados:</p>
                <p className="text-slate-900 font-black">{attendanceRecords.length} Sessões</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Apresentações:</p>
                <p className="text-slate-900 font-black">{events.length} Eventos</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Emissão em:</p>
                <p className="text-slate-900 font-black">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3">Nº</th>
                    <th className="px-4 py-3">Nome do Integrante</th>
                    <th className="px-4 py-3">Naipe / Instrumento</th>
                    <th className="px-4 py-3">Turma Regular</th>
                    <th className="px-4 py-3">Nível</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {activeMembers.map((m, idx) => (
                    <tr key={m.id}>
                      <td className="px-4 py-2.5 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-black text-slate-900 uppercase">{m.name}</td>
                      <td className="px-4 py-2.5 text-slate-700 font-bold uppercase">{m.naipe} - {m.instrument}</td>
                      <td className="px-4 py-2.5 text-slate-600">{m.classroomName}</td>
                      <td className="px-4 py-2.5 text-slate-600 font-bold">{m.level}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[9px] uppercase">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-12 pt-12 text-center text-xs font-bold text-slate-800">
              <div className="space-y-1 border-t border-slate-400 pt-2">
                <p>Regente / Instrutor de Fanfarra e Banda</p>
                <p className="text-[10px] text-slate-400 font-medium">Projeto Educarte</p>
              </div>
              <div className="space-y-1 border-t border-slate-400 pt-2">
                <p>Direção Escolar / Coordenação Pedagógica</p>
                <p className="text-[10px] text-slate-400 font-medium">E.E. André Antônio Maggi</p>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'inventory' && (
          <div className="space-y-6">
            <div className="text-center space-y-1 pb-6 border-b border-slate-200">
              <h2 className="text-lg font-black text-slate-900 uppercase">ESTADO DE MATO GROSSO • SEDUC-MT</h2>
              <p className="text-xs font-bold text-slate-600 uppercase">ESCOLA ESTADUAL ANDRÉ ANTÔNIO MAGGI • DRE SINOP</p>
              <p className="text-sm font-black text-amber-900 uppercase pt-2">
                INVENTÁRIO E TOMBAMENTO DO ACERVO DE INSTRUMENTOS MUSICAIS
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3">Instrumento</th>
                    <th className="px-4 py-3">Naipe</th>
                    <th className="px-4 py-3">Marca / Modelo</th>
                    <th className="px-4 py-3">Nº de Série</th>
                    <th className="px-4 py-3">Conservação</th>
                    <th className="px-4 py-3">Status / Cautelado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {instruments.map(inst => (
                    <tr key={inst.id}>
                      <td className="px-4 py-2.5 font-black text-slate-900 uppercase">{inst.name}</td>
                      <td className="px-4 py-2.5 text-slate-600 font-bold">{inst.naipe}</td>
                      <td className="px-4 py-2.5 text-slate-700">{inst.brand || '-'}</td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">{inst.serialNumber || '-'}</td>
                      <td className="px-4 py-2.5 text-slate-700 font-bold">{inst.condition}</td>
                      <td className="px-4 py-2.5 font-bold">
                        {inst.status === 'CAUTELADO' ? (
                          <span className="text-blue-700">Cautelado: {inst.loanedToName}</span>
                        ) : (
                          <span className="text-emerald-700">{inst.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === 'certificate' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Selecione o Aluno:</span>
                <select
                  value={selectedMemberForCert?.id || ''}
                  onChange={e => {
                    const mem = activeMembers.find(m => m.id === e.target.value);
                    if (mem) setSelectedMemberForCert(mem);
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase outline-none"
                >
                  {activeMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.instrument})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
              >
                <Printer size={14} /> Imprimir Certificado
              </button>
            </div>

            {selectedMemberForCert && (
              <div className="p-12 md:p-16 border-8 border-double border-amber-500 rounded-[3rem] bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 text-center space-y-6 relative overflow-hidden shadow-inner">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">GOVERNO DO ESTADO DE MATO GROSSO • SEDUC-MT</p>
                  <p className="text-xs font-bold uppercase text-slate-600">ESCOLA ESTADUAL ANDRÉ ANTÔNIO MAGGI • DRE SINOP</p>
                  <h1 className="text-4xl md:text-5xl font-black uppercase text-amber-900 tracking-widest pt-4">
                    CERTIFICADO
                  </h1>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">PROJETO EDUCARTE • BANDA MUSICAL & FANFARRA</p>
                </div>

                <div className="max-w-2xl mx-auto py-6 space-y-4 text-slate-800 text-sm leading-relaxed font-medium">
                  <p>
                    Certificamos que o(a) estudante
                  </p>
                  <p className="text-2xl font-black uppercase text-slate-950 border-b-2 border-amber-400 inline-block px-8 pb-1">
                    {selectedMemberForCert.name}
                  </p>
                  <p>
                    participou com dedicação, disciplina e assiduidade das atividades de formação musical e prática de conjunto na <strong>BANDA MUSICAL ESCOLAR ANDRÉ MAGGI</strong>, atuando no naipe de <strong>{selectedMemberForCert.naipe} ({selectedMemberForCert.instrument})</strong> com carga horária total de <strong>120 horas de ensaios e apresentações cívicas</strong> durante o ano letivo.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-12 pt-10 max-w-xl mx-auto text-center text-xs font-bold text-slate-800">
                  <div className="space-y-1 border-t border-slate-400 pt-2">
                    <p>Maestro / Regente da Banda</p>
                    <p className="text-[10px] text-slate-400 font-medium">Projeto Educarte</p>
                  </div>
                  <div className="space-y-1 border-t border-slate-400 pt-2">
                    <p>Direção Escolar</p>
                    <p className="text-[10px] text-slate-400 font-medium">E.E. André Antônio Maggi</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};

export default EducarteReports;
