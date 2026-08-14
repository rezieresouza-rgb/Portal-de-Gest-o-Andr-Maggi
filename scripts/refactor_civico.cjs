const fs = require('fs');

const path = 'c:/Users/rezie/Downloads/portal-de-gestão-andré-maggi/modules/CivicoMilitarModule.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace the loading useEffect with Supabase load logic
const oldLoadUseEffect = `  useEffect(() => {
    // A. Inspections
    try {
      const savedInspections = localStorage.getItem('civico_militar_inspections_v2');
      if (savedInspections) {
        setInspections(JSON.parse(savedInspections));
      } else {
        localStorage.setItem('civico_militar_inspections_v2', JSON.stringify([]));
        setInspections([]);
      }
    } catch (e) {
      console.error(e);
    }

    // B. Civic Routines
    try {
      const savedRoutines = localStorage.getItem('civico_militar_routines_v2');
      if (savedRoutines) {
        setRoutines(JSON.parse(savedRoutines));
      } else {
        localStorage.setItem('civico_militar_routines_v2', JSON.stringify([]));
        setRoutines([]);
      }
    } catch (e) {
      console.error(e);
    }

    // D. Document History
    try {
      let currentDocs: any[] = [];
      const savedDocs = localStorage.getItem('civico_militar_documentos_v2');
      if (savedDocs) {
        currentDocs = JSON.parse(savedDocs);
      }
      
      // Migrate v1 docs to v2
      const oldDocs = localStorage.getItem('civico_militar_documentos_v1');
      if (oldDocs) {
        const oldParsed = JSON.parse(oldDocs);
        const newOnes = oldParsed.filter((oldDoc: any) => !currentDocs.some((d: any) => d.id === oldDoc.id));
        if (newOnes.length > 0) {
          currentDocs = [...newOnes, ...currentDocs].sort((a, b) => b.timestamp - a.timestamp);
          localStorage.setItem('civico_militar_documentos_v2', JSON.stringify(currentDocs));
        }
        localStorage.removeItem('civico_militar_documentos_v1');
      }

      setDocHistory(currentDocs);
    } catch (e) {
      console.error(e);
    }
  }, []);`;

const newLoadUseEffect = `  // Fetch data from Supabase on mount
  useEffect(() => {
    const loadFromSupabase = async () => {
      try {
        // Load Inspections
        const { data: inspData } = await supabase.from('civic_inspections').select('*');
        if (inspData) {
          setInspections(inspData.map((i: any) => ({
            id: i.id,
            studentId: i.student_id,
            studentName: i.student_name,
            className: i.class_name,
            item: i.item,
            date: i.date,
            shift: i.shift,
            observations: i.observations,
            responsible: i.responsible
          })));
        }

        // Load Routines
        const { data: routData } = await supabase.from('civic_routines').select('*');
        if (routData) {
          setRoutines(routData.map((r: any) => ({
            id: r.id,
            date: r.date,
            shift: r.shift,
            formationOk: r.formation_ok,
            commandersPresent: r.commanders_present,
            flagsRaised: r.flags_raised,
            anthemsSung: r.anthems_sung,
            marchingOk: r.marching_ok,
            bulletinRead: r.bulletin_read,
            responsible: r.responsible
          })));
        }

        // Load Documents
        const { data: docData } = await supabase.from('civic_documents').select('*');
        if (docData) {
          setDocHistory(docData.map((d: any) => ({
            id: d.id,
            template: d.template,
            date: d.date,
            timestamp: d.timestamp,
            studentName: d.student_name,
            studentClass: d.student_class,
            ...d.content
          })).sort((a, b) => b.timestamp - a.timestamp));
        }
      } catch (err) {
        console.error('Error loading civic data:', err);
      }
    };
    loadFromSupabase();
  }, []);`;

content = content.replace(oldLoadUseEffect, newLoadUseEffect);

// 2. Replace sync for studentStates (load)
const oldSyncStudentStates = `  // Sync studentStates automatically whenever dbStudents is loaded/updated from Supabase
  useEffect(() => {
    if (!dbStudents || dbStudents.length === 0) return;

    try {
      const savedScores = localStorage.getItem('civico_militar_student_scores_v3');
      let saved: StudentBehaviorState[] = [];
      if (savedScores) {
        try {
          saved = JSON.parse(savedScores);
        } catch (e) {}
      }

      // Merge dbStudents with saved scores or create default 8.0 score state
      const updatedStates: StudentBehaviorState[] = dbStudents.map(dbS => {
        const existing = saved.find(s => String(s.studentId) === String(dbS.CodigoAluno));
        if (existing) {
          return {
            ...existing,
            studentName: dbS.Nome,
            className: dbS.Turma // Always keep current class in sync with Supabase
          };
        }
        return {
          studentId: dbS.CodigoAluno,
          studentName: dbS.Nome,
          className: dbS.Turma,
          score: 8.0,
          isClassLeader: false,
          isCivicHighlight: false,
          occurrences: []
        };
      });

      setStudentStates(updatedStates);
      localStorage.setItem('civico_militar_student_scores_v3', JSON.stringify(updatedStates));
    } catch (e) {
      console.error("Error syncing student states:", e);
    }
  }, [dbStudents]);`;

