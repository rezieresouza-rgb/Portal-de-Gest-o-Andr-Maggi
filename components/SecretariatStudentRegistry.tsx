
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Plus,
  X,
  User,
  Calendar,
  MapPin,
  Phone,
  History,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Users,
  FileUp,
  Sparkles,
  Loader2,
  Table,
  Download,
  RefreshCw,
  UserPlus,
  Pencil, // Added Pencil icon
  Clock // Added Clock icon for history
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { extractDetailedStudentList, consolidateStudentData } from '../geminiService';
import { StudentMovement } from '../types';

/* 
 * MÓDULO MIGRO PARA SUPABASE 
 * (Substitui LocalStorage e MockData)
 */

// Tipagem interna temporária para compatibilidade com o layout existente
interface DetailedStudent {
  id?: string; // UUID do Supabase
  Nome: string;
  Turma: string;
  Turno: string;
  Sequencia: string;
  CodigoAluno: string;
  DataMatricula: string;
  DataNascimento: string;
  PAED: string;
  TransporteEscolar: string;
  NomeResponsavel: string;
  TelefoneContato: string;
}

const SecretariatStudentRegistry: React.FC = () => {
  const [students, setStudents] = useState<DetailedStudent[]>([]);
  const [availableClassrooms, setAvailableClassrooms] = useState<string[]>([]); // Lista de turmas para o dropdown
  const [isLoading, setIsLoading] = useState(true);

  // Carregar alunos do Supabase
  const fetchClassrooms = async () => {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('name')
        .order('name');

      if (error) throw error;

      if (data) {
        setAvailableClassrooms(data.map((c: any) => c.name));
      }
    } catch (error) {
      console.error("Erro ao buscar turmas:", error);
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          enrollments (
            classrooms (name, shift)
          )
        `);

      if (error) throw error;

      if (data) {
        // Mapear estrutura do banco para estrutura da UI
        // Supomos que cada aluno tem 1 matrícula ativa principal para simplificar
        const mappedStudents: DetailedStudent[] = data.map((s: any) => {
          const classroom = s.enrollments?.[0]?.classrooms;
          return {
            id: s.id,
            Nome: s.name,
            CodigoAluno: s.registration_number,
            DataNascimento: s.birth_date,
            Turma: classroom?.name || 'SEM TURMA',
            Turno: classroom?.shift || '---',
            Sequencia: '', // Será calculado no frontend
            DataMatricula: s.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            PAED: s.paed ? 'Sim' : 'Não',
            TransporteEscolar: s.school_transport ? 'Sim' : 'Não',
            NomeResponsavel: s.guardian_name || '',
            TelefoneContato: s.contact_phone || ''
          };
        });
        setStudents(mappedStudents);
      }
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
      alert("Erro ao carregar lista de alunos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClassrooms();
  }, []);

  const [isImporting, setIsImporting] = useState(false);
  const [isMultiImporting, setIsMultiImporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // EDIT STATE
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // BULK ACTIONS STATE
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false);
  const [bulkTargetClass, setBulkTargetClass] = useState('');

  // MOVEMENT STATE
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedStudentForMovement, setSelectedStudentForMovement] = useState<DetailedStudent | null>(null);
  const [movements, setMovements] = useState<StudentMovement[]>([]);
  const [newMovement, setNewMovement] = useState<{ type: string; description: string; date: string }>({
    type: 'TRANSFERENCIA',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchMovements = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_movements')
        .select('*')
        .eq('student_id', studentId)
        .order('movement_date', { ascending: false });

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    }
  };

  const openMovementModal = (student: DetailedStudent) => {
    setSelectedStudentForMovement(student);
    setIsMovementModalOpen(true);
    setNewMovement({
      type: 'TRANSFERENCIA',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setMovements([]); // Clear previous
    if (student.id) {
      fetchMovements(student.id);
    }
  };

  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForMovement?.id) return;

    try {
      const { error } = await supabase
        .from('student_movements')
        .insert([{
          student_id: selectedStudentForMovement.id,
          movement_type: newMovement.type,
          description: newMovement.description.toUpperCase(),
          movement_date: newMovement.date
        }]);

      if (error) throw error;

      alert("Movimentação registrada com sucesso!");
      fetchMovements(selectedStudentForMovement.id); // Refresh list
      setNewMovement({ ...newMovement, description: '' }); // Clear description
    } catch (error: any) {
      console.error("Erro ao registrar movimentação:", error);
      alert("Erro ao registrar: " + error.message);
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id!).filter(Boolean));
    }
  };

  const toggleSelectStudent = (id: string) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(prev => prev.filter(sId => sId !== id));
    } else {
      setSelectedStudents(prev => [...prev, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return;

    if (window.confirm(`ATENÇÃO: Você está prestes a excluir ${selectedStudents.length} alunos.\n\nEsta ação é irreversível e excluirá todo o histórico destes alunos.\n\nDeseja continuar?`)) {
      try {
        setIsLoading(true);
        const { error } = await supabase
          .from('students')
          .delete()
          .in('id', selectedStudents);

        if (error) throw error;

        alert("Alunos excluídos com sucesso!");
        setSelectedStudents([]);
        fetchStudents();
      } catch (error: any) {
        console.error("Erro deletar em massa:", error);
        alert("Erro ao excluir alunos: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const executeBulkMove = async () => {
    if (!bulkTargetClass) {
      alert("Por favor, selecione uma turma de destino.");
      return;
    }

    try {
      setIsLoading(true);

      // 1. Get Target Classroom ID
      const { data: classroom, error: classError } = await supabase
        .from('classrooms')
        .select('id')
        .eq('name', bulkTargetClass)
        .single();

      if (classError || !classroom) throw new Error("Turma de destino não encontrada.");

      // 2. Process each student
      let successCount = 0;

      // Using Promise.all for better performance, but ensuring one failure doesn't stop all is tricky with simple storage 
      // doing serial for safer error handling or map with individual catch
      await Promise.all(selectedStudents.map(async (studentId) => {
        try {
          // Check active enrollment
          const { data: currentEnrollment } = await supabase
            .from('enrollments')
            .select('id, classroom_id')
            .eq('student_id', studentId)
            .is('end_date', null)
            .maybeSingle();

          if (currentEnrollment) {
            if (currentEnrollment.classroom_id !== classroom.id) {
              await supabase
                .from('enrollments')
                .update({ classroom_id: classroom.id })
                .eq('id', currentEnrollment.id);
            }
          } else {
            await supabase.from('enrollments').insert([{
              student_id: studentId,
              classroom_id: classroom.id,
              enrollment_date: new Date().toISOString().split('T')[0]
            }]);
          }
          successCount++;
        } catch (err) {
          console.error(`Falha ao mover aluno ${studentId}`, err);
        }
      }));

      alert(`${successCount} alunos movidos para a turma ${bulkTargetClass} com sucesso!`);
      setIsBulkMoveModalOpen(false);
      setBulkTargetClass('');
      setSelectedStudents([]);
      fetchStudents();

    } catch (error: any) {
      console.error("Erro bulk move:", error);
      alert("Erro ao mover alunos: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState: DetailedStudent = {
    Nome: '',
    Turma: '', // Default to empty to force selection or use placeholder
    Turno: 'MATUTINO',
    Sequencia: '',
    CodigoAluno: '',
    DataMatricula: new Date().toISOString().split('T')[0],
    DataNascimento: '',
    PAED: 'Não',
    TransporteEscolar: 'Não',
    NomeResponsavel: '',
    TelefoneContato: ''
  };

  const [form, setForm] = useState<DetailedStudent>(initialFormState);

  // Função utilitária para formatar data sem sofrer com fuso horário (Timezone-safe)
  const formatDateSafe = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return '---';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const startEditing = (student: DetailedStudent) => {
    setForm({
      ...student,
      // Ensure dropdowns match exact values
      PAED: student.PAED === 'Sim' ? 'Sim' : 'Não',
      TransporteEscolar: student.TransporteEscolar === 'Sim' ? 'Sim' : 'Não'
    });
    setIsEditing(true);
    setEditingId(student.id || null);
    setIsModalOpen(true);
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && editingId) {
        // --- UPDATE LOGIC ---

        // 1. Update Student Basic Info
        const { error: updateError } = await supabase
          .from('students')
          .update({
            name: form.Nome,
            registration_number: form.CodigoAluno,
            birth_date: form.DataNascimento,
            paed: form.PAED === 'Sim',
            school_transport: form.TransporteEscolar === 'Sim',
            guardian_name: form.NomeResponsavel?.toUpperCase(),
            contact_phone: form.TelefoneContato
          })
          .eq('id', editingId);

        if (updateError) throw updateError;

        // 2. Handle Classroom Change (Enrollment)
        const { data: newClassroom, error: classError } = await supabase
          .from('classrooms')
          .select('id')
          .eq('name', form.Turma)
          .single();

        if (newClassroom) {
          // Find current active enrollment
          const { data: currentEnrollment } = await supabase
            .from('enrollments')
            .select('id, classroom_id')
            .eq('student_id', editingId)
            .is('end_date', null)
            .maybeSingle();

          if (currentEnrollment) {
            if (currentEnrollment.classroom_id !== newClassroom.id) {
              // Class changed: Update enrollment
              await supabase
                .from('enrollments')
                .update({ classroom_id: newClassroom.id })
                .eq('id', currentEnrollment.id);
            }
          } else {
            // No active enrollment, create one
            await supabase.from('enrollments').insert([{
              student_id: editingId,
              classroom_id: newClassroom.id,
              enrollment_date: new Date().toISOString().split('T')[0]
            }]);
          }
        } else {
          console.warn("Turma não encontrada ao editar, enturmação não alterada.");
        }

        alert("Aluno atualizado com sucesso!");

      } else {
        // --- CREATE LOGIC ---

        // 1. Criar o Aluno
        const { data: newStudent, error: studentError } = await supabase
          .from('students')
          .insert([{
            name: form.Nome,
            registration_number: form.CodigoAluno,
            birth_date: form.DataNascimento,
            paed: form.PAED === 'Sim',
            school_transport: form.TransporteEscolar === 'Sim',
            guardian_name: form.NomeResponsavel?.toUpperCase(),
            contact_phone: form.TelefoneContato
          }])
          .select()
          .single();

        if (studentError) throw studentError;

        // 2. Buscar Turma pelo Nome (Ex: 6º ANO A)
        const { data: classroom, error: classError } = await supabase
          .from('classrooms')
          .select('id')
          .eq('name', form.Turma)
          .single();

        if (classroom) {
          // 3. Criar Matrícula (Vínculo)
          await supabase.from('enrollments').insert([{
            student_id: newStudent.id,
            classroom_id: classroom.id,
            enrollment_date: form.DataMatricula
          }]);
        } else {
          alert("Atenção: A turma especificada não foi encontrada no banco. O aluno foi cadastrado mas não foi enturmado.");
        }
        alert("Aluno cadastrado com sucesso!");
      }

      await fetchStudents(); // Recarrega a lista
      closeModal(); // Reset and close

    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      if (error.code === '23505') {
        alert("Erro: Este número de matrícula já está em uso por outro aluno. Por favor, verifique o código ou gere um novo.");
      } else {
        alert("Erro ao salvar aluno: " + (error.message || "Erro desconhecido"));
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setForm(initialFormState);
  };

  const generateNewCode = async () => {
    // Generate a simple unique code based on timestamp + random
    // Format: YYYYMM-XXXX
    const now = new Date();
    const prefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setForm(prev => ({ ...prev, CodigoAluno: `${prefix}-${random}` }));
  };

  const forceSync = () => {
    alert("Sincronização desativada na versão Database (Dados vêm direto do servidor).");
  };

  // Lógica de cálculo sequencial
  const studentsWithSequence = useMemo(() => {
    // 1. Agrupar alunos por turma
    const studentsByClass: Record<string, DetailedStudent[]> = {};

    students.forEach(student => {
      const className = student.Turma || 'SEM TURMA';
      if (!studentsByClass[className]) {
        studentsByClass[className] = [];
      }
      studentsByClass[className].push(student);
    });

    // 2. Ordenar e atribuir sequência dentro de cada turma
    let allStudentsWithSeq: DetailedStudent[] = [];

    Object.keys(studentsByClass).forEach(className => {
      // Ordenar alfabeticamente
      studentsByClass[className].sort((a, b) => a.Nome.localeCompare(b.Nome));

      // Atribuir sequência
      studentsByClass[className].forEach((student, index) => {
        allStudentsWithSeq.push({
          ...student,
          Sequencia: (index + 1).toString().padStart(2, '0') // 01, 02, 03...
        });
      });
    });

    return allStudentsWithSeq;
  }, [students]);

  const filteredStudents = useMemo(() => {
    return studentsWithSequence.filter(s =>
      s.Nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.CodigoAluno.includes(searchTerm) ||
      s.Turma.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.Turma.localeCompare(b.Turma) || a.Nome.localeCompare(b.Nome));
  }, [studentsWithSequence, searchTerm]);

  // Importação PDF com Integração Gemini e Supabase
  const handleImportPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione um arquivo PDF válido.');
      return;
    }

    setIsImporting(true);
    try {
      // 1. Converter PDF para Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Data = reader.result?.toString().split(',')[1];
        if (!base64Data) {
          throw new Error("Falha ao ler o arquivo.");
        }

        // 2. Chamar Serviço Gemini
        const data = await extractDetailedStudentList(base64Data, "application/pdf");

        if (!data.Alunos || data.Alunos.length === 0) {
          alert("Nenhum aluno encontrado ou erro na leitura do PDF.");
          setIsImporting(false);
          return;
        }

        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        // Função auxiliar para converter e VALIDAR datas
        const toISODate = (dateStr: string): string | null => {
          if (!dateStr) return null;

          let cleanStr = dateStr.trim();
          let year, month, day;

          // 1. Tentar detectar formato YYYY-MM-DD ou YYYY/MM/DD
          if (/^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(cleanStr)) {
            [year, month, day] = cleanStr.split(/[\/-]/);
          }
          // 2. Tentar detectar formato DD/MM/YYYY ou DD-MM-YYYY
          else if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(cleanStr)) {
            [day, month, year] = cleanStr.split(/[\/-]/);
          } else {
            return null;
          }

          // Padronizar
          const y = parseInt(year);
          const m = parseInt(month);
          const d = parseInt(day);

          // 3. Validação Lógica de Data (ex: não permitir 31/02)
          const dateObj = new Date(y, m - 1, d);
          if (
            dateObj.getFullYear() === y &&
            dateObj.getMonth() === m - 1 &&
            dateObj.getDate() === d
          ) {
            return dateObj.toISOString().split('T')[0];
          }

          return null;
        };

        // 3. Iterar e Salvar no Supabase
        for (const student of data.Alunos) {
          try {
            // Conversão robusta de data
            const birthDate = toISODate(student.DataNascimento);

            if (!birthDate) {
              console.warn(`Data inválida para o aluno ${student.Nome}: ${student.DataNascimento}`);
              errors.push(`${student.Nome}: Data de nascimento inválida/não reconhecida (${student.DataNascimento})`);
              failCount++;
              continue;
            }

            // Inserir Aluno
            // REMOVIDO: paed e school_transport pois não existem no schema atual
            const { data: newStudent, error: studentError } = await supabase
              .from('students')
              .upsert([{
                name: student.Nome,
                registration_number: student.CodigoAluno,
                birth_date: birthDate
              }], { onConflict: 'registration_number' })
              .select()
              .single();

            if (studentError) {
              console.error(`Erro ao salvar aluno ${student.Nome}:`, studentError);
              errors.push(`${student.Nome}: ${studentError.message}`);
              failCount++;
              continue;
            }

            // Buscar Turma
            // Tentativa de match exato ou parcial se necessário
            const { data: classroom, error: classError } = await supabase
              .from('classrooms')
              .select('id')
              .ilike('name', `%${student.Turma}%`) // Tenta achar turma que contenha o nome extraído
              .limit(1)
              .maybeSingle();

            if (classroom) {
              // Verificar se já existe matrícula ativa para evitar duplicidade
              const { data: existingEnrollment } = await supabase
                .from('enrollments')
                .select('id')
                .eq('student_id', newStudent.id)
                .is('end_date', null) // Apenas matrículas ativas
                .maybeSingle();

              if (!existingEnrollment) {
                await supabase.from('enrollments').insert([{
                  student_id: newStudent.id,
                  classroom_id: classroom.id,
                  enrollment_date: new Date().toISOString().split('T')[0]
                }]);
              }
            }

            successCount++;

          } catch (innerError: any) {
            console.error("Erro no processamento individual:", innerError);
            errors.push(`${student.Nome}: ${innerError.message}`);
            failCount++;
          }
        }

        await fetchStudents();
        let msg = `Importação concluída!\nSucessos: ${successCount}\nFalhas: ${failCount}`;
        if (errors.length > 0) {
          msg += `\n\nErros:\n${errors.slice(0, 5).join('\n')}`;
        }
        alert(msg);
      };

      reader.onerror = () => {
        throw new Error("Erro na leitura do arquivo.");
      };

    } catch (error: any) {
      console.error("Erro na importação:", error);
      alert("Erro crítico na importação: " + (error.message || "Verifique o console."));
    } finally {
      setIsImporting(false);
      // Limpar o input para permitir selecionar o mesmo arquivo novamente se necessário
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length < 2) {
      alert('Por favor, selecione pelo menos 2 arquivos para consolidar/mesclar (PDF, CSV, Imagens).');
      return;
    }

    setIsMultiImporting(true);
    try {
      const filePromises = Array.from(files).map((file: any) => {
        return new Promise<{ base64: string; mimeType: string; name: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result?.toString().split(',')[1];
            if (base64) resolve({ base64, mimeType: file.type, name: file.name });
            else reject(new Error(`Falha ao ler ${file.name}`));
          };
          reader.onerror = () => reject(new Error(`Erro ao ler ${file.name}`));
          reader.readAsDataURL(file);
        });
      });

      const processedFiles = await Promise.all(filePromises);
      const result = await consolidateStudentData(processedFiles);

      if (!result.consolidatedStudents || result.consolidatedStudents.length === 0) {
        alert("Nenhum aluno identificado na consolidação. Tente novamente com arquivos mais legíveis.");
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const student of result.consolidatedStudents) {
        try {
          // Cadastro direto
          const { data: newStudent, error: studentError } = await supabase
            .from('students')
            .upsert([{
              name: student.Nome,
              registration_number: student.CodigoAluno || `GEN-${Math.floor(Math.random() * 100000)}`, // Fallback se não tiver matrícula
              birth_date: student.DataNascimento,
              paed: student.PAED === 'Sim',
              school_transport: student.TransporteEscolar === 'Sim',
              guardian_name: student.NomeResponsavel,
              contact_phone: student.TelefoneContato
            }], { onConflict: 'registration_number' })
            .select()
            .single();

          if (studentError) throw studentError;

          // Vínculo Turma
          const { data: classroom } = await supabase
            .from('classrooms')
            .select('id')
            .ilike('name', `%${student.Turma}%`)
            .maybeSingle();

          if (classroom) {
            const { data: existingEnrollment } = await supabase
              .from('enrollments')
              .select('id')
              .eq('student_id', newStudent.id)
              .is('end_date', null)
              .maybeSingle();

            if (!existingEnrollment) {
              await supabase.from('enrollments').insert([{
                student_id: newStudent.id,
                classroom_id: classroom.id,
                enrollment_date: new Date().toISOString().split('T')[0]
              }]);
            }
          }
          successCount++;
        } catch (err) {
          console.error(`Erro ao salvar consolidado ${student.Nome}`, err);
          failCount++;
        }
      }

      await fetchStudents();
      alert(`Consolidação Finalizada!\nResumo IA: ${result.summary}\n\nSucessos: ${successCount}\nFalhas: ${failCount}`);

    } catch (error: any) {
      console.error("Erro multi-import", error);
      alert("Erro crítico na consolidação: " + error.message);
    } finally {
      setIsMultiImporting(false);
      if (multiFileInputRef.current) multiFileInputRef.current.value = '';
    }
  };

  const deleteStudent = async (code: string) => {
    if (window.confirm("Remover este aluno e seus dados permanentemente?")) {
      try {
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('registration_number', code);

        if (error) throw error;
        await fetchStudents();
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir aluno.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl">
            <GraduationCap size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Base de Dados de Alunos</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Sincronizada com Merenda e Financeiro</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input
              type="text"
              placeholder="Buscar aluno, turma ou código..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 transition-all"
              title="Cadastrar Manualmente"
            >
              <UserPlus size={20} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-6 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-black transition-all"
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
              Importar PDF
            </button>
            <button
              onClick={() => multiFileInputRef.current?.click()}
              disabled={isImporting || isMultiImporting}
              className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-700 transition-all"
            >
              {isMultiImporting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Mesclar 3+ Planilhas (IA)
            </button>
            <button
              onClick={forceSync}
              className="p-4 bg-amber-50 text-amber-600 rounded-2xl shadow-sm hover:bg-amber-100 transition-all"
              title="Restaurar Dados Faltantes"
            >
              <RefreshCw size={20} />
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImportPDF} className="hidden" accept=".pdf" />
          <input type="file" ref={multiFileInputRef} onChange={handleMultiFileUpload} className="hidden" multiple accept=".pdf,.csv,.xlsx,.xls,.jpg,.jpeg,.png" />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden relative">
        {/* Bulk Action Toolbar */}
        {selectedStudents.length > 0 && (
          <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white p-4 z-10 flex justify-between items-center animate-in slide-in-from-top-full duration-300">
            <div className="flex items-center gap-4 px-4">
              <span className="font-black text-sm uppercase">{selectedStudents.length} Alunos Selecionados</span>
            </div>
            <div className="flex gap-3 px-4">
              <button
                onClick={() => setIsBulkMoveModalOpen(true)}
                className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-black uppercase hover:bg-indigo-50 transition-colors"
              >
                Mover de Turma
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-black uppercase hover:bg-red-600 transition-colors"
              >
                Excluir Selecionados
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-8 py-5 text-center w-16">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="px-2 py-5 text-center">Nº</th>
                <th className="px-8 py-5">Nome Completo</th>
                <th className="px-8 py-5">Nascimento</th>
                <th className="px-8 py-5">Telefone</th>
                <th className="px-8 py-5">Turma / Turno</th>
                <th className="px-8 py-5 text-center">Transporte</th>
                <th className="px-8 py-5 text-center">PAED</th>
                <th className="px-8 py-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-8 py-10 text-center text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-2" />
                    Carregando registros...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredStudents.map((s) => (
                    <tr key={s.id || s.CodigoAluno} className={`transition-colors group ${selectedStudents.includes(s.id!) ? 'bg-indigo-50/50' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-8 py-5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(s.id!)}
                          onChange={() => toggleSelectStudent(s.id!)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-5 text-center"><span className="text-xs font-black text-indigo-400 bg-indigo-50 px-2 py-1 rounded-md">{s.Sequencia}</span></td>
                      <td className="px-8 py-5"><p className="text-sm font-black text-gray-900 uppercase">{s.Nome}</p></td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-black text-gray-600">{formatDateSafe(s.DataNascimento)}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-1.5">
                          <Phone size={14} className="text-gray-400" />
                          <span className="text-xs font-bold text-gray-600 truncate max-w-[120px]">{s.TelefoneContato || '---'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-gray-700 uppercase">{s.Turma}</p>
                        <p className="text-[9px] text-indigo-500 font-black uppercase">{s.Turno}</p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${s.TransporteEscolar === 'Sim' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-gray-100 text-gray-400'}`}>{s.TransporteEscolar}</span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${s.PAED === 'Sim' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-100 text-gray-400'}`}>{s.PAED}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => startEditing(s)} className="p-2 text-gray-300 hover:text-indigo-600 transition-colors" title="Editar">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => openMovementModal(s)} className="p-2 text-gray-300 hover:text-amber-500 transition-colors" title="Histórico / Movimentação">
                            <Clock size={18} />
                          </button>
                          <button onClick={() => deleteStudent(s.CodigoAluno)} className="p-2 text-gray-300 hover:text-red-500 transition-colors" title="Excluir">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
          {!isLoading && filteredStudents.length === 0 && (
            <div className="py-20 text-center">
              <Users size={48} className="mx-auto mb-4 text-gray-100" />
              <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Nenhum aluno cadastrado no momento</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Bulk Move */}
      {isBulkMoveModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 uppercase">Mover {selectedStudents.length} Alunos</h3>
              <button onClick={() => setIsBulkMoveModalOpen(false)}><X size={24} className="text-gray-400 hover:text-red-500" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase ml-1">Selecione a Nova Turma de Destino</label>
                <select
                  value={bulkTargetClass}
                  onChange={e => setBulkTargetClass(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border border-gray-200 focus:border-indigo-500 mt-2"
                >
                  <option value="">Selecione...</option>
                  {availableClassrooms.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setIsBulkMoveModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase text-xs hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeBulkMove}
                  disabled={!bulkTargetClass}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Mudança
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Histórico e Movimentação */}
      {isMovementModalOpen && selectedStudentForMovement && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-8 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase">Histórico do Aluno</h3>
                <p className="text-sm font-bold text-indigo-600 uppercase">{selectedStudentForMovement.Nome}</p>
              </div>
              <button onClick={() => setIsMovementModalOpen(false)}><X size={24} className="text-gray-400 hover:text-red-500" /></button>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
              {movements.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                  <History size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-xs font-black text-gray-400 uppercase">Nenhuma movimentação registrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {movements.map((mov) => (
                    <div key={mov.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${mov.movement_type === 'TRANSFERENCIA' ? 'bg-amber-100 text-amber-700' :
                            mov.movement_type === 'ATESTADO' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-200 text-gray-700'
                            }`}>
                            {mov.movement_type}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">{formatDateSafe(mov.movement_date)}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-700 uppercase">{mov.description || 'Sem descrição'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-100 shrink-0">
              <h4 className="text-sm font-black text-gray-900 uppercase mb-4 flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                Registrar Nova Movimentação
              </h4>
              <form onSubmit={handleRegisterMovement} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Tipo de Movimentação</label>
                    <select
                      value={newMovement.type}
                      onChange={e => setNewMovement({ ...newMovement, type: e.target.value })}
                      className="w-full p-3 bg-gray-50 rounded-xl font-bold text-xs outline-none border border-gray-200 focus:border-indigo-500"
                    >
                      <option value="TRANSFERENCIA">TRANSFERÊNCIA</option>
                      <option value="ATESTADO">ATESTADO MÉDICO</option>
                      <option value="ABANDONO">ABANDONO</option>
                      <option value="OBITO">ÓBITO</option>
                      <option value="OUTROS">OUTROS</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Data do Evento</label>
                    <input
                      type="date"
                      required
                      value={newMovement.date}
                      onChange={e => setNewMovement({ ...newMovement, date: e.target.value })}
                      className="w-full p-3 bg-gray-50 rounded-xl font-bold text-xs outline-none border border-gray-200 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Descrição / Observações</label>
                  <textarea
                    required
                    value={newMovement.description}
                    onChange={e => setNewMovement({ ...newMovement, description: e.target.value })}
                    placeholder="Detalhes sobre a movimentação..."
                    className="w-full p-3 bg-gray-50 rounded-xl font-bold text-xs outline-none border border-gray-200 focus:border-indigo-500 min-h-[80px]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs hover:bg-indigo-700 transition-colors shadow-lg"
                >
                  Salvar Movimentação
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro/Edição Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl">
                  {isEditing ? <Pencil size={24} /> : <UserPlus size={24} />}
                </div>
                <h3 className="text-2xl font-black text-gray-900 uppercase">
                  {isEditing ? 'Editar Aluno' : 'Cadastrar Aluno'}
                </h3>
              </div>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-red-500 transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleManualSave} className="p-10 space-y-6 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nome Completo</label>
                <input required value={form.Nome} onChange={e => setForm({ ...form, Nome: e.target.value.toUpperCase() })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:bg-white border border-gray-100" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Matrícula (Código)</label>
                  <div className="flex gap-2">
                    <input required value={form.CodigoAluno} onChange={e => setForm({ ...form, CodigoAluno: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none" />
                    {!isEditing && (
                      <button type="button" onClick={generateNewCode} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors" title="Gerar Código Automático">
                        <RefreshCw size={20} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Data de Nascimento</label><input required type="date" value={form.DataNascimento} onChange={e => setForm({ ...form, DataNascimento: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Turma</label>
                  <select
                    required
                    value={form.Turma}
                    onChange={e => setForm({ ...form, Turma: e.target.value })}
                    className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none"
                  >
                    <option value="">Selecione a Turma</option>
                    {availableClassrooms.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Turno</label><select value={form.Turno} onChange={e => setForm({ ...form, Turno: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs"><option>MATUTINO</option><option>VESPERTINO</option><option>NOTURNO</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nome do Responsável</label><input required value={form.NomeResponsavel} onChange={e => setForm({ ...form, NomeResponsavel: e.target.value.toUpperCase() })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Telefone de Contato</label><input required value={form.TelefoneContato} onChange={e => setForm({ ...form, TelefoneContato: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none" placeholder="(XX) 9XXXX-XXXX" /></div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">PAED</label><select value={form.PAED} onChange={e => setForm({ ...form, PAED: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs"><option>Não</option><option>Sim</option></select></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Transporte</label><select value={form.TransporteEscolar} onChange={e => setForm({ ...form, TransporteEscolar: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs"><option>Não</option><option>Sim</option></select></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Data Matrícula</label><input type="date" value={form.DataMatricula} onChange={e => setForm({ ...form, DataMatricula: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" /></div>
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-sm shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                <Save size={20} />
                {isEditing ? 'Atualizar Dados' : 'Salvar Registro'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-indigo-900 p-8 rounded-[3rem] text-white flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-6">
          <ShieldCheck size={32} className="text-indigo-300" />
          <div>
            <h4 className="text-xl font-black uppercase">Banco de Dados Ativo</h4>
            <p className="text-indigo-200/60 text-xs font-medium uppercase">Seus dados estão protegidos contra perdas durante a navegação.</p>
          </div>
        </div>
        <div className="bg-white/10 px-6 py-4 rounded-2xl text-center">
          <p className="text-[8px] font-black text-indigo-300 uppercase">Alunos em Base</p>
          <p className="text-2xl font-black">{students.length}</p>
        </div>
      </div>
    </div >
  );
};

export default SecretariatStudentRegistry;
