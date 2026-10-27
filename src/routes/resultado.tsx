import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FlaskConical, Lightbulb, ChevronLeft, Languages, Info, GitBranch } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { aporteNote, clasesDeNivel, levelClasses, levelDot, levelExplanations, levelLabel, informativeNote } from "@/data/nutrilex";
import type { IdNutriente } from "@/traductor/lenguaje-fuente";
import { leerAnalisis } from "@/traductor/historial";
import { guardarReporte, leerReporte, type Reporte } from "@/traductor/traduccion";

type BusquedaResultado = {
  id?: string;
};

export const Route = createFileRoute("/resultado")({
  validateSearch: (search: Record<string, unknown>): BusquedaResultado => {
    const id = search["id"];
    if (typeof id === "string" && id.length > 0) return { id };
    return {};
  },
  component: Resultado,
  head: () => ({
    meta: [
      { title: "Resultado del análisis | NutriLex" },
      {
        name: "description",
        content:
          "Semáforo nutricional, equivalencias fáciles, ingredientes explicados y recomendaciones rápidas del producto analizado.",
      },
      { property: "og:title", content: "Resultado del análisis | NutriLex" },
      {
        property: "og:description",
        content: "Descubre si el producto es bajo, moderado o alto de un solo vistazo.",
      },
    ],
  }),
});

const icono: Record<IdNutriente, string> = {
  azucares: "🍬",
  sodio: "🧂",
  grasas: "🥑",
  grasasSaturadas: "🧈",
  fibra: "🌾",
  proteina: "🥚",
  calorias: "⚡",
};

