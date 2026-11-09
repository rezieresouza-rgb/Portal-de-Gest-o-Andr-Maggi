import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAcademicYear } from '../contexts/AcademicYearContext';

export interface Student {
    id: string;
    name: string;
    Nome?: string;
    class: string;
    Turma?: string;
    shift?: string;
    birth_date?: string;
    registration_number?: string;
    CodigoAluno?: string;
    enrollment_date?: string;
    adjustment_date?: string;
    guardian_name?: string;
    guardianName?: string;
    NomeMae?: string;
    NomePai?: string;
    contact_phone?: string;
    contactPhone?: string;
    Telefone?: string;
    address?: string;
    Endereco?: string;
    status?: string;
    paed?: boolean;
    school_transport?: boolean;
    gender?: string;
}

export const useStudents = () => {
    let selectedYear = 2027;
    try {
        const yearCtx = useAcademicYear();
        if (yearCtx) selectedYear = yearCtx.selectedYear;
    } catch (e) {
        const saved = localStorage.getItem('portal_selected_academic_year');
        if (saved) selectedYear = parseInt(saved, 10) || 2027;
    }

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isEnrollmentOfSelectedYear = (enr: any) => {
        const c = enr.classrooms;
        if (selectedYear === 2027) {
            return (c && (c.year === '2027' || (c.created_at && c.created_at >= '2027-01-01') || (c.name && c.name.includes('2027')))) ||
                   (enr.enrollment_date && enr.enrollment_date >= '2027-01-01');
        } else {
            return (!c || (c.year !== '2027' && (!c.created_at || c.created_at < '2027-01-01') && (!c.name || !c.name.includes('2027')))) &&
                   (!enr.enrollment_date || enr.enrollment_date < '2027-01-01');
        }
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('students')
                .select(`
                  *,
                  enrollments (
                    enrollment_date,
                    adjustment_date,
                    status,
                    classrooms (name, shift, year, created_at)
                  )
                `);

            if (error) throw error;

            if (data) {
                const yearStudents: Student[] = [];

                data.forEach((s: any) => {
                    // Filtrar apenas matrículas pertencentes ao ano selecionado (2026 vs 2027)
                    const filteredEnrs = (s.enrollments || []).filter(isEnrollmentOfSelectedYear);
                    if (filteredEnrs.length === 0) return; // Não matriculado neste ano letivo

                    const sortedEnrollments = [...filteredEnrs].sort((a, b) => {
                        const dateA = new Date(a.enrollment_date || 0).getTime();
                        const dateB = new Date(b.enrollment_date || 0).getTime();
                        
                        const isActiveA = (a.status === 'ATIVO' || a.status === 'RECLASSIFICADO');
                        const isActiveB = (b.status === 'ATIVO' || b.status === 'RECLASSIFICADO');
                        
                        if (isActiveA && !isActiveB) return -1;
                        if (!isActiveA && isActiveB) return 1;
                        
                        return dateB - dateA;
                    });

                    const enrollment = sortedEnrollments[0];
                    const classroom = enrollment?.classrooms;
                    
                    const guardian = (s.guardian_name || '').trim();
                    const phone = (s.contact_phone || '').trim();
                    const address = (s.address || '').trim();

                    const rawStudentStatus = (s.status || '').trim().toUpperCase();
                    const rawEnrollmentStatus = (enrollment?.status || '').trim().toUpperCase();
                    const classroomName = (classroom?.name || '').toUpperCase();

                    let resolvedStatus = 'ATIVO';
                    if (rawStudentStatus.startsWith('TRANSFERIDO') || rawStudentStatus === 'DESISTENTE' || rawStudentStatus === 'EVADIDO' || rawStudentStatus === 'FALECIDO' || rawStudentStatus === 'INATIVO') {
                        resolvedStatus = rawStudentStatus;
                    } else if (rawEnrollmentStatus.startsWith('TRANSFERIDO') || rawEnrollmentStatus === 'DESISTENTE' || rawEnrollmentStatus === 'EVADIDO' || rawEnrollmentStatus === 'FALECIDO' || rawEnrollmentStatus === 'INATIVO') {
                        resolvedStatus = rawEnrollmentStatus;
                    } else if (classroomName.includes('TRANSFERIDO')) {
                        resolvedStatus = 'TRANSFERIDO DE ESCOLA';
                    } else if (rawEnrollmentStatus) {
                        resolvedStatus = rawEnrollmentStatus;
                    } else if (rawStudentStatus) {
                        resolvedStatus = rawStudentStatus;
                    }

                    yearStudents.push({
                        id: s.id,
                        name: (s.name || '').trim(),
                        Nome: (s.name || '').trim(),
                        class: classroom?.name || 'SEM TURMA',
                        Turma: classroom?.name || 'SEM TURMA',
                        shift: classroom?.shift || '---',
                        birth_date: s.birth_date,
                        registration_number: s.registration_number,
                        CodigoAluno: s.registration_number || s.id,
                        enrollment_date: enrollment?.enrollment_date,
                        adjustment_date: enrollment?.adjustment_date,
                        status: resolvedStatus,
                        guardian_name: guardian,
                        guardianName: guardian,
                        NomeMae: guardian,
                        NomePai: guardian,
                        contact_phone: phone,
                        contactPhone: phone,
                        Telefone: phone,
                        address: address,
                        Endereco: address,
                        paed: s.paed,
                        school_transport: s.school_transport,
                        gender: s.gender
                    });
                });

                yearStudents.sort((a, b) => (a.name || '').trim().localeCompare((b.name || '').trim(), 'pt-BR', { sensitivity: 'base' }));
                setStudents(yearStudents);
            }
        } catch (err: any) {
            console.error('Error fetching students:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [selectedYear]);

    return { students, loading, error, refetch: fetchStudents };
};
