export type Level = "bajo" | "moderado" | "alto";

export const levelLabel: Record<Level, string> = {
  bajo: "Bajo",
  moderado: "Moderado",
  alto: "Alto",
};

export const levelDot: Record<Level, string> = {
  bajo: "●",
  moderado: "●",
  alto: "●",
};

export const levelClasses: Record<Level, string> = {
  bajo: "bg-level-low-soft text-level-low",
  moderado: "bg-level-mid-soft text-level-mid",
  alto: "bg-level-high-soft text-level-high",
};

export const analysis = {
  product: "Cereal de chocolate",
  level: "alto" as Level,
  summary:
    "Este producto contiene niveles elevados de algunos nutrientes. Se recomienda moderar su consumo.",
  nutrients: [
    { icon: "🍬", name: "Azúcares", level: "alto" as Level, amount: "12 g", equivalence: "≈ 3 cucharaditas" },
    { icon: "🧂", name: "Sodio", level: "moderado" as Level, amount: "180 mg", equivalence: "≈ ⅓ cucharadita de sal" },
    { icon: "🥑", name: "Grasas", level: "bajo" as Level, amount: "3 g", equivalence: "≈ ⅔ cucharadita de aceite" },
    { icon: "⚡", name: "Calorías", level: "bajo" as Level, amount: "120 kcal", equivalence: "≈ 1 manzana grande" },
  ],
  ingredients: [
    {
      name: "Jarabe de maíz de alta fructosa",
      meaning: "Endulzante utilizado en algunos alimentos procesados.",
      level: "alto" as Level,
    },
    {
      name: "Glutamato monosódico (E621)",
      meaning: "Potenciador de sabor utilizado en alimentos procesados.",
      level: "moderado" as Level,
    },
    {
      name: "Avena integral",
      meaning: "Cereal natural que aporta fibra.",
      level: "bajo" as Level,
    },
  ],
  tips: [
    "Busca alternativas con menos azúcar.",
    "Revisa el tamaño de la porción.",
    "Compara productos similares.",
    "Si tiene mucho sodio, considera otra opción.",
  ],
};

export const history = [
  { name: "Cereal de chocolate", level: "alto" as Level, when: "Analizado hoy" },
  { name: "Galletas integrales", level: "moderado" as Level, when: "Analizado ayer" },
  { name: "Yogurt natural", level: "bajo" as Level, when: "Analizado hace 2 días" },
  { name: "Refresco de cola", level: "alto" as Level, when: "Analizado hace 3 días" },
];
