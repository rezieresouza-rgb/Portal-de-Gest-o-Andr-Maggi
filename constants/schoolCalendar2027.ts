import { SchoolCalendarData } from '../types';

export const SCHOOL_CALENDAR_2027: SchoolCalendarData = {
  ano_letivo: 2027,
  unidade_escolar: "158330 - EE ANDRÉ ANTONIO MAGGI",
  municipio: "Colíder - MT",
  meses: [
    {
      mes: "Janeiro",
      eventos: [
        { dia: 1, tipo: "FN - Confraternização Universal", categoria: 'FERIADO' },
        { dia: 4, tipo: "PF - Período de Férias Docentes", categoria: 'FERIAS' },
        { dia: 18, tipo: "PF - Férias", categoria: 'FERIAS' },
        { dia: 25, tipo: "SP - Semana Pedagógica e Planejamento 2027", categoria: 'PEDAGOGICO' }
      ]
    },
    {
      mes: "Fevereiro",
      orientativo: "001/2027 - Acolhimento e Paz na Escola",
      eventos: [
        { dia: 1, tipo: "IAL - Início do Ano Letivo 2027", categoria: 'LETIVO' },
        { dia: 8, tipo: "RPM - Reunião de Pais e Mestres", categoria: 'PEDAGOGICO' },
        { dia: 9, tipo: "Carnaval - Ponto Facultativo", categoria: 'FERIADO' },
        { dia: 10, tipo: "Quarta-feira de Cinzas", categoria: 'FERIADO' },
        { dia: 22, tipo: "CD - Reunião do CDCE", categoria: 'ADMINISTRATIVO' }
      ]
    },
    {
      mes: "Março",
      orientativo: "002/2027 - Semana da Conscientização e Cidadania",
      eventos: [
        { dia: 1, tipo: "RA - Reunião Administrativa", categoria: 'ADMINISTRATIVO' },
        { dia: 8, tipo: "Semana Letiva", categoria: 'LETIVO' },
        { dia: 15, tipo: "Semana Letiva", categoria: 'LETIVO' },
        { dia: 26, tipo: "Sexta-feira Santa", categoria: 'FERIADO' }
      ]
    },
    {
      mes: "Abril",
      orientativo: "003/2027 - Semana Nacional de Prevenção ao Bullying",
      eventos: [
        { dia: 21, tipo: "FN - Tiradentes", categoria: 'FERIADO' },
        { dia: 23, tipo: "FB - Fim do 1º Bimestre", categoria: 'LETIVO' },
        { dia: 26, tipo: "IB - Início do 2º Bimestre", categoria: 'LETIVO' },
        { dia: 30, tipo: "Conselho de Classe do 1º Bimestre", categoria: 'PEDAGOGICO' }
      ]
    },
    {
      mes: "Maio",
      orientativo: "004/2027 - Maio Laranja - Proteção à Criança",
      eventos: [
        { dia: 1, tipo: "FN - Dia do Trabalhador", categoria: 'FERIADO' },
        { dia: 10, tipo: "RA - Reunião Administrativa", categoria: 'ADMINISTRATIVO' },
        { dia: 27, tipo: "Corpus Christi", categoria: 'FERIADO' }
      ]
    },
    {
      mes: "Junho",
      orientativo: "005/2027 - Erradicação do Trabalho Infantil",
      eventos: [
        { dia: 7, tipo: "RA - Reunião Administrativa", categoria: 'ADMINISTRATIVO' },
        { dia: 23, tipo: "FM - Feriado Municipal", categoria: 'FERIADO' },
        { dia: 30, tipo: "FB - Fim do 2º Bimestre", categoria: 'LETIVO' }
      ]
    },
    {
      mes: "Julho",
      orientativo: "006/2027 - Educação Ambiental e Direitos Humanos",
      eventos: [
        { dia: 1, tipo: "Conselho de Classe do 2º Bimestre", categoria: 'PEDAGOGICO' },
        { dia: 5, tipo: "PF - Recesso Escolar / Férias", categoria: 'FERIAS' },
        { dia: 19, tipo: "Fim do Recesso Escolar", categoria: 'FERIAS' },
        { dia: 20, tipo: "IB - Início do 3º Bimestre", categoria: 'LETIVO' }
      ]
    },
    {
      mes: "Agosto",
      orientativo: "007/2027 - Agosto Lilás",
      eventos: [
        { dia: 2, tipo: "RA - Reunião Administrativa", categoria: 'ADMINISTRATIVO' },
        { dia: 11, tipo: "Dia do Estudante", categoria: 'LETIVO' },
        { dia: 23, tipo: "Semana de Avaliações Diagnósticas", categoria: 'PEDAGOGICO' }
      ]
    },
    {
      mes: "Setembro",
      orientativo: "008/2027 - Setembro Amarelo - Valorização da Vida",
      eventos: [
        { dia: 7, tipo: "FN - Independência do Brasil", categoria: 'FERIADO' },
        { dia: 24, tipo: "FB - Fim do 3º Bimestre", categoria: 'LETIVO' },
        { dia: 27, tipo: "IB - Início do 4º Bimestre", categoria: 'LETIVO' }
      ]
    },
    {
      mes: "Outubro",
      orientativo: "009/2027 - Outubro Rosa",
      eventos: [
        { dia: 12, tipo: "FN - Nossa Senhora Aparecida", categoria: 'FERIADO' },
        { dia: 15, tipo: "Dia do Professor", categoria: 'FERIADO' },
        { dia: 25, tipo: "RPM - Reunião de Pais e Mestres", categoria: 'PEDAGOGICO' }
      ]
    },
    {
      mes: "Novembro",
      orientativo: "010/2027 - Novembro Azul e Consciência Negra",
      eventos: [
        { dia: 2, tipo: "FN - Finados", categoria: 'FERIADO' },
        { dia: 15, tipo: "FN - Proclamação da República", categoria: 'FERIADO' },
        { dia: 20, tipo: "FN - Dia da Consciência Negra", categoria: 'FERIADO' }
      ]
    },
    {
      mes: "Dezembro",
      orientativo: "011/2027 - Encerramento do Ano Letivo 2027",
      eventos: [
        { dia: 10, tipo: "FB - Fim do 4º Bimestre e Aulas", categoria: 'LETIVO' },
        { dia: 13, tipo: "Semana de Exames Finais / Recuperação", categoria: 'PEDAGOGICO' },
        { dia: 17, tipo: "Conselho de Classe Final e Encerramento do Ano Letivo", categoria: 'ADMINISTRATIVO' },
        { dia: 20, tipo: "PF - Férias Escolares", categoria: 'FERIAS' },
        { dia: 25, tipo: "FN - Natal", categoria: 'FERIADO' }
      ]
    }
  ]
};
