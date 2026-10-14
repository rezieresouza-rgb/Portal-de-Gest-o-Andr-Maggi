import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { StaffMember, UserRole, Shift } from '../types';

const COORDINATION_STAFF: StaffMember = {
    id: 'coordenacao',
    code: 'COORD',
    registration: 'COORD',
    name: 'COORDENAÇÃO',
    role: 'COORDENADOR' as UserRole,
    cpf: '',
    birthDate: '',
    entryProfile: 'EFETIVO',
    qualification: 'Ensino Superior',
    serverType: 'EFETIVO' as any,
    jobFunction: 'Coordenação Pedagógica',
    shift: 'MATUTINO' as Shift,
    email: '',
    status: 'EM_ATIVIDADE' as any,
    workload: '40H',
    assignedSubjects: [],
    contractTerm: '',
    movementHistory: []
};

export const useStaff = () => {
    const [staff, setStaff] = useState<StaffMember[]>([COORDINATION_STAFF]);
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

                const hasCoordination = mappedStaff.some(
                    s => s.name?.trim().toUpperCase() === 'COORDENAÇÃO' || s.name?.trim().toUpperCase() === 'COORDENACAO'
                );

                if (!hasCoordination) {
                    mappedStaff.push(COORDINATION_STAFF);
                }

                mappedStaff.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
                setStaff(mappedStaff);
            }
        } catch (err: any) {
            console.error('Error fetching staff:', err);
            setError(err.message);
            setStaff(prev => (prev.length > 0 ? prev : [COORDINATION_STAFF]));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    return { staff, loading, error, refetch: fetchStaff };
};
