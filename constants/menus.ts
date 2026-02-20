
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
      { day: "Segunda", dish: "Salada de Alface com Tomate e Macarrão com Carne Moída", ingredients: ["ALFACE", "ALHO", "CARNE MOIDA", "CEBOLA", "MACARRÃO", "EXTRATO DE TOMATE", "TOMATE", "ABACAXI"] },
      { day: "Terça", dish: "Fricassê de Frango com Abóbora e Arroz", ingredients: ["FRANGO", "ABÓBORA", "ARROZ", "AMIDO DE MILHO", "LEITE", "QUEIJO MUSSARELA", "PÃO"] },
      { day: "Quarta", dish: "Salada de Repolho, Arroz com Carne Suína e Feijão", ingredients: ["REPOLHO", "CARNE SUÍNA", "FEIJÃO", "ARROZ", "BANANA", "COUVE"] },
      { day: "Quinta", dish: "Estrogonofe de Carne e Arroz", ingredients: ["CARNE EM ISCAS", "ARROZ", "CREME DE LEITE", "EXTRATO DE TOMATE", "BOLO DE CHOCOLATE"] },
      { day: "Sexta", dish: "Frango ao Molho com Batata e Cenoura", ingredients: ["FRANGO", "BATATA", "CENOURA", "ARROZ", "FEIJÃO", "MELÃO"] }
    ]
  },
  {
    week: 2,
    label: "2ª SEMANA",
    days: [
      { day: "Segunda", dish: "Estrogonofe de Frango e Arroz", ingredients: ["FRANGO", "ARROZ", "COUVE", "MAMÃO"] },
      { day: "Terça", dish: "Carne com Mandioca, Arroz e Feijão", ingredients: ["CARNE EM CUBOS", "MANDIOCA", "ARROZ", "FEIJÃO", "CAFÉ", "PÃO", "MANTEIGA"] },
      { day: "Quarta", dish: "Peixe a Parmegiana e Arroz", ingredients: ["PEIXE", "QUEIJO MUSSARELA", "ARROZ", "MAÇÃ", "EXTRATO DE TOMATE"] },
      { day: "Quinta", dish: "Galinhada e Farofa de Banana", ingredients: ["FRANGO", "ARROZ", "BANANA", "FEIJÃO", "REQUEIJÃO"] },
      { day: "Sexta", dish: "Picadinho de Carne Suína e Arroz", ingredients: ["CARNE SUÍNA", "ARROZ", "BATATA", "CENOURA"] }
    ]
  },
  {
    week: 3,
    label: "3ª SEMANA",
    days: [
      { day: "Segunda", dish: "Risoto de Carne com Abóbora", ingredients: ["CARNE MOIDA", "ABÓBORA", "ARROZ", "FEIJÃO", "MELANCIA"] },
      { day: "Terça", dish: "Yakissoba de Frango", ingredients: ["FRANGO", "MACARRÃO", "BRÓCOLIS", "CENOURA", "PÃO", "OVOS"] },
      { day: "Quarta", dish: "Salada de Rúcula e Arroz Caipira", ingredients: ["RÚCULA", "CARNE EM CUBOS", "ARROZ", "MILHO", "LARANJA"] },
      { day: "Quinta", dish: "Carne com Batata e Feijão", ingredients: ["CARNE EM CUBOS", "BATATA", "ARROZ", "FEIJÃO", "BOLO"] },
      { day: "Sexta", dish: "Escondidinho de Frango com Batata Doce", ingredients: ["FRANGO", "BATATA DOCE", "ARROZ", "FEIJÃO", "ABACAXI"] }
    ]
  },
  {
    week: 4,
    label: "4ª SEMANA",
    days: [
      { day: "Segunda", dish: "Carne com Mandioca e Arroz", ingredients: ["CARNE EM CUBOS", "MANDIOCA", "ARROZ", "MELÃO"] },
      { day: "Terça", dish: "Feijoada e Farofa de Couve", ingredients: ["FEIJÃO PRETO", "CARNE SUÍNA", "COUVE", "ARROZ", "CAFÉ", "PÃO"] },
      { day: "Quarta", dish: "Bobó de Frango e Arroz", ingredients: ["FRANGO", "MANDIOCA", "ARROZ", "BANANA"] },
      { day: "Quinta", dish: "Escondidinho de Peixe", ingredients: ["PEIXE", "BATATA", "ARROZ", "BOLO DE COCO"] },
      { day: "Sexta", dish: "Macarrão com Carne Moída", ingredients: ["CARNE MOIDA", "MACARRÃO", "FEIJÃO", "MAMÃO"] }
    ]
  },
  {
    week: 5,
    label: "5ª SEMANA",
    days: [
      { day: "Segunda", dish: "Carne com Batata e Cenoura", ingredients: ["CARNE EM CUBOS", "BATATA", "CENOURA", "ARROZ", "MELANCIA"] },
      { day: "Terça", dish: "Lasanha de Frango", ingredients: ["FRANGO", "MASSA PARA LASANHA", "QUEIJO MUSSARELA", "LEITE", "PÃO DOCE"] },
      { day: "Quarta", dish: "Arroz com Carne e Feijão", ingredients: ["CARNE EM CUBOS", "ARROZ", "FEIJÃO", "REPOLHO", "MAÇÃ"] },
      { day: "Quinta", dish: "Estrogonofe de Carne Suína", ingredients: ["CARNE SUÍNA", "ARROZ", "REQUEIJÃO"] },
      { day: "Sexta", dish: "Arroz Cuiabano e Feijão", ingredients: ["CARNE EM CUBOS", "BANANA", "ARROZ", "FEIJÃO", "PONCÃ"] }
    ]
  }
];
