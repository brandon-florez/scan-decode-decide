import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, PencilLine, Leaf } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { ListaAnalisis } from "@/components/TarjetaAnalisis";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "NutriLex — Entiende lo que comes" },
      {
        name: "description",
        content:
          "Escanea la etiqueta de un producto y entiende en segundos sus azúcares, sodio, grasas, fibra, proteína y calorías.",
      },
      { property: "og:title", content: "NutriLex — Entiende lo que comes" },
      {
        property: "og:description",
        content: "Escanea, entiende y decide: semáforo nutricional simple para tus compras.",
      },
    ],
  }),
});

function Index() {
  return (
    <PhoneShell>
      <header className="text-center">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold tracking-tight text-foreground">
          <Leaf className="size-7 text-primary" />
          NutriLex
        </h1>
        <p className="mt-1 text-base text-muted-foreground">Entiende lo que comes.</p>
      </header>

      <section className="mt-8 rounded-3xl bg-mint p-6 text-mint-foreground shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-bold">¿Qué quieres analizar?</h2>
        <p className="mt-1 text-sm opacity-80">Escanea, entiende y decide.</p>

        <div className="mt-6 space-y-3">
          <Link
            to="/escanear"
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-5 text-lg font-bold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <Camera className="size-6" />
            Escanear etiqueta
          </Link>
          <Link
            to="/ingresar"
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-primary bg-background px-5 py-5 text-lg font-bold text-primary transition-transform active:scale-[0.98]"
          >
            <PencilLine className="size-6" />
            Ingresar datos
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Analizados hace poco</h2>
          <Link to="/historial" className="text-sm font-semibold text-primary">
            Ver todo
          </Link>
        </div>
        <ListaAnalisis limite={2} />
      </section>
    </PhoneShell>
  );
}
