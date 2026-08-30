import React from 'react';
import { ShieldCheck, QrCode, CheckCircle2, Lock, ExternalLink } from 'lucide-react';
import { ElectronicSignatureProof } from '../types';
import { getVerificationUrl, getQrCodeUrl } from '../utils/signatureService';

interface ElectronicSignatureStampProps {
  signature: ElectronicSignatureProof;
  compact?: boolean;
  onVerify?: (verificationCode: string) => void;
}

export const ElectronicSignatureStamp: React.FC<ElectronicSignatureStampProps> = ({
  signature,
  compact = false,
  onVerify
}) => {
  const verificationUrl = getVerificationUrl(signature.verificationCode);
  const qrCodeUrl = getQrCodeUrl(verificationUrl);

  const formattedDate = new Date(signature.signedAt).toLocaleDateString('pt-BR');
  const formattedTime = new Date(signature.signedAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Resumo do Hash SHA-256 para exibição (ex: 8f3a9b2c...a1b2c3d4)
  const shortHash = signature.documentHash
    ? `${signature.documentHash.substring(0, 16)}...${signature.documentHash.substring(signature.documentHash.length - 8)}`
    : 'SHA256-AUTHENTICATED';

  if (compact) {
    return (
      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
            <ShieldCheck size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-black text-emerald-900 uppercase text-[10px]">
              <span>Assinado Eletronicamente</span>
              <CheckCircle2 size={12} className="text-emerald-600" />
            </div>
            <p className="text-[11px] font-bold text-slate-800 uppercase">
              {signature.signerName} • <span className="text-slate-500 font-normal">{signature.signerRole}</span>
            </p>
            <p className="text-[9px] font-mono text-slate-500">
              {formattedDate} {formattedTime} • Cód: <strong>{signature.verificationCode}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onVerify ? onVerify(signature.verificationCode) : window.open(verificationUrl, '_blank')}
          className="px-2.5 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
        >
          <ExternalLink size={10} /> Validar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full my-4 p-4 sm:p-5 bg-white border-2 border-emerald-600/60 rounded-2xl shadow-sm print:border-emerald-800 print:p-3 print:my-2 text-slate-900 relative overflow-hidden">
      {/* Faixa Superior do Selo */}
      <div className="flex items-center justify-between pb-3 border-b border-emerald-200 print:pb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-700 text-white rounded-lg flex items-center justify-center font-black shadow-sm print:w-6 print:h-6">
            <ShieldCheck size={16} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 block leading-tight">
              Selo de Autenticidade Digital • SEDUC-MT / DRE Sinop
            </span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">
              EE Cívico-Militar André Antônio Maggi • Lei Federal nº 14.063/2020
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100/80 text-emerald-900 rounded-full border border-emerald-300 text-[8px] font-black uppercase tracking-wider">
          <Lock size={10} className="text-emerald-700" />
          <span>Assinatura Eletrônica Válida</span>
        </div>
      </div>

      {/* Conteúdo Principal do Carimbo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 print:pt-2 items-center">
        <div className="md:col-span-3 space-y-1.5 text-left">
          <p className="text-[11px] leading-snug">
            Documento assinado eletronicamente por{' '}
            <strong className="text-slate-900 uppercase font-black">{signature.signerName}</strong>,{' '}
            na função de <strong className="text-slate-800 uppercase font-bold">{signature.signerRole}</strong>
            {signature.signerCpfOrMatricula && ` (Identificação: ${signature.signerCpfOrMatricula})`}, em{' '}
            <strong>{formattedDate}</strong> às <strong>{formattedTime}</strong>, conforme horário oficial de Mato Grosso.
          </p>

          <p className="text-[9px] text-slate-600 leading-tight">
            <strong>Base Legal:</strong> {signature.legalBasis || 'Lei Federal nº 14.063/2020 e Art. 10, § 2º da MP nº 2.200-2/2001'}.
          </p>

          <div className="flex items-center gap-3 pt-1 text-[9px] font-mono text-slate-600 flex-wrap">
            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Cód. Verificador: <strong className="text-emerald-800 font-black">{signature.verificationCode}</strong>
            </span>
            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Hash SHA-256: <strong className="text-slate-700 font-bold">{shortHash}</strong>
            </span>
          </div>

          <p className="text-[8px] text-slate-500 font-medium pt-0.5">
            A autenticidade e integridade deste documento podem ser conferidas online através do endereço oficial{' '}
            <span className="text-emerald-700 underline font-mono">{verificationUrl}</span>
          </p>
        </div>

        {/* QR Code de Validação */}
        <div className="flex flex-col items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl shrink-0 text-center">
          <img
            src={qrCodeUrl}
            alt="QR Code de Validação Oficial"
            className="w-20 h-20 print:w-16 print:h-16 object-contain rounded-md shadow-sm border border-white"
            loading="lazy"
          />
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-tight mt-1">
            Escaneie p/ Validar
          </span>
        </div>
      </div>
    </div>
  );
};

export default ElectronicSignatureStamp;
