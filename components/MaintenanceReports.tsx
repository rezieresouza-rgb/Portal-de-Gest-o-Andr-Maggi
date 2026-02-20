
import React, { useState, useRef } from 'react';
import {
    FileText,
    Printer,
    ArrowLeft,
    Loader2,
    Plus,
    Trash2,
    Upload,
    Image as ImageIcon,
    Save,
    Edit3,
    Eye,
    Camera
} from 'lucide-react';

interface MaintenanceItem {
    id: string;
    title: string;
    description: string;
    serviceValue: string;
    materialValue?: string; // Optional
    nfs: string;
    date: string;
    beforePhoto?: string;
    afterPhoto?: string;
}

interface ReportData {
    referenceYear: number;
    city: string;
    schoolName: string;
    maintenances: MaintenanceItem[];
    smallRepairs: string[];
    signatures: {
        director: string;
        treasurer: string;
    };
}

const DEFAULT_DATA: ReportData = {
    referenceYear: new Date().getFullYear(),
    city: 'Colíder-MT',
    schoolName: 'ESCOLA ESTADUAL ANDRÉ ANTÔNIO MAGGI',
    maintenances: [
        {
            id: '1',
            title: 'Manutenção do Telhado',
            description: 'Troca de telha (cerâmica por termoacústica 30 mm) em 332 m².',
            serviceValue: 'R$ 46.760,87 (Material Incluso)',
            nfs: '2025-2544 e 2025-15446',
            date: '03/08/2025'
        },
        {
            id: '2',
            title: 'Instalação de Suporte para Reservatório',
            description: 'Suporte pré-moldado em concreto e reservatório de 3.000 L.',
            serviceValue: 'R$ 4.500,00',
            materialValue: 'R$ 3.300,00',
            nfs: '2025-145154 e 2025-54677',
            date: '15/09/2025'
        }
    ],
    smallRepairs: [
        'Reposição de vidros de janelas em salas de aula',
        'Limpeza e desinfecção de caixas d\'água',
        'Troca de tomadas e pequenos reparos elétricos',
        'Manutenção preventiva em portão eletrônico',
        'Solda e reforço de grades dos portões de acesso'
    ],
    signatures: {
        director: 'Maria XXXXX',
        treasurer: 'José XXXXX'
    }
};

