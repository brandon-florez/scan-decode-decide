/**
 * La tabla de símbolos vive en Supabase. El navegador la consulta y,
 * si faltan los nombres de esta etiqueta, los completa con la misma lista
 * que está al final de supabase/catalogo.sql.
 */

import { supabase } from "@/lib/supabase";

export type Nivel = "bajo" | "moderado" | "alto";

export type SimboloIngrediente = {
  nombre: string;
  codigo: string | null;
  significado: string;
  nivel: Nivel;
};

export type LecturaTabla =
  | { ok: true; simbolos: readonly SimboloIngrediente[] }
  | { ok: false; mensaje: string };

export async function leerTablaSimbolos(): Promise<LecturaTabla> {
  const { data, error } = await supabase.from("ingredientes").select("nombre, codigo, significado, nivel");

  if (error || !data) {
    return {
      ok: false,
      mensaje: "No se pudo leer la tabla de ingredientes en Supabase.",
    };
  }

  const simbolos: SimboloIngrediente[] = [];
  for (const fila of data) {
    const simbolo = interpretarFila(fila);
    if (simbolo) simbolos.push(simbolo);
  }

  return { ok: true, simbolos: completarConEstaEtiqueta(simbolos) };
}

/**
 * Nombres de la crema de verduras que aún no están en public.ingredientes.
 * Si Supabase ya trae el mismo nombre, se queda el de la base.
 * La lista coincide con el final de supabase/catalogo.sql.
 */
const DE_ESTA_ETIQUETA: readonly SimboloIngrediente[] = [
  { nombre: "zanahoria", codigo: null, significado: "Hortaliza", nivel: "bajo" },
  { nombre: "raíz de apio", codigo: null, significado: "Hortaliza", nivel: "bajo" },
  { nombre: "cebolla", codigo: null, significado: "Hortaliza", nivel: "bajo" },
  { nombre: "tomate", codigo: null, significado: "Hortaliza", nivel: "bajo" },
  { nombre: "chirivía", codigo: null, significado: "Hortaliza", nivel: "bajo" },
  { nombre: "patata", codigo: null, significado: "Tubérculo", nivel: "bajo" },
  { nombre: "calabaza", codigo: null, significado: "Hortaliza", nivel: "bajo" },
  { nombre: "puerro", codigo: null, significado: "Hortaliza", nivel: "bajo" },
  { nombre: "nabo", codigo: null, significado: "Hortaliza", nivel: "bajo" },
  {
    nombre: "leche mazada reconstituida",
    codigo: null,
    significado: "Suero de mantequilla en polvo, vuelto a mezclar con agua",
    nivel: "moderado",
  },
  {
    nombre: "leche desnatada reconstituida",
    codigo: null,
    significado: "Leche descremada en polvo, vuelta a mezclar con agua",
    nivel: "moderado",
  },
  {
    nombre: "almidón modificado de maíz",
    codigo: null,
    significado: "Almidón de maíz tratado para espesar",
    nivel: "moderado",
  },
  {
    nombre: "zumo de acerola reconstituido",
    codigo: null,
    significado: "Jugo de acerola vuelto a diluir; aporta su azúcar",
    nivel: "moderado",
  },
  { nombre: "aromas", codigo: null, significado: "Sabor añadido", nivel: "moderado" },
  {
    nombre: "zumos concentrados vegetales (contiene raíz de apio)",
    codigo: null,
    significado: "Jugos de verdura concentrados",
    nivel: "bajo",
  },
];

function completarConEstaEtiqueta(simbolos: readonly SimboloIngrediente[]): SimboloIngrediente[] {
  const presentes = new Set(simbolos.map((simbolo) => normalizar(simbolo.nombre)));
  const completos = [...simbolos];
  for (const extra of DE_ESTA_ETIQUETA) {
    if (!presentes.has(normalizar(extra.nombre))) completos.push(extra);
  }
  return completos;
}

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function interpretarFila(fila: unknown): SimboloIngrediente | undefined {
  if (!fila || typeof fila !== "object") return undefined;
  const registro = fila as Record<string, unknown>;
  const nombre = registro["nombre"];
  const significado = registro["significado"];
  const nivel = registro["nivel"];
  const codigo = registro["codigo"];

  if (typeof nombre !== "string" || typeof significado !== "string" || !esNivel(nivel)) return undefined;

  return {
    nombre,
    significado,
    nivel,
    codigo: typeof codigo === "string" && codigo.trim() !== "" ? codigo.trim() : null,
  };
}

function esNivel(valor: unknown): valor is Nivel {
  return valor === "bajo" || valor === "moderado" || valor === "alto";
}
