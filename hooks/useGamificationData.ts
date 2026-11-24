import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { SCHOOL_CLASSES } from '../constants/initialData';

export type GamificationPeriod =
  | 'ANO_TODO'
  | '1º BIMESTRE'
  | '2º BIMESTRE'
  | '3º BIMESTRE'
  | '4º BIMESTRE'
  | 'PERSONALIZADO';

export type GamificationPillar =
  | 'grades'
  | 'attendance'
  | 'library'
  | 'civicBehavior'
  | 'praises'
  | 'occurrences'
  | 'extraPoints';

export type GamificationSortBy =
  | 'totalPoints'
  | 'grades'
  | 'attendance'
  | 'library'
  | 'civicBehavior'
  | 'praises'
  | 'occurrences'
  | 'extraPoints';

export interface GamificationEvent {
  id: string;
  date: string; // YYYY-MM-DD
  bimestre: string;
  className: string;
  studentCode?: string;
  studentName?: string;
  pillar: GamificationPillar;
  points: number;
  title: string;
  description: string;
  sourceLabel: string;
}

export interface BimesterPointSnapshot {
  bimestre: string;
  totalPoints: number;
  grades: number;
  attendance: number;
  library: number;
  civicBehavior: number;
  praises: number;
  occurrences: number;
  extraPoints: number;
  attendanceRate?: number;
}

export interface ClassScore {
  className: string;
  shift: string;
  gradeLevel: string;
  activeStudentCount: number;
  totalPoints: number;
  rank: number;
  deltaPoints: number | null;
  breakdown: {
    grades: number;
    library: number;
    cleaning: number;
    occurrences: number;
    praises: number;
    civicBehavior: number;
    attendance: number;
    extraPoints: number;
  };
  attendanceStats?: {
    rate: number;
    presences: number;
    absences: number;
    rank?: number;
  };
  badges: string[];
  bimesterHistory: BimesterPointSnapshot[];
  events: GamificationEvent[];
}

export interface StudentScore {
  studentKey: string;
  studentCode: string;
  studentName: string;
  className: string;
  shift: string;
  gradeLevel: string;
  isActive: boolean;
  status: string;
  totalPoints: number;
  rankOverall: number;
  rankInClass: number;
  deltaPoints: number | null;
  breakdown: {
    grades: number;
    library: number;
    occurrences: number;
    praises: number;
    civicBehavior: number;
    attendance: number;
    extraPoints: number;
  };
  attendanceStats?: {
    rate: number;
    presences: number;
    absences: number;
  };
  badges: string[];
  bimesterHistory: BimesterPointSnapshot[];
  events: GamificationEvent[];
}

export interface GamificationExtraPoint {
  id: string;
  classroom_name: string;
  student_id?: string | null;
  student_name?: string | null;
  bimestre: string;
  date: string;
  points: number;
  category: string;
  description: string;
  created_by: string;
  created_at?: string;
}

export interface GamificationFilters {
  period: GamificationPeriod;
  customStart: string;
  customEnd: string;
  shift: string; // 'TODOS' | 'MATUTINO' | 'VESPERTINO'
  gradeLevel: string; // 'TODAS' | '6º ANO' | '7º ANO' | '8º ANO' | '9º ANO'
  className: string; // 'TODAS' | exact class name
  searchQuery: string;
  badge: string; // 'TODOS' | 'Selo Paz' | 'Selo Leitura' | 'Selo Coruja' | 'Selo Cívico' | 'Selo Assiduidade'
  sortBy: GamificationSortBy;
  includeTransferred: boolean;
}

export const BIMESTRES_LIST = ['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'] as const;

export const EXTRA_POINT_CATEGORIES = [
  'Gincana Escolar',
  'Feira de Ciências / Mostra',
  'Sala Mais Limpa e Organizada',
  'Ação Solidária / Cidadania',
  'Projeto Cultural / Esportivo',
  'Olimpíada / Competição Acadêmica',
  'Ajuste / Bonificação da Gestão'
];

const EXTRA_POINTS_LOCAL_KEY = 'liga_maggi_extra_points_v1';

export const normalizeText = (value?: string | null): string =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

export const extractGradeLevel = (className: string): string => {
  const m = String(className || '').match(/^(\d)[º°]?\s*ANO/i);
  return m ? `${m[1]}º ANO` : 'OUTROS';
};

export const getBimestreDateRange = (bimestre: string, year = 2026) => {
  switch (bimestre) {
    case '1º BIMESTRE':
      return { start: `${year}-02-01`, end: `${year}-04-30` };
    case '2º BIMESTRE':
      return { start: `${year}-05-01`, end: `${year}-07-15` };
    case '3º BIMESTRE':
      return { start: `${year}-07-16`, end: `${year}-10-15` };
    case '4º BIMESTRE':
      return { start: `${year}-10-16`, end: `${year}-12-31` };
    default:
      return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
};

export const inferBimestreFromIsoDate = (iso?: string | null): string => {
  if (!iso) return '1º BIMESTRE';
  const d = String(iso).slice(0, 10);
  if (d <= '2026-04-30') return '1º BIMESTRE';
  if (d <= '2026-07-15') return '2º BIMESTRE';
  if (d <= '2026-10-15') return '3º BIMESTRE';
  return '4º BIMESTRE';
};

export const formatDateBr = (iso?: string | null): string => {
  if (!iso) return '---';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(iso);
  return `${m[3]}/${m[2]}/${m[1]}`;
};

const fetchAllPaginated = async (
  buildQuery: (from: number, to: number) => any,
  pageSize = 1000,
  maxPages = 30
): Promise<any[]> => {
  const all: any[] = [];
  for (let page = 0; page < maxPages; page++) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await buildQuery(from, to);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
  }
  return all;
};

interface AttendanceSummaryMap {
  classByBim: Record<string, Record<string, { presences: number; absences: number }>>;
  studentByBim: Record<string, Record<string, { presences: number; absences: number }>>;
}

interface RawGamificationDataset {
  classrooms: { name: string; shift: string; gradeLevel: string }[];
  studentsRoster: {
    uuid: string;
    code: string;
    name: string;
    normName: string;
    className: string;
    shift: string;
    gradeLevel: string;
    isActive: boolean;
    status: string;
  }[];
  grades: {
    score: number;
    studentId?: string;
    studentCode?: string;
    studentName: string;
    className: string;
    bimestre: string;
    subject: string;
    date: string;
  }[];
  loans: {
    date: string;
    bimestre: string;
    studentName: string;
    className: string;
    isApa: boolean;
  }[];
  occurrences: {
    id: string;
    date: string;
    bimestre: string;
    className: string;
    studentName: string;
    category: string;
    severity: string;
    description: string;
  }[];
  civicBehaviors: {
    studentCode: string;
    studentName: string;
    className: string;
    score: number;
  }[];
  civicOccurrences: {
    id: string;
    studentCode: string;
    type: string;
    category: string;
    points: number;
    date: string;
    bimestre: string;
    observations: string;
    disciplinaryMeasure?: string;
  }[];
  extraPoints: GamificationExtraPoint[];
  extraPointsBackendAvailable: boolean;
}

const generateSimpleUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const loadLocalExtraPoints = (): GamificationExtraPoint[] => {
  try {
    const raw = localStorage.getItem(EXTRA_POINTS_LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalExtraPoints = (list: GamificationExtraPoint[]) => {
  try {
    localStorage.setItem(EXTRA_POINTS_LOCAL_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
};

export const useGamificationData = (filters: GamificationFilters) => {
  const [rawData, setRawData] = useState<RawGamificationDataset | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummaryMap>({
    classByBim: {},
    studentByBim: {}
  });
  const [isLoadingCore, setIsLoadingCore] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [loadedAttendancePeriods, setLoadedAttendancePeriods] = useState<Record<string, boolean>>({});
  const attendanceCacheRef = useRef<Map<string, { classStats: Record<string, { presences: number; absences: number }>; studentStats: Record<string, { presences: number; absences: number }> }>>(new Map());
  const inFlightBimestresRef = useRef<Set<string>>(new Set());

  const loadCoreData = useCallback(async () => {
    setIsLoadingCore(true);
    try {
      // 1. Turmas, alunos ativos/transferidos e avaliações bimestrais (com paginação completa)
      const [classroomsRes, rawStudents, rawAssessments] = await Promise.all([
        supabase.from('classrooms').select('id, name, shift').order('name'),
        fetchAllPaginated(
          (from, to) =>
            supabase
              .from('students')
              .select('id, name, registration_number, status, enrollments(status, enrollment_date, classrooms(name, shift))')
              .range(from, to),
          1000,
          10
        ),
        fetchAllPaginated(
          (from, to) =>
            supabase
              .from('assessments')
              .select('id, bimestre, subject, date, type, classrooms(name)')
              .eq('type', 'AVALIACAO_BIMESTRAL')
              .range(from, to),
          1000,
          10
        )
      ]);

      const classShiftMap = new Map<string, string>();
      const classroomsList: { name: string; shift: string; gradeLevel: string }[] = [];
      (classroomsRes.data || []).forEach((c: any) => {
        const name = String(c.name || '').trim();
        const shift = String(c.shift || 'MATUTINO').toUpperCase().trim();
        if (name) {
          classShiftMap.set(name, shift);
          classroomsList.push({ name, shift, gradeLevel: extractGradeLevel(name) });
        }
      });
      SCHOOL_CLASSES.forEach(c => {
        if (!classShiftMap.has(c)) {
          classShiftMap.set(c, 'MATUTINO');
          classroomsList.push({ name: c, shift: 'MATUTINO', gradeLevel: extractGradeLevel(c) });
        }
      });
      classroomsList.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      const inactiveStatuses = new Set(['TRANSFERIDO DE ESCOLA', 'TRANSFERIDO DA ESCOLA', 'TRANSFERIDO DE TURMA', 'TRANSFERIDO DA TURMA', 'FALECIDO', 'ÓBITO', 'OBITO', 'ABANDONO', 'EVADIDO', 'DESISTENTE', 'CANCELADO', 'INATIVO']);

      const isInactiveStatus = (raw?: string | null) => {
        const st = String(raw || '').toUpperCase().trim();
        if (!st) return false;
        return inactiveStatuses.has(st) || st.includes('TRANSFERIDO');
      };

      const studentsRoster = (rawStudents || [])
        .map((s: any) => {
          const studentStatusUpper = String(s.status || '').toUpperCase().trim();
          const enrollments = Array.isArray(s.enrollments)
            ? [...s.enrollments].sort((a: any, b: any) =>
                String(b.enrollment_date || '').localeCompare(String(a.enrollment_date || ''))
              )
            : [];
          const newestEnr = enrollments[0];
          const newestEnrStatus = String(newestEnr?.status || '').toUpperCase().trim();

          let activeEnr = enrollments.find((e: any) =>
            ['ATIVO', 'MATRICULADO', 'CURSANDO'].includes(String(e.status || '').toUpperCase().trim())
          );
          if (!activeEnr && !isInactiveStatus(studentStatusUpper) && !isInactiveStatus(newestEnrStatus)) {
            activeEnr = enrollments.find((e: any) => String(e.status || '').toUpperCase().trim() === 'RECLASSIFICADO');
          }

          const enr = activeEnr || newestEnr;
          const className = String(enr?.classrooms?.name || 'SEM TURMA').trim();
          const shift = String(classShiftMap.get(className) || enr?.classrooms?.shift || 'MATUTINO').toUpperCase().trim();
          const resolvedStatus = String(activeEnr ? activeEnr.status : (enr?.status || s.status || 'ATIVO')).toUpperCase().trim();
          const isActive = Boolean(activeEnr) && !isInactiveStatus(resolvedStatus);
          return {
            uuid: s.id,
            code: String(s.registration_number || s.id).trim(),
            name: String(s.name || '').trim(),
            normName: normalizeText(s.name),
            className,
            shift,
            gradeLevel: extractGradeLevel(className),
            isActive,
            status: resolvedStatus
          };
        })
        .filter(s => s.name && s.className !== 'SEM TURMA');

      const assMap = new Map<string, { bimestre: string; subject: string; date: string; className: string }>();
      (rawAssessments || []).forEach((a: any) => {
        if (a.id && a.bimestre) {
          assMap.set(a.id, {
            bimestre: String(a.bimestre).trim().toUpperCase(),
            subject: String(a.subject || 'Disciplina').trim(),
            date: String(a.date || '').slice(0, 10),
            className: String(a.classrooms?.name || '').trim()
          });
        }
      });

      const assIds = Array.from(assMap.keys());
      const fetchGradesChunked = async (ids: string[]) => {
        if (ids.length === 0) return [];
        const chunkSize = 50;
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += chunkSize) {
          chunks.push(ids.slice(i, i + chunkSize));
        }
        const results = await Promise.all(
          chunks.map(chunk =>
            fetchAllPaginated(
              (from, to) =>
                supabase
                  .from('grades')
                  .select('score, student_id, student_code, student_name, assessment_id')
                  .in('assessment_id', chunk)
                  .range(from, to),
              1000,
              20
            )
          )
        );
        return results.flat();
      };

      // 2. Carregar dados principais em paralelo com paginação completa
      const [
        rawGrades,
        regularLoans,
        apaLoans,
        rawOccurrences,
        rawCivicBehaviors,
        rawCivicOccurrences
      ] = await Promise.all([
        fetchGradesChunked(assIds),
        fetchAllPaginated((from, to) =>
          supabase
            .from('library_loans')
            .select('loan_date, status, library_readers(name, class_info)')
            .in('status', ['ATIVO', 'DEVOLVIDO'])
            .range(from, to)
        ),
        fetchAllPaginated((from, to) =>
          supabase
            .from('library_apa_loans')
            .select('loan_date, status, library_readers(name, class_info)')
            .in('status', ['ATIVO', 'DEVOLVIDO'])
            .range(from, to)
        ),
        fetchAllPaginated((from, to) =>
          supabase
            .from('occurrences')
            .select('id, classroom_name, student_name, category, severity, date, description')
            .eq('status', 'REGISTRADO')
            .range(from, to)
        ),
        fetchAllPaginated((from, to) =>
          supabase.from('civic_student_behavior').select('student_id, student_name, class_name, score').range(from, to)
        ),
        fetchAllPaginated((from, to) =>
          supabase
            .from('civic_occurrences')
            .select('id, student_id, type, category, points, date, observations, disciplinary_measure')
            .range(from, to)
        )
      ]);

      // 3. Pontos Extras (Supabase com fallback transparente para localStorage caso a tabela ainda não tenha sido criada)
      let extraPoints: GamificationExtraPoint[] = [];
      let extraPointsBackendAvailable = false;
      try {
        const { data: epData, error: epErr } = await supabase
          .from('gamification_extra_points')
          .select('*')
          .order('date', { ascending: false });
        if (!epErr && epData) {
          extraPointsBackendAvailable = true;
          extraPoints = epData.map((e: any) => ({
            id: e.id,
            classroom_name: e.classroom_name,
            student_id: e.student_id,
            student_name: e.student_name,
            bimestre: e.bimestre,
            date: String(e.date || '').slice(0, 10),
            points: Number(e.points) || 0,
            category: e.category || 'Bonificação',
            description: e.description || '',
            created_by: e.created_by || 'Gestão',
            created_at: e.created_at
          }));
        } else {
          extraPoints = loadLocalExtraPoints();
        }
      } catch {
        extraPoints = loadLocalExtraPoints();
      }

      const grades = rawGrades
        .map((g: any) => {
          const ass = assMap.get(g.assessment_id);
          if (!ass || g.score == null || isNaN(Number(g.score))) return null;
          return {
            score: Number(g.score),
            studentId: g.student_id || undefined,
            studentCode: g.student_code ? String(g.student_code).trim() : undefined,
            studentName: String(g.student_name || '').trim(),
            className: ass.className,
            bimestre: ass.bimestre,
            subject: ass.subject,
            date: ass.date || getBimestreDateRange(ass.bimestre).end
          };
        })
        .filter(Boolean) as RawGamificationDataset['grades'];

      const loans: RawGamificationDataset['loans'] = [
        ...regularLoans.map((l: any) => ({
          date: String(l.loan_date || '').slice(0, 10),
          bimestre: inferBimestreFromIsoDate(l.loan_date),
          studentName: String(l.library_readers?.name || '').trim(),
          className: String(l.library_readers?.class_info || '').trim(),
          isApa: false
        })),
        ...apaLoans.map((l: any) => ({
          date: String(l.loan_date || '').slice(0, 10),
          bimestre: inferBimestreFromIsoDate(l.loan_date),
          studentName: String(l.library_readers?.name || '').trim(),
          className: String(l.library_readers?.class_info || '').trim(),
          isApa: true
        }))
      ].filter(l => l.className);

      const occurrences: RawGamificationDataset['occurrences'] = rawOccurrences.map((o: any) => ({
        id: o.id || generateSimpleUUID(),
        date: String(o.date || '').slice(0, 10),
        bimestre: inferBimestreFromIsoDate(o.date),
        className: String(o.classroom_name || '').trim(),
        studentName: String(o.student_name || '').trim(),
        category: String(o.category || 'OCORRÊNCIA').trim(),
        severity: String(o.severity || 'MÉDIA').trim(),
        description: String(o.description || '').trim()
      }));

      const civicBehaviors: RawGamificationDataset['civicBehaviors'] = rawCivicBehaviors.map((c: any) => ({
        studentCode: String(c.student_id || '').trim(),
        studentName: String(c.student_name || '').trim(),
        className: String(c.class_name || '').trim(),
        score: Number(c.score) || 8.0
      }));

      const civicOccurrences: RawGamificationDataset['civicOccurrences'] = rawCivicOccurrences.map((c: any) => ({
        id: c.id || generateSimpleUUID(),
        studentCode: String(c.student_id || '').trim(),
        type: String(c.type || 'DEMERIT').toUpperCase(),
        category: String(c.category || '').trim(),
        points: Number(c.points) || 0,
        date: String(c.date || '').slice(0, 10),
        bimestre: inferBimestreFromIsoDate(c.date),
        observations: String(c.observations || '').trim(),
        disciplinaryMeasure: c.disciplinary_measure || undefined
      }));

      setRawData({
        classrooms: classroomsList,
        studentsRoster,
        grades,
        loans,
        occurrences,
        civicBehaviors,
        civicOccurrences,
        extraPoints,
        extraPointsBackendAvailable
      });
    } catch (err) {
      console.error('Erro ao carregar dados base da Gamificação:', err);
    } finally {
      setIsLoadingCore(false);
    }
  }, []);

  // Carrega frequência para os bimestres solicitados com atualização progressiva e deduplicação
  const loadAttendanceForBimestres = useCallback(async (targetBimestres: string[]) => {
    const missing = targetBimestres.filter(
      b => !attendanceCacheRef.current.has(b) && !inFlightBimestresRef.current.has(b)
    );
    if (missing.length === 0) return;

    missing.forEach(b => inFlightBimestresRef.current.add(b));
    setIsLoadingAttendance(true);
    try {
      for (const bim of missing) {
        const range = getBimestreDateRange(bim);
        const records = await fetchAllPaginated(
          (from, to) =>
            supabase
              .from('class_attendance_records')
              .select('classroom_name, date, presences:class_attendance_students(student_id, student_name, is_present)')
              .gte('date', range.start)
              .lte('date', range.end)
              .range(from, to),
          300,
          40
        );

        const classStats: Record<string, { presences: number; absences: number }> = {};
        const studentStats: Record<string, { presences: number; absences: number }> = {};

        records.forEach((r: any) => {
          const cName = String(r.classroom_name || '').trim();
          if (!cName) return;
          if (!classStats[cName]) classStats[cName] = { presences: 0, absences: 0 };

          (r.presences || []).forEach((p: any) => {
            const sCode = p.student_id ? String(p.student_id).trim() : '';
            const sNorm = normalizeText(p.student_name);
            const sKey = sCode ? `CODE:${sCode}` : sNorm ? `NAME:${sNorm}::${cName}` : '';
            if (sKey && !studentStats[sKey]) studentStats[sKey] = { presences: 0, absences: 0 };

            if (p.is_present) {
              classStats[cName].presences++;
              if (sKey) studentStats[sKey].presences++;
            } else {
              classStats[cName].absences++;
              if (sKey) studentStats[sKey].absences++;
            }
          });
        });

        attendanceCacheRef.current.set(bim, { classStats, studentStats });
        inFlightBimestresRef.current.delete(bim);

        // Atualiza progressivamente a cada bimestre carregado
        const nextClassByBim: AttendanceSummaryMap['classByBim'] = {};
        const nextStudentByBim: AttendanceSummaryMap['studentByBim'] = {};
        const nextLoaded: Record<string, boolean> = {};

        attendanceCacheRef.current.forEach((val, key) => {
          nextClassByBim[key] = val.classStats;
          nextStudentByBim[key] = val.studentStats;
          nextLoaded[key] = true;
        });

        setAttendanceSummary({ classByBim: nextClassByBim, studentByBim: nextStudentByBim });
        setLoadedAttendancePeriods(nextLoaded);
      }
    } catch (err) {
      console.error('Erro ao carregar frequência na Gamificação:', err);
    } finally {
      missing.forEach(b => inFlightBimestresRef.current.delete(b));
      if (inFlightBimestresRef.current.size === 0) {
        setIsLoadingAttendance(false);
      }
    }
  }, []);

  useEffect(() => {
    loadCoreData();
  }, [loadCoreData]);

  // Carrega primeiro o bimestre ativo e, na sequência, completa os demais para manter o histórico evolutivo 100% íntegro
  useEffect(() => {
    if (!rawData) return;
    if (filters.period === 'ANO_TODO' || filters.period === 'PERSONALIZADO') {
      loadAttendanceForBimestres([...BIMESTRES_LIST]);
    } else {
      const ordered = [filters.period, ...BIMESTRES_LIST.filter(b => b !== filters.period)];
      loadAttendanceForBimestres(ordered);
    }
  }, [rawData, filters.period, loadAttendanceForBimestres]);

  // CRUD de Pontos Extras
  const addExtraPoint = useCallback(
    async (payload: Omit<GamificationExtraPoint, 'id' | 'created_at'>) => {
      const newRecord: GamificationExtraPoint = {
        ...payload,
        id: generateSimpleUUID(),
        created_at: new Date().toISOString()
      };

      if (rawData?.extraPointsBackendAvailable) {
        const { error } = await supabase.from('gamification_extra_points').insert({
          id: newRecord.id,
          classroom_name: newRecord.classroom_name,
          student_id: newRecord.student_id || null,
          student_name: newRecord.student_name || null,
          bimestre: newRecord.bimestre,
          date: newRecord.date,
          points: newRecord.points,
          category: newRecord.category,
          description: newRecord.description,
          created_by: newRecord.created_by
        });
        if (error) {
          console.error('Erro ao salvar ponto extra no Supabase, usando localStorage:', error);
          const updatedLocal = [newRecord, ...loadLocalExtraPoints()];
          saveLocalExtraPoints(updatedLocal);
        }
      } else {
        const updatedLocal = [newRecord, ...loadLocalExtraPoints()];
        saveLocalExtraPoints(updatedLocal);
      }

      setRawData(prev => (prev ? { ...prev, extraPoints: [newRecord, ...prev.extraPoints] } : prev));
      return newRecord;
    },
    [rawData?.extraPointsBackendAvailable]
  );

  const deleteExtraPoint = useCallback(
    async (id: string) => {
      if (rawData?.extraPointsBackendAvailable) {
        await supabase.from('gamification_extra_points').delete().eq('id', id);
      }
      const updatedLocal = loadLocalExtraPoints().filter(e => e.id !== id);
      saveLocalExtraPoints(updatedLocal);
      setRawData(prev => (prev ? { ...prev, extraPoints: prev.extraPoints.filter(e => e.id !== id) } : prev));
    },
    [rawData?.extraPointsBackendAvailable]
  );

  // Motor de Cálculo Instantâneo (por bimestre + recorte filtrado + histórico completo)
  const computed = useMemo(() => {
    if (!rawData) {
      return {
        allClassScores: [] as ClassScore[],
        filteredClassScores: [] as ClassScore[],
        allStudentScores: [] as StudentScore[],
        filteredStudentScores: [] as StudentScore[],
        timelineEvents: [] as GamificationEvent[],
        classroomsMeta: [] as { name: string; shift: string; gradeLevel: string }[]
      };
    }

    // Índices rápidos de alunos
    const rosterByUuid = new Map<string, (typeof rawData.studentsRoster)[0]>();
    const rosterByCode = new Map<string, (typeof rawData.studentsRoster)[0]>();
    const rosterByNormNameClass = new Map<string, (typeof rawData.studentsRoster)[0]>();
    const rosterByNormName = new Map<string, (typeof rawData.studentsRoster)[0]>();
    const activeCountByClass = new Map<string, number>();

    rawData.studentsRoster.forEach(s => {
      rosterByUuid.set(s.uuid, s);
      rosterByCode.set(s.code, s);
      rosterByNormNameClass.set(`${s.normName}::${s.className}`, s);
      if (!rosterByNormName.has(s.normName)) rosterByNormName.set(s.normName, s);
      if (s.isActive) {
        activeCountByClass.set(s.className, (activeCountByClass.get(s.className) || 0) + 1);
      }
    });

    const resolveStudent = (opts: { uuid?: string; code?: string; name?: string; className?: string }) => {
      if (opts.uuid && rosterByUuid.has(opts.uuid)) return rosterByUuid.get(opts.uuid)!;
      if (opts.code && rosterByCode.has(opts.code)) return rosterByCode.get(opts.code)!;
      const norm = normalizeText(opts.name);
      if (norm && opts.className && rosterByNormNameClass.has(`${norm}::${opts.className}`)) {
        return rosterByNormNameClass.get(`${norm}::${opts.className}`)!;
      }
      if (norm && rosterByNormName.has(norm)) return rosterByNormName.get(norm)!;
      return null;
    };

    const classMetaMap = new Map<string, { name: string; shift: string; gradeLevel: string }>();
    rawData.classrooms.forEach(c => classMetaMap.set(c.name, c));

    // Função que calcula um recorte específico (um bimestre, ANO_TODO ou PERSONALIZADO)
    const computeSlice = (
      slicePeriod: GamificationPeriod,
      startDate?: string,
      endDate?: string,
      collectEvents = false
    ) => {
      const inRange = (bim: string, isoDate?: string) => {
        if (slicePeriod === 'ANO_TODO') return true;
        if (slicePeriod === 'PERSONALIZADO') {
          const d = String(isoDate || '').slice(0, 10);
          if (!d) return false;
          if (startDate && d < startDate) return false;
          if (endDate && d > endDate) return false;
          return true;
        }
        return bim === slicePeriod;
      };

      const cMap: Record<string, ClassScore> = {};
      const sMap: Record<string, StudentScore> = {};
      const allEvents: GamificationEvent[] = [];

      rawData.classrooms.forEach(c => {
        cMap[c.name] = {
          className: c.name,
          shift: c.shift,
          gradeLevel: c.gradeLevel,
          activeStudentCount: activeCountByClass.get(c.name) || 0,
          totalPoints: 0,
          rank: 0,
          deltaPoints: null,
          breakdown: {
            grades: 0,
            library: 0,
            cleaning: 0,
            occurrences: 0,
            praises: 0,
            civicBehavior: 0,
            attendance: 0,
            extraPoints: 0
          },
          badges: [],
          bimesterHistory: [],
          events: []
        };
      });

      // Usa exclusivamente o cadastro oficial (students + enrollments) como fonte única da verdade
      // para nunca criar alunos duplicados/fantasmas vindos de códigos antigos ou erros de digitação.
      const ensureStudent = (
        resolved: ReturnType<typeof resolveStudent>,
        _fallbackName?: string,
        _fallbackClass?: string,
        _fallbackCode?: string
      ): StudentScore | null => {
        if (!resolved) return null;
        const className = resolved.className;
        const studentName = resolved.name;
        if (!studentName || !className) return null;
        const code = resolved.code;
        const key = `${code}::${className}`;
        if (!sMap[key]) {
          const meta = classMetaMap.get(className);
          sMap[key] = {
            studentKey: key,
            studentCode: code,
            studentName,
            className,
            shift: resolved.shift || meta?.shift || 'MATUTINO',
            gradeLevel: resolved.gradeLevel || extractGradeLevel(className),
            isActive: resolved.isActive,
            status: resolved.status || 'ATIVO',
            totalPoints: 0,
            rankOverall: 0,
            rankInClass: 0,
            deltaPoints: null,
            breakdown: {
              grades: 0,
              library: 0,
              occurrences: 0,
              praises: 0,
              civicBehavior: 0,
              attendance: 0,
              extraPoints: 0
            },
            badges: [],
            bimesterHistory: [],
            events: []
          };
        }
        return sMap[key];
      };

      // Pré-popular todos os alunos ativos do cadastro para que ninguém suma da busca
      rawData.studentsRoster.forEach(r => {
        if (r.isActive || filters.includeTransferred) {
          ensureStudent(r, r.name, r.className, r.code);
        }
      });

      const pushEvent = (evt: GamificationEvent, st?: StudentScore | null) => {
        if (!collectEvents) return;
        allEvents.push(evt);
        if (cMap[evt.className]) cMap[evt.className].events.push(evt);
        if (st) st.events.push(evt);
      };

      // 1. Notas Bimestrais
      rawData.grades.forEach((g, idx) => {
        if (!inRange(g.bimestre, g.date)) return;
        const resolved = resolveStudent({ uuid: g.studentId, code: g.studentCode, name: g.studentName, className: g.className });
        const cName = resolved?.className || g.className;
        if (!cName || !cMap[cName]) return;

        let pts = 0;
        if (g.score >= 9) pts = 10;
        else if (g.score >= 7) pts = 5;
        else if (g.score >= 6) pts = 2;

        if (pts > 0) {
          cMap[cName].breakdown.grades += pts;
          const st = ensureStudent(resolved, g.studentName, cName, g.studentCode);
          if (st) st.breakdown.grades += pts;

          pushEvent(
            {
              id: `grade-${idx}-${g.bimestre}`,
              date: g.date,
              bimestre: g.bimestre,
              className: cName,
              studentCode: st?.studentCode,
              studentName: st?.studentName || g.studentName,
              pillar: 'grades',
              points: pts,
              title: `Nota ${g.score.toFixed(1)} em ${g.subject}`,
              description: `Desempenho em ${g.subject} (${g.bimestre}) — nota ${g.score.toFixed(1)} (+${pts} pts).`,
              sourceLabel: 'Notas'
            },
            st
          );
        }
      });

      // 2. Biblioteca (Regular + APA) — Indicador informativo de empréstimos (não altera pontuação do ranking)
      rawData.loans.forEach((l, idx) => {
        if (!inRange(l.bimestre, l.date)) return;
        if (!cMap[l.className]) return;

        cMap[l.className].breakdown.library += 1;
        const resolved = resolveStudent({ name: l.studentName, className: l.className });
        const st = ensureStudent(resolved, l.studentName, l.className);
        if (st) st.breakdown.library += 1;

        pushEvent(
          {
            id: `loan-${idx}-${l.date}`,
            date: l.date,
            bimestre: l.bimestre,
            className: l.className,
            studentCode: st?.studentCode,
            studentName: st?.studentName || l.studentName,
            pillar: 'library',
            points: 0,
            title: l.isApa ? 'Leitura Projeto APA' : 'Empréstimo na Biblioteca',
            description: `${l.isApa ? 'Leitura registrada no Projeto APA' : 'Empréstimo literário registrado na Biblioteca Escolar'} (indicador informativo — conta para o Selo Leitura, não soma no total).`,
            sourceLabel: 'Biblioteca'
          },
          st
        );
      });

      // 3. Ocorrências & Elogios (Pedagógico)
      rawData.occurrences.forEach(o => {
        if (!inRange(o.bimestre, o.date)) return;
        if (!cMap[o.className]) return;

        const resolved = resolveStudent({ name: o.studentName, className: o.className });
        const st = ensureStudent(resolved, o.studentName, o.className);
        const isPraise = o.category.toUpperCase().includes('ELOGIO') || o.severity.toUpperCase() === 'ELOGIO';

        if (isPraise) {
          cMap[o.className].breakdown.praises += 20;
          if (st) st.breakdown.praises += 20;
          pushEvent(
            {
              id: `occ-${o.id}`,
              date: o.date,
              bimestre: o.bimestre,
              className: o.className,
              studentCode: st?.studentCode,
              studentName: st?.studentName || o.studentName,
              pillar: 'praises',
              points: 20,
              title: `Elogio Registrado (${o.category})`,
              description: o.description || 'Reconhecimento positivo registrado pela equipe escolar.',
              sourceLabel: 'Elogios'
            },
            st
          );
        } else {
          const isHigh = o.severity.toUpperCase() === 'ALTA' || o.severity.toUpperCase() === 'CRÍTICA';
          const delta = isHigh ? -30 : -10;
          cMap[o.className].breakdown.occurrences += delta;
          if (st) st.breakdown.occurrences += delta;
          pushEvent(
            {
              id: `occ-${o.id}`,
              date: o.date,
              bimestre: o.bimestre,
              className: o.className,
              studentCode: st?.studentCode,
              studentName: st?.studentName || o.studentName,
              pillar: 'occurrences',
              points: delta,
              title: `Ocorrência ${o.category} (${o.severity})`,
              description: o.description || 'Ocorrência pedagógica/disciplinar registrada.',
              sourceLabel: 'Ocorrências'
            },
            st
          );
        }
      });

      // 4. Cívico-Militar — Eventos Datados (civic_occurrences: Art. 50, Art. 51, Elogios e Deméritos)
      rawData.civicOccurrences.forEach(co => {
        if (!inRange(co.bimestre, co.date)) return;
        const resolved = resolveStudent({ code: co.studentCode });
        const cName = resolved?.className;
        if (!cName || !cMap[cName]) return;
        const st = ensureStudent(resolved, resolved?.name || co.studentCode, cName, co.studentCode);

        const isMerit = co.type === 'MERIT';
        let pts = 0;
        if (isMerit) {
          if (co.category.includes('Art. 50') || co.category.includes('Elogio Individual')) pts = 25;
          else if (co.category.includes('Elogio Coletivo')) pts = 15;
          else pts = 10; // Art. 51 (2 meses sem medida)
        } else {
          if (co.points >= 0.5) pts = -30;
          else if (co.points >= 0.2) pts = -20;
          else pts = -10;
        }

        cMap[cName].breakdown.civicBehavior += pts;
        if (st) st.breakdown.civicBehavior += pts;

        pushEvent(
          {
            id: `civic-${co.id}`,
            date: co.date,
            bimestre: co.bimestre,
            className: cName,
            studentCode: st?.studentCode || co.studentCode,
            studentName: st?.studentName,
            pillar: 'civicBehavior',
            points: pts,
            title: isMerit ? `Mérito Cívico: ${co.category}` : `Medida Cívico-Militar: ${co.disciplinaryMeasure || 'Demérito'}`,
            description: co.observations || co.category,
            sourceLabel: 'Cívico-Militar'
          },
          st
        );
      });

      // 4b. Bônus de Nota de Atitude Geral (civic_student_behavior) — deduplicado por aluno oficial
      // Prioriza correspondência exata pelo código SEDUC oficial e impede contagem dupla/tripla por registros legados órfãos.
      if (slicePeriod === 'ANO_TODO' || slicePeriod === '3º BIMESTRE' || slicePeriod === '4º BIMESTRE') {
        const appliedCivicStudentKeys = new Set<string>();

        const applyCivicBehavior = (
          resolved: ReturnType<typeof resolveStudent>,
          score: number
        ) => {
          if (!resolved) return;
          const cName = resolved.className;
          if (!cName || !cMap[cName]) return;
          if (!resolved.isActive && !filters.includeTransferred) return;

          const dedupeKey = `${resolved.code}::${cName}`;
          if (appliedCivicStudentKeys.has(dedupeKey)) return;
          appliedCivicStudentKeys.add(dedupeKey);

          let bonus = 0;
          if (score >= 9.0) bonus = 50;
          else if (score >= 8.0) bonus = 10;
          else if (score < 5.0) bonus = -20;

          if (bonus !== 0) {
            cMap[cName].breakdown.civicBehavior += bonus;
            const st = ensureStudent(resolved);
            if (st) st.breakdown.civicBehavior += bonus;
          }
        };

        // Passo 1: registros com código SEDUC idêntico ao cadastro oficial (mais confiáveis)
        rawData.civicBehaviors.forEach(cb => {
          const exactByCode = cb.studentCode ? rosterByCode.get(cb.studentCode) || null : null;
          if (exactByCode) {
            applyCivicBehavior(exactByCode, cb.score);
          }
        });

        // Passo 2: fallback por nome exato apenas para alunos reais que não possuíam registro direto no Passo 1
        rawData.civicBehaviors.forEach(cb => {
          const exactByCode = cb.studentCode ? rosterByCode.get(cb.studentCode) || null : null;
          if (exactByCode) return;
          const resolvedByName = resolveStudent({ name: cb.studentName, className: cb.className });
          if (resolvedByName) {
            applyCivicBehavior(resolvedByName, cb.score);
          }
        });
      }

      // 5. Assiduidade (Frequência) usando o cache agregado por bimestre
      const bimsToSumAttendance: string[] =
        slicePeriod === 'ANO_TODO'
          ? [...BIMESTRES_LIST]
          : slicePeriod === 'PERSONALIZADO'
          ? BIMESTRES_LIST.filter(b => {
              const r = getBimestreDateRange(b);
              if (startDate && r.end < startDate) return false;
              if (endDate && r.start > endDate) return false;
              return true;
            })
          : [slicePeriod];

      const aggClassAtt: Record<string, { presences: number; absences: number }> = {};
      const aggStudentAtt: Record<string, { presences: number; absences: number }> = {};

      bimsToSumAttendance.forEach(b => {
        const cBim = attendanceSummary.classByBim[b];
        if (cBim) {
          Object.entries(cBim).forEach(([cn, stats]) => {
            if (!aggClassAtt[cn]) aggClassAtt[cn] = { presences: 0, absences: 0 };
            aggClassAtt[cn].presences += stats.presences;
            aggClassAtt[cn].absences += stats.absences;
          });
        }
        const sBim = attendanceSummary.studentByBim[b];
        if (sBim) {
          Object.entries(sBim).forEach(([sk, stats]) => {
            if (!aggStudentAtt[sk]) aggStudentAtt[sk] = { presences: 0, absences: 0 };
            aggStudentAtt[sk].presences += stats.presences;
            aggStudentAtt[sk].absences += stats.absences;
          });
        }
      });

      Object.entries(aggClassAtt).forEach(([cName, stats]) => {
        if (!cMap[cName]) return;
        const total = stats.presences + stats.absences;
        const rate = total > 0 ? (stats.presences / total) * 100 : 0;
        cMap[cName].attendanceStats = { rate, presences: stats.presences, absences: stats.absences };
        if (rate >= 90) cMap[cName].breakdown.attendance += 150;
        else if (rate >= 85) cMap[cName].breakdown.attendance += 50;
        else if (rate < 80 && total > 0) cMap[cName].breakdown.attendance -= 50;
      });

      const sortedAttClasses = Object.values(cMap)
        .filter(c => c.attendanceStats && c.attendanceStats.presences + c.attendanceStats.absences > 0)
        .sort((a, b) => (b.attendanceStats?.rate || 0) - (a.attendanceStats?.rate || 0));

      if (sortedAttClasses[0]) {
        sortedAttClasses[0].breakdown.attendance += 300;
        if (sortedAttClasses[0].attendanceStats) sortedAttClasses[0].attendanceStats.rank = 1;
      }
      if (sortedAttClasses[1]) {
        sortedAttClasses[1].breakdown.attendance += 200;
        if (sortedAttClasses[1].attendanceStats) sortedAttClasses[1].attendanceStats.rank = 2;
      }
      if (sortedAttClasses[2]) {
        sortedAttClasses[2].breakdown.attendance += 100;
        if (sortedAttClasses[2].attendanceStats) sortedAttClasses[2].attendanceStats.rank = 3;
      }

      Object.values(sMap).forEach(st => {
        const stats =
          aggStudentAtt[`CODE:${st.studentCode}`] ||
          aggStudentAtt[`NAME:${normalizeText(st.studentName)}::${st.className}`];
        if (!stats) return;
        const total = stats.presences + stats.absences;
        const rate = total > 0 ? (stats.presences / total) * 100 : 0;
        st.attendanceStats = { rate, presences: stats.presences, absences: stats.absences };
        if (stats.absences === 0 && stats.presences >= 20) {
          st.breakdown.attendance += 50;
          if (!st.badges.includes('Selo Assiduidade')) st.badges.push('Selo Assiduidade');
        } else if (rate >= 90 && total >= 10) {
          st.breakdown.attendance += 20;
        }
      });

      // 6. Pontos Extras Manuais (Gincanas, Eventos, Projetos)
      rawData.extraPoints.forEach(ep => {
        if (!inRange(ep.bimestre, ep.date)) return;
        if (!cMap[ep.classroom_name]) return;

        cMap[ep.classroom_name].breakdown.extraPoints += ep.points;
        let targetStudent: StudentScore | null = null;
        if (ep.student_id || ep.student_name) {
          const resolved = resolveStudent({ code: ep.student_id || undefined, name: ep.student_name || undefined, className: ep.classroom_name });
          targetStudent = ensureStudent(resolved, ep.student_name || '', ep.classroom_name, ep.student_id || undefined);
          if (targetStudent) targetStudent.breakdown.extraPoints += ep.points;
        }

        pushEvent(
          {
            id: `extra-${ep.id}`,
            date: ep.date,
            bimestre: ep.bimestre,
            className: ep.classroom_name,
            studentCode: targetStudent?.studentCode,
            studentName: targetStudent?.studentName || (ep.student_name || undefined),
            pillar: 'extraPoints',
            points: ep.points,
            title: `Ponto Extra: ${ep.category}`,
            description: `${ep.description} (lançado por ${ep.created_by})`,
            sourceLabel: 'Pontos Extras'
          },
          targetStudent
        );
      });

      // Consolidar totais, medalhas e ranking (Biblioteca mantida apenas como indicador informativo + Selo Leitura)
      const classList = Object.values(cMap)
        .map(c => {
          c.totalPoints =
            1000 +
            c.breakdown.grades +
            c.breakdown.cleaning +
            c.breakdown.occurrences +
            c.breakdown.praises +
            c.breakdown.civicBehavior +
            c.breakdown.attendance +
            c.breakdown.extraPoints;

          if (c.breakdown.cleaning >= 0 && c.breakdown.occurrences >= -10) c.badges.push('Selo Paz');
          if (c.attendanceStats && c.attendanceStats.rate >= 90) c.badges.push('Selo Assiduidade');
          if (c.breakdown.library >= 11) c.badges.push('Selo Leitura');
          if (c.breakdown.grades > 100) c.badges.push('Selo Coruja');
          if (c.breakdown.civicBehavior >= 100) c.badges.push('Selo Cívico');

          c.events.sort((a, b) => String(b.date).localeCompare(String(a.date)));
          return c;
        })
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((c, idx) => ({ ...c, rank: idx + 1 }));

      const studentList = Object.values(sMap)
        .filter(s => (filters.includeTransferred ? true : s.isActive))
        .map(s => {
          s.totalPoints =
            1000 +
            s.breakdown.grades +
            s.breakdown.occurrences +
            s.breakdown.praises +
            s.breakdown.civicBehavior +
            s.breakdown.attendance +
            s.breakdown.extraPoints;

          if (s.breakdown.praises > 0 && s.breakdown.occurrences === 0) s.badges.push('Selo Paz');
          if (s.breakdown.library >= 2) s.badges.push('Selo Leitura');
          if (s.breakdown.grades >= 30) s.badges.push('Selo Coruja');
          if (s.breakdown.civicBehavior >= 50) s.badges.push('Selo Cívico');

          s.events.sort((a, b) => String(b.date).localeCompare(String(a.date)));
          return s;
        })
        .sort((a, b) => b.totalPoints - a.totalPoints);

      // Posição geral e posição dentro da própria turma
      const classRankCounter: Record<string, number> = {};
      studentList.forEach((s, idx) => {
        s.rankOverall = idx + 1;
        classRankCounter[s.className] = (classRankCounter[s.className] || 0) + 1;
        s.rankInClass = classRankCounter[s.className];
      });

      allEvents.sort((a, b) => String(b.date).localeCompare(String(a.date)));

      return { classList, studentList, allEvents };
    };

    // 1. Calcular os 4 bimestres para o histórico evolutivo
    const bimSlices: Record<string, ReturnType<typeof computeSlice>> = {};
    BIMESTRES_LIST.forEach(b => {
      bimSlices[b] = computeSlice(b, undefined, undefined, false);
    });

    // 2. Calcular o recorte ativo (com coleta completa de eventos para extratos)
    const activeSlice = computeSlice(
      filters.period,
      filters.customStart,
      filters.customEnd,
      true
    );

    // 3. Anexar bimesterHistory e deltaPoints em cada turma e aluno
    const prevBimMap: Record<string, string | null> = {
      '1º BIMESTRE': null,
      '2º BIMESTRE': '1º BIMESTRE',
      '3º BIMESTRE': '2º BIMESTRE',
      '4º BIMESTRE': '3º BIMESTRE'
    };
    const prevBim = prevBimMap[filters.period] || null;

    const classLookupByBim: Record<string, Map<string, ClassScore>> = {};
    const studentLookupByBim: Record<string, Map<string, StudentScore>> = {};
    BIMESTRES_LIST.forEach(b => {
      classLookupByBim[b] = new Map(bimSlices[b].classList.map(c => [c.className, c]));
      studentLookupByBim[b] = new Map(bimSlices[b].studentList.map(s => [s.studentKey, s]));
    });

    const enrichedClasses = activeSlice.classList.map(c => {
      const bimesterHistory: BimesterPointSnapshot[] = BIMESTRES_LIST.map(b => {
        const snap = classLookupByBim[b].get(c.className);
        return {
          bimestre: b,
          totalPoints: snap?.totalPoints ?? 1000,
          grades: snap?.breakdown.grades ?? 0,
          attendance: snap?.breakdown.attendance ?? 0,
          library: snap?.breakdown.library ?? 0,
          civicBehavior: snap?.breakdown.civicBehavior ?? 0,
          praises: snap?.breakdown.praises ?? 0,
          occurrences: snap?.breakdown.occurrences ?? 0,
          extraPoints: snap?.breakdown.extraPoints ?? 0,
          attendanceRate: snap?.attendanceStats?.rate
        };
      });

      let deltaPoints: number | null = null;
      if (prevBim) {
        const prevSnap = classLookupByBim[prevBim].get(c.className);
        if (prevSnap) deltaPoints = c.totalPoints - prevSnap.totalPoints;
      } else if (filters.period === 'ANO_TODO') {
        const b3 = classLookupByBim['3º BIMESTRE'].get(c.className);
        const b2 = classLookupByBim['2º BIMESTRE'].get(c.className);
        if (b3 && b2) deltaPoints = b3.totalPoints - b2.totalPoints;
      }

      return { ...c, bimesterHistory, deltaPoints };
    });

    const enrichedStudents = activeSlice.studentList.map(s => {
      const bimesterHistory: BimesterPointSnapshot[] = BIMESTRES_LIST.map(b => {
        const snap = studentLookupByBim[b].get(s.studentKey);
        return {
          bimestre: b,
          totalPoints: snap?.totalPoints ?? 1000,
          grades: snap?.breakdown.grades ?? 0,
          attendance: snap?.breakdown.attendance ?? 0,
          library: snap?.breakdown.library ?? 0,
          civicBehavior: snap?.breakdown.civicBehavior ?? 0,
          praises: snap?.breakdown.praises ?? 0,
          occurrences: snap?.breakdown.occurrences ?? 0,
          extraPoints: snap?.breakdown.extraPoints ?? 0,
          attendanceRate: snap?.attendanceStats?.rate
        };
      });

      let deltaPoints: number | null = null;
      if (prevBim) {
        const prevSnap = studentLookupByBim[prevBim].get(s.studentKey);
        if (prevSnap) deltaPoints = s.totalPoints - prevSnap.totalPoints;
      }

      return { ...s, bimesterHistory, deltaPoints };
    });

    // 4. Aplicar Filtros Globais (Turno, Série, Turma, Busca, Selo e Ordenação por Pilar)
    const sortScoreValue = (item: ClassScore | StudentScore, sortBy: GamificationSortBy): number => {
      if (sortBy === 'totalPoints') return item.totalPoints;
      if (sortBy === 'occurrences') return item.breakdown.occurrences; // menos negativo = melhor
      return item.breakdown[sortBy] ?? 0;
    };

    const normSearch = normalizeText(filters.searchQuery);

    const filteredClassScores = enrichedClasses
      .filter(c => {
        if (filters.shift !== 'TODOS' && c.shift !== filters.shift) return false;
        if (filters.gradeLevel !== 'TODAS' && c.gradeLevel !== filters.gradeLevel) return false;
        if (filters.className !== 'TODAS' && c.className !== filters.className) return false;
        if (filters.badge !== 'TODOS' && !c.badges.includes(filters.badge)) return false;
        return true;
      })
      .sort((a, b) => sortScoreValue(b, filters.sortBy) - sortScoreValue(a, filters.sortBy));

    const filteredStudentScores = enrichedStudents
      .filter(s => {
        if (filters.shift !== 'TODOS' && s.shift !== filters.shift) return false;
        if (filters.gradeLevel !== 'TODAS' && s.gradeLevel !== filters.gradeLevel) return false;
        if (filters.className !== 'TODAS' && s.className !== filters.className) return false;
        if (filters.badge !== 'TODOS' && !s.badges.includes(filters.badge)) return false;
        if (normSearch) {
          const matchesName = normalizeText(s.studentName).includes(normSearch);
          const matchesCode = normalizeText(s.studentCode).includes(normSearch);
          const matchesClass = normalizeText(s.className).includes(normSearch);
          if (!matchesName && !matchesCode && !matchesClass) return false;
        }
        return true;
      })
      .sort((a, b) => sortScoreValue(b, filters.sortBy) - sortScoreValue(a, filters.sortBy));

    const filteredTimelineEvents = activeSlice.allEvents.filter(evt => {
      const meta = classMetaMap.get(evt.className);
      if (filters.shift !== 'TODOS' && meta && meta.shift !== filters.shift) return false;
      if (filters.gradeLevel !== 'TODAS' && extractGradeLevel(evt.className) !== filters.gradeLevel) return false;
      if (filters.className !== 'TODAS' && evt.className !== filters.className) return false;
      if (normSearch) {
        const matchesName = normalizeText(evt.studentName).includes(normSearch);
        const matchesCode = normalizeText(evt.studentCode).includes(normSearch);
        const matchesDesc = normalizeText(evt.title + ' ' + evt.description).includes(normSearch);
        if (!matchesName && !matchesCode && !matchesDesc) return false;
      }
      return true;
    });

    return {
      allClassScores: enrichedClasses,
      filteredClassScores,
      allStudentScores: enrichedStudents,
      filteredStudentScores,
      timelineEvents: filteredTimelineEvents,
      classroomsMeta: rawData.classrooms
    };
  }, [rawData, attendanceSummary, filters]);

  return {
    ...computed,
    extraPoints: rawData?.extraPoints || [],
    extraPointsBackendAvailable: rawData?.extraPointsBackendAvailable ?? false,
    studentsRoster: rawData?.studentsRoster || [],
    isLoading: isLoadingCore,
    isLoadingAttendance,
    loadedAttendancePeriods,
    refresh: () => {
      attendanceCacheRef.current.clear();
      inFlightBimestresRef.current.clear();
      setAttendanceSummary({ classByBim: {}, studentByBim: {} });
      setLoadedAttendancePeriods({});
      loadCoreData();
    },
    addExtraPoint,
    deleteExtraPoint
  };
};
