import React from 'react';

interface DocumentHeaderProps {
  subtitle?: string;
  documentType?: string;
  className?: string;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ subtitle, documentType, className = '' }) => {
  return (
    <div className={`flex items-center justify-between border-b-2 border-black pb-4 mb-6 w-full max-w-[210mm] mx-auto print:flex print:visible font-sans ${className}`}>
      {/* Lado Esquerdo: Logo da Escola Cívico-Militar */}
      <div className="flex items-center justify-start shrink-0">
        <img
          src="/logo-escola-oficial.png"
          alt="Logo Escola Cívico-Militar"
          className="h-24 w-auto object-contain max-w-[120px]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/logo-escola.png';
          }}
        />
      </div>

      {/* Meio: Texto Oficial do Estado / SEDUC do Print do Usuário */}
      <div className="text-center flex-1 mx-3 space-y-0.5">
        <h1 className="text-xs md:text-sm font-bold uppercase text-black leading-tight">
          Governo do Estado de Mato Grosso
        </h1>
        <h2 className="text-[11px] md:text-xs font-bold uppercase text-black leading-tight">
          Secretaria de Estado de Educação
        </h2>
        <h3 className="text-[11px] md:text-xs font-bold uppercase text-black leading-tight">
          Secretaria Adjunta de Gestão Regional
        </h3>
        <h4 className="text-[10px] md:text-[11px] font-bold uppercase text-black leading-tight">
          Superintendência de Gestão das Diretorias Regionais
        </h4>
        <h5 className="text-[10px] md:text-[11px] font-bold uppercase text-black leading-tight">
          Diretoria Regional de Educação de Sinop
        </h5>
        <h6 className="text-xs md:text-sm font-black uppercase text-black leading-tight pt-0.5">
          Escola Estadual Cívico-Militar André Antônio Maggi
        </h6>

        {documentType && (
          <p className="text-[10px] font-black uppercase text-indigo-900 tracking-widest pt-1 border-t border-black/20 mt-1">
            {documentType}
          </p>
        )}
        {subtitle && (
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">
            {subtitle}
          </p>
        )}
      </div>

      {/* Lado Direito: Brasão do Estado de Mato Grosso */}
      <div className="flex items-center justify-end shrink-0">
        <img
          src="/brasao_mt.png"
          alt="Brasão do Estado de Mato Grosso"
          className="h-24 w-auto object-contain max-w-[120px]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/SEDUC 2.jpg';
          }}
        />
      </div>
    </div>
  );
};

export default DocumentHeader;
