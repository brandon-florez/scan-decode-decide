/**
 * Paso 4 del traductor. Revisa el árbol: unidades, inconsistencias,
 * niveles por porción y el significado de cada ingrediente.
 * Los significados salen de la tabla de símbolos, no de una cuenta local.
 */

import type { Posicion } from "@/traductor/analisis-lexico";
import type { ArbolEtiqueta, NodoNutriente } from "@/traductor/analisis-sintactico";
import {
  esAporte,
  NUTRIENTES_A_VIGILAR,
  UNIDADES_POR_NUTRIENTE,
  UNIDADES_PORCION,
  type IdNutriente,
  type Unidad,
} from "@/traductor/lenguaje-fuente";
import {
  leerTablaSimbolos,
  type Nivel,
  type SimboloIngrediente,
} from "@/traductor/tabla-simbolos";

export type { Nivel, SimboloIngrediente };

/**
 * Por porción. Bajo es menor que el primer número. Alto empieza en el segundo.
 * Grasas saturadas: orientación de semáforo por porción, bajo menor que 1,5 g y alto desde 5 g.
 * Fibra: un aporte alto empieza en 6 g. Proteína: un aporte alto empieza en 12 g.
 * En fibra y proteína, alto no es una alerta.
 */
export const UMBRALES: Record<IdNutriente, { bajoMenorQue: number; altoDesde: number }> = {
  azucares: { bajoMenorQue: 5, altoDesde: 12 },
  sodio: { bajoMenorQue: 120, altoDesde: 600 },
  grasas: { bajoMenorQue: 5, altoDesde: 15 },
  grasasSaturadas: { bajoMenorQue: 1.5, altoDesde: 5 },
  fibra: { bajoMenorQue: 2, altoDesde: 6 },
  proteina: { bajoMenorQue: 5, altoDesde: 12 },
  calorias: { bajoMenorQue: 150, altoDesde: 400 },
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

const MENSAJE_NEGATIVO: Record<IdNutriente, string> = {
  azucares: "Los azúcares no pueden ser negativos.",
  sodio: "El sodio no puede ser negativo.",
  grasas: "Las grasas no pueden ser negativas.",
  grasasSaturadas: "Las grasas saturadas no pueden ser negativas.",
  fibra: "La fibra no puede ser negativa.",
  proteina: "La proteína no puede ser negativa.",
  calorias: "Las calorías no pueden ser negativas.",
};

const NOMBRE_NUTRIENTE: Record<IdNutriente, string> = {
  azucares: "Azúcares",
  sodio: "Sodio",
  grasas: "Grasas",
  grasasSaturadas: "Grasas saturadas",
  fibra: "Fibra",
  proteina: "Proteína",
  calorias: "Calorías",
};

const EN_GRAMOS = new Set<IdNutriente>(["azucares", "grasas", "grasasSaturadas", "fibra", "proteina"]);

export type ErrorSemantico = {
  mensaje: string;
  posicion: Posicion;
};

export type NutrienteEvaluado = {
  id: IdNutriente;
  nombre: string;
  valor: number;
  unidad: string;
  nivel: Nivel | null;
  posicion: Posicion;
};

export type IngredienteEvaluado = {
  nombre: string;
  significado: string | null;
  nivel: Nivel | null;
  codigo: string | null;
};

export type ResultadoSemantico = {
  valido: boolean;
  nivelGlobal: Nivel | null;
  nutrientes: readonly NutrienteEvaluado[];
  ingredientes: readonly IngredienteEvaluado[];
  errores: readonly ErrorSemantico[];
  reglas: readonly string[];
};

export async function analizarSemantica(arbol: ArbolEtiqueta): Promise<ResultadoSemantico> {
  const lectura = await leerTablaSimbolos();
  if (!lectura.ok) {
    const resultado = evaluarEtiqueta(arbol, [], false);
    return {
      ...resultado,
      valido: false,
      errores: [
        ...resultado.errores,
        { mensaje: lectura.mensaje, posicion: arbol.ingredientes.posicion },
      ],
    };
  }

  return evaluarEtiqueta(arbol, lectura.simbolos, true);
}

export function evaluarEtiqueta(
  arbol: ArbolEtiqueta,
  tabla: readonly SimboloIngrediente[],
  consultarIngredientes = true,
): ResultadoSemantico {
  const errores: ErrorSemantico[] = [];
  const reglas: string[] = [];
  const porcion = arbol.porcion.cantidad;
  const unidadPorcion = unidadPermitida(porcion.unidad, UNIDADES_PORCION);
  let porcionUtil = false;

  if (!unidadPorcion) {
    errores.push({ mensaje: "La unidad de la porción debe ser g o ml.", posicion: porcion.posicion });
  } else if (porcion.valor < 0) {
    errores.push({ mensaje: "La porción no puede ser negativa.", posicion: porcion.posicion });
  } else if (porcion.valor === 0) {
    errores.push({ mensaje: "La porción está en cero.", posicion: porcion.posicion });
  } else {
    porcionUtil = true;
    reglas.push(`La porción es ${porcion.lexema} ${unidadPorcion}.`);
  }

  const nutrientes = arbol.nutrientes.map((nodo) =>
    evaluarNutriente(nodo, porcion.lexema, porcion.valor, unidadPorcion ?? "g", porcionUtil, errores, reglas),
  );

  const ingredientes = consultarIngredientes
    ? evaluarIngredientes(arbol, tabla, reglas)
    : arbol.ingredientes.nombres.map((nombre) => ({
        nombre,
        significado: null,
        nivel: null,
        codigo: null,
      }));

  return {
    valido: errores.length === 0,
    nivelGlobal: nivelGlobal(nutrientes),
    nutrientes,
    ingredientes,
    errores,
    reglas,
  };
}

function evaluarNutriente(
  nodo: NodoNutriente,
  lexemaPorcion: string,
  porcion: number,
  unidadPorcion: string,
  porcionUtil: boolean,
  errores: ErrorSemantico[],
  reglas: string[],
): NutrienteEvaluado {
  const frase = FRASE_NUTRIENTE[nodo.id];
  const permitidas = UNIDADES_POR_NUTRIENTE[nodo.id];
  const unidad = unidadPermitida(nodo.cantidad.unidad, permitidas);
  const base = {
    id: nodo.id,
    nombre: nodo.nombre,
    valor: nodo.cantidad.valor,
    unidad: nodo.cantidad.unidad,
    nivel: null,
    posicion: nodo.posicion,
  };

  if (!unidad) {
    errores.push({
      mensaje: `La unidad de ${frase} debe ser ${permitidas.join(" o ")}.`,
      posicion: nodo.cantidad.posicion,
    });
    return base;
  }

  if (nodo.cantidad.valor < 0) {
    errores.push({
      mensaje: MENSAJE_NEGATIVO[nodo.id],
      posicion: nodo.cantidad.posicion,
    });
    return { ...base, unidad };
  }

  if (EN_GRAMOS.has(nodo.id) && porcionUtil && nodo.cantidad.valor > porcion) {
    const mensaje =
      nodo.id === "azucares"
        ? `Los azúcares (${nodo.cantidad.lexema} g) superan la porción (${lexemaPorcion} ${unidadPorcion}).`
        : `La cantidad de ${frase} (${nodo.cantidad.lexema} g) supera la porción (${lexemaPorcion} ${unidadPorcion}).`;
    errores.push({ mensaje, posicion: nodo.cantidad.posicion });
    return { ...base, unidad };
  }

  if (!porcionUtil) return { ...base, unidad };

  const nivel = nivelDe(nodo.cantidad.valor, nodo.id);
  const umbral = UMBRALES[nodo.id];
  const aporte = esAporte(nodo.id) ? " Un nivel alto aquí es un aporte, no una alerta." : "";
  reglas.push(
    `${NOMBRE_NUTRIENTE[nodo.id]}: ${nodo.cantidad.lexema} ${unidad} es ${etiquetaNivel(nivel)}. Bajo es menor que ${umbral.bajoMenorQue} ${unidad}; alto empieza en ${umbral.altoDesde} ${unidad}.${aporte}`,
  );

  return { ...base, unidad, nivel };
}

export const SIN_TRADUCCION = "Sin traducción en la tabla.";

function evaluarIngredientes(
  arbol: ArbolEtiqueta,
  tabla: readonly SimboloIngrediente[],
  reglas: string[],
): IngredienteEvaluado[] {
  return arbol.ingredientes.nombres.map((nombre) => {
    const simbolo = buscarSimbolo(nombre, tabla);
    if (!simbolo) {
      reglas.push(`${nombre}: ${SIN_TRADUCCION}`);
      return { nombre, significado: null, nivel: null, codigo: null };
    }

    reglas.push(`${nombre}: ${simbolo.significado}`);
    return {
      nombre,
      significado: simbolo.significado,
      nivel: simbolo.nivel,
      codigo: simbolo.codigo,
    };
  });
}

function buscarSimbolo(
  nombre: string,
  tabla: readonly SimboloIngrediente[],
): SimboloIngrediente | undefined {
  const clave = normalizar(nombre);
  const exacto = tabla.find((simbolo) => normalizar(simbolo.nombre) === clave);
  if (exacto) return exacto;

  const codigo = codigoEnNombre(nombre);
  if (!codigo) return undefined;
  return tabla.find((simbolo) => simbolo.codigo !== null && normalizar(simbolo.codigo) === normalizar(codigo));
}

function codigoEnNombre(nombre: string): string | undefined {
  const coincidencia = nombre.match(/e\s*-?\s*(\d{3,4})/i);
  const numero = coincidencia?.[1];
  if (!numero) return undefined;
  return `E${numero}`;
}

function nivelDe(valor: number, id: IdNutriente): Nivel {
  const umbral = UMBRALES[id];
  if (valor < umbral.bajoMenorQue) return "bajo";
  if (valor < umbral.altoDesde) return "moderado";
  return "alto";
}

function nivelGlobal(nutrientes: readonly NutrienteEvaluado[]): Nivel | null {
  let actual: Nivel | null = null;
  for (const nutriente of nutrientes) {
    if (!nutriente.nivel) continue;
    if (!(NUTRIENTES_A_VIGILAR as readonly string[]).includes(nutriente.id)) continue;
    actual = actual === null ? nutriente.nivel : mayor(actual, nutriente.nivel);
  }
  return actual;
}

function mayor(izquierda: Nivel, derecha: Nivel): Nivel {
  const peso: Record<Nivel, number> = { bajo: 0, moderado: 1, alto: 2 };
  return peso[izquierda] >= peso[derecha] ? izquierda : derecha;
}

function unidadPermitida(lexema: string, permitidas: readonly Unidad[]): Unidad | undefined {
  const clave = normalizar(lexema);
  return permitidas.find((unidad) => unidad === clave);
}

function etiquetaNivel(nivel: Nivel): string {
  if (nivel === "bajo") return "Bajo";
  if (nivel === "moderado") return "Moderado";
  return "Alto";
}

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
