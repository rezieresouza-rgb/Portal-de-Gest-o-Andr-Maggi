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
  updateYearStatus: (year: number, status: AcademicYearStatus) => Promise<void>;
}

const DEFAULT_YEARS: AcademicYear[] = [
  {
    id: 'year-2026',
    year: 2026,
    name: 'Ano Letivo 2026',
    status: 'ATIVO',
    is_active: true,
    start_date: '2026-02-02',
    end_date: '2026-12-18',
    total_school_days: 200,
    description: 'Ano Letivo 2026 - Vigente em Andamento'
  },
  {
    id: 'year-2027',
    year: 2027,
    name: 'Ano Letivo 2027',
    status: 'PLANEJAMENTO',
    is_active: false,
    start_date: '2027-02-01',
    end_date: '2027-12-17',
    total_school_days: 200,
    description: 'Ano Letivo 2027 - Planejamento e Novas Matrículas'
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
    return 2026; // 2026 é o ano letivo vigente em andamento
  });

  const [availableYears, setAvailableYears] = useState<AcademicYear[]>(() => {
    try {
      const saved = localStorage.getItem('portal_academic_years_list_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garantir que 2026 seja sempre ATIVO e 2027 PLANEJAMENTO
          return parsed.map((y: any) => {
            if (y.year === 2026) {
              return { ...y, status: 'ATIVO', is_active: true, name: 'Ano Letivo 2026' };
            }
            if (y.year === 2027 && y.status === 'ATIVO') {
              return { ...y, status: 'PLANEJAMENTO', is_active: false, name: 'Ano Letivo 2027' };
            }
            return y;
          });
        }
      }
    } catch (e) {
      console.error('Erro ao ler lista de anos do localStorage:', e);
    }
    return DEFAULT_YEARS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchYearsFromDB = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('year', { ascending: false });

      if (!error && data && data.length > 0) {
        // Garantir que 2026 permaneça ATIVO e 2027 PLANEJAMENTO
        const normalized = data.map((y: any) => {
          if (y.year === 2026) {
            return { ...y, status: 'ATIVO', is_active: true, name: 'Ano Letivo 2026' };
          }
          if (y.year === 2027 && y.status === 'ATIVO') {
            return { ...y, status: 'PLANEJAMENTO', is_active: false, name: 'Ano Letivo 2027' };
          }
          return y;
        });
        setAvailableYears(normalized as AcademicYear[]);
        localStorage.setItem('portal_academic_years_list_v2', JSON.stringify(normalized));
      } else {
        setAvailableYears(DEFAULT_YEARS);
        localStorage.setItem('portal_academic_years_list_v2', JSON.stringify(DEFAULT_YEARS));
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

  const updateYearStatus = useCallback(async (year: number, status: AcademicYearStatus) => {
    try {
      setAvailableYears(prev => {
        const updated = prev.map(y => y.year === year ? { ...y, status } : y);
        localStorage.setItem('portal_academic_years_list_v2', JSON.stringify(updated));
        return updated;
      });

      await supabase
        .from('academic_years')
        .update({ status })
        .eq('year', year);
    } catch (err) {
      console.warn('Aviso ao sincronizar status do ano no Supabase:', err);
    }
  }, []);

  const currentYearInfo = availableYears.find(y => y.year === selectedYear);

  // O arquivamento/somente leitura só acontece quando o ano for explicitamente encerrado na virada do ano
  const isReadOnly = currentYearInfo?.status === 'ENCERRADO' || (currentYearInfo?.status === 'ARQUIVADO' && selectedYear < 2026);

  return (
    <AcademicYearContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
        availableYears,
        currentYearInfo,
        isReadOnly,
        isLoading,
        refreshYears: fetchYearsFromDB,
        updateYearStatus
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
