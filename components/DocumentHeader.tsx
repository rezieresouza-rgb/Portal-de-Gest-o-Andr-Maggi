
import React from 'react';

const DocumentHeader: React.FC = () => {
    return (
        <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6 w-full max-w-[210mm] mx-auto print:flex print:visible font-serif">
            <div className="flex items-center gap-4">
                <img
                    src="/SEDUC 2.jpg"
                    alt="Logo SEDUC"
                    className="h-16 w-auto object-contain"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                />
                <img
                    src="/dre sinop.jpg"
                    alt="Logo DRE Sinop"
                    className="h-16 w-auto object-contain"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                />
            </div>

            <div className="text-center flex-1 px-4 leading-tight">
                <h2 className="text-[10px] font-bold uppercase tracking-wide">Estado de Mato Grosso</h2>
                <h2 className="text-[10px] font-bold uppercase tracking-wide">Secretaria de Estado de Educação</h2>
                <h2 className="text-[10px] font-bold uppercase tracking-wide">Diretoria Regional de Educação de Sinop</h2>
                <h1 className="text-sm font-black uppercase mt-2 tracking-wider">Escola Estadual André Antônio Maggi</h1>
            </div>

            <div className="flex items-center justify-end">
                <img
                    src="/logo-escola.png"
                    alt="Logo Escola"
                    className="h-16 w-auto object-contain"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                />
            </div>
        </div>
    );
};

export default DocumentHeader;
