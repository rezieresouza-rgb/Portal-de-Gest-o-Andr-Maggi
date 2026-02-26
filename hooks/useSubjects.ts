import { useState, useEffect } from 'react';
import { SCHOOL_SUBJECTS } from '../constants/initialData';

export const useSubjects = () => {
    const [subjects, setSubjects] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Por enquanto, usamos a lista estática, mas o hook permite migrar para o banco facilmente
        setSubjects(SCHOOL_SUBJECTS);
        setLoading(false);
    }, []);

    return { subjects, loading };
};
