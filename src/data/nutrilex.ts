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

/** La palabra del semáforo. En un aporte, «Aporta» no se lee como alerta. */
export function etiquetaDeNivel(nivel: Level, sentido?: "vigilar" | "aportar"): string {
  if (sentido !== "aportar") return levelLabel[nivel];
  if (nivel === "alto") return "Aporta";
  if (nivel === "bajo") return "Poco";
  return "Aporte medio";
}

export const levelExplanations: {
  level: Level;
  title: string;
  text: string;
}[] = [
  {
    level: "bajo",
    title: "Bajo",
    text: "Poca cantidad en la porción.",
  },
  {
    level: "moderado",
    title: "Moderado",
    text: "Ni poca ni mucha.",
  },
  {
    level: "alto",
    title: "Alto",
    text: "Mucha cantidad. Conviene mirarlo.",
  },
];

export const aporteNote = "En verde, la fibra o la proteína suman. En rojo, conviene vigilar.";

export const informativeNote = "Solo informa. No es un consejo médico.";
