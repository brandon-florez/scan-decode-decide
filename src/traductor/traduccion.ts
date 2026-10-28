/**
 * Paso 5 del traductor. Convierte el resultado semántico en un reporte
 * con equivalencias y lenguaje cotidiano.
 *
 * 4 g de azúcar = 1 cucharadita.
 * 4,5 g de grasa = 1 cucharadita de aceite.
 * 2 000 mg de sodio = 1 cucharadita de sal.
 * 120 kcal = 1 manzana grande.
 */

import type { TipoToken } from "@/traductor/analisis-lexico";
import { analizarTexto, describirArbol } from "@/traductor/analisis-sintactico";
import { analizarSemantica, SIN_TRADUCCION, type Nivel, type ResultadoSemantico } from "@/traductor/analisis-semantico";
import { esAporte, NUTRIENTES_A_VIGILAR, type IdNutriente } from "@/traductor/lenguaje-fuente";

const GRAMOS_POR_CUCHARADITA_AZUCAR = 4;
const GRAMOS_POR_CUCHARADITA_ACEITE = 4.5;
const MILIGRAMOS_POR_CUCHARADITA_SAL = 2000;
const KCAL_POR_MANZANA = 120;
const GRAMOS_FIBRA_POR_MANZANA = 4;
const GRAMOS_PROTEINA_POR_HUEVO = 6;

const CLAVE_REPORTE = "nutrilex.reporte";

export type CapturaManual = {
  producto: string;
  porcion: string;
  azucares: string;
  sodio: string;
  grasas: string;
  grasasSaturadas: string;
  fibra: string;
  proteina: string;
  calorias: string;
  ingredientes: string;
};

export type NutrienteReporte = {
  id: IdNutriente;
  nombre: string;
  nivel: Nivel;
  cantidad: string;
  equivalencia: string;
  traduccion: string;
  sentido?: "vigilar" | "aportar";
};

export type IngredienteReporte = {
  nombre: string;
  significado: string;
  nivel: Nivel | null;
};

export type TokenVisible = {
  tipo: string;
  lexema: string;
  linea: number;
  columna: number;
};

/** Recorrido del análisis que produjo el reporte. Cambia con cada etiqueta. */
export type ProcesoVisible = {
  tokens: readonly TokenVisible[];
  arbol: readonly string[];
  reglas: readonly string[];
  errores: readonly string[];
};

export type Reporte = {
  producto: string;
  textoFuente: string;
  nivelGlobal: Nivel;
  resumen: string;
  nutrientes: readonly NutrienteReporte[];
  ingredientes: readonly IngredienteReporte[];
  traducciones: readonly { original: string; traduccion: string }[];
  consejos: readonly string[];
  proceso: ProcesoVisible;
};

export type ResultadoTraduccion =
  | { ok: true; reporte: Reporte }
  | { ok: false; errores: readonly string[] };

const NUTRIENTES_CAPTURA: readonly {
  id: IdNutriente;
  etiqueta: string;
  unidad: string;
  campo: "azucares" | "sodio" | "grasas" | "grasasSaturadas" | "fibra" | "proteina" | "calorias";
}[] = [
  { id: "azucares", etiqueta: "Azúcares", unidad: "g", campo: "azucares" },
  { id: "sodio", etiqueta: "Sodio", unidad: "mg", campo: "sodio" },
  { id: "grasas", etiqueta: "Grasas", unidad: "g", campo: "grasas" },
  { id: "grasasSaturadas", etiqueta: "Grasas saturadas", unidad: "g", campo: "grasasSaturadas" },
  { id: "fibra", etiqueta: "Fibra", unidad: "g", campo: "fibra" },
  { id: "proteina", etiqueta: "Proteína", unidad: "g", campo: "proteina" },
  { id: "calorias", etiqueta: "Calorías", unidad: "kcal", campo: "calorias" },
];

export function textoDesdeCaptura(captura: CapturaManual): { texto: string; producto: string } | { errores: readonly string[] } {
  const errores: string[] = [];
  const lineas: string[] = [];
  const porcion = leerNumero(captura.porcion);

  if (captura.porcion.trim() === "") errores.push("Falta la porción.");
  else if (porcion === undefined) errores.push("La porción debe ser un número.");
  else lineas.push(`Porción: ${formatearNumero(porcion)} g`);

  let hayNutriente = false;
  for (const campo of NUTRIENTES_CAPTURA) {
    const escrito = captura[campo.campo].trim();
    if (escrito === "") continue;
    const numero = leerNumero(escrito);
    if (numero === undefined) {
      errores.push(`${campo.etiqueta} debe ser un número.`);
      continue;
    }
    hayNutriente = true;
    lineas.push(`${campo.etiqueta}: ${formatearNumero(numero)} ${campo.unidad}`);
  }

  if (!hayNutriente) {
    errores.push(
      "Falta al menos un nutriente: azúcares, sodio, grasas, grasas saturadas, fibra, proteína o calorías.",
    );
  }

  const nombres = captura.ingredientes
    .split(",")
    .map((nombre) => nombre.trim().replace(/\s+/g, " "))
    .filter((nombre) => nombre.length > 0);

  if (nombres.length === 0) errores.push("Falta la lista de ingredientes.");
  else lineas.push(`Ingredientes: ${nombres.join(", ")}`);

  if (errores.length > 0) return { errores };

  const producto = captura.producto.trim() || "Producto sin nombre";
  return { texto: lineas.join("\n"), producto };
}

