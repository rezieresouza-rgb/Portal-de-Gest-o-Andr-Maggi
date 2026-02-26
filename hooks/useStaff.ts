import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { StaffMember, UserRole, Shift } from '../types';

export const useStaff = () => {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('staff')
                .select('*')
                .eq('status', 'EM_ATIVIDADE')
                .order('name');

            if (error) throw error;

            if (data) {
                const mappedStaff: StaffMember[] = data.map((s: any) => ({
                    id: s.id,
                    code: s.code,
                    registration: s.registration,
                    name: s.name,
                    role: s.role as UserRole,
                    cpf: s.cpf,
                    birthDate: s.birth_date,
                    entryProfile: s.entry_profile,
                    qualification: s.qualification,
                    serverType: s.server_type as any,
                    jobFunction: s.job_function,
                    shift: s.shift as Shift,
                    email: s.email,
                    status: s.status as any,
                    workload: s.workload,
                    assignedSubjects: s.assigned_subjects,
                    contractTerm: s.contract_term,
                    additionalWorkloadHours: s.additional_workload_hours,
                    additionalWorkloadTerm: s.additional_workload_term,
                    notifyAlerts: s.notify_alerts,
                    photoUrl: s.photo_url,
                    movementHistory: []
                }));
                setStaff(mappedStaff);
            }
        } catch (err: any) {
            console.error('Error fetching staff:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    return { staff, loading, error, refetch: fetchStaff };
};
