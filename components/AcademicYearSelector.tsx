import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useAcademicYear } from '../contexts/AcademicYearContext';

interface AcademicYearSelectorProps {
  className?: string;
  variant?: 'header' | 'compact' | 'light';
}

export const AcademicYearSelector: React.FC<AcademicYearSelectorProps> = ({ 
  className = '',
  variant = 'header' 
}) => {
  const { selectedYear, setSelectedYear, availableYears, currentYearInfo, isReadOnly } = useAcademicYear();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ATIVO':
        return { label: 'Vigente', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'PLANEJAMENTO':
        return { label: 'Planejamento 2027', bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
      case 'ENCERRADO':
      case 'ARQUIVADO':
        return { label: 'Histórico / Bloqueado', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      default:
        return { label: 'Ativo', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    }
  };

  return (
    <div className={elative inline-block text-left } ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={lex items-center gap-3 px-3.5 py-2 rounded-2xl transition-all border shadow-sm }
        title="Alternar Ano Letivo"
      >
        <div className={w-8 h-8 rounded-xl flex items-center justify-center shrink-0 }>
          <Calendar size={16} />
        </div>

        <div className="text-left flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Ano Letivo</span>
            {selectedYear === 2027 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-black bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                <Sparkles size={8} /> 2027
              </span>
            )}
          </div>
          <span className="text-sm font-black tracking-tight leading-none mt-0.5">
            {selectedYear}
          </span>
        </div>

        <ChevronDown size={14} className={opacity-60 transition-transform duration-200 } />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl z-50 p-2 text-white animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          <div className="px-3 py-2.5 border-b border-white/10 mb-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Contexto do Sistema</p>
            <p className="text-xs text-white/60 mt-0.5">Selecione o Ano Letivo para filtrar turmas, matrículas e chamadas:</p>
          </div>

          <div className="space-y-1">
            {availableYears.map((yr) => {
              const isSelected = yr.year === selectedYear;
              const badge = getStatusBadge(yr.status);

              return (
                <button
                  key={yr.year}
                  type="button"
                  onClick={() => {
                    setSelectedYear(yr.year);
                    setIsOpen(false);
                  }}
                  className={w-full flex items-center justify-between p-3 rounded-xl text-left transition-all }
                >
                  <div className="flex items-center gap-3">
                    <div className={w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs }>
                      {yr.year}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight text-white flex items-center gap-1.5">
                        {yr.name}
                        {isSelected && <Check size={14} className="text-emerald-400" />}
                      </p>
                      <span className={inline-block mt-0.5 text-[8px] font-black px-2 py-0.5 rounded-md uppercase border }>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedYear === 2027 && (
            <div className="mt-2 p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-500/20 text-[10px] text-indigo-200 flex items-start gap-2">
              <Sparkles size={14} className="text-indigo-400 shrink-0 mt-0.5" />
              <span>Você está visualizando a base do <strong>Ano Letivo 2027</strong>. Turmas e matrículas criadas aqui não afetam 2026.</span>
            </div>
          )}

          {isReadOnly && (
            <div className="mt-2 p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/20 text-[10px] text-amber-200 flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <span>Ano letivo arquivado. Os registros estão disponíveis apenas para consulta e boletins passados.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AcademicYearSelector;
