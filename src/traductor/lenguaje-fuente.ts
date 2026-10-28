/**
 * Paso 1 del traductor. Define la etiqueta antes de calificarla.
 * Si falta la porción, un nutriente no trae número o unidad permitida,
 * o no hay ingredientes, el análisis no empieza.
 */

export const UNIDADES = ["g", "mg", "kcal", "ml"] as const;
export type Unidad = (typeof UNIDADES)[number];

export const NUTRIENTES = [
  "azucares",
  "sodio",
  "grasas",
  "grasasSaturadas",
  "fibra",
  "proteina",
  "calorias",
] as const;
export type IdNutriente = (typeof NUTRIENTES)[number];

/** Orden fijo del texto de una etiqueta. Porción e ingredientes siempre van. Al menos un nutriente también. */
export const SECUENCIA_CAMPOS = [
  { id: "porcion", etiqueta: "Porción", obligatorio: true, unidades: ["g"] },
  { id: "azucares", etiqueta: "Azúcares", obligatorio: false, unidades: ["g"] },
  { id: "sodio", etiqueta: "Sodio", obligatorio: false, unidades: ["mg"] },
  { id: "grasas", etiqueta: "Grasas", obligatorio: false, unidades: ["g"] },
  { id: "grasasSaturadas", etiqueta: "Grasas saturadas", obligatorio: false, unidades: ["g"] },
  { id: "fibra", etiqueta: "Fibra", obligatorio: false, unidades: ["g"] },
  { id: "proteina", etiqueta: "Proteína", obligatorio: false, unidades: ["g"] },
  { id: "calorias", etiqueta: "Calorías", obligatorio: false, unidades: ["kcal"] },
  { id: "ingredientes", etiqueta: "Ingredientes", obligatorio: true, unidades: [] },
] as const;

/**
 * Recorrido completo del traductor.
 * Cada paso recibe la salida del anterior. Los pasos 1 a 7 ya tienen código.
 * El paso 4 lee la tabla de ingredientes en Supabase.
 * El paso 5 arma el reporte y el paso 6 lo acompaña con el recorrido.
 */
export const SECUENCIA_TRADUCTOR = [
  {
    paso: 1,
    nombre: "Lenguaje fuente",
    entrada: "Porción, nutrientes e ingredientes",
    salida: "Etiqueta válida, o la lista de lo que falta",
  },
  {
    paso: 2,
    nombre: "Análisis léxico",
    entrada: "Texto de la etiqueta",
    salida: "Tokens con lexema, tipo y posición",
  },
  {
    paso: 3,
    nombre: "Análisis sintáctico",
    entrada: "Tokens",
    salida: "Árbol de la etiqueta",
  },
  {
    paso: 4,
    nombre: "Análisis semántico",
    entrada: "Árbol",
    salida: "Niveles, inconsistencias y tabla de ingredientes",
  },
  {
    paso: 5,
    nombre: "Traducción y reporte",
    entrada: "Resultado semántico",
    salida: "Lenguaje cotidiano, equivalencias y nivel global",
  },
  {
    paso: 6,
    nombre: "Apartado visual",
    entrada: "Todas las etapas del análisis real",
    salida: "Texto, tokens, árbol, reglas y traducción en pantalla",
  },
  {
    paso: 7,
    nombre: "Lectura de imagen",
    entrada: "Foto de la etiqueta",
    salida: "El mismo texto del lenguaje fuente, corregible",
  },
  {
    paso: 8,
    nombre: "Historial",
    entrada: "Reporte ya calculado",
    salida: "Análisis guardado en Supabase",
  },
] as const;

const ETIQUETA_NUTRIENTE: Record<IdNutriente, string> = {
  azucares: "Azúcares",
  sodio: "Sodio",
  grasas: "Grasas",
  grasasSaturadas: "Grasas saturadas",
  fibra: "Fibra",
  proteina: "Proteína",
  calorias: "Calorías",
};

const FRASE_NUTRIENTE: Record<IdNutriente, string> = {
  azucares: "los azúcares",
  sodio: "el sodio",
  grasas: "las grasas",
  grasasSaturadas: "las grasas saturadas",
  fibra: "la fibra",
  proteina: "la proteína",
  calorias: "las calorías",
};