const newSyncStudentStates = `  // Sync studentStates automatically whenever dbStudents is loaded/updated from Supabase
  useEffect(() => {
    if (!dbStudents || dbStudents.length === 0) return;

    const loadStudentData = async () => {
      try {
        const { data: behaviors } = await supabase.from('civic_student_behavior').select('*');
        const { data: occurrences } = await supabase.from('civic_occurrences').select('*');

        const saved: StudentBehaviorState[] = (behaviors || []).map((b: any) => ({
          studentId: b.student_id,
          studentName: b.student_name,
          className: b.class_name,
          score: parseFloat(b.score),
          isClassLeader: b.is_class_leader,
          isCivicHighlight: b.is_civic_highlight,
          occurrences: (occurrences || []).filter((o: any) => o.student_id === b.student_id).map((o: any) => ({
            id: o.id,
            type: o.type,
            category: o.category,
            categories: o.categories,
            points: parseFloat(o.points),
            date: o.date,
            observations: o.observations,
            responsible: o.responsible,
            disciplinaryMeasure: o.disciplinary_measure,
            suspensionDays: o.suspension_days,
            isEscalated: o.is_escalated
          }))
        }));

        const updatedStates: StudentBehaviorState[] = dbStudents.map(dbS => {
          const existing = saved.find(s => String(s.studentId) === String(dbS.CodigoAluno));
          if (existing) {
            return {
              ...existing,
              studentName: dbS.Nome,
              className: dbS.Turma
            };
          }
          return {
            studentId: dbS.CodigoAluno,
            studentName: dbS.Nome,
            className: dbS.Turma,
            score: 8.0,
            isClassLeader: false,
            isCivicHighlight: false,
            occurrences: []
          };
        });

        setStudentStates(updatedStates);
      } catch (e) {
        console.error("Error syncing student states from DB:", e);
      }
    };
    loadStudentData();
  }, [dbStudents]);`;

content = content.replace(oldSyncStudentStates, newSyncStudentStates);

// 3. Replace save functions
const oldSaveFunctions = `  // Sync state to local storage when state changes
  const saveInspectionsToStorage = (list: InspectionRecord[]) => {
    localStorage.setItem('civico_militar_inspections_v2', JSON.stringify(list));
    setInspections(list);
  };

  const saveRoutinesToStorage = (list: CivicRoutineRecord[]) => {
    localStorage.setItem('civico_militar_routines_v2', JSON.stringify(list));
    setRoutines(list);
  };

  const saveStudentStatesToStorage = (list: StudentBehaviorState[]) => {
    localStorage.setItem('civico_militar_student_scores_v3', JSON.stringify(list));
    setStudentStates(list);
    // If a modal is open for a student, update its local copy as well
    if (selectedStudentState) {
      const updated = list.find(s => s.studentId === selectedStudentState.studentId);
      if (updated) setSelectedStudentState(updated);
    }
  };

  const saveDocHistoryToStorage = (list: any[]) => {
    localStorage.setItem('civico_militar_documentos_v2', JSON.stringify(list));
    setDocHistory(list);
  };`;

