/**
 * El historial vive en Supabase. El navegador solo guarda y vuelve a leer
 * el reporte que ya calculó. El jsonb incluye texto, niveles, traducción
 * y el recorrido visual.
 */

import { supabase } from "@/lib/supabase";
import { guardarReporte, interpretarReporte, type Reporte } from "@/traductor/traduccion";
import type { Nivel } from "@/traductor/analisis-semantico";

export type EntradaHistorial = {
  id: string;
  producto: string;
  nivel: Nivel;
  creadoEn: string;
};

export type LecturaHistorial =
  | { ok: true; entradas: readonly EntradaHistorial[] }
  | { ok: false; mensaje: string };

export type AnalisisGuardado =
  | { ok: true; reporte: Reporte }
  | { ok: false; mensaje: string };

export async function publicarReporte(reporte: Reporte): Promise<string | null> {
  guardarReporte(reporte);
  const guardado = await guardarAnalisis(reporte);
  return guardado.ok ? guardado.id : null;
}

export async function leerHistorial(): Promise<LecturaHistorial> {
  const { data, error } = await supabase
    .from("analisis")
    .select("id, producto, nivel, creado_en")
    .order("creado_en", { ascending: false });

  if (error || !data) {
    return { ok: false, mensaje: "No se pudo leer el historial en Supabase." };
  }

  const entradas: EntradaHistorial[] = [];
  for (const fila of data) {
    const entrada = interpretarEntrada(fila);
    if (entrada) entradas.push(entrada);
  }

  return { ok: true, entradas };
}

export async function leerAnalisis(id: string): Promise<AnalisisGuardado> {
  const { data, error } = await supabase.from("analisis").select("reporte").eq("id", id).maybeSingle();

  if (error) {
    return { ok: false, mensaje: "No se pudo leer ese análisis en Supabase." };
  }
  if (!data) {
    return { ok: false, mensaje: "Ese análisis no está en el historial." };
  }

  const registro = data as Record<string, unknown>;
  const reporte = interpretarReporte(registro["reporte"]);
  if (!reporte) {
    return { ok: false, mensaje: "Ese análisis guardado no se puede mostrar." };
  }

  return { ok: true, reporte };
}

export function formatearMomento(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "Fecha desconocida";
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
}

async function guardarAnalisis(reporte: Reporte): Promise<{ ok: true; id: string } | { ok: false }> {
  const { data, error } = await supabase
    .from("analisis")
    .insert({
      producto: reporte.producto,
      nivel: reporte.nivelGlobal,
      reporte,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false };
  const id = (data as Record<string, unknown>)["id"];
  if (typeof id !== "string") return { ok: false };
  return { ok: true, id };
}

function interpretarEntrada(fila: unknown): EntradaHistorial | undefined {
  if (!fila || typeof fila !== "object") return undefined;
  const registro = fila as Record<string, unknown>;
  const id = registro["id"];
  const producto = registro["producto"];
  const nivel = registro["nivel"];
  const creadoEn = registro["creado_en"];
  if (typeof id !== "string" || typeof producto !== "string" || typeof creadoEn !== "string") return undefined;
  if (!esNivel(nivel)) return undefined;
  return { id, producto, nivel, creadoEn };
}

function esNivel(valor: unknown): valor is Nivel {
  return valor === "bajo" || valor === "moderado" || valor === "alto";
}
