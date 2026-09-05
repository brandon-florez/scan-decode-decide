import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/ingresar")({
  component: Ingresar,
  head: () => ({
    meta: [
      { title: "Ingresar datos | NutriLex" },
      {
        name: "description",
        content:
          "Escribe a mano los datos de la etiqueta cuando no puedas usar la cámara y recibe el mismo análisis claro.",
      },
      { property: "og:title", content: "Ingresar datos | NutriLex" },
      {
        property: "og:description",
        content: "Captura manualmente azúcares, sodio, grasas y calorías del producto.",
      },
    ],
  }),
});

const fields = [
  { label: "Nombre del producto", placeholder: "Cereal de chocolate" },
  { label: "Azúcares (g)", placeholder: "12" },
  { label: "Sodio (mg)", placeholder: "180" },
  { label: "Grasas (g)", placeholder: "3" },
  { label: "Calorías (kcal)", placeholder: "120" },
];

function Ingresar() {
  return (
    <PhoneShell>
      <h1 className="text-2xl font-extrabold text-foreground">Ingresar datos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Escribe lo que aparece en la etiqueta del producto.
      </p>

      <form className="mt-6 space-y-4">
        {fields.map((f) => (
          <label key={f.label} className="block">
            <span className="text-sm font-semibold text-foreground">{f.label}</span>
            <input
              placeholder={f.placeholder}
              className="mt-1 w-full rounded-2xl border border-input bg-card px-4 py-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </label>
        ))}
      </form>

      <Link
        to="/resultado"
        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-5 text-lg font-bold text-primary-foreground active:scale-[0.98]"
      >
        Analizar
      </Link>
    </PhoneShell>
  );
}
