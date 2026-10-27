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

/** En fibra y proteína, una cantidad alta se pinta como aporte y una baja como poco aporte. */
export function clasesDeNivel(nivel: Level, sentido?: "vigilar" | "aportar"): string {
  if (sentido === "aportar") {
    if (nivel === "alto") return levelClasses.bajo;
    if (nivel === "bajo") return levelClasses.alto;
    return levelClasses.moderado;
  }
  return levelClasses[nivel];
}

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

export const aporteNote =
  "El nivel global mira azúcares, sodio, grasas, grasas saturadas y calorías. En fibra y proteína, alto significa que la porción aporta bastante.";

export const informativeNote =
  "NutriLex traduce la información de las etiquetas a palabras simples. Es una herramienta meramente informativa: no emite alertas de salud ni recomendaciones médicas.";