function Resultado() {
  const { id } = Route.useSearch();
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [aviso, setAviso] = useState("");
  const [listo, setListo] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);

  useEffect(() => {
    let vigente = true;
    setListo(false);

    async function cargar() {
      if (id) {
        const guardado = await leerAnalisis(id);
        if (!vigente) return;
        if (guardado.ok) {
          guardarReporte(guardado.reporte);
          setReporte(guardado.reporte);
          setAviso("");
        } else {
          setReporte(null);
          setAviso(guardado.mensaje);
        }
      } else {
        setReporte(leerReporte());
        setAviso("");
      }
      setListo(true);
    }

    void cargar();
    return () => {
      vigente = false;
    };
  }, [id]);

  if (!listo) {
    return (
      <PhoneShell>
        <p className="text-sm text-muted-foreground">Cargando reporte...</p>
      </PhoneShell>
    );
  }

  if (!reporte) {
    return (
      <PhoneShell>
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ChevronLeft className="size-4" /> Inicio
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold text-foreground">Resultado del análisis</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {aviso || "Todavía no hay un reporte de esta visita. Escribe los datos de la etiqueta para traducirla."}
        </p>
        <Link
          to="/ingresar"
          className="mt-6 flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-5 text-lg font-bold text-primary-foreground"
        >
          Ingresar datos
        </Link>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ChevronLeft className="size-4" /> Inicio
      </Link>

      <h1 className="mt-3 text-2xl font-extrabold text-foreground">Resultado del análisis</h1>
      <p className="mt-1 text-base text-muted-foreground">{reporte.producto}</p>

      <section className={`mt-5 rounded-3xl p-6 shadow-[var(--shadow-soft)] ${levelClasses[reporte.nivelGlobal]}`}>
        <p className="text-2xl font-extrabold uppercase">
          {levelDot[reporte.nivelGlobal]} Nivel {levelLabel[reporte.nivelGlobal]}
        </p>
        <p className="mt-2 text-sm font-medium text-foreground/80">{reporte.resumen}</p>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3">
        {reporte.nutrientes.map((nutriente) => (
          <div key={nutriente.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-2xl">{icono[nutriente.id]}</p>
            <p className="mt-1 font-bold text-foreground">{nutriente.nombre}</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-bold ${clasesDeNivel(nutriente.nivel, nutriente.sentido)}`}>
              {levelDot[nutriente.nivel]} {levelLabel[nutriente.nivel]}
            </span>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Languages className="size-5 text-primary" /> Tu etiqueta en palabras simples
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Así se lee lo que escribiste de la etiqueta.</p>
        <ul className="mt-3 space-y-3">
          {reporte.traducciones.map((fila) => (
            <li key={fila.original} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">La etiqueta dice</p>
              <p className="mt-0.5 font-mono text-sm text-foreground/70">{fila.original}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">En palabras simples</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{fila.traduccion}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <GitBranch className="size-5 text-primary" /> Cómo se analizó
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Este recorrido sale de la etiqueta que acabas de escribir.
        </p>

        <h3 className="mt-4 text-sm font-bold text-foreground">Texto fuente</h3>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-2xl border border-border bg-card p-4 font-mono text-sm text-foreground">
          {reporte.textoFuente}
        </pre>

        <h3 className="mt-4 text-sm font-bold text-foreground">Tokens</h3>
        <ul className="mt-2 space-y-2">
          {reporte.proceso.tokens.map((token, indice) => (
            <li
              key={`${token.linea}-${token.columna}-${indice}`}
              className="flex items-baseline justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <span className="font-mono text-sm text-foreground">{token.lexema}</span>
              <span className="shrink-0 text-right text-xs text-muted-foreground">
                {token.tipo}
                <span className="mt-0.5 block">
                  línea {token.linea}, columna {token.columna}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <h3 className="mt-4 text-sm font-bold text-foreground">Árbol</h3>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-2xl border border-border bg-card p-4 font-mono text-sm text-foreground">
          {reporte.proceso.arbol.join("\n")}
        </pre>

        <h3 className="mt-4 text-sm font-bold text-foreground">Reglas aplicadas</h3>
        <ul className="mt-2 space-y-2">
          {reporte.proceso.reglas.map((regla) => (
            <li key={regla} className="rounded-2xl bg-accent/60 p-4 text-sm text-foreground">
              {regla}
            </li>
          ))}
        </ul>

        <h3 className="mt-4 text-sm font-bold text-foreground">Errores</h3>
        {reporte.proceso.errores.length === 0 ? (
          <p className="mt-2 rounded-2xl bg-accent/60 p-4 text-sm text-muted-foreground">
            Este análisis no encontró errores.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {reporte.proceso.errores.map((error) => (
              <li key={error} className="rounded-2xl bg-accent/60 p-4 text-sm text-foreground">
                {error}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Info className="size-5 text-primary" /> ¿Qué significan los niveles?
        </h2>
        <ul className="mt-3 space-y-3">
          {levelExplanations.map((explicacion) => (
            <li key={explicacion.level} className={`rounded-2xl p-4 ${levelClasses[explicacion.level]}`}>
              <p className="font-bold">
                {levelDot[explicacion.level]} {explicacion.title}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground/80">{explicacion.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-2xl bg-accent/60 p-4 text-sm text-muted-foreground">{aporteNote}</p>
        <p className="mt-3 rounded-2xl bg-accent/60 p-4 text-sm text-muted-foreground">{informativeNote}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground">Equivalencias fáciles</h2>
        <ul className="mt-3 space-y-3">
          {reporte.nutrientes.map((nutriente) => (
            <li key={nutriente.id} className="flex items-center justify-between rounded-2xl bg-accent/60 p-4">
              <div>
                <p className="font-semibold text-foreground">
                  {icono[nutriente.id]} {nutriente.nombre}
                </p>
                <p className="text-sm text-muted-foreground">{nutriente.cantidad}</p>
              </div>
              <p className="text-right font-bold text-primary">{nutriente.equivalencia}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <button
          onClick={() => setShowIngredients((valor) => !valor)}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-primary bg-background px-5 py-5 text-lg font-bold text-primary"
        >
          <FlaskConical className="size-6" />
          {showIngredients ? "Ocultar ingredientes" : "Ver ingredientes"}
        </button>

        {showIngredients && (
          <ul className="mt-4 space-y-3">
            {reporte.ingredientes.map((ingrediente) => (
              <li key={ingrediente.nombre} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-bold text-foreground">{ingrediente.nombre}</p>
                <p className="mt-1 text-sm text-muted-foreground">¿Qué significa?</p>
                <p className="text-sm text-foreground/80">{ingrediente.significado}</p>
                {ingrediente.nivel && (
                  <span className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-bold ${levelClasses[ingrediente.nivel]}`}>
                    Nivel: {levelDot[ingrediente.nivel]} {levelLabel[ingrediente.nivel]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-3xl bg-mint p-6 text-mint-foreground">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Lightbulb className="size-5" /> Para decidir
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {reporte.consejos.map((consejo) => (
            <li key={consejo}>✓ {consejo}</li>
          ))}
        </ul>
      </section>

      <Link
        to="/historial"
        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-5 text-lg font-bold text-primary-foreground"
      >
        Ir al historial
      </Link>
    </PhoneShell>
  );
}