export async function traducirEtiqueta(texto: string, producto: string): Promise<ResultadoTraduccion> {
  const sintaxis = analizarTexto(texto);
  if (!sintaxis.valido) {
    return {
      ok: false,
      errores: [
        ...sintaxis.erroresLexicos.map((error) => error.mensaje),
        ...sintaxis.erroresSintacticos.map((error) => error.mensaje),
      ],
    };
  }

  const semantica = await analizarSemantica(sintaxis.arbol);
  if (!semantica.valido) {
    return { ok: false, errores: semantica.errores.map((error) => error.mensaje) };
  }

  const proceso: ProcesoVisible = {
    tokens: sintaxis.tokens.map((token) => ({
      tipo: NOMBRE_TIPO[token.tipo],
      lexema: token.lexema,
      linea: token.posicion.linea,
      columna: token.posicion.columna,
    })),
    arbol: describirArbol(sintaxis.arbol),
    reglas: semantica.reglas,
    errores: [
      ...sintaxis.erroresLexicos.map((error) => error.mensaje),
      ...sintaxis.erroresSintacticos.map((error) => error.mensaje),
      ...semantica.errores.map((error) => error.mensaje),
    ],
  };

  return { ok: true, reporte: armarReporte(producto, texto, semantica, proceso) };
}

export function armarReporte(
  producto: string,
  textoFuente: string,
  semantica: ResultadoSemantico,
  proceso: ProcesoVisible,
): Reporte {
  const nivelGlobal = semantica.nivelGlobal ?? "bajo";
  const vigila = semantica.nutrientes.some(
    (nutriente) => nutriente.nivel !== null && (NUTRIENTES_A_VIGILAR as readonly string[]).includes(nutriente.id),
  );
  const nutrientes: NutrienteReporte[] = [];
  const traducciones: { original: string; traduccion: string }[] = [];

  for (const nutriente of semantica.nutrientes) {
    if (!nutriente.nivel) continue;
    const cantidad = `${formatearNumero(nutriente.valor)} ${nutriente.unidad}`;
    const equivalencia = equivalenciaDe(nutriente.id, nutriente.valor);
    const traduccion = `Equivale a ${equivalencia.replace(/^≈\s*/, "")}. ${cierreDeNivel(nutriente.id, nutriente.nivel)}`;
    nutrientes.push({
      id: nutriente.id,
      nombre: nutriente.nombre,
      nivel: nutriente.nivel,
      cantidad,
      equivalencia,
      traduccion,
      sentido: esAporte(nutriente.id) ? "aportar" : "vigilar",
    });
    traducciones.push({ original: `${nutriente.nombre}: ${cantidad}`, traduccion });
  }

  const ingredientes: IngredienteReporte[] = [];
  for (const ingrediente of semantica.ingredientes) {
    const significado = ingrediente.significado ?? SIN_TRADUCCION;
    ingredientes.push({
      nombre: ingrediente.nombre,
      significado,
      nivel: ingrediente.nivel,
    });
    traducciones.push({ original: ingrediente.nombre, traduccion: significado });
  }

  return {
    producto,
    textoFuente,
    nivelGlobal,
    resumen: resumenDe(nivelGlobal, vigila),
    nutrientes,
    ingredientes,
    traducciones,
    consejos: consejosDe(nutrientes),
    proceso,
  };
}

const NOMBRE_TIPO: Record<TipoToken, string> = {
  palabra_clave: "palabra clave",
  nutriente: "nutriente",
  numero: "número",
  unidad: "unidad",
  ingrediente: "ingrediente",
  separador: "separador",
};

export function guardarReporte(reporte: Reporte): void {
  sessionStorage.setItem(CLAVE_REPORTE, JSON.stringify(reporte));
}

export function leerReporte(): Reporte | null {
  if (typeof sessionStorage === "undefined") return null;
  const crudo = sessionStorage.getItem(CLAVE_REPORTE);
  if (!crudo) return null;
  try {
    const valor: unknown = JSON.parse(crudo);
    return interpretarReporte(valor);
  } catch {
    return null;
  }
}

export function interpretarReporte(valor: unknown): Reporte | null {
  return esReporte(valor) ? valor : null;
}

function equivalenciaDe(id: IdNutriente, valor: number): string {
  if (id === "azucares") return cucharaditas(valor / GRAMOS_POR_CUCHARADITA_AZUCAR, "azúcar");
  if (id === "grasas") return cucharaditas(valor / GRAMOS_POR_CUCHARADITA_ACEITE, "aceite");
  if (id === "grasasSaturadas") return cucharaditas(valor / GRAMOS_POR_CUCHARADITA_ACEITE, "grasa");
  if (id === "sodio") return cucharaditas(valor / MILIGRAMOS_POR_CUCHARADITA_SAL, "sal");
  if (id === "fibra") return unidadesCocina(valor / GRAMOS_FIBRA_POR_MANZANA, "manzana mediana", "manzanas medianas");
  if (id === "proteina") return unidadesCocina(valor / GRAMOS_PROTEINA_POR_HUEVO, "huevo grande", "huevos grandes");
  return manzanas(valor / KCAL_POR_MANZANA);
}

