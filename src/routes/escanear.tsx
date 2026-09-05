import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Check, Loader2 } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/escanear")({
  component: Escanear,
  head: () => ({
    meta: [
      { title: "Escanear etiqueta | NutriLex" },
      {
        name: "description",
        content: "Toma una foto de la tabla nutrimental y NutriLex analiza el producto por ti.",
      },
      { property: "og:title", content: "Escanear etiqueta | NutriLex" },
      {
        property: "og:description",
        content: "Analiza una etiqueta nutrimental en segundos con NutriLex.",
      },
    ],
  }),
});

function Escanear() {
  const [state, setState] = useState<"listo" | "analizando" | "listo-resultado">("listo");

  useEffect(() => {
    if (state !== "analizando") return;
    const t = setTimeout(() => setState("listo-resultado"), 2200);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <PhoneShell>
      <h1 className="text-2xl font-extrabold text-foreground">Escanear etiqueta</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enfoca la tabla nutrimental y los ingredientes.
      </p>

      <div className="mt-6 flex aspect-[3/4] items-center justify-center rounded-3xl border-2 border-dashed border-primary/40 bg-accent/50">
        {state === "listo" && <Camera className="size-16 text-primary/60" />}
        {state === "analizando" && (
          <div className="text-center">
            <Loader2 className="mx-auto size-14 animate-spin text-primary" />
            <p className="mt-4 text-lg font-bold text-foreground">Analizando producto...</p>
          </div>
        )}
        {state === "listo-resultado" && (
          <div className="text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-9" />
            </span>
            <p className="mt-4 text-lg font-bold text-foreground">Análisis terminado</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        {state === "listo-resultado" ? (
          <Link
            to="/resultado"
            className="flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-5 text-lg font-bold text-primary-foreground active:scale-[0.98]"
          >
            Ver resultado
          </Link>
        ) : (
          <button
            onClick={() => setState("analizando")}
            disabled={state === "analizando"}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-5 text-lg font-bold text-primary-foreground disabled:opacity-60"
          >
            <Camera className="size-6" />
            {state === "analizando" ? "Analizando..." : "Tomar foto"}
          </button>
        )}
      </div>
    </PhoneShell>
  );
}