const MaintenanceReports: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [reportData, setReportData] = useState<ReportData>(DEFAULT_DATA);
    const [isPrinting, setIsPrinting] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

    // Refs for file inputs are handled dynamically or via a temporary state/ref approach if needed, 
    // but typically we can just trigger a click on a hidden input generated on the fly or referenced via ID.
    // For simplicity, we'll use a hidden input logic per item or a shared handler.

    const handlePrint = async () => {
        setIsPrinting(true);
        const element = document.getElementById('report-content');
        if (element) {
            try {
                // @ts-ignore
                await window.html2pdf().set({
                    margin: [10, 10, 10, 10],
                    filename: `Relatorio_Servicos_Executados_${reportData.referenceYear}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                }).from(element).save();
            } catch (error) {
                console.error("Erro ao imprimir:", error);
                alert("Erro ao gerar PDF.");
            }
        }
        setIsPrinting(false);
    };

    const handleAddMaintenance = () => {
        setReportData(prev => ({
            ...prev,
            maintenances: [
                ...prev.maintenances,
                {
                    id: Math.random().toString(36).substr(2, 9),
                    title: 'Nova Manutenção',
                    description: '',
                    serviceValue: '',
                    nfs: '',
                    date: ''
                }
            ]
        }));
    };

    const handleRemoveMaintenance = (id: string) => {
        setReportData(prev => ({
            ...prev,
            maintenances: prev.maintenances.filter(item => item.id !== id)
        }));
    };

    const handleUpdateMaintenance = (id: string, field: keyof MaintenanceItem, value: string) => {
        setReportData(prev => ({
            ...prev,
            maintenances: prev.maintenances.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

    const handlePhotoUpload = (id: string, type: 'before' | 'after', event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReportData(prev => ({
                    ...prev,
                    maintenances: prev.maintenances.map(item =>
                        item.id === id ? { ...item, [type === 'before' ? 'beforePhoto' : 'afterPhoto']: reader.result as string } : item
                    )
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = (id: string, type: 'before' | 'after') => {
        setReportData(prev => ({
            ...prev,
            maintenances: prev.maintenances.map(item =>
                item.id === id ? { ...item, [type === 'before' ? 'beforePhoto' : 'afterPhoto']: undefined } : item
            )
        }));
    };

    const handleAddSmallRepair = () => {
        setReportData(prev => ({
            ...prev,
            smallRepairs: [...prev.smallRepairs, '']
        }));
    };

    const handleUpdateSmallRepair = (index: number, value: string) => {
        setReportData(prev => {
            const newRepairs = [...prev.smallRepairs];
            newRepairs[index] = value;
            return { ...prev, smallRepairs: newRepairs };
        });
    };

    const handleRemoveSmallRepair = (index: number) => {
        setReportData(prev => ({
            ...prev,
            smallRepairs: prev.smallRepairs.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header Controls */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 no-print sticky top-4 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Relatórios de Manutenção</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ano de Referência:</span>
                            <input
                                type="number"
                                value={reportData.referenceYear}
                                onChange={(e) => setReportData({ ...reportData, referenceYear: parseInt(e.target.value) })}
                                className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                        className={`px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg transition-all flex items-center gap-2 ${viewMode === 'edit'
                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                    >
                        {viewMode === 'edit' ? <><Eye size={18} /> Visualizar</> : <><Edit3 size={18} /> Editar</>}
                    </button>

                    <button
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isPrinting ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                        Imprimir
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* ---------------- EDITOR MODE ---------------- */}
                {viewMode === 'edit' && (
                    <div className="w-full space-y-8 animate-in slide-in-from-left duration-300">
                        {/* Basic Info */}
                        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <FileText size={16} /> Informações Básicas
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Cidade</label>
                                    <input
                                        type="text"
                                        value={reportData.city}
                                        onChange={(e) => setReportData({ ...reportData, city: e.target.value })}
                                        className="w-full p-3 bg-gray-50 rounded-xl font-medium text-sm border-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nome da Escola</label>
                                    <input
                                        type="text"
                                        value={reportData.schoolName}
                                        onChange={(e) => setReportData({ ...reportData, schoolName: e.target.value })}
                                        className="w-full p-3 bg-gray-50 rounded-xl font-medium text-sm border-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Signatures */}
                        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Edit3 size={16} /> Assinaturas
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Diretor(a)</label>
                                    <input
                                        type="text"
                                        value={reportData.signatures.director}
                                        onChange={(e) => setReportData({ ...reportData, signatures: { ...reportData.signatures, director: e.target.value } })}
                                        className="w-full p-3 bg-gray-50 rounded-xl font-medium text-sm border-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tesoureiro(a)</label>
                                    <input
                                        type="text"
                                        value={reportData.signatures.treasurer}
                                        onChange={(e) => setReportData({ ...reportData, signatures: { ...reportData.signatures, treasurer: e.target.value } })}
                                        className="w-full p-3 bg-gray-50 rounded-xl font-medium text-sm border-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Maintenances */}
                        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <FileText size={16} /> Manutenções Realizadas
                                </h3>
                                <button onClick={handleAddMaintenance} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {reportData.maintenances.map((item, index) => (
                                    <div key={item.id} className="p-4 bg-gray-50 rounded-2xl relative border border-gray-100 group">
                                        <button
                                            onClick={() => handleRemoveMaintenance(item.id)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <input
                                                    placeholder="Título da Manutenção"
                                                    value={item.title}
                                                    onChange={(e) => handleUpdateMaintenance(item.id, 'title', e.target.value)}
                                                    className="w-full p-2 bg-transparent font-bold text-sm border-b border-gray-200 focus:border-blue-500 outline-none placeholder:text-gray-400"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <textarea
                                                    placeholder="Descrição detalhada..."
                                                    value={item.description}
                                                    onChange={(e) => handleUpdateMaintenance(item.id, 'description', e.target.value)}
                                                    className="w-full p-2 bg-white rounded-lg text-sm border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                                                />
                                            </div>
                                            <input
                                                placeholder="Valor Serviço"
                                                value={item.serviceValue}
                                                onChange={(e) => handleUpdateMaintenance(item.id, 'serviceValue', e.target.value)}
                                                className="w-full p-2 bg-white rounded-lg text-xs"
                                            />
                                            <input
                                                placeholder="Valor Material (Opcional)"
                                                value={item.materialValue || ''}
                                                onChange={(e) => handleUpdateMaintenance(item.id, 'materialValue', e.target.value)}
                                                className="w-full p-2 bg-white rounded-lg text-xs"
                                            />
                                            <input
                                                placeholder="Nº NFs"
                                                value={item.nfs}
                                                onChange={(e) => handleUpdateMaintenance(item.id, 'nfs', e.target.value)}
                                                className="w-full p-2 bg-white rounded-lg text-xs"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Data (dd/mm/aaaa)"
                                                value={item.date}
                                                onChange={(e) => handleUpdateMaintenance(item.id, 'date', e.target.value)}
                                                className="w-full p-2 bg-white rounded-lg text-xs"
                                            />

                                            {/* PHOTO UPLOADS FOR THIS ITEM */}
                                            <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-2">
                                                {/* BEFORE PHOTO */}
                                                <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center min-h-[100px] bg-white">
                                                    {item.beforePhoto ? (
                                                        <>
                                                            <img src={item.beforePhoto} alt="Antes" className="w-full h-32 object-cover rounded-lg" />
                                                            <button
                                                                onClick={() => handleRemovePhoto(item.id, 'before')}
                                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                            <div className="absolute bottom-1 right-1 px-2 py-0.5 bg-black/50 text-white text-[10px] uppercase font-bold rounded">
                                                                Antes
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 w-full h-full justify-center hover:text-blue-500 transition-colors">
                                                            <Camera size={24} />
                                                            <span className="text-xs font-bold uppercase">Foto Antes</span>
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={(e) => handlePhotoUpload(item.id, 'before', e)}
                                                            />
                                                        </label>
                                                    )}
                                                </div>

                                                {/* AFTER PHOTO */}
                                                <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center min-h-[100px] bg-white">
                                                    {item.afterPhoto ? (
                                                        <>
                                                            <img src={item.afterPhoto} alt="Depois" className="w-full h-32 object-cover rounded-lg" />
                                                            <button
                                                                onClick={() => handleRemovePhoto(item.id, 'after')}
                                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                            <div className="absolute bottom-1 right-1 px-2 py-0.5 bg-black/50 text-white text-[10px] uppercase font-bold rounded">
                                                                Depois
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 w-full h-full justify-center hover:text-emerald-500 transition-colors">
                                                            <Camera size={24} />
                                                            <span className="text-xs font-bold uppercase">Foto Depois</span>
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={(e) => handlePhotoUpload(item.id, 'after', e)}
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Small Repairs */}
                        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <FileText size={16} /> Pequenas Manutenções
                                </h3>
                                <button onClick={handleAddSmallRepair} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {reportData.smallRepairs.map((repair, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            value={repair}
                                            onChange={(e) => handleUpdateSmallRepair(index, e.target.value)}
                                            className="flex-1 p-3 bg-gray-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Descrição do reparo..."
                                        />
                                        <button
                                            onClick={() => handleRemoveSmallRepair(index)}
                                            className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {/* ---------------- PREVIEW MODE ---------------- */}
                <div className={`transition-all duration-300 ${viewMode === 'edit' ? 'hidden lg:block lg:w-[210mm]' : 'w-full flex justify-center'}`}>
                    <div className="bg-gray-50 p-8 rounded-[3rem] overflow-auto shadow-inner">
                        <div id="report-content" className="w-[210mm] min-h-[297mm] mx-auto bg-white p-[15mm] shadow-2xl text-gray-900 font-serif relative">

                            {/* HEADER */}
                            <div className="border-b-2 border-black pb-6 mb-8 text-center space-y-2">
                                <h1 className="text-xl font-black uppercase tracking-wide">Relatório de Serviços Executados</h1>
                                <h2 className="text-sm font-bold uppercase">{reportData.schoolName}</h2>
                                <p className="text-xs uppercase text-gray-600">Ano de Referência: {reportData.referenceYear}</p>
                            </div>

                            <div className="space-y-8">
                                {/* I - IDENTIFICAÇÃO */}
                                <section>
                                    <h3 className="text-sm font-black uppercase bg-gray-100 p-2 mb-4 border-l-4 border-black">I - Identificação</h3>
                                    <div className="grid grid-cols-1 gap-2 text-xs uppercase leading-relaxed ml-2">
                                        <p><span className="font-bold">Unidade Escolar:</span> {reportData.schoolName}</p>
                                        <p><span className="font-bold">Município:</span> {reportData.city.toUpperCase()}</p>
                                        <p><span className="font-bold">Imóvel Próprio:</span> ( X ) SIM  (  ) NÃO</p>
                                    </div>
                                </section>

                                {/* II - MANUTENÇÕES */}
                                <section>
                                    <h3 className="text-sm font-black uppercase bg-gray-100 p-2 mb-4 border-l-4 border-black">II - Manutenções Realizadas</h3>
                                    <p className="text-[10px] italic mb-4 ml-2">Conforme Art. 36° (inciso XIII) da IN Nº 010/2024/GS/SEDUC/MT</p>
                                    <div className="space-y-6 ml-2">
                                        {reportData.maintenances.map((item, idx) => (
                                            <div key={item.id} className="border border-gray-300 p-4 rounded-lg break-inside-avoid">
                                                <h4 className="font-bold text-xs uppercase mb-2">{idx + 1}) {item.title}</h4>
                                                <p className="text-xs mb-2 whitespace-pre-line">{item.description}</p>
                                                <div className={`grid ${item.materialValue ? 'grid-cols-2' : 'grid-cols-1'} gap-4 text-[10px] bg-gray-50 p-2 rounded`}>
                                                    <p><span className="font-bold">Valor Serviço:</span> {item.serviceValue}</p>
                                                    {item.materialValue && <p><span className="font-bold">Valor Materiais:</span> {item.materialValue}</p>}
                                                    <p><span className="font-bold">Nº das NFs:</span> {item.nfs}</p>
                                                    <p><span className="font-bold">Data das NFs:</span> {item.date}</p>
                                                </div>

                                                {/* PHOTOS GRID */}
                                                {(item.beforePhoto || item.afterPhoto) && (
                                                    <div className="grid grid-cols-2 gap-4 mt-4 border-t border-gray-200 pt-4">
                                                        <div className="space-y-1">
                                                            {item.beforePhoto && (
                                                                <>
                                                                    <div className="text-[10px] font-bold uppercase text-center bg-gray-100 py-1">Antes</div>
                                                                    <img src={item.beforePhoto} alt="Antes" className="w-full h-32 object-cover border border-gray-200" />
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            {item.afterPhoto && (
                                                                <>
                                                                    <div className="text-[10px] font-bold uppercase text-center bg-gray-100 py-1">Depois</div>
                                                                    <img src={item.afterPhoto} alt="Depois" className="w-full h-32 object-cover border border-gray-200" />
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* III - PEQUENAS MANUTENÇÕES */}
                                <section className="break-inside-avoid">
                                    <h3 className="text-sm font-black uppercase bg-gray-100 p-2 mb-4 border-l-4 border-black">III - Pequenas Manutenções (Rotina)</h3>
                                    <p className="text-[10px] italic mb-4 ml-2">Execuções diretas sem solicitação externa via sistema.</p>
                                    <ul className="list-disc list-inside text-xs uppercase ml-4 space-y-1">
                                        {reportData.smallRepairs.map((repair, idx) => (
                                            <li key={idx} className="break-words">{repair}</li>
                                        ))}
                                    </ul>
                                </section>

                                {/* ASSINATURAS */}
                                <div className="pt-16 mt-16 border-t-2 border-black grid grid-cols-2 gap-20 text-center uppercase text-[10px] font-bold break-inside-avoid">
                                    <div className="space-y-1">
                                        <div className="h-px bg-black w-3/4 mx-auto mb-2"></div>
                                        <p>{reportData.signatures.director}</p>
                                        <p className="text-[8px] text-gray-500">Diretora Escolar / Presidente CDCE</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="h-px bg-black w-3/4 mx-auto mb-2"></div>
                                        <p>{reportData.signatures.treasurer}</p>
                                        <p className="text-[8px] text-gray-500">Tesoureiro do CDCE</p>
                                    </div>
                                </div>

                                <div className="text-center mt-12 text-[10px] uppercase font-bold text-gray-400">
                                    {reportData.city}, Dezembro de {reportData.referenceYear}
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceReports;
