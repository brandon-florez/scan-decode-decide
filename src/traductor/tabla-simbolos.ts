/**
 * La tabla de símbolos vive en Supabase. El navegador solo la consulta.
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

  return { ok: true, simbolos };
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