const newSaveFunctions = `  // Sync state to Supabase when state changes
  const saveInspectionsToStorage = async (list: InspectionRecord[]) => {
    setInspections(list);
    try {
      const payload = list.map(i => ({
        id: i.id,
        student_id: i.studentId,
        student_name: i.studentName,
        class_name: i.className,
        item: i.item,
        date: i.date,
        shift: i.shift,
        observations: i.observations,
        responsible: i.responsible
      }));
      if (payload.length > 0) {
        await supabase.from('civic_inspections').upsert(payload, { onConflict: 'id' });
      }
    } catch(e) { console.error(e); }
  };

  const saveRoutinesToStorage = async (list: CivicRoutineRecord[]) => {
    setRoutines(list);
    try {
      const payload = list.map(r => ({
        id: r.id,
        date: r.date,
        shift: r.shift,
        formation_ok: r.formationOk,
        commanders_present: r.commandersPresent,
        flags_raised: r.flagsRaised,
        anthems_sung: r.anthemsSung,
        marching_ok: r.marchingOk,
        bulletin_read: r.bulletinRead,
        responsible: r.responsible
      }));
      if (payload.length > 0) {
        await supabase.from('civic_routines').upsert(payload, { onConflict: 'id' });
      }
    } catch(e) { console.error(e); }
  };

  const saveStudentStatesToStorage = async (list: StudentBehaviorState[]) => {
    setStudentStates(list);
    if (selectedStudentState) {
      const updated = list.find(s => s.studentId === selectedStudentState.studentId);
      if (updated) setSelectedStudentState(updated);
    }
    
    try {
      // Upsert behaviors
      const behaviorsPayload = list.map(b => ({
        student_id: b.studentId,
        student_name: b.studentName,
        class_name: b.className,
        score: b.score,
        is_class_leader: b.isClassLeader,
        is_civic_highlight: b.isCivicHighlight
      }));
      if (behaviorsPayload.length > 0) {
        await supabase.from('civic_student_behavior').upsert(behaviorsPayload, { onConflict: 'student_id' });
      }

      // Upsert occurrences
      let occsPayload: any[] = [];
      list.forEach(b => {
        b.occurrences.forEach(o => {
          occsPayload.push({
            id: o.id,
            student_id: b.studentId,
            type: o.type,
            category: o.category,
            categories: o.categories,
            points: o.points,
            date: o.date,
            observations: o.observations,
            responsible: o.responsible,
            disciplinary_measure: o.disciplinaryMeasure,
            suspension_days: o.suspensionDays,
            is_escalated: o.isEscalated
          });
        });
      });
      if (occsPayload.length > 0) {
        await supabase.from('civic_occurrences').upsert(occsPayload, { onConflict: 'id' });
      }
    } catch(e) { console.error(e); }
  };

  const saveDocHistoryToStorage = async (list: any[]) => {
    setDocHistory(list);
    try {
      const payload = list.map(d => {
        const { id, template, date, timestamp, studentName, studentClass, ...rest } = d;
        return {
          id: d.id,
          template: d.template,
          date: d.date,
          timestamp: d.timestamp,
          student_name: d.studentName,
          student_class: d.studentClass,
          content: rest
        };
      });
      if (payload.length > 0) {
        await supabase.from('civic_documents').upsert(payload, { onConflict: 'id' });
      }
    } catch(e) { console.error(e); }
  };

  const handleSyncLocalToCloud = async () => {
    if(!window.confirm('Tem certeza? Isso fará com que os dados atuais salvos no seu computador (se houver) sejam enviados para o banco de dados na nuvem.')) return;
    try {
      const localInspections = JSON.parse(localStorage.getItem('civico_militar_inspections_v2') || '[]');
      if(localInspections.length > 0) await saveInspectionsToStorage(localInspections);

      const localRoutines = JSON.parse(localStorage.getItem('civico_militar_routines_v2') || '[]');
      if(localRoutines.length > 0) await saveRoutinesToStorage(localRoutines);

      const localDocs = JSON.parse(localStorage.getItem('civico_militar_documentos_v2') || '[]');
      if(localDocs.length > 0) await saveDocHistoryToStorage(localDocs);

      const localScores = JSON.parse(localStorage.getItem('civico_militar_student_scores_v3') || '[]');
      if(localScores.length > 0) await saveStudentStatesToStorage(localScores);

      alert('Dados locais sincronizados para a nuvem com sucesso!');
      window.location.reload();
    } catch(e) {
      alert('Erro ao sincronizar: ' + String(e));
    }
  };
`;

content = content.replace(oldSaveFunctions, newSaveFunctions);

// Add the sync button to the Dashboard tab UI
const dashboardHeaderTarget = `<h3 className="text-xl font-bold text-gray-800">Visão Geral</h3>`;
const dashboardHeaderReplacement = `<div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-gray-800">Visão Geral</h3>
            <button onClick={handleSyncLocalToCloud} className="text-xs flex items-center gap-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-full transition-colors no-print" title="Sincronizar dados gravados localmente (computador atual) para o banco de dados na nuvem">
              <RefreshCw size={12} />
              Migrar Dados Locais
            </button>
          </div>`;

content = content.replace(dashboardHeaderTarget, dashboardHeaderReplacement);

// Import RefreshCw if it doesn't exist (it already exists in lucide-react imports)

fs.writeFileSync(path, content, 'utf8');
console.log('CivicoMilitarModule.tsx refactored successfully.');
