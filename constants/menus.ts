
export interface MenuItem {
  day: string;
  dish: string;
  ingredients: string[];
}

export interface WeeklyMenu {
  week: number;
  label: string;
  days: MenuItem[];
}

export const OFFICIAL_MENUS: WeeklyMenu[] = [
  {
    week: 1,
    label: "1ª SEMANA",
    days: [
      { day: "Segunda", dish: "SALADA DE ALFACE COM TOMATE, MACARRÃO COM MOLHO DE CARNE MOÍDA + ABACAXI", ingredients: ["ALFACE", "ALHO", "CARNE MOIDA", "CEBOLA", "MACARRÃO", "EXTRATO DE TOMATE", "TOMATE", "ABACAXI"] },
      { day: "Terça", dish: "FRICASSÊ DE FRANGO COM ABÓBORA E ARROZ + PÃO COM QUEIJO MUSSARELA E SUCO DE POLPA DE FRUTA", ingredients: ["FRANGO", "ABÓBORA", "ARROZ", "AMIDO DE MILHO", "LEITE", "QUEIJO MUSSARELA", "PÃO", "POLPA DE FRUTA"] },
      { day: "Quarta", dish: "SALADA DE REPOLHO COM COUVE, ARROZ COM CARNE SUÍNA E FEIJÃO + BANANA", ingredients: ["REPOLHO", "CARNE SUÍNA", "FEIJÃO CARIOCA", "ARROZ BRANCO", "BANANA", "COUVE"] },
      { day: "Quinta", dish: "ESTROGONOFE DE CARNE E ARROZ + BOLO DE CHOCOLATE E CHÁ", ingredients: ["CARNE BOVINA ISCAS", "ARROZ BRANCO", "LEITE", "EXTRATO DE TOMATE", "FARINHA DE TRIGO", "CACAU EM PÓ", "CHÁ MATE"] },
      { day: "Sexta", dish: "FRANGO AO MOLHO COM BATATA E CENOURA, ARROZ, FEIJÃO + MELÃO", ingredients: ["FILÉ DE PEITO DE FRANGO", "BATATA INGLESA", "CENOURA", "ARROZ BRANCO", "FEIJÃO CARIOCA", "MELÃO"] }
    ]
  },
  {
    week: 2,
    label: "2ª SEMANA",
    days: [
      { day: "Segunda", dish: "SALADA DE COUVE COM TOMATE, ESTROGONOFE DE FRANGO E ARROZ + MAMÃO", ingredients: ["ALHO", "ARROZ BRANCO", "FILÉ DE PEITO DE FRANGO", "CEBOLA", "COUVE", "EXTRATO DE TOMATE", "MAMÃO"] },
      { day: "Terça", dish: "SALADA DE ALFACE COM ALMEIRÃO, CARNE COM MANDIOCA, ARROZ E FEIJÃO + PÃO COM MANTEIGA E LEITE COM CAFÉ", ingredients: ["ALFACE", "ALHO", "ALMEIRÃO", "ARROZ BRANCO", "CARNE BOVINA CUBOS", "FEIJÃO CARIOCA", "MANDIOCA", "PÃO", "LEITE", "CAFÉ"] },
      { day: "Quarta", dish: "PEIXE A PARMEGIANA E ARROZ + MAÇÃ", ingredients: ["PEIXE", "QUEIJO MUSSARELA", "ARROZ BRANCO", "MAÇÃ", "EXTRATO DE TOMATE"] },
      { day: "Quinta", dish: "SALADA DE REPOLHO COM RÚCULA, GALINHADA, FAROFA DE BANANA E FEIJÃO + PÃO COM REQUEIJÃO E SUCO DE POLPA DE FRUTA", ingredients: ["REPOLHO", "RÚCULA", "ARROZ BRANCO", "BANANA", "FEIJÃO CARIOCA", "PÃO", "REQUEIJÃO CREMOSO", "POLPA DE FRUTA"] },
      { day: "Sexta", dish: "PICADINHO DE CARNE SUÍNA E ARROZ + BANANA", ingredients: ["CARNE SUÍNA", "ARROZ BRANCO", "BATATA INGLESA", "CENOURA", "BANANA"] }
    ]
  },
  {
    week: 3,
    label: "3ª SEMANA",
    days: [
      { day: "Segunda", dish: "RISOTO DE CARNE COM ABÓBORA E FEIJÃO + MELANCIA", ingredients: ["CARNE BOVINA MOÍDA", "ABÓBORA", "ARROZ BRANCO", "FEIJÃO CARIOCA", "MELANCIA"] },
      { day: "Terça", dish: "YAKISSOBA DE FRANGO + PÃO COM OVOS MEXIDOS E CHÁ", ingredients: ["FILÉ DE PEITO DE FRANGO", "MACARRÃO", "BRÓCOLIS", "CENOURA", "PÃO", "OVO DE GALINHA", "CHÁ MATE"] },
      { day: "Quarta", dish: "SALADA DE RÚCULA COM TOMATE E ARROZ CAIPIRA + LARANJA", ingredients: ["RÚCULA", "CARNE BOVINA CUBOS", "ARROZ BRANCO", "MILHO VERDE", "TOMATE", "LARANJA"] },
      { day: "Quinta", dish: "SALADA DE REPOLHO COM AGRIÃO, CARNE COM BATATA, ARROZ E FEIJÃO + BOLO SIMPLES E LEITE COM CACAU", ingredients: ["REPOLHO", "AGRIÃO", "CARNE BOVINA CUBOS", "BATATA INGLESA", "ARROZ BRANCO", "FEIJÃO CARIOCA", "BOLO SIMPLES", "LEITE", "CACAU EM PÓ"] },
      { day: "Sexta", dish: "ESCONDIDINHO DE FRANGO COM BATATA DOCE, ARROZ E FEIJÃO + ABACAXI", ingredients: ["FILÉ DE PEITO DE FRANGO", "BATATA DOCE", "ARROZ BRANCO", "FEIJÃO CARIOCA", "ABACAXI"] }
    ]
  },
  {
    week: 4,
    label: "4ª SEMANA",
    days: [
      { day: "Segunda", dish: "CARNE COM MANDIOCA E ARROZ + MELÃO", ingredients: ["CARNE BOVINA CUBOS", "MANDIOCA", "ARROZ BRANCO", "MELÃO"] },
      { day: "Terça", dish: "FEIJOADA, FAROFA DE COUVE E ARROZ + PÃO COM MANTEIGA E LEITE COM CAFÉ", ingredients: ["FEIJÃO PRETO", "CARNE SUÍNA", "COUVE", "FARINHA DE MANDIOCA", "PÃO", "LEITE", "CAFÉ"] },
      { day: "Quarta", dish: "SALADA DE REPOLHO, PEPINO E RÚCULA, BOBÓ DE FRANGO E ARROZ + BANANA", ingredients: ["REPOLHO", "PEPINO", "RÚCULA", "FILÉ DE PEITO DE FRANGO", "MANDIOCA", "ARROZ BRANCO", "BANANA"] },
      { day: "Quinta", dish: "ESCONDIDINHO DE PEIXE E ARROZ + BOLO DE COCO E SUCO DE POLPA DE FRUTA", ingredients: ["PEIXE", "BATATA INGLESA", "ARROZ BRANCO", "BOLO DE COCO", "POLPA DE FRUTA"] },
      { day: "Sexta", dish: "SALADA DE ALFACE, AGRIÃO E CENOURA, MACARRÃO COM MOLHO DE CARNE MOÍDA E FEIJÃO + MAMÃO", ingredients: ["ALFACE", "AGRIÃO", "CENOURA", "MACARRÃO", "CARNE BOVINA MOÍDA", "FEIJÃO CARIOCA", "MAMÃO"] }
    ]
  },
  {
    week: 5,
    label: "5ª SEMANA",
    days: [
      { day: "Segunda", dish: "CARNE COM BATATA E CENOURA E ARROZ + MELANCIA", ingredients: ["CARNE BOVINA CUBOS", "BATATA INGLESA", "CENOURA", "ARROZ BRANCO", "MELANCIA"] },
      { day: "Terça", dish: "LASANHA DE FRANGO E ARROZ + PÃO DOCE E BEBIDA LÁCTEA", ingredients: ["FILÉ DE PEITO DE FRANGO", "MASSA PARA LASANHA", "QUEIJO MUSSARELA", "LEITE", "PÃO DOCE", "BEBIDA LÁCTEA"] },
      { day: "Quarta", dish: "SALADA DE REPOLHO E RÚCULA, ARROZ COM CARNE E FEIJÃO + MAÇÃ", ingredients: ["REPOLHO", "RÚCULA", "ARROZ BRANCO", "CARNE BOVINA CUBOS", "FEIJÃO CARIOCA", "MAÇÃ"] },
      { day: "Quinta", dish: "SALADA DE ALFACE COM CENOURA, ESTROGONOFE DE CARNE SUÍNA E ARROZ + PÃO COM REQUEIJÃO E LEITE COM CACAU", ingredients: ["ALFACE", "CENOURA", "CARNE SUÍNA", "ARROZ BRANCO", "REQUEIJÃO CREMOSO", "LEITE", "CACAU EM PÓ"] },
      { day: "Sexta", dish: "ARROZ CUIABANO E FEIJÃO + PONCÃ", ingredients: ["CARNE BOVINA CUBOS", "BANANA DA TERRA", "ARROZ BRANCO", "FEIJÃO CARIOCA", "PONCÃ"] }
    ]
  }
];
