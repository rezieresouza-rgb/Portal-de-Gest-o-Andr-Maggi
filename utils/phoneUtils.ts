/**
 * Utilitários de extração e formatação de telefones dos responsáveis
 * cadastrados na Secretaria Escolar para integração com o WhatsApp.
 */

export interface ParsedPhone {
  raw: string;
  cleaned: string; // Ex: 5566996427075
  formatted: string; // Ex: (66) 99642-7075
  label?: string; // Ex: Mãe, Pai, Recado
}

/**
 * Extrai todos os números de telefone válidos de uma string de contato da secretaria,
 * que pode conter múltiplos telefones separados por '/', ';', 'e', 'ou' ou anotações como (Mãe), (Pai).
 */
export function extractPhoneNumbers(rawContact?: string): ParsedPhone[] {
  if (!rawContact || typeof rawContact !== 'string') return [];

  // Dividir por separadores comuns
  const segments = rawContact.split(/[/;|\n]|(?:\sou\s)|(?:\se\s)/i);
  const result: ParsedPhone[] = [];
  const seenDigits = new Set<string>();

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;

    // Detectar rótulo (ex: "mãe", "pai", "avó", "tia")
    let label = '';
    const lower = trimmed.toLowerCase();
    if (lower.includes('mãe') || lower.includes('mae')) label = 'Mãe';
    else if (lower.includes('pai')) label = 'Pai';
    else if (lower.includes('avó') || lower.includes('avo') || lower.includes('avô')) label = 'Avós';
    else if (lower.includes('tia') || lower.includes('tio')) label = 'Tios';
    else if (lower.includes('recado')) label = 'Recado';

    // Extrair apenas dígitos
    let digits = trimmed.replace(/\D/g, '');

    // Tratar DDD com zero inicial (ex: 066 -> 66)
    if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
      digits = digits.substring(1);
    }

    // Se já começa com DDI 55
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      digits = digits.substring(2);
    }

    // Número brasileiro padrão com DDD: 10 dígitos (fixo) ou 11 dígitos (celular)
    if (digits.length === 10 || digits.length === 11) {
      const fullDigits = `55${digits}`;
      if (!seenDigits.has(fullDigits)) {
        seenDigits.add(fullDigits);
        const ddd = digits.substring(0, 2);
        const number = digits.substring(2);
        const formatted = digits.length === 11
          ? `(${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`
          : `(${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;

        result.push({
          raw: trimmed,
          cleaned: fullDigits,
          formatted,
          label: label || undefined
        });
      }
    } else if (digits.length === 8 || digits.length === 9) {
      // Sem DDD informado, assume DDD padrão da escola em Colíder/Sinop (66)
      const fullDigits = `5566${digits}`;
      if (!seenDigits.has(fullDigits)) {
        seenDigits.add(fullDigits);
        const formatted = digits.length === 9
          ? `(66) ${digits.substring(0, 5)}-${digits.substring(5)}`
          : `(66) ${digits.substring(0, 4)}-${digits.substring(4)}`;

        result.push({
          raw: trimmed,
          cleaned: fullDigits,
          formatted,
          label: label || undefined
        });
      }
    } else if (digits.length > 11) {
      // Caso dígitos concatenados de dois números (ex: 6699642707566997151511)
      const matches = digits.match(/(?:[1-9]{2}9?[0-9]{8})/g);
      if (matches) {
        for (const m of matches) {
          const fullDigits = `55${m}`;
          if (!seenDigits.has(fullDigits)) {
            seenDigits.add(fullDigits);
            const ddd = m.substring(0, 2);
            const num = m.substring(2);
            const formatted = m.length === 11
              ? `(${ddd}) ${num.substring(0, 5)}-${num.substring(5)}`
              : `(${ddd}) ${num.substring(0, 4)}-${num.substring(4)}`;

            result.push({
              raw: trimmed,
              cleaned: fullDigits,
              formatted,
              label: label || undefined
            });
          }
        }
      }
    }
  }

  return result;
}

/**
 * Retorna a URL direta para abrir o WhatsApp no navegador/app
 */
export function buildWhatsAppUrl(cleanedPhone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedMessage}`;
}

/**
 * Gera mensagens oficiais padronizadas para envio aos pais
 */
export function generateBuscaAtivaMessage(
  type: 'ABSENCE_TODAY' | 'BOLSA_FAMILIA_ALERT' | 'CONVOCATION' | 'GENERAL_CHECK',
  params: {
    studentName: string;
    className: string;
    guardianName?: string;
    absencesCount?: number;
    attendanceRate?: number;
    customNote?: string;
  }
): string {
  const { studentName, className, guardianName, absencesCount, attendanceRate } = params;
  const saudacao = guardianName ? `Prezado(a) ${guardianName}, responsável pelo(a) estudante` : `Prezado(a) responsável pelo(a) estudante`;

  switch (type) {
    case 'ABSENCE_TODAY':
      return (
        `*ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI*\n` +
        `*NÚCLEO DE BUSCA ATIVA ESCOLAR*\n\n` +
        `${saudacao} *${studentName}* (${className}):\n\n` +
        `Informamos que o(a) estudante foi registrado(a) como *AUSENTE* nas aulas de hoje (${new Date().toLocaleDateString('pt-BR')}).\n\n` +
        `Pedimos a gentileza de responder a esta mensagem informando o motivo da ausência para que possamos realizar o devido registro pedagógico.\n\n` +
        `_Busca ativa escolar EECM André Antônio Maggi_`
      );

    case 'BOLSA_FAMILIA_ALERT':
      return (
        `*ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI*\n` +
        `*ALERTA DE CONDICIONALIDADE - BOLSA FAMÍLIA (MDS/MEC)*\n\n` +
        `${saudacao} *${studentName}* (${className}):\n\n` +
        `Identificamos que o(a) estudante está com frequência escolar de *${attendanceRate || 0}%* neste período (${absencesCount || 0} faltas registradas).\n\n` +
        `⚠️ *AVISO IMPORTANTE:* O Programa Bolsa Família exige frequência escolar mínima de *85%* no Ensino Fundamental (6º ao 9º Ano). Caso a infrequência continue, o benefício financeiro da família poderá ser bloqueado ou suspenso pelo Governo Federal.\n\n` +
        `Solicitamos seu comparecimento urgente à secretaria da escola para regularização e apresentação das justificativas.\n\n` +
        `_Busca ativa escolar EECM André Antônio Maggi_`
      );

    case 'CONVOCATION':
      return (
        `*ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI*\n` +
        `*CONVOCAÇÃO DE COMPARECIMENTO PRESENCIAL*\n\n` +
        `${saudacao} *${studentName}* (${className}):\n\n` +
        `Solicitamos seu comparecimento à Unidade Escolar no prazo de até 48 horas para reunião com a Coordenação Pedagógica / Direção referente à frequência escolar do(a) discente (${absencesCount || 0} faltas acumuladas).\n\n` +
        `A reunião tem como objetivo firmar o Termo de Compromisso e orientar a família quanto às normas do ECA (Lei nº 8.069/1990, Art. 56).\n\n` +
        `_Busca ativa escolar EECM André Antônio Maggi_`
      );

    case 'GENERAL_CHECK':
    default:
      return (
        `*ESCOLA ESTADUAL CÍVICO-MILITAR ANDRÉ ANTÔNIO MAGGI*\n` +
        `*NÚCLEO DE BUSCA ATIVA ESCOLAR*\n\n` +
        `${saudacao} *${studentName}* (${className}):\n\n` +
        `Entramos em contato para verificar a situação de frequência do(a) estudante, que atualmente possui *${absencesCount || 0} faltas* registradas (${attendanceRate || 100}% de presença).\n\n` +
        `Solicitamos um retorno para alinhamento e atualização cadastral.\n\n` +
        `_Busca ativa escolar EECM André Antônio Maggi_`
      );
  }
}