function cucharaditas(valor: number, deQue: string): string {
  if (valor < 0.25) return `≈ menos de ¼ de cucharadita de ${deQue}`;
  const palabra = valor < 1.05 ? "cucharadita" : "cucharaditas";
  return `≈ ${formatearRacion(valor)} ${palabra} de ${deQue}`;
}

function manzanas(valor: number): string {
  return unidadesCocina(valor, "manzana grande", "manzanas grandes");
}

function unidadesCocina(valor: number, singular: string, plural: string): string {
  if (valor < 0.25) return `≈ menos de ¼ de ${singular}`;
  const palabra = valor < 1.05 ? singular : plural;
  return `≈ ${formatearRacion(valor)} ${palabra}`;
}

function formatearRacion(valor: number): string {
  const redondeado = Math.round(valor * 100) / 100;
  const enteros = Math.floor(redondeado + 1e-9);
  const resto = redondeado - enteros;
  const fraccion = fraccionCercana(resto);
  if (enteros === 0) return fraccion ?? redondeado.toFixed(1).replace(".", ",");
  if (resto < 0.05 || !fraccion) return String(enteros);
  return `${enteros} ${fraccion}`;
}

function fraccionCercana(resto: number): string | undefined {
  const opciones = [
    [0.25, "¼"],
    [1 / 3, "⅓"],
    [0.5, "½"],
    [2 / 3, "⅔"],
    [0.75, "¾"],
  ] as const;
  let mejor: { distancia: number; texto: string } | undefined;
  for (const [objetivo, texto] of opciones) {
    const distancia = Math.abs(resto - objetivo);
    if (distancia >= 0.04) continue;
    if (!mejor || distancia < mejor.distancia) mejor = { distancia, texto };
  }
  return mejor?.texto;
}

function cierreDeNivel(id: IdNutriente, nivel: Nivel): string {
  if (esAporte(id) && nivel === "alto") return "Es una cantidad alta. En este nutriente, eso suma a la porción.";
  if (esAporte(id) && nivel === "bajo") return "Es una cantidad baja. En este nutriente, la porción aporta poco.";
  if (nivel === "alto") return "Es una cantidad alta para una porción.";
  if (nivel === "moderado") return "Es una cantidad media para una porción.";
  return "Es una cantidad baja para una porción.";
}

function resumenDe(nivel: Nivel, vigila: boolean): string {
  if (!vigila) return "No hay una alerta. Fibra y proteína se leen como aporte.";
  if (nivel === "alto") return "Hay algo alto en lo que conviene vigilar.";
  if (nivel === "moderado") return "Lo que conviene vigilar queda en moderado.";
  return "Lo que conviene vigilar está bajo.";
}

function consejosDe(nutrientes: readonly NutrienteReporte[]): string[] {
  const consejos = ["Revisa el tamaño de la porción.", "Compara productos similares."];
  if (nutrientes.some((nutriente) => nutriente.id === "azucares" && nutriente.nivel === "alto")) {
    consejos.unshift("Busca alternativas con menos azúcar.");
  }
  if (nutrientes.some((nutriente) => nutriente.id === "sodio" && nutriente.nivel !== "bajo")) {
    consejos.push("Si el sodio no es bajo, mira otra opción.");
  }
  if (nutrientes.some((nutriente) => nutriente.id === "grasasSaturadas" && nutriente.nivel === "alto")) {
    consejos.push("Las grasas saturadas están altas: compara con otro producto.");
  }
  if (nutrientes.some((nutriente) => nutriente.id === "fibra" && nutriente.nivel === "bajo")) {
    consejos.push("Esta porción aporta poca fibra.");
  }
  return consejos;
}

function leerNumero(texto: string): number | undefined {
  const numero = Number(texto.trim().replace(",", "."));
  if (!Number.isFinite(numero)) return undefined;
  return numero;
}

function formatearNumero(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : String(valor);
}

function esReporte(valor: unknown): valor is Reporte {
  if (!valor || typeof valor !== "object") return false;
  const reporte = valor as Record<string, unknown>;
  const proceso = reporte["proceso"];
  if (!proceso || typeof proceso !== "object") return false;
  const recorrido = proceso as Record<string, unknown>;
  return (
    typeof reporte["producto"] === "string" &&
    Array.isArray(reporte["nutrientes"]) &&
    Array.isArray(reporte["ingredientes"]) &&
    Array.isArray(recorrido["tokens"]) &&
    Array.isArray(recorrido["arbol"]) &&
    Array.isArray(recorrido["reglas"]) &&
    Array.isArray(recorrido["errores"])
  );
}
