import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AcademicYear, AcademicYearStatus } from '../types/academicYear';
import { supabase } from '../supabaseClient';

interface AcademicYearContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: AcademicYear[];
  currentYearInfo?: AcademicYear;
  isReadOnly: boolean;
  isLoading: boolean;
  refreshYears: () => Promise<void>;
}

const DEFAULT_YEARS: AcademicYear[] = [
  {
    id: 'year-2026',
    year: 2026,
    name: 'Ano Letivo 2026',
    status: 'ATIVO',
    is_active: false,
    start_date: '2026-02-02',
    end_date: '2026-12-18',
    total_school_days: 200,
    description: 'Ano Letivo Vigente / Histórico'
  },
  {
    id: 'year-2027',
    year: 2027,
    name: 'Ano Letivo 2027',
    status: 'PLANEJAMENTO',
    is_active: true,
    start_date: '2027-02-01',
    end_date: '2027-12-17',
    total_school_days: 200,
    description: 'Ano Letivo 2027 - Planejamento e Matrículas'
  }
];

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export const AcademicYearProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedYear, setSelectedYearState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('portal_selected_academic_year');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num)) return num;
      }
    } catch (e) {
      console.error('Erro ao ler ano letivo do localStorage:', e);
    }
    return 2027; // Foco solicitado: 2027 por padrão
  });

  const [availableYears, setAvailableYears] = useState<AcademicYear[]>(DEFAULT_YEARS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchYearsFromDB = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('year', { ascending: false });

      if (!error && data && data.length > 0) {
        setAvailableYears(data as AcademicYear[]);
      } else {
        setAvailableYears(DEFAULT_YEARS);
      }
    } catch (err) {
      console.warn('Usando anos letivos locais (fallback):', err);
      setAvailableYears(DEFAULT_YEARS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYearsFromDB();
  }, [fetchYearsFromDB]);

  const setSelectedYear = useCallback((year: number) => {
    setSelectedYearState(year);
    try {
      localStorage.setItem('portal_selected_academic_year', year.toString());
    } catch (e) {
      console.error('Erro ao salvar ano letivo no localStorage:', e);
    }
  }, []);

  const currentYearInfo = availableYears.find(y => y.year === selectedYear);

  // Anos anteriores com status 'ENCERRADO' ou 'ARQUIVADO' ficam em modo somente leitura
  const isReadOnly = currentYearInfo?.status === 'ENCERRADO' || currentYearInfo?.status === 'ARQUIVADO';

  return (
    <AcademicYearContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
        availableYears,
        currentYearInfo,
        isReadOnly,
        isLoading,
        refreshYears: fetchYearsFromDB
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = (): AcademicYearContextType => {
  const context = useContext(AcademicYearContext);
  if (!context) {
    throw new Error('useAcademicYear deve ser utilizado dentro de um AcademicYearProvider');
  }
  return context;
};
