
import { TechnicalSheet } from '../types';

export const TECHNICAL_SHEETS: TechnicalSheet[] = [
  {
    preparationName: "SALADA DE ALFACE COM TOMATE, MACARRÃO COM MOLHO DE CARNE MOÍDA",
    ingredients: [
      { description: 'ALFACE', perCapitaLiquido: 6.85 },
      { description: 'ALHO', perCapitaLiquido: 0.93 },
      { description: 'CARNE MOIDA', perCapitaLiquido: 28.57 },
      { description: 'CEBOLA', perCapitaLiquido: 2.73 },
      { description: 'CEBOLINHA', perCapitaLiquido: 1.69 },
      { description: 'EXTRATO DE TOMATE', perCapitaLiquido: 5.00 },
      { description: 'MACARRÃO', perCapitaLiquido: 40.00 },
      { description: 'ÓLEO DE SOJA', perCapitaLiquido: 1.00 },
      { description: 'PIMENTÃO', perCapitaLiquido: 2.42 },
      { description: 'SAL', perCapitaLiquido: 1.00 },
      { description: 'SALSA', perCapitaLiquido: 1.57 },
      { description: 'TOMATE', perCapitaLiquido: 9.80 },
    ]
  },
  {
    preparationName: "FRICASSÊ DE FRANGO COM ABÓBORA E ARROZ",
    ingredients: [
      { description: 'ABÓBORA', perCapitaLiquido: 9.16 },
      { description: 'ALHO', perCapitaLiquido: 0.93 },
      { description: 'AMIDO DE MILHO', perCapitaLiquido: 6.00 },
      { description: 'ARROZ BRANCO', perCapitaLiquido: 30.00 },
      { description: 'CEBOLA', perCapitaLiquido: 2.73 },
      { description: 'CEBOLINHA', perCapitaLiquido: 1.69 },
      { description: 'COLORAU', perCapitaLiquido: 0.50 },
      { description: 'FILÉ DE PEITO DE FRANGO', perCapitaLiquido: 35.00 },
      { description: 'LEITE', perCapitaLiquido: 10.00 },
      { description: 'QUEIJO MUSSARELA', perCapitaLiquido: 6.60 },
      { description: 'SAL', perCapitaLiquido: 1.00 },
    ]
  },
  {
    preparationName: "ABACAXI",
    ingredients: [{ description: 'ABACAXI', perCapitaLiquido: 48.53 }]
  }
  // ... Dados podem ser expandidos conforme necessidade seguindo o padrão do PDF
];

export const PERISHABLES = [
  'ALFACE', 'TOMATE', 'ABACAXI', 'FRANGO', 'CARNE MOIDA', 'CARNE SUÍNA', 
  'BANANA', 'MELÃO', 'PEIXE', 'CEBOLINHA', 'SALSA', 'MANDIOCA', 'ABÓBORA',
  'LEITE', 'QUEIJO MUSSARELA', 'MAMÃO', 'MAÇÃ', 'PONCÃ', 'MELANCIA'
];
