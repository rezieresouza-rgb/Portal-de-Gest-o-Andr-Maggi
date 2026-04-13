import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface Student {
    id: string;
    name: string;
    class: string;
    shift?: string;
    birth_date?: string;
    registration_number?: string;
    enrollment_date?: string;
    adjustment_date?: string;
    guardian_name?: string;
    contact_phone?: string;
    status?: string;
}

export const useStudents = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            classrooms (name, shift)
          )
        `);

            if (error) throw error;

            if (data) {
                const mappedStudents: Student[] = data.map((s: any) => {
                    const enrollment = s.enrollments?.[0];
                    const classroom = enrollment?.classrooms;
                    return {
                        id: s.id,
                        name: s.name,
                        class: classroom?.name || 'SEM TURMA',
                        shift: classroom?.shift || '---',
                        birth_date: s.birth_date,
                        registration_number: s.registration_number,
                        enrollment_date: enrollment?.enrollment_date,
                        adjustment_date: enrollment?.adjustment_date,
                        status: enrollment?.status || 'INATIVO',
                        guardian_name: s.guardian_name,
                        contact_phone: s.contact_phone
                    };
                });

                // Sort by Name
                mappedStudents.sort((a, b) => a.name.localeCompare(b.name));

                setStudents(mappedStudents);
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

        // Optional: Subscribe to changes if needed, but for now simple fetch is enough
    }, []);

    return { students, loading, error, refetch: fetchStudents };
};
