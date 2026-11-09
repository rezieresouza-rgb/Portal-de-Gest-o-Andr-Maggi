import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, Sparkles, AlertCircle, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAcademicYear } from '../contexts/AcademicYearContext';

interface AcademicYearSelectorProps {
  className?: string;
  variant?: 'header' | 'compact' | 'light' | 'sidebar';
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

  const getStatusBadge = (status?: string, year?: number) => {
    if (year === 2026 || status === 'ATIVO') {
      return { 
        label: 'Vigente', 
        pillBg: 'bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300',
        dotColor: 'bg-emerald-500',
        icon: Calendar
      };
    }
    if (year === 2027 || status === 'PLANEJAMENTO') {
      return { 
        label: 'Planejamento', 
        pillBg: 'bg-indigo-500/15 text-indigo-700 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300',
        dotColor: 'bg-indigo-500',
        icon: Sparkles
      };
    }
    if (status === 'ARQUIVADO' || status === 'ENCERRADO') {
      return { 
        label: 'Arquivado', 
        pillBg: 'bg-amber-500/15 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300',
        dotColor: 'bg-amber-500',
        icon: Lock
      };
    }
    return { 
      label: status || 'Planejamento', 
      pillBg: 'bg-slate-500/15 text-slate-700 border-slate-300 dark:bg-slate-500/20 dark:text-slate-300',
      dotColor: 'bg-slate-500',
      icon: Calendar
    };
  };

  const currentBadge = getStatusBadge(currentYearInfo?.status, selectedYear);
  const CurrentIcon = currentBadge.icon;

  return (
    <div className={`relative inline-block text-left z-40 ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 md:gap-3 px-3.5 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl transition-all border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-indigo-300 shadow-sm text-slate-800 active:scale-[0.98] group"
        title="Alternar entre Ano Letivo 2026 (Vigente) e 2027 (Planejamento)"
      >
        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
          selectedYear === 2026 
            ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' 
            : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
        }`}>
          <CurrentIcon size={16} />
        </div>

        <div className="text-left flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Ano Letivo</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase border leading-none ${currentBadge.pillBg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentBadge.dotColor} ${selectedYear === 2026 ? 'animate-pulse' : ''}`} />
              {selectedYear === 2026 ? '2026 Vigente' : '2027 Planejamento'}
            </span>
          </div>
          <span className="text-xs md:text-sm font-black tracking-tight text-slate-900 leading-none mt-0.5 flex items-center gap-1">
            {selectedYear}
            {isReadOnly && <Lock size={11} className="text-amber-500 shrink-0" />}
          </span>
        </div>

        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ml-1 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200/90 shadow-2xl z-50 p-2 text-slate-800 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          <div className="px-3 py-2.5 border-b border-slate-100 mb-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1">
                <Calendar size={12} /> Contexto do Sistema
              </p>
              <span className="text-[9px] font-black text-slate-400 uppercase">Selecione o Ciclo</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-snug">
              Alterne entre o ano letivo em andamento (<strong>2026</strong>) ou o planejamento (<strong>2027</strong>):
            </p>
          </div>

          <div className="space-y-1.5">
            {availableYears.map((yr) => {
              const isSelected = yr.year === selectedYear;
              const badge = getStatusBadge(yr.status, yr.year);
              const BadgeIcon = badge.icon;
              const isCurrentActive = yr.year === 2026;

              return (
                <button
                  key={yr.year}
                  type="button"
                  onClick={() => {
                    setSelectedYear(yr.year);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all border ${
                    isSelected
                      ? isCurrentActive
                        ? 'bg-emerald-50/80 border-emerald-200 shadow-sm'
                        : 'bg-indigo-50/80 border-indigo-200 shadow-sm'
                      : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                      isSelected
                        ? isCurrentActive
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {yr.year}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black uppercase tracking-tight text-slate-900 truncate">
                          {yr.name}
                        </p>
                        {isSelected && <Check size={14} className={isCurrentActive ? "text-emerald-600 shrink-0" : "text-indigo-600 shrink-0"} />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded uppercase border leading-none ${badge.pillBg}`}>
                          <BadgeIcon size={8} /> {badge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ArrowRight size={14} className={`shrink-0 transition-transform ${isSelected ? (isCurrentActive ? 'text-emerald-600 translate-x-0.5' : 'text-indigo-600 translate-x-0.5') : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>

          {/* MENSAGEM EXPLICATIVA CONFORME O ANO SELECIONADO */}
          {selectedYear === 2026 ? (
            <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
              <Calendar size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-black text-emerald-950 block">Ano Letivo 2026 (Vigente / Ativo):</strong>
                <span>Ambiente corrente em andamento. Todas as turmas, diários e notas de 2026 estão liberados para movimentações e lançamentos. O arquivamento será feito na virada do ano.</span>
              </div>
            </div>
          ) : (
            <div className="mt-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
              <Sparkles size={16} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-black text-indigo-950 block">Ano Letivo 2027 (Planejamento):</strong>
                <span>Ambiente preparado para novas matrículas, enturmações e planejamento de 2027. Os dados do ano 2026 continuam preservados e ativos no seu ciclo.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AcademicYearSelector;
