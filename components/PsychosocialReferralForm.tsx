import React, { useState, useRef } from 'react';
import {
  X,
  Save,
  Printer,
  ArrowLeft,
  FileText,
  User,
  CheckSquare,
  Square,
  ShieldCheck,
  Brain,
  Smile,
  Activity,
  Loader2,
  Search,
  Plus,
  Scale,
  Sparkles,
  School,
  Calendar,
  Layers
} from 'lucide-react';
import { PsychosocialReferral } from '../types';
import { useStudents } from '../hooks/useStudents';

interface PsychosocialReferralFormProps {
  onCancel: () => void;
  onSave: (referral: PsychosocialReferral) => void;
  initialData?: Partial<PsychosocialReferral>;
}

const PsychosocialReferralForm: React.FC<PsychosocialReferralFormProps> = ({ onCancel, onSave, initialData }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<PsychosocialReferral>(() => ({
    id: initialData?.id || `ref-${Date.now()}`,
    schoolUnit: (initialData?.schoolUnit && initialData.schoolUnit !== 'Unidade Escolar') ? initialData.schoolUnit : 'EE CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI',
    studentName: initialData?.studentName || '',
    studentAge: initialData?.studentAge || '',
    className: initialData?.className || '',
    teacherName: initialData?.teacherName || 'PROFESSOR(A)',
    previousStrategies: initialData?.previousStrategies || '',
    attendanceFrequency: initialData?.attendanceFrequency || '0',
    adoptedProcedures: initialData?.adoptedProcedures || [],
    observedAspects: {
      learning: Array.isArray(initialData?.observedAspects?.learning) ? initialData.observedAspects.learning : [],
      behavioral: Array.isArray(initialData?.observedAspects?.behavioral) ? initialData.observedAspects.behavioral : [],
      emotional: Array.isArray(initialData?.observedAspects?.emotional) ? initialData.observedAspects.emotional : [],
    },
    report: initialData?.report || initialData?.reason || '',
    status: (initialData?.status as any) || 'PENDENTE',
    priority: (initialData?.priority as any) || 'MEDIA',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    timestamp: initialData?.timestamp || Date.now(),
    referralDestination: 'MEDIACAO',
    reason: initialData?.reason || 'Encaminhamento para Mediação Escolar',
    mediationProcedures: initialData?.mediationProcedures || []
  }));

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || `ref-${Date.now()}`,
        schoolUnit: (initialData.schoolUnit && initialData.schoolUnit !== 'Unidade Escolar') ? initialData.schoolUnit : 'EE CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI',
        studentName: initialData.studentName || '',
        studentAge: initialData.studentAge || '',
        className: initialData.className || '',
        teacherName: initialData.teacherName || 'PROFESSOR(A)',
        previousStrategies: initialData.previousStrategies || '',
        attendanceFrequency: initialData.attendanceFrequency || '0',
        adoptedProcedures: initialData.adoptedProcedures || [],
        observedAspects: {
          learning: Array.isArray(initialData.observedAspects?.learning) ? initialData.observedAspects.learning : [],
          behavioral: Array.isArray(initialData.observedAspects?.behavioral) ? initialData.observedAspects.behavioral : [],
          emotional: Array.isArray(initialData.observedAspects?.emotional) ? initialData.observedAspects.emotional : [],
        },
        report: initialData.report || initialData.reason || '',
        status: (initialData.status as any) || 'PENDENTE',
        priority: (initialData.priority as any) || 'MEDIA',
        date: initialData.date || new Date().toISOString().split('T')[0],
        timestamp: initialData.timestamp || Date.now(),
        referralDestination: 'MEDIACAO',
        reason: initialData.reason || 'Encaminhamento para Mediação Escolar',
        mediationProcedures: initialData.mediationProcedures || []
      });
    }
  }, [initialData]);

  const ASPECTS = {
    learning: {
      title: 'Aspectos relacionados à aprendizagem',
      icon: Brain,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50/50',
      borderColor: 'border-indigo-200',
      activeBorder: 'border-indigo-600',
      activeBg: 'bg-indigo-50',
      activeText: 'text-indigo-900',
      items: [
        "Dificuldade de Leitura;",
        "Dificuldade em decodificar palavras e números;",
        "Dificuldade em compreender textos;",
        "Dificuldade de escrita."
      ]
    },
    behavioral: {
      title: 'Aspectos comportamentais',
      icon: Activity,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50/50',
      borderColor: 'border-rose-200',
      activeBorder: 'border-rose-600',
      activeBg: 'bg-rose-50',
      activeText: 'text-rose-900',
      items: [
        "Dificuldades em manter o foco;",
        "Esquecimento frequente de instruções ou tarefas;",
        "Muita Dificuldade de se manter sentado ao decorrer da aula;",
        "Dificuldade em esperar a vez;",
        "Mudança brusca de comportamento."
      ]
    },
    emotional: {
      title: 'Aspectos Emocionais',
      icon: Smile,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50/50',
      borderColor: 'border-amber-200',
      activeBorder: 'border-amber-600',
      activeBg: 'bg-amber-50',
      activeText: 'text-amber-900',
      items: [
        "Preocupação excessiva com desempenho escolar;",
        "Medo de fracassar ou decepcionar os outros;",
        "Baixa Autoestima;",
        "Sentimentos de inadequação;",
        "Tristeza frequente."
      ]
    }
  };

  const toggleAspect = (category: 'learning' | 'behavioral' | 'emotional', aspect: string) => {
    setFormData(prev => {
      const current = prev.observedAspects[category] || [];
      const updated = current.includes(aspect)
        ? current.filter(a => a !== aspect)
        : [...current, aspect];
      return {
        ...prev,
        observedAspects: { ...prev.observedAspects, [category]: updated }
      };
    });
  };

  const handlePrint = () => {
    setIsGenerating(true);
    setTimeout(() => {
      window.print();
      setIsGenerating(false);
    }, 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim()) {
      alert("Por favor, preencha ou selecione o nome do estudante.");
      return;
    }
    onSave(formData);
  };

  // Autocomplete e busca de estudantes
  const [searchStudent, setSearchStudent] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { students } = useStudents();

  const filteredStudents = React.useMemo(() => {
    if (!searchStudent || searchStudent.length < 2) return [];
    return students
      .filter(s => s.name.toLowerCase().includes(searchStudent.toLowerCase()))
      .slice(0, 6);
  }, [searchStudent, students]);

  const selectStudent = (student: any) => {
    let age = '';
    if (student.birth_date) {
      const birth = new Date(student.birth_date);
      const today = new Date();
      let ageNum = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        ageNum--;
      }
      age = ageNum > 0 && ageNum < 100 ? ageNum.toString() : '';
    }

    setFormData(prev => ({
      ...prev,
      studentName: student.name.toUpperCase(),
      studentAge: age || prev.studentAge,
      className: (student.class || '').toUpperCase(),
      schoolUnit: 'E.E. CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI'
    }));
    setSearchStudent('');
    setShowDropdown(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">

      {/* HEADER SUPERIOR */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-5">
          <button 
            type="button"
            onClick={onCancel} 
            className="p-3 bg-gray-50 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
            title="Voltar"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[9px] font-black uppercase tracking-widest">
                Modelo Oficial SEDUC/MT
              </span>
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mt-1">
              Encaminhamento para Mediação
            </h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
              Instrumento Oficial Docente — Núcleo de Mediação e Práticas Restaurativas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isGenerating}
            className="px-6 py-3.5 bg-gray-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-black transition-all flex items-center gap-2"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
            Imprimir / Gerar PDF
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-8 py-3.5 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center gap-2"
          >
            <Save size={16} /> Salvar & Encaminhar
          </button>
        </div>
      </div>

      {/* FORMULÁRIO PRINCIPAL */}
      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-10 no-print">

        {/* CABEÇALHO DO DOCUMENTO NO FORMULÁRIO */}
        <div className="text-center pb-6 border-b border-gray-100 space-y-1">
          <div className="inline-flex items-center justify-center p-3 bg-rose-50 text-rose-600 rounded-2xl mb-2">
            <Scale size={28} />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight">
            ENCAMINHAMENTO PARA MEDIAÇÃO
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {formData.schoolUnit}
          </p>
        </div>

        {/* 1. IDENTIFICAÇÃO DO ESTUDANTE E PROFESSOR */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-gray-900 border-b border-gray-100 pb-3">
            <User size={18} className="text-rose-600" />
            <h4 className="text-xs font-black uppercase tracking-[0.15em]">
              1. Identificação
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Unidade Escolar */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                <School size={12} className="text-rose-500" /> Unidade Escolar:
              </label>
              <input 
                type="text" 
                value={formData.schoolUnit} 
                onChange={e => setFormData({ ...formData, schoolUnit: e.target.value.toUpperCase() })}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-xs text-gray-800 outline-none focus:bg-white focus:border-rose-500 transition-all uppercase" 
              />
            </div>

            {/* Professor */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Professor(a):
              </label>
              <input 
                required 
                type="text" 
                value={formData.teacherName} 
                onChange={e => setFormData({ ...formData, teacherName: e.target.value.toUpperCase() })} 
                placeholder="NOME DO PROFESSOR(A)"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm text-gray-900 outline-none focus:bg-white focus:border-rose-500 transition-all uppercase" 
              />
            </div>

            {/* Nome do Estudante (com busca) */}
            <div className="lg:col-span-2 space-y-1.5 relative">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Nome do estudante:
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={formData.studentName || searchStudent}
                  onChange={e => {
                    setFormData({ ...formData, studentName: e.target.value.toUpperCase() });
                    setSearchStudent(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="DIGITE OU BUSQUE O NOME DO ALUNO..."
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-rose-500 transition-all uppercase"
                />
                {showDropdown && filteredStudents.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden divide-y divide-gray-50 animate-in fade-in zoom-in-95 duration-150">
                    {filteredStudents.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectStudent(s)}
                        className="w-full text-left px-6 py-3.5 hover:bg-rose-50 transition-colors flex justify-between items-center group"
                      >
                        <div>
                          <p className="text-xs font-black text-gray-800 uppercase">{s.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase group-hover:text-rose-600">Turma: {s.class || 'Não informada'}</p>
                        </div>
                        <Plus size={16} className="text-gray-300 group-hover:text-rose-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Idade */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Idade:
              </label>
              <input 
                type="text" 
                value={formData.studentAge} 
                onChange={e => setFormData({ ...formData, studentAge: e.target.value })} 
                placeholder="Ex: 14 anos" 
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm text-gray-900 outline-none focus:bg-white focus:border-rose-500 transition-all" 
              />
            </div>

            {/* Ano/Turma */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Ano/Turma:
              </label>
              <input 
                required 
                type="text" 
                value={formData.className} 
                onChange={e => setFormData({ ...formData, className: e.target.value.toUpperCase() })} 
                placeholder="Ex: 9º ANO A" 
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm text-gray-900 outline-none focus:bg-white focus:border-rose-500 transition-all uppercase" 
              />
            </div>
          </div>
        </div>

        {/* 2. ESTRATÉGIAS JÁ REALIZADAS PELO PROFESSOR */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-900 border-b border-gray-100 pb-3">
            <Activity size={18} className="text-rose-600" />
            <h4 className="text-xs font-black uppercase tracking-[0.15em]">
              Estratégias já realizadas pelo(a) PROFESSOR(A):
            </h4>
          </div>
          <textarea
            rows={4}
            value={formData.previousStrategies}
            onChange={e => setFormData({ ...formData, previousStrategies: e.target.value })}
            placeholder="Descreva as intervenções pedagógicas, conversas individuais, reorganização de espaço em sala, contato prévio ou tentativas anteriores de mediação..."
            className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-normal text-gray-800 leading-relaxed outline-none focus:bg-white focus:border-rose-500 transition-all resize-none"
          />
        </div>

        {/* 3. ASPECTOS OBSERVADOS */}
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h4 className="text-xs font-black uppercase tracking-[0.15em] text-gray-900 flex items-center gap-2">
              <CheckSquare size={18} className="text-rose-600" /> Marque com X a alternativa que corresponde ao que foi observado:
            </h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Selecione todos os aspectos aplicáveis ao caso
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Aprendizagem */}
            <div className="bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100 space-y-4">
              <div className="flex items-center gap-2 text-indigo-700 pb-2 border-b border-indigo-100">
                <Brain size={18} />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {ASPECTS.learning.title}
                </span>
              </div>
              <div className="space-y-2">
                {ASPECTS.learning.items.map(aspect => {
                  const isChecked = Boolean(formData.observedAspects?.learning?.includes(aspect));
                  return (
                    <button
                      key={aspect}
                      type="button"
                      onClick={() => toggleAspect('learning', aspect)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? <CheckSquare size={16} /> : <Square size={16} className="text-gray-300" />}
                      </div>
                      <span className="text-xs font-bold leading-tight">{aspect}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comportamentais */}
            <div className="bg-rose-50/30 p-6 rounded-3xl border border-rose-100 space-y-4">
              <div className="flex items-center gap-2 text-rose-700 pb-2 border-b border-rose-100">
                <Activity size={18} />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {ASPECTS.behavioral.title}
                </span>
              </div>
              <div className="space-y-2">
                {ASPECTS.behavioral.items.map(aspect => {
                  const isChecked = Boolean(formData.observedAspects?.behavioral?.includes(aspect));
                  return (
                    <button
                      key={aspect}
                      type="button"
                      onClick={() => toggleAspect('behavioral', aspect)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        isChecked
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-rose-300'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? <CheckSquare size={16} /> : <Square size={16} className="text-gray-300" />}
                      </div>
                      <span className="text-xs font-bold leading-tight">{aspect}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Emocionais */}
            <div className="bg-amber-50/30 p-6 rounded-3xl border border-amber-100 space-y-4">
              <div className="flex items-center gap-2 text-amber-700 pb-2 border-b border-amber-100">
                <Smile size={18} />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {ASPECTS.emotional.title}
                </span>
              </div>
              <div className="space-y-2">
                {ASPECTS.emotional.items.map(aspect => {
                  const isChecked = Boolean(formData.observedAspects?.emotional?.includes(aspect));
                  return (
                    <button
                      key={aspect}
                      type="button"
                      onClick={() => toggleAspect('emotional', aspect)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        isChecked
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-amber-300'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? <CheckSquare size={16} /> : <Square size={16} className="text-gray-300" />}
                      </div>
                      <span className="text-xs font-bold leading-tight">{aspect}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. BREVE RELATO */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-900 border-b border-gray-100 pb-3">
            <FileText size={18} className="text-rose-600" />
            <h4 className="text-xs font-black uppercase tracking-[0.15em]">
              Escreva um breve relato:
            </h4>
          </div>
          <textarea
            rows={6}
            value={formData.report}
            onChange={e => setFormData({ ...formData, report: e.target.value })}
            placeholder="Descreva detalhadamente o ocorrido, contexto do conflito, atitudes do estudante, relacionamento com os colegas ou demanda específica para atendimento pelo professor mediador..."
            className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-normal text-gray-800 leading-relaxed outline-none focus:bg-white focus:border-rose-500 transition-all resize-none"
          />
        </div>

        {/* BOTÃO FINALIZAR */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-rose-600/20 hover:bg-rose-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
          >
            <Save size={20} /> Salvar & Encaminhar para Mediação Escolar
          </button>
        </div>
      </form>

      {/* ÁREA OFICIAL DE IMPRESSÃO / PDF (MODELO EXATO DO DOCX) */}
      <div className="print-referral-area">
        <div className="pdf-page p-6 sm:p-8 flex flex-col justify-between min-h-[275mm] text-black font-serif">
          
          <div className="flex-1 flex flex-col justify-start">
            {/* CABEÇALHO OFICIAL SEDUC/MT */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
              <img 
                src="/brasao_mt.png" 
                alt="Brasão MT" 
                className="h-24 w-auto object-contain shrink-0 max-h-[90px]" 
                onError={(e) => (e.currentTarget.src = '/SEDUC 2.jpg')} 
              />
              <div className="text-center flex-1 mx-2 space-y-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
                <h1 className="text-[11px] font-bold uppercase text-black leading-tight">Governo do Estado de Mato Grosso</h1>
                <h2 className="text-[10px] font-bold uppercase text-black leading-tight">Secretaria de Estado de Educação</h2>
                <h3 className="text-[10px] font-bold uppercase text-black leading-tight">Secretaria Adjunta de Gestão Regional</h3>
                <h4 className="text-[9px] font-bold uppercase text-black leading-tight">Superintendência de Gestão das Diretorias Regionais</h4>
                <h5 className="text-[9px] font-bold uppercase text-black leading-tight">Diretoria Regional de Educação de Sinop</h5>
                <h6 className="text-[11px] font-black uppercase text-black leading-tight pt-0.5">Escola Estadual Cívico-Militar André Antônio Maggi</h6>
              </div>
              <img 
                src="/logo-escola-oficial.png" 
                alt="Escola Logo" 
                className="h-28 w-auto object-contain shrink-0 max-h-[110px]" 
                onError={(e) => (e.currentTarget.src = '/logo-escola.png')} 
              />
            </div>

            {/* TÍTULO */}
            <div className="text-center my-3">
              <h2 className="text-base font-bold uppercase text-black tracking-wider" style={{ fontFamily: 'Arial, sans-serif' }}>
                ENCAMINHAMENTO PARA MEDIAÇÃO
              </h2>
            </div>

            {/* IDENTIFICAÇÃO */}
            <div className="text-xs space-y-1.5 border border-black p-3 mb-3 leading-relaxed">
              <p><strong>Unidade Escolar:</strong> {formData.schoolUnit}</p>
              <p><strong>Nome do estudante:</strong> {formData.studentName || '________________________________________'}</p>
              <div className="grid grid-cols-2 gap-4">
                <p><strong>Idade:</strong> {formData.studentAge || '____'} anos</p>
                <p><strong>Ano/Turma:</strong> {formData.className || '____________'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <p><strong>Professor:</strong> {formData.teacherName || '________________________'}</p>
                <p><strong>Data:</strong> {new Date(formData.date).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {/* ESTRATÉGIAS */}
            <div className="text-xs space-y-1 mb-3">
              <p className="font-bold uppercase">Estratégias já realizadas pela PROFESSOR :</p>
              <div className="border border-black p-2.5 min-h-[60px] text-justify leading-relaxed whitespace-pre-line">
                {formData.previousStrategies || "________________________________________________________________________________________________________________________________________________________________________________________________________________________________"}
              </div>
            </div>

            {/* ASPECTOS OBSERVADOS */}
            <div className="text-xs space-y-2 mb-3">
              <p className="font-bold uppercase">Marque com X a alternativa corresponde ao que foi observado.</p>

              {/* Aprendizagem */}
              <div className="space-y-0.5">
                <p className="font-bold text-[11px] uppercase">Aspectos relacionados à aprendizagem</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10.5px]">
                  {ASPECTS.learning.items.map(item => (
                    <div key={item} className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs">
                        ({formData.observedAspects.learning.includes(item) ? ' X ' : '   '})
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comportamentais */}
              <div className="space-y-0.5 pt-1">
                <p className="font-bold text-[11px] uppercase">Aspectos comportamentais</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10.5px]">
                  {ASPECTS.behavioral.items.map(item => (
                    <div key={item} className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs">
                        ({formData.observedAspects.behavioral.includes(item) ? ' X ' : '   '})
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emocionais */}
              <div className="space-y-0.5 pt-1">
                <p className="font-bold text-[11px] uppercase">Aspectos Emocionais</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10.5px]">
                  {ASPECTS.emotional.items.map(item => (
                    <div key={item} className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs">
                        ({formData.observedAspects.emotional.includes(item) ? ' X ' : '   '})
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BREVE RELATO */}
            <div className="text-xs space-y-1 mb-4">
              <p className="font-bold uppercase">Escreva um breve relato:</p>
              <div className="border border-black p-2.5 min-h-[90px] text-justify leading-relaxed whitespace-pre-line">
                {formData.report || "________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________"}
              </div>
            </div>

            {/* ASSINATURAS */}
            <div className="grid grid-cols-2 gap-12 text-center text-xs pt-6">
              <div>
                <div className="border-t border-black pt-1">
                  <p className="font-bold uppercase">{formData.teacherName}</p>
                  <p className="text-[10px] text-gray-600">Professor(a) Solicitante</p>
                </div>
              </div>
              <div>
                <div className="border-t border-black pt-1">
                  <p className="font-bold uppercase">EQUIPE DE MEDIAÇÃO ESCOLAR</p>
                  <p className="text-[10px] text-gray-600">Ciente e Recebido em ____/____/________</p>
                </div>
              </div>
            </div>

          </div>

          {/* RODAPÉ OFICIAL */}
          <div className="mt-auto border-t border-black/40 pt-2 grid grid-cols-2 gap-4 text-[8.5px] leading-tight text-black" style={{ color: '#000000', fontFamily: 'Arial, sans-serif' }}>
            <div className="text-left space-y-0.5">
              <p>Rua Engenheiro Edgar Prado Arze, Quadra 01, Lote 05, Setor A, Centro Político Administrativo,</p>
              <p>CEP: 78049-906 – Cuiabá-MT Fone (65) 3613-6300</p>
              <p>Site: www.seduc.mt.gov.br</p>
            </div>
            <div className="text-left space-y-0.5 pl-6">
              <p>Rua Borba Gato, nº 80, Bairro Torre</p>
              <p>CEP: 78500-000 – Colíder-MT Fones +55 (66) 99682-7608</p>
              <p>Email: escola.158330@edu.mt.gov.br</p>
            </div>
          </div>

        </div>
      </div>

      {/* ESTILOS CSS DE IMPRESSÃO */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media screen {
          .print-referral-area { display: none !important; }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm !important;
          }
          html, body {
            height: auto !important;
            width: 100% !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * { visibility: hidden !important; }
          .no-print { display: none !important; }
          .print-referral-area, .print-referral-area * { visibility: visible !important; }
          .print-referral-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            min-height: 100% !important;
            display: block !important;
            background: white !important;
            color: black !important;
            box-sizing: border-box !important;
            padding: 0 !important;
          }
          .pdf-page { 
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            min-height: 275mm !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 0 !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
          }
        }
      `}} />

    </div>
  );
};

export default PsychosocialReferralForm;
