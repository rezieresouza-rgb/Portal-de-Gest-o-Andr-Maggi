export type AcademicYearStatus = 'PLANEJAMENTO' | 'ATIVO' | 'ENCERRADO' | 'ARQUIVADO';

export interface AcademicYear {
  id: string;
  year: number; // ex: 2026, 2027
  name: string; // ex: "Ano Letivo 2027"
  status: AcademicYearStatus;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  total_school_days?: number;
  description?: string;
}

export interface AcademicYearStats {
  totalClassrooms: number;
  totalStudents: number;
  totalTeachers: number;
  status: AcademicYearStatus;
}
