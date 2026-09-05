import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/consejos")({
  component: Consejos,
  head: () => ({
    meta: [
      { title: "Consejos para tus compras | NutriLex" },
      {
        name: "description",
        content:
          "Consejos cortos y fáciles de recordar para elegir mejor tus alimentos al leer las etiquetas.",
      },
      { property: "og:title", content: "Consejos para tus compras | NutriLex" },
      {
        property: "og:description",
        content: "Ideas rápidas para comprar mejor con ayuda del semáforo nutricional.",
      },
    ],
  }),
});

const tips = [
  {
    icon: "🍬",
    title: "Menos azúcar añadida",
    text: "Si el azúcar aparece entre los primeros ingredientes, busca otra opción.",
  },
  {
    icon: "🧂",
    title: "Cuida el sodio",
    text: "Compara dos productos parecidos y elige el de menor sodio.",
  },
  {
    icon: "📏",
    title: "Revisa la porción",
    text: "Los datos de la etiqueta suelen ser por porción, no por paquete.",
  },
  {
    icon: "🧪",
    title: "Menos nombres raros",
    text: "Entre menos ingredientes difíciles de pronunciar, mejor.",
  },
  {
    icon: "🥗",
    title: "Prefiere lo natural",
    text: "Frutas, verduras y cereales enteros casi siempre salen en verde.",
  },
];

function Consejos() {
  return (
    <PhoneShell>
      <h1 className="text-2xl font-extrabold text-foreground">Consejos</h1>
      <p className="mt-1 text-sm text-muted-foreground">Cortos, claros y fáciles de recordar.</p>

      <ul className="mt-6 space-y-3">
        {tips.map((t) => (
          <li key={t.title} className="rounded-2xl bg-accent/60 p-5">
            <p className="text-2xl">{t.icon}</p>
            <p className="mt-1 font-bold text-foreground">{t.title}</p>
            <p className="mt-1 text-sm text-foreground/80">{t.text}</p>
          </li>
        ))}
      </ul>
    </PhoneShell>
  );
}
