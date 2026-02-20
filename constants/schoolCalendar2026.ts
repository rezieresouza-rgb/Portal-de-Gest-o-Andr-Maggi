
import { SchoolCalendarData } from '../types';

export const SCHOOL_CALENDAR_2026: SchoolCalendarData = {
  ano_letivo: 2026,
  unidade_escolar: "158330 - EE ANDRÉ ANTONIO MAGGI",
  municipio: "Colíder - MT",
  meses: [
    {
      mes: "Janeiro",
      eventos: [
        { dia: 1, tipo: "FN - Feriado Nacional", categoria: 'FERIADO' },
        { dia: 2, tipo: "PF - Período de Férias", categoria: 'FERIAS' },
        { dia: 18, tipo: "PF - Férias", categoria: 'FERIAS' },
        { dia: 19, tipo: "SP - Semana Pedagógica", categoria: 'PEDAGOGICO' },
        { dia: 26, tipo: "SP - Semana Pedagógica", categoria: 'PEDAGOGICO' }
      ]
    },
    {
      mes: "Fevereiro",
      orientativo: "001/2026 - Paz em Ação na Escola",
      eventos: [
        { dia: 2, tipo: "IAL - Início do Ano Letivo", categoria: 'LETIVO' },
        { dia: 9, tipo: "RPM - Reunião de Pais e Mestres", categoria: 'PEDAGOGICO' },
        { dia: 17, tipo: "PFA - Ponto Facultativo", categoria: 'FERIADO' },
        { dia: 23, tipo: "CD - Reunião do CDCE", categoria: 'ADMINISTRATIVO' }
      ]
    },
    {
      mes: "Março",
      orientativo: "002/2026 - Semana Escolar de Combate à Violência Contra a Mulher",
      eventos: [
        { dia: 2, tipo: "RA - Reunião Administrativa", categoria: 'ADMINISTRATIVO' },
        { dia: 9, tipo: "Semana Letiva", categoria: 'LETIVO' },
        { dia: 16, tipo: "Semana Letiva", categoria: 'LETIVO' },
        { dia: 23, tipo: "Semana Letiva", categoria: 'LETIVO' },
        { dia: 30, tipo: "Semana Letiva", categoria: 'LETIVO' }
      ]
    },
    {
      mes: "Abril",
      orientativo: "003/2026 - Semana Nacional da Convivência Escolar e Prevenção ao Bullying",
      eventos: [
        { dia: 3, tipo: "FN - Feriado Nacional", categoria: 'FERIADO' },
        { dia: 10, tipo: "RA - Reunião Administrativa", categoria: 'ADMINISTRATIVO' },
        { dia: 17, tipo: "RP - Reunião Pedagógica", categoria: 'PEDAGOGICO' },
        { dia: 21, tipo: "FN - Feriado Nacional", categoria: 'FERIADO' },
        { dia: 22, tipo: "LR - Limite para Reclassificação", categoria: 'ADMINISTRATIVO' }
      ]
    },
    {
      mes: "Maio",
      orientativo: "004/2026 - Maio Laranja",
      eventos: [
        { dia: 1, tipo: "FN - Feriado Nacional", categoria: 'FERIADO' },
        { dia: 4, tipo: "RPM - Reunião de Pais e Mestres", categoria: 'PEDAGOGICO' },
        { dia: 11, tipo: "RA - Reunião Administrativa", categoria: 'ADMINISTRATIVO' }
      ]
    },
    {
      mes: "Junho",
      orientativo: "005/2026 - Prevenção e Erradicação do Trabalho Infantil",
      eventos: [
        { dia: 4, tipo: "FN - Feriado Nacional", categoria: 'FERIADO' },
        { dia: 7, tipo: "RA - Reunião Administrativa", categoria: 'ADMINISTRATIVO' },
        { dia: 23, tipo: "FM - Feriado Municipal", categoria: 'FERIADO' }
      ]
    },
    {
      mes: "Julho",
      orientativo: "006/2026 - Educação para Direitos Humanos, Ambientais e Climáticos",
      eventos: [
        { dia: 6, tipo: "PF - Férias", categoria: 'FERIAS' },
        { dia: 13, tipo: "PF - Férias", categoria: 'FERIAS' },
        { dia: 20, tipo: "PF - Férias", categoria: 'FERIAS' },
        { dia: 27, tipo: "RPM - Reunião de Pais e Mestres", categoria: 'PEDAGOGICO' }
      ]
    },
    {
      mes: "Agosto",
      orientativo: "007/2026 - Agosto Lilás",
      eventos: [
        { dia: 3, tipo: "RA - Reunião Administrativa", categoria: 'ADMINISTRATIVO' },
        { dia: 10, tipo: "Semana Letiva", categoria: 'LETIVO' },
        { dia: 17, tipo: "Semana Letiva", categoria: 'LETIVO' }
      ]
    },
    {
      mes: "Setembro",
      orientativo: "008/2026 - Setembro Amarelo",
      eventos: [
        { dia: 7, tipo: "FN - Feriado Nacional", categoria: 'FERIADO' },
        { dia: 14, tipo: "RA - Reunião Administrativa", categoria: 'ADMINISTRATIVO' },
        { dia: 28, tipo: "RP - Reunião Pedagógica", categoria: 'PEDAGOGICO' }
      ]
    },
    {
      mes: "Outubro",
      orientativo: "009/2026 - Outubro Rosa",
      eventos: [
        { dia: 1, tipo: "FB - Fim do Bimestre", categoria: 'LETIVO' },
        { dia: 2, tipo: "IB - Início do Bimestre", categoria: 'LETIVO' },
        { dia: 12, tipo: "FN - Feriado Nacional", categoria: 'FERIADO' },
        { dia: 19, tipo: "RPM - Reunião de Pais e Mestres", categoria: 'PEDAGOGICO' }
      ]
    },
    {
      mes: "Novembro",
      orientativo: "010/2026 - Novembro Azul",
      eventos: [
        { dia: 2, tipo: "FN - Feriado Nacional", categoria: 'FERIADO' },
        { dia: 15, tipo: "FN - Feriado Nacional", categoria: 'FERIADO' }
      ]
    },
    {
      mes: "Dezembro",
      eventos: [
        { dia: 19, tipo: "FM - Feriado Municipal", categoria: 'FERIADO' },
        { dia: 20, tipo: "PF - Férias", categoria: 'FERIAS' },
        { dia: 26, tipo: "PF - Férias", categoria: 'FERIAS' },
        { dia: 31, tipo: "PF - Férias", categoria: 'FERIAS' }
      ]
    }
  ]
};
