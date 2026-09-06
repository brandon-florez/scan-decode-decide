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
  labelTranslation: [
    {
      original: "Azúcares 12 g por porción",
      translated:
        "Cada porción tiene el equivalente a 3 cucharaditas de azúcar. Es una cantidad considerable para un solo producto.",
    },
    {
      original: "Sodio 180 mg por porción",
      translated:
        "Contiene algo de sal: alrededor de un tercio de cucharadita. Está dentro de un rango medio.",
    },
    {
      original: "Grasas totales 3 g por porción",
      translated:
        "Es poca grasa, menos de una cucharadita de aceite. Este punto está bien.",
    },
    {
      original: "120 kcal por porción",
      translated:
        "Aporta energía similar a una manzana grande. Es una cantidad baja.",
    },
  ],
};

export const levelExplanations: {
  level: Level;
  title: string;
  text: string;
}[] = [
  {
    level: "bajo",
    title: "Bajo",
    text: "La cantidad de este nutriente es pequeña en relación con lo que se suele consumir al día.",
  },
  {
    level: "moderado",
    title: "Moderado",
    text: "La cantidad no es ni poca ni mucha. Conviene tenerla en cuenta si consumes varios productos similares.",
  },
  {
    level: "alto",
    title: "Alto",
    text: "La cantidad de este nutriente es grande comparada con lo habitual. La etiqueta lo indica para que lo sepas.",
  },
];

export const informativeNote =
  "NutriLex traduce la información de las etiquetas a palabras simples. Es una herramienta meramente informativa: no emite alertas de salud ni recomendaciones médicas.";

export const history = [
  { name: "Cereal de chocolate", level: "alto" as Level, when: "Analizado hoy" },
  { name: "Galletas integrales", level: "moderado" as Level, when: "Analizado ayer" },
  { name: "Yogurt natural", level: "bajo" as Level, when: "Analizado hace 2 días" },
  { name: "Refresco de cola", level: "alto" as Level, when: "Analizado hace 3 días" },
];
