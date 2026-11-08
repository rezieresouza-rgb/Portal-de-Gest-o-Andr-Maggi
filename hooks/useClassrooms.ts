import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Classroom, Shift } from '../types';
import { useAcademicYear } from '../contexts/AcademicYearContext';

export const useClassrooms = () => {
    let selectedYear = 2027;
    try {
        const yearCtx = useAcademicYear();
        if (yearCtx) selectedYear = yearCtx.selectedYear;
    } catch (e) {
        // Fallback para quando chamado fora do provider
        const saved = localStorage.getItem('portal_selected_academic_year');
        if (saved) selectedYear = parseInt(saved, 10) || 2027;
    }

    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isClassOfSelectedYear = (c: any) => {
        if (selectedYear === 2027) {
            return c.year === '2027' || (c.created_at && c.created_at >= '2027-01-01') || (c.name && c.name.includes('2027'));
        } else {
            return c.year !== '2027' && (!c.created_at || c.created_at < '2027-01-01') && (!c.name || !c.name.includes('2027'));
        }
    };

    const fetchClassrooms = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('classrooms')
                .select('*')
                .order('name');

            if (error) throw error;

            if (data) {
                const yearClassrooms = data.filter(isClassOfSelectedYear);
                const mapped: Classroom[] = yearClassrooms.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    year: c.year,
                    shift: c.shift as Shift,
                    teacherId: c.teacher_id,
                    studentIds: [],
                    schedule: []
                }));
                setClassrooms(mapped);
            }
        } catch (err: any) {
            console.error('Error fetching classrooms:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassrooms();
    }, [selectedYear]);

    return { classrooms, loading, error, refetch: fetchClassrooms };
};
