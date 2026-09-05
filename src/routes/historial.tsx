import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { history, levelClasses, levelDot, levelLabel } from "@/data/nutrilex";

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

      <ul className="mt-6 space-y-3">
        {history.map((item) => (
          <li key={item.name}>
            <Link
              to="/resultado"
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-bold text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.when}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-bold ${levelClasses[item.level]}`}
              >
                {levelDot[item.level]} {levelLabel[item.level]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PhoneShell>
  );
}
