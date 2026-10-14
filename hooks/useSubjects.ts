import { useState, useEffect } from 'react';
import { SCHOOL_SUBJECTS } from '../constants/initialData';

export const useSubjects = () => {
    const [subjects, setSubjects] = useState<string[]>(SCHOOL_SUBJECTS);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Por enquanto, usamos a lista estática, mas o hook permite migrar para o banco facilmente
        if (!SCHOOL_SUBJECTS.includes('AVALIAÇÃO')) {
            setSubjects([...SCHOOL_SUBJECTS, 'AVALIAÇÃO']);
        } else {
            setSubjects(SCHOOL_SUBJECTS);
        }
        setLoading(false);
    }, []);

    return { subjects, loading };
};
