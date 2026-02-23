
import React, { useState, useEffect } from 'react';
import { Save, X, Calculator, BookOpen, PenTool, MessageSquare, SpellCheck, Star, TrendingUp } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface LearningAssessmentFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const LITERACY_LEVELS = [
    'Pré-silábico',
    'Silábico sem valor sonoro',
    'Silábico com valor sonoro',
    'Silábico-alfabético',
    'Alfabético',
    'Alfabético consolidado'
];

const LearningAssessmentForm: React.FC<LearningAssessmentFormProps> = ({ onClose, onSuccess, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        student_name: '',
        student_code: '',
        reading_score: 0,
        writing_score: 0,
        comprehension_score: 0,
        spelling_score: 0,
        production_score: 0,
        total_score: 0,
        literacy_level: 'Pré-silábico',
        interventions: '',
        methodologies: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    // Update total score whenever a component score changes
    useEffect(() => {
        const total =
            Number(formData.reading_score) +
            Number(formData.writing_score) +
            Number(formData.comprehension_score) +
            Number(formData.spelling_score) +
            Number(formData.production_score);
        setFormData(prev => ({ ...prev, total_score: total }));
    }, [
        formData.reading_score,
        formData.writing_score,
        formData.comprehension_score,
        formData.spelling_score,
        formData.production_score
    ]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData?.id) {
                const { error } = await supabase
                    .from('learning_assessment_records')
                    .update(formData)
                    .eq('id', initialData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('learning_assessment_records')
                    .insert([formData]);
                if (error) throw error;
            }
            onSuccess();
        } catch (error) {
            console.error('Erro ao salvar avaliação:', error);
            alert('Erro ao salvar registro de avaliação.');
        } finally {
            setLoading(false);
        }
    };

    const renderScoreInput = (label: string, field: string, icon: React.ReactNode) => (
        <div className="space-y-1.5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                {icon} {label} (0-10)
            </label>
            <input
                type="number"
                min="0"
                max="10"
                value={(formData as any)[field]}
                onChange={e => setFormData({ ...formData, [field]: parseInt(e.target.value) || 0 })}
                className="w-full bg-white p-3 rounded-xl font-black text-lg text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-100"
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300 font-sans">
            <div className="bg-white rounded-[2rem] w-full max-w-4xl h-[90vh] shadow-2xl border border-white/20 overflow-hidden flex flex-col">
                <div className="p-6 bg-emerald-700 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <span className="bg-white/20 p-2 rounded-lg">📊</span>
                            Sondagem de Alfabetização & Aprendizagem
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Estudante</label>
                            <input required value={formData.student_name} onChange={e => setFormData({ ...formData, student_name: e.target.value })} className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-emerald-100" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Código / Matrícula</label>
                            <input value={formData.student_code} onChange={e => setFormData({ ...formData, student_code: e.target.value })} className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-emerald-100" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 pb-2">Avaliação de Habilidades</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                            {renderScoreInput('Leitura', 'reading_score', <BookOpen size={14} />)}
                            {renderScoreInput('Escrita', 'writing_score', <PenTool size={14} />)}
                            {renderScoreInput('Compreensão', 'comprehension_score', <MessageSquare size={14} />)}
                            {renderScoreInput('Ortografia', 'spelling_score', <SpellCheck size={14} />)}
                            {renderScoreInput('Produção', 'production_score', <PenTool size={14} />)}
                        </div>

                        <div className="mt-4 p-6 bg-indigo-50 rounded-[2rem] flex items-center justify-between border border-indigo-100">
                            <div>
                                <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Geral</h5>
                                <p className="text-3xl font-black text-indigo-700">{formData.total_score} <span className="text-indigo-300 text-sm">/ 50</span></p>
                            </div>
                            <Calculator size={32} className="text-indigo-200" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nível de Alfabetização</label>
                            <div className="grid grid-cols-1 gap-2">
                                {LITERACY_LEVELS.map(level => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, literacy_level: level })}
                                        className={`p-4 rounded-xl text-left text-xs font-bold transition-all border-2 ${formData.literacy_level === level
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md'
                                            : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Intervenções Realizadas</label>
                                <textarea
                                    value={formData.interventions}
                                    onChange={e => setFormData({ ...formData, interventions: e.target.value })}
                                    className="w-full p-4 bg-gray-50 rounded-xl font-medium h-32 resize-none outline-none focus:ring-2 focus:ring-emerald-100"
                                    placeholder="Descreva as intervenções feitas..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Metodologias Aplicadas</label>
                                <textarea
                                    value={formData.methodologies}
                                    onChange={e => setFormData({ ...formData, methodologies: e.target.value })}
                                    className="w-full p-4 bg-gray-50 rounded-xl font-medium h-32 resize-none outline-none focus:ring-2 focus:ring-emerald-100"
                                    placeholder="Descreva as metodologias..."
                                />
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
                    <div className="flex gap-2">
                        {initialData?.id && (
                            <button
                                onClick={() => {
                                    const element = document.getElementById('assessment-pdf-content');
                                    if (element && (window as any).html2pdf) {
                                        (window as any).html2pdf().set({
                                            margin: 10,
                                            filename: `Avaliacao_${formData.student_name}.pdf`,
                                            image: { type: 'jpeg', quality: 0.98 },
                                            html2canvas: { scale: 2 },
                                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                        }).from(element).save();
                                    }
                                }}
                                className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
                            >
                                <span className="p-1.5 bg-white rounded-lg"><TrendingUp size={16} className="text-emerald-600" /></span>
                                Exportar PDF
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-4 rounded-xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all uppercase text-xs tracking-widest">
                            Cancelar
                        </button>
                        <button onClick={handleSubmit} disabled={loading} className="px-10 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 shadow-xl shadow-indigo-200 transition-all flex items-center gap-2">
                            {loading ? 'Salvando...' : <><Save size={18} /> Salvar Avaliação</>}
                        </button>
                    </div>
                </div>

                {/* Hidden PDF Content */}
                <div id="assessment-pdf-content" className="hidden print:block fixed -left-[9999px] top-0 w-[210mm] bg-white p-12 text-gray-900 font-sans">
                    <div className="text-center border-b-2 border-emerald-900 pb-8 mb-10">
                        <h1 className="text-2xl font-black uppercase text-emerald-900">Sondagem de Alfabetização & Aprendizagem</h1>
                    </div>

                    <div className="space-y-8">
                        <section className="space-y-4">
                            <h2 className="bg-emerald-50 p-2 text-emerald-800 font-black uppercase text-xs tracking-widest border-l-4 border-emerald-600">I. Identificação</h2>
                            <div className="grid grid-cols-2 gap-6 text-sm">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase">Estudante</p><p className="font-bold">{formData.student_name}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase">Matrícula</p><p className="font-bold">{formData.student_code}</p></div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="bg-emerald-50 p-2 text-emerald-800 font-black uppercase text-xs tracking-widest border-l-4 border-emerald-600">II. Resultado da Sondagem</h2>
                            <div className="grid grid-cols-5 gap-4">
                                <div className="text-center border p-2 rounded-lg"><p className="text-[8px] font-black uppercase text-gray-400">Leitura</p><p className="text-lg font-black">{formData.reading_score}</p></div>
                                <div className="text-center border p-2 rounded-lg"><p className="text-[8px] font-black uppercase text-gray-400">Escrita</p><p className="text-lg font-black">{formData.writing_score}</p></div>
                                <div className="text-center border p-2 rounded-lg"><p className="text-[8px] font-black uppercase text-gray-400">Compr.</p><p className="text-lg font-black">{formData.comprehension_score}</p></div>
                                <div className="text-center border p-2 rounded-lg"><p className="text-[8px] font-black uppercase text-gray-400">Ortogr.</p><p className="text-lg font-black">{formData.spelling_score}</p></div>
                                <div className="text-center border p-2 rounded-lg"><p className="text-[8px] font-black uppercase text-gray-400">Prod.</p><p className="text-lg font-black">{formData.production_score}</p></div>
                            </div>
                            <div className="p-4 bg-emerald-900 text-white rounded-2xl flex justify-between items-center mt-4">
                                <div>
                                    <p className="text-[8px] font-black uppercase text-emerald-300">Total Acumulado</p>
                                    <p className="text-2xl font-black">{formData.total_score} / 50</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black uppercase text-emerald-300">Nível de Alfabetização</p>
                                    <p className="font-black uppercase">{formData.literacy_level}</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div>
                                <h2 className="bg-emerald-50 p-2 text-emerald-800 font-black uppercase text-xs tracking-widest border-l-4 border-emerald-600 mb-2">III. Intervenções Realizadas</h2>
                                <p className="text-xs leading-relaxed">{formData.interventions || 'Sem registros.'}</p>
                            </div>
                            <div>
                                <h2 className="bg-emerald-50 p-2 text-emerald-800 font-black uppercase text-xs tracking-widest border-l-4 border-emerald-600 mb-2">IV. Metodologias Aplicadas</h2>
                                <p className="text-xs leading-relaxed">{formData.methodologies || 'Sem registros.'}</p>
                            </div>
                        </section>

                        <div className="pt-32 grid grid-cols-2 gap-20 text-center">
                            <div className="border-t border-black pt-2"><p className="text-[10px] font-black uppercase">Professor AEE / APA</p></div>
                            <div className="border-t border-black pt-2"><p className="text-[10px] font-black uppercase">Coordenação Pedagógica</p></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearningAssessmentForm;
