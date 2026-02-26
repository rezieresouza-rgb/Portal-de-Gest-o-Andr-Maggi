import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Classroom, Shift } from '../types';

export const useClassrooms = () => {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClassrooms = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('classrooms')
                .select('*')
                .order('name');

            if (error) throw error;

            if (data) {
                const mapped: Classroom[] = data.map((c: any) => ({
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
    }, []);

    return { classrooms, loading, error, refetch: fetchClassrooms };
};