/** Nombres que una etiqueta real usa y que equivalen a un nutriente del lenguaje. */
const ALIAS_NUTRIENTE: Record<string, IdNutriente> = {
  "grasa saturada": "grasasSaturadas",
  proteinas: "proteina",
};

/** Más cantidad es una alerta. Fibra y proteína no entran: ahí un nivel alto es un aporte. */
export const NUTRIENTES_A_VIGILAR: readonly IdNutriente[] = [
  "azucares",
  "sodio",
  "grasas",
  "grasasSaturadas",
  "calorias",
];

export function esAporte(id: IdNutriente): boolean {
  return id === "fibra" || id === "proteina";
}

export function idDeNutriente(lexema: string): IdNutriente | undefined {
  const clave = normalizar(lexema);
  const alias = ALIAS_NUTRIENTE[clave];
  if (alias) return alias;
  for (const campo of SECUENCIA_CAMPOS) {
    if (campo.id === "porcion" || campo.id === "ingredientes") continue;
    if (normalizar(campo.etiqueta) === clave) return campo.id;
  }
  return undefined;
}

export function frasesDelLenguaje(): readonly string[] {
  const frases = SECUENCIA_CAMPOS.map((campo) => normalizar(campo.etiqueta));
  return [...frases, ...Object.keys(ALIAS_NUTRIENTE), ...UNIDADES];
}

export const UNIDADES_PORCION = ["g", "ml"] as const satisfies readonly Unidad[];

export const UNIDADES_POR_NUTRIENTE: Record<IdNutriente, readonly Unidad[]> = {
  azucares: ["g"],
  sodio: ["mg"],
  grasas: ["g"],
  grasasSaturadas: ["g"],
  fibra: ["g"],
  proteina: ["g"],
  calorias: ["kcal"],
};

export type Cantidad = {
  valor: number;
  unidad: Unidad;
};

/** Lo que puede llegar del formulario o, más adelante, del parser. Los campos pueden faltar. */
export type BorradorCantidad = {
  valor?: number;
  unidad?: string;
};

export type BorradorEtiqueta = {
  porcion?: BorradorCantidad;
  nutrientes?: Partial<Record<IdNutriente, BorradorCantidad>>;
  ingredientes?: readonly string[];
};

/** Etiqueta que ya cumplió la secuencia de campos. Las etapas siguientes solo reciben este tipo. */
export type EtiquetaFuente = {
  porcion: Cantidad;
  nutrientes: Partial<Record<IdNutriente, Cantidad>>;
  ingredientes: readonly string[];
};

export type ResultadoEstructura =
  | { valida: true; etiqueta: EtiquetaFuente }
  | { valida: false; errores: readonly string[] };

/** Ejemplo de la propuesta: porción, azúcares y dos ingredientes. */
export const ejemploPropuesta: BorradorEtiqueta = {
  porcion: { valor: 30, unidad: "g" },
  nutrientes: {
    azucares: { valor: 12, unidad: "g" },
  },
  ingredientes: ["jarabe de maíz de alta fructosa", "glutamato monosódico"],
};

export const TEXTO_EJEMPLO_PROPUESTA = [
  "Porción: 30 g",
  "Azúcares: 12 g",
  "Ingredientes: jarabe de maíz de alta fructosa, glutamato monosódico",
].join("\n");

/** Mismo lenguaje con los cuatro nutrientes del contrato. */
export const ejemploContrato: BorradorEtiqueta = {
  porcion: { valor: 30, unidad: "g" },
  nutrientes: {
    azucares: { valor: 12, unidad: "g" },
    sodio: { valor: 180, unidad: "mg" },
    grasas: { valor: 3, unidad: "g" },
    calorias: { valor: 120, unidad: "kcal" },
  },
  ingredientes: ["jarabe de maíz de alta fructosa", "glutamato monosódico"],
};

export const TEXTO_EJEMPLO_CONTRATO = [
  "Porción: 30 g",
  "Azúcares: 12 g",
  "Sodio: 180 mg",
  "Grasas: 3 g",
  "Calorías: 120 kcal",
  "Ingredientes: jarabe de maíz de alta fructosa, glutamato monosódico",
].join("\n");

