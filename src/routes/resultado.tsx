import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FlaskConical, Lightbulb, ChevronLeft, Languages, Info } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import {
  analysis,
  levelClasses,
  levelDot,
  levelExplanations,
  levelLabel,
  informativeNote,
} from "@/data/nutrilex";

export const Route = createFileRoute("/resultado")({
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

function Resultado() {
  const [showIngredients, setShowIngredients] = useState(false);
  const a = analysis;

  return (
    <PhoneShell>
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ChevronLeft className="size-4" /> Inicio
      </Link>

      <h1 className="mt-3 text-2xl font-extrabold text-foreground">Resultado del análisis</h1>
      <p className="mt-1 text-base text-muted-foreground">{a.product}</p>

      <section
        className={`mt-5 rounded-3xl p-6 shadow-[var(--shadow-soft)] ${levelClasses[a.level]}`}
      >
        <p className="text-2xl font-extrabold uppercase">
          {levelDot[a.level]} Nivel {levelLabel[a.level]}
        </p>
        <p className="mt-2 text-sm font-medium text-foreground/80">{a.summary}</p>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3">
        {a.nutrients.map((n) => (
          <div key={n.name} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-2xl">{n.icon}</p>
            <p className="mt-1 font-bold text-foreground">{n.name}</p>
            <span
              className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-bold ${levelClasses[n.level]}`}
            >
              {levelDot[n.level]} {levelLabel[n.level]}
            </span>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Languages className="size-5 text-primary" /> Tu etiqueta en palabras simples
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Así se lee lo que dice la etiqueta que escaneaste.
        </p>
        <ul className="mt-3 space-y-3">
          {a.labelTranslation.map((row) => (
            <li key={row.original} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                La etiqueta dice
              </p>
              <p className="mt-0.5 font-mono text-sm text-foreground/70">{row.original}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">
                En palabras simples
              </p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{row.translated}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Info className="size-5 text-primary" /> ¿Qué significan los niveles?
        </h2>
        <ul className="mt-3 space-y-3">
          {levelExplanations.map((e) => (
            <li key={e.level} className={`rounded-2xl p-4 ${levelClasses[e.level]}`}>
              <p className="font-bold">
                {levelDot[e.level]} {e.title}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground/80">{e.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-2xl bg-accent/60 p-4 text-sm text-muted-foreground">
          {informativeNote}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground">Equivalencias fáciles</h2>
        <ul className="mt-3 space-y-3">
          {a.nutrients.map((n) => (
            <li
              key={n.name}
              className="flex items-center justify-between rounded-2xl bg-accent/60 p-4"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {n.icon} {n.name}
                </p>
                <p className="text-sm text-muted-foreground">{n.amount}</p>
              </div>
              <p className="text-right font-bold text-primary">{n.equivalence}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <button
          onClick={() => setShowIngredients((v) => !v)}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-primary bg-background px-5 py-5 text-lg font-bold text-primary"
        >
          <FlaskConical className="size-6" />
          {showIngredients ? "Ocultar ingredientes" : "Ver ingredientes"}
        </button>

        {showIngredients && (
          <ul className="mt-4 space-y-3">
            {a.ingredients.map((ing) => (
              <li key={ing.name} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-bold text-foreground">{ing.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">¿Qué significa?</p>
                <p className="text-sm text-foreground/80">{ing.meaning}</p>
                <span
                  className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-bold ${levelClasses[ing.level]}`}
                >
                  Nivel: {levelDot[ing.level]} {levelLabel[ing.level]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-3xl bg-mint p-6 text-mint-foreground">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Lightbulb className="size-5" /> Recomendación
        </h2>
        <p className="mt-2 font-semibold">Consume este producto con moderación.</p>
        <ul className="mt-4 space-y-2 text-sm">
          {a.tips.map((t) => (
            <li key={t}>✓ {t}</li>
          ))}
        </ul>
      </section>

      <Link
        to="/historial"
        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-5 text-lg font-bold text-primary-foreground"
      >
        Guardar en historial
      </Link>
    </PhoneShell>
  );
}
