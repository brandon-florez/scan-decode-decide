import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { ListaAnalisis } from "@/components/TarjetaAnalisis";

export const Route = createFileRoute("/historial")({
  component: Historial,
  head: () => ({
    meta: [
      { title: "Historial de productos | NutriLex" },
      {
        name: "description",
        content:
          "Consulta los productos que ya analizaste y compara rápidamente cuáles son bajos, moderados o altos.",
      },
      { property: "og:title", content: "Historial de productos | NutriLex" },
      {
        property: "og:description",
        content: "Revisa y compara los productos analizados anteriormente en NutriLex.",
      },
    ],
  }),
});

function Historial() {
  return (
    <PhoneShell>
      <h1 className="text-2xl font-extrabold text-foreground">Historial</h1>
      <p className="mt-1 text-sm text-muted-foreground">Productos que ya analizaste.</p>
      <ListaAnalisis className="mt-6" />
    </PhoneShell>
  );
}