export function completarEtiqueta(borrador: BorradorEtiqueta): ResultadoEstructura {
  const errores: string[] = [];
  const porcion = leerCantidad(borrador.porcion, "la porción", UNIDADES_PORCION, errores);

  const nutrientes: Partial<Record<IdNutriente, Cantidad>> = {};
  let hayNutriente = false;

  for (const id of NUTRIENTES) {
    const borradorNutriente = borrador.nutrientes?.[id];
    if (!borradorNutriente) continue;
    hayNutriente = true;
    const cantidad = leerCantidad(
      borradorNutriente,
      FRASE_NUTRIENTE[id],
      UNIDADES_POR_NUTRIENTE[id],
      errores,
    );
    if (cantidad) nutrientes[id] = cantidad;
  }

  if (!hayNutriente) {
    errores.push(
      "Falta al menos un nutriente: azúcares, sodio, grasas, grasas saturadas, fibra, proteína o calorías.",
    );
  }

  const ingredientes = leerIngredientes(borrador.ingredientes, errores);

  if (!porcion || !hayNutriente || !ingredientes || errores.length > 0) {
    return { valida: false, errores };
  }

  return {
    valida: true,
    etiqueta: { porcion, nutrientes, ingredientes },
  };
}

export function serializarEtiqueta(etiqueta: EtiquetaFuente): string {
  const lineas = [`Porción: ${formatearCantidad(etiqueta.porcion)}`];

  for (const id of NUTRIENTES) {
    const cantidad = etiqueta.nutrientes[id];
    if (!cantidad) continue;
    lineas.push(`${ETIQUETA_NUTRIENTE[id]}: ${formatearCantidad(cantidad)}`);
  }

  lineas.push(`Ingredientes: ${etiqueta.ingredientes.join(", ")}`);
  return lineas.join("\n");
}

function leerCantidad(
  cantidad: BorradorCantidad | undefined,
  frase: string,
  unidadesPermitidas: readonly Unidad[],
  errores: string[],
): Cantidad | undefined {
  if (!cantidad) {
    errores.push(`Falta ${frase}.`);
    return undefined;
  }

  let valor: number | undefined;
  let unidad: Unidad | undefined;

  if (cantidad.valor === undefined || Number.isNaN(cantidad.valor) || !Number.isFinite(cantidad.valor)) {
    errores.push(`Falta el número de ${frase}.`);
  } else {
    valor = cantidad.valor;
  }

  const unidadEscrita = cantidad.unidad?.trim() ?? "";
  if (unidadEscrita === "") {
    errores.push(`Falta la unidad de ${frase}.`);
  } else if (!esUnidadPermitida(unidadEscrita, unidadesPermitidas)) {
    errores.push(`La unidad de ${frase} debe ser ${formatearOpciones(unidadesPermitidas)}.`);
  } else {
    unidad = unidadEscrita;
  }

  if (valor === undefined || unidad === undefined) return undefined;
  return { valor, unidad };
}

function leerIngredientes(
  lista: readonly string[] | undefined,
  errores: string[],
): readonly string[] | undefined {
  if (!lista || lista.length === 0) {
    errores.push("Falta la lista de ingredientes.");
    return undefined;
  }

  const nombres = lista.map((nombre) => nombre.trim().replace(/\s+/g, " "));
  if (nombres.some((nombre) => nombre.length === 0)) {
    errores.push("Hay un ingrediente vacío.");
    return undefined;
  }

  return nombres;
}

function formatearCantidad(cantidad: Cantidad): string {
  const valor = Number.isInteger(cantidad.valor) ? String(cantidad.valor) : String(cantidad.valor);
  return `${valor} ${cantidad.unidad}`;
}

function formatearOpciones(unidades: readonly Unidad[]): string {
  if (unidades.length === 1) return unidades[0] ?? "";
  const ultima = unidades[unidades.length - 1] ?? "";
  return `${unidades.slice(0, -1).join(", ")} o ${ultima}`;
}

function esUnidadPermitida(valor: string, permitidas: readonly Unidad[]): valor is Unidad {
  return (permitidas as readonly string[]).includes(valor);
}

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
