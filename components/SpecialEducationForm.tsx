
import React, { useState, useEffect } from 'react';
import { Save, X, Calendar, Users, Brain, Activity, BookOpen, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface SpecialEducationFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const TABS = [
    { id: 'identificacao', label: 'Identificação & Saúde', icon: Users },
    { id: 'equipe', label: 'Equipe & Calendário', icon: Calendar },
    { id: 'perfil', label: 'Perfil do Estudante', icon: Brain },
    { id: 'planejamento', label: 'Planejamento Pedagógico', icon: BookOpen },
    { id: 'habilidades', label: 'Habilidades Funcionais', icon: Activity },
    { id: 'parecer', label: 'Parecer Semestral', icon: FileText },
];

const SpecialEducationForm: React.FC<SpecialEducationFormProps> = ({ onClose, onSuccess, initialData }) => {
    const [activeTab, setActiveTab] = useState('identificacao');
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        student_name: '',
        student_code: '',
        date_of_birth: '',
        folder_link: '',
        responsible_persons: '',
        diagnosis_condition: '',
        health_observations: '',
        school_frequency: '',
        collaborative_guidance: '',
        learning_characterization: '',
        semester_report: '',

        // JSON Fields
        pei_calendar: { start_date: '', review_date: '', initial_evaluation_date: '' },
        school_team: { regent_teacher: '', aee_teacher: '', support_professional: '', coordination: '' },
        student_profile: { cognitive: '', motor: '', social: '', communicative: '' },
        pedagogical_planning: [] as any[],
        functional_skills: [] as any[]
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...formData,
                ...initialData,
                pei_calendar: initialData.pei_calendar || { start_date: '', review_date: '', initial_evaluation_date: '' },
                school_team: initialData.school_team || { regent_teacher: '', aee_teacher: '', support_professional: '', coordination: '' },
                student_profile: initialData.student_profile || { cognitive: '', motor: '', social: '', communicative: '' },
                pedagogical_planning: initialData.pedagogical_planning || [],
                functional_skills: initialData.functional_skills || []
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData?.id) {
                const { error } = await supabase
                    .from('pei_records')
                    .update(formData)
                    .eq('id', initialData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('pei_records')
                    .insert([formData]);
                if (error) throw error;
            }
            onSuccess();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar registro do PEI.');
        } finally {
            setLoading(false);
        }
    };

    const addPlanningItem = () => {
        setFormData({
            ...formData,
            pedagogical_planning: [
                ...formData.pedagogical_planning,
                { area: '', thematic_unit: '', skills: '', methodology: '', evaluation: '' }
            ]
        });
    };

    const updatePlanningItem = (index: number, field: string, value: string) => {
        const newItems = [...formData.pedagogical_planning];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, pedagogical_planning: newItems });
    };

    const removePlanningItem = (index: number) => {
        const newItems = formData.pedagogical_planning.filter((_, i) => i !== index);
        setFormData({ ...formData, pedagogical_planning: newItems });
    };

    const addSkillItem = () => {
        setFormData({
            ...formData,
            functional_skills: [
                ...formData.functional_skills,
                { skill: '', strategy: '', independence_level: 'Parcialmente' }
            ]
        });
    };

    const updateSkillItem = (index: number, field: string, value: string) => {
        const newItems = [...formData.functional_skills];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, functional_skills: newItems });
    };

    const removeSkillItem = (index: number) => {
        const newItems = formData.functional_skills.filter((_, i) => i !== index);
        setFormData({ ...formData, functional_skills: newItems });
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300 font-sans">
            <div className="bg-white rounded-[2rem] w-full max-w-6xl h-[90vh] shadow-2xl border border-white/20 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 bg-indigo-900 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                            <span className="bg-white/20 p-2 rounded-lg">📄</span>
                            Plano Educacional Individualizado (PEI)
                        </h3>
                        <p className="text-xs text-indigo-200 font-bold uppercase tracking-widest mt-1 ml-14 opacity-80">
                            {initialData ? 'Edição de Documento' : 'Novo Documento'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-gray-50 border-b border-gray-200 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-4 ${activeTab === tab.id
                                ? 'border-indigo-600 text-indigo-700 bg-white'
                                : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">

                    {/* IDENTIFICAÇÃO & SAÚDE */}
                    {activeTab === 'identificacao' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Estudante</label>
                                    <input required value={formData.student_name} onChange={e => setFormData({ ...formData, student_name: e.target.value })} className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Código / Matrícula</label>
                                    <input value={formData.student_code} onChange={e => setFormData({ ...formData, student_code: e.target.value })} className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                                    <input type="date" value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Responsáveis</label>
                                    <input value={formData.responsible_persons} onChange={e => setFormData({ ...formData, responsible_persons: e.target.value })} className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100" />
                                </div>
                            </div>

                            <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 space-y-4">
                                <h4 className="flex items-center gap-2 text-rose-700 font-black uppercase text-sm"><AlertCircle size={18} /> Saúde e Diagnóstico</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Condição / Diagnóstico (CID)</label>
                                        <input value={formData.diagnosis_condition} onChange={e => setFormData({ ...formData, diagnosis_condition: e.target.value })} className="w-full p-4 bg-white rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-rose-200" placeholder="Ex: TEA, TDAH, Deficiência Intelectual..." />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Observações de Saúde (Alergias, Intolerâncias)</label>
                                        <textarea value={formData.health_observations} onChange={e => setFormData({ ...formData, health_observations: e.target.value })} className="w-full p-4 bg-white rounded-xl font-medium border-none outline-none focus:ring-2 focus:ring-rose-200 resize-none h-24" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EQUIPE & CALENDÁRIO */}
                    {activeTab === 'equipe' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-4">
                                <h4 className="flex items-center gap-2 text-blue-700 font-black uppercase text-sm"><Calendar size={18} /> Cronograma do PEI</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Data Início</label>
                                        <input type="date" value={formData.pei_calendar.start_date} onChange={e => setFormData({ ...formData, pei_calendar: { ...formData.pei_calendar, start_date: e.target.value } })} className="w-full p-3 bg-white rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-200" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Avaliação Inicial</label>
                                        <input type="date" value={formData.pei_calendar.initial_evaluation_date} onChange={e => setFormData({ ...formData, pei_calendar: { ...formData.pei_calendar, initial_evaluation_date: e.target.value } })} className="w-full p-3 bg-white rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-200" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Previsão de Revisão</label>
                                        <input type="date" value={formData.pei_calendar.review_date} onChange={e => setFormData({ ...formData, pei_calendar: { ...formData.pei_calendar, review_date: e.target.value } })} className="w-full p-3 bg-white rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-200" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-gray-700 font-black uppercase text-sm"><Users size={18} /> Equipe Multidisciplinar</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professor Regente</label>
                                        <input value={formData.school_team.regent_teacher} onChange={e => setFormData({ ...formData, school_team: { ...formData.school_team, regent_teacher: e.target.value } })} className="w-full p-4 bg-gray-50 rounded-xl font-medium" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professor AEE</label>
                                        <input value={formData.school_team.aee_teacher} onChange={e => setFormData({ ...formData, school_team: { ...formData.school_team, aee_teacher: e.target.value } })} className="w-full p-4 bg-gray-50 rounded-xl font-medium" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Apoio / Cuidador</label>
                                        <input value={formData.school_team.support_professional} onChange={e => setFormData({ ...formData, school_team: { ...formData.school_team, support_professional: e.target.value } })} className="w-full p-4 bg-gray-50 rounded-xl font-medium" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Coordenação Pedagógica</label>
                                        <input value={formData.school_team.coordination} onChange={e => setFormData({ ...formData, school_team: { ...formData.school_team, coordination: e.target.value } })} className="w-full p-4 bg-gray-50 rounded-xl font-medium" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Orientações Colaborativas (Família/Saúde)</label>
                                <textarea value={formData.collaborative_guidance} onChange={e => setFormData({ ...formData, collaborative_guidance: e.target.value })} className="w-full p-4 bg-gray-50 rounded-xl font-medium h-32 resize-none" placeholder="Orientações de outros profissionais..." />
                            </div>
                        </div>
                    )}

                    {/* PERFIL DO ESTUDANTE */}
                    {activeTab === 'perfil' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Desenvolvimento Cognitivo</label>
                                    <textarea value={formData.student_profile.cognitive} onChange={e => setFormData({ ...formData, student_profile: { ...formData.student_profile, cognitive: e.target.value } })} className="w-full p-4 bg-indigo-50/50 rounded-xl font-medium h-32 resize-none border border-indigo-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Atenção, memória, raciocínio..." />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Desenvolvimento Motor</label>
                                    <textarea value={formData.student_profile.motor} onChange={e => setFormData({ ...formData, student_profile: { ...formData.student_profile, motor: e.target.value } })} className="w-full p-4 bg-emerald-50/50 rounded-xl font-medium h-32 resize-none border border-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all" placeholder="Coordenação grosa, fina, equilíbrio..." />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Aspectos Sociais & Emocionais</label>
                                    <textarea value={formData.student_profile.social} onChange={e => setFormData({ ...formData, student_profile: { ...formData.student_profile, social: e.target.value } })} className="w-full p-4 bg-amber-50/50 rounded-xl font-medium h-32 resize-none border border-amber-100 focus:bg-white focus:ring-2 focus:ring-amber-100 transition-all" placeholder="Interação, comportamento, frustração..." />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-sky-500 uppercase tracking-widest ml-1">Comunicação e Linguagem</label>
                                    <textarea value={formData.student_profile.communicative} onChange={e => setFormData({ ...formData, student_profile: { ...formData.student_profile, communicative: e.target.value } })} className="w-full p-4 bg-sky-50/50 rounded-xl font-medium h-32 resize-none border border-sky-100 focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all" placeholder="Expressão, compreensão, vocabulário..." />
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Caracterização da Aprendizagem (Potencialidades e Dificuldades)</label>
                                <textarea value={formData.learning_characterization} onChange={e => setFormData({ ...formData, learning_characterization: e.target.value })} className="w-full p-6 bg-gray-50 rounded-2xl font-medium text-gray-700 h-48 resize-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Descreva detalhadamente como o aluno aprende..." />
                            </div>
                        </div>
                    )}

                    {/* PLANEJAMENTO PEDAGÓGICO */}
                    {activeTab === 'planejamento' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <p className="text-sm text-indigo-800 font-bold">Defina as adaptações curriculares por área de conhecimento.</p>
                                <button type="button" onClick={addPlanningItem} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors flex items-center gap-2">
                                    <BookOpen size={16} /> Adicionar Área
                                </button>
                            </div>

                            <div className="space-y-6">
                                {formData.pedagogical_planning.map((item, index) => (
                                    <div key={index} className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm relative group hover:border-indigo-300 transition-colors">
                                        <button type="button" onClick={() => removePlanningItem(index)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-2"><X size={18} /></button>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-10">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Área do Conhecimento</label>
                                                <select value={item.area} onChange={e => updatePlanningItem(index, 'area', e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg border-none outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold">
                                                    <option value="">Selecione...</option>
                                                    <option value="Linguagens">Linguagens</option>
                                                    <option value="Matemática">Matemática</option>
                                                    <option value="Ciências Humanas">Ciências Humanas</option>
                                                    <option value="Ciências da Natureza">Ciências da Natureza</option>
                                                    <option value="Ensino Religioso">Ensino Religioso</option>
                                                    <option value="Parte Diversificada">Parte Diversificada</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Unidade Temática</label>
                                                <input value={item.thematic_unit} onChange={e => updatePlanningItem(index, 'thematic_unit', e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg border-none outline-none focus:ring-2 focus:ring-indigo-100 text-sm" placeholder="Ex: Operações..." />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Habilidades Trabalhadas / Objetivos</label>
                                                <textarea value={item.skills} onChange={e => updatePlanningItem(index, 'skills', e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg border-none outline-none focus:ring-2 focus:ring-indigo-100 text-sm h-20 resize-none" placeholder="Quais habilidades da turma e do estudante serão focadas?" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Metodologia / Estratégias</label>
                                                    <textarea value={item.methodology} onChange={e => updatePlanningItem(index, 'methodology', e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg border-none outline-none focus:ring-2 focus:ring-indigo-100 text-sm h-16 resize-none" placeholder="Recursos, materiais adaptados..." />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Avaliação</label>
                                                    <textarea value={item.evaluation} onChange={e => updatePlanningItem(index, 'evaluation', e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg border-none outline-none focus:ring-2 focus:ring-indigo-100 text-sm h-16 resize-none" placeholder="Como será verificado o aprendizado?" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {formData.pedagogical_planning.length === 0 && (
                                    <p className="text-center text-gray-400 text-sm py-10 italic">Nenhum item de planejamento adicionado.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* HABILIDADES FUNCIONAIS */}
                    {activeTab === 'habilidades' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                <p className="text-sm text-emerald-800 font-bold">Autonomia e Vida Diária</p>
                                <button type="button" onClick={addSkillItem} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors flex items-center gap-2">
                                    <Activity size={16} /> Adicionar Habilidade
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.functional_skills.map((item, index) => (
                                    <div key={index} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl items-start relative group">
                                        <button type="button" onClick={() => removeSkillItem(index)} className="absolute -right-2 -top-2 bg-white text-red-500 border border-red-100 shadow-sm p-1.5 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={14} /></button>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Habilidade Funcional</label>
                                            <input value={item.skill} onChange={e => updateSkillItem(index, 'skill', e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 text-sm" placeholder="Ex: Higiene, Alimentação..." />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Estratégia</label>
                                            <input value={item.strategy} onChange={e => updateSkillItem(index, 'strategy', e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 text-sm" placeholder="Como desenvolver?" />
                                        </div>
                                        <div className="w-40 space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Nível Independência</label>
                                            <select value={item.independence_level} onChange={e => updateSkillItem(index, 'independence_level', e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 text-xs font-bold uppercase">
                                                <option value="Totalmente">Totalmente</option>
                                                <option value="Parcialmente">Parcialmente</option>
                                                <option value="Insuficiente">Insuficiente</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PARECER SEMESTRAL */}
                    {activeTab === 'parecer' && (
                        <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 mb-6">
                                <h4 className="flex items-center gap-2 text-indigo-700 font-black uppercase text-sm mb-2"><CheckCircle2 size={18} /> Relatório Final / Semestral</h4>
                                <p className="text-xs text-indigo-600">Espaço reservado para o parecer descritivo do Conselho de Classe, destacando avanços, desafios persistentes e encaminhamentos.</p>
                            </div>
                            <textarea
                                value={formData.semester_report}
                                onChange={e => setFormData({ ...formData, semester_report: e.target.value })}
                                className="flex-1 w-full p-6 bg-gray-50 rounded-2xl border-none outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-gray-700 leading-relaxed resize-none text-base"
                                placeholder="Redija aqui o parecer..."
                            />
                        </div>
                    )}

                </form>

                {/* Footer Actions */}
                <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
                    <div className="flex gap-2">
                        {initialData?.id && (
                            <button
                                onClick={() => {
                                    const element = document.getElementById('pei-pdf-content');
                                    if (element && (window as any).html2pdf) {
                                        (window as any).html2pdf().set({
                                            margin: 10,
                                            filename: `PEI_${formData.student_name}.pdf`,
                                            image: { type: 'jpeg', quality: 0.98 },
                                            html2canvas: { scale: 2 },
                                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                        }).from(element).save();
                                    }
                                }}
                                className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
                            >
                                <span className="p-1.5 bg-white rounded-lg"><FileText size={16} /></span>
                                Exportar PDF
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-4 rounded-xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all uppercase text-xs tracking-widest">
                            Cancelar
                        </button>
                        <button onClick={handleSubmit} disabled={loading} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50">
                            {loading ? 'Salvando...' : <><Save size={18} /> Salvar PEI</>}
                        </button>
                    </div>
                </div>

                {/* Hidden PDF Content */}
                <div id="pei-pdf-content" className="hidden print:block fixed -left-[9999px] top-0 w-[210mm] bg-white p-12 text-gray-900 font-sans">
                    <div className="text-center border-b-2 border-indigo-900 pb-8 mb-10">
                        <h1 className="text-2xl font-black uppercase text-indigo-900">Plano de Atendimento Educacional Especializado (PAEE)</h1>
                    </div>

                    <div className="space-y-8">
                        {/* IDENTIFICAÇÃO */}
                        <section className="space-y-4">
                            <h2 className="bg-indigo-50 p-2 text-indigo-800 font-black uppercase text-xs tracking-widest border-l-4 border-indigo-600">I. Identificação do Estudante</h2>
                            <div className="grid grid-cols-2 gap-6 text-sm">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase">Nome</p><p className="font-bold">{formData.student_name}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase">Código</p><p className="font-bold">{formData.student_code}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase">Nascimento</p><p className="font-bold">{formData.date_of_birth}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase">Diagnóstico</p><p className="font-bold">{formData.diagnosis_condition}</p></div>
                            </div>
                        </section>

                        {/* EQUIPE */}
                        <section className="space-y-4">
                            <h2 className="bg-indigo-50 p-2 text-indigo-800 font-black uppercase text-xs tracking-widest border-l-4 border-indigo-600">II. Equipe e Cronograma</h2>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div><p className="font-black text-gray-400 text-[9px] uppercase">Prof. Regente</p><p>{formData.school_team.regent_teacher}</p></div>
                                <div><p className="font-black text-gray-400 text-[9px] uppercase">Prof. AEE</p><p>{formData.school_team.aee_teacher}</p></div>
                                <div><p className="font-black text-gray-400 text-[9px] uppercase">Início</p><p>{formData.pei_calendar.start_date}</p></div>
                                <div><p className="font-black text-gray-400 text-[9px] uppercase">Revisão</p><p>{formData.pei_calendar.review_date}</p></div>
                            </div>
                        </section>

                        {/* PERFIL */}
                        <section className="space-y-4">
                            <h2 className="bg-indigo-50 p-2 text-indigo-800 font-black uppercase text-xs tracking-widest border-l-4 border-indigo-600">III. Perfil de Desenvolvimento</h2>
                            <div className="space-y-4 text-xs">
                                <div><p className="font-black text-indigo-600 uppercase text-[9px]">Cognitivo</p><p className="leading-relaxed">{formData.student_profile.cognitive}</p></div>
                                <div><p className="font-black text-indigo-600 uppercase text-[9px]">Comunicação</p><p className="leading-relaxed">{formData.student_profile.communicative}</p></div>
                                <div><p className="font-black text-indigo-600 uppercase text-[9px]">Aprendizagem</p><p className="leading-relaxed">{formData.learning_characterization}</p></div>
                            </div>
                        </section>

                        {/* PLANEJAMENTO */}
                        <section className="space-y-4">
                            <h2 className="bg-indigo-50 p-2 text-indigo-800 font-black uppercase text-xs tracking-widest border-l-4 border-indigo-600">IV. Planejamento por Áreas</h2>
                            <table className="w-full text-[10px] border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left">Área</th>
                                        <th className="border p-2 text-left">Habilidades / Metodologia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.pedagogical_planning.map((item, i) => (
                                        <tr key={i}>
                                            <td className="border p-2 font-bold w-1/4">{item.area}</td>
                                            <td className="border p-2">
                                                <p><span className="font-bold">Habilidades:</span> {item.skills}</p>
                                                <p className="mt-1"><span className="font-bold">Estratégias:</span> {item.methodology}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>

                        {/* PARECER */}
                        <section className="space-y-4 pt-10">
                            <h2 className="bg-indigo-50 p-2 text-indigo-800 font-black uppercase text-xs tracking-widest border-l-4 border-indigo-600">V. Parecer Semestral</h2>
                            <p className="text-xs leading-relaxed italic">{formData.semester_report || 'Não redigido.'}</p>
                        </section>

                        <div className="pt-20 grid grid-cols-2 gap-20 text-center">
                            <div className="border-t border-black pt-2"><p className="text-[10px] font-black uppercase">Responsável AEE</p></div>
                            <div className="border-t border-black pt-2"><p className="text-[10px] font-black uppercase">Direção / Coordenação</p></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpecialEducationForm;
