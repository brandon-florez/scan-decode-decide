import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { publicarReporte } from "@/traductor/historial";
import { textoDesdeCaptura, traducirEtiqueta, type CapturaManual } from "@/traductor/traduccion";

export const Route = createFileRoute("/ingresar")({
  component: Ingresar,
  head: () => ({
    meta: [
      { title: "Ingresar datos | NutriLex" },
      {
        name: "description",
        content:
          "Escribe a mano los datos de la etiqueta y recibe el mismo análisis claro que con una foto.",
      },
      { property: "og:title", content: "Ingresar datos | NutriLex" },
      {
        property: "og:description",
        content: "Captura manualmente azúcares, sodio, grasas y calorías del producto.",
      },
    ],
  }),
});

const datos: { clave: keyof CapturaManual; etiqueta: string; placeholder: string }[] = [
  { clave: "producto", etiqueta: "Nombre del producto", placeholder: "Cereal de chocolate" },
  { clave: "porcion", etiqueta: "Porción (g)", placeholder: "30" },
];

const vigilar: { clave: keyof CapturaManual; etiqueta: string; placeholder: string }[] = [
  { clave: "azucares", etiqueta: "Azúcares (g)", placeholder: "12" },
  { clave: "sodio", etiqueta: "Sodio (mg)", placeholder: "180" },
  { clave: "grasas", etiqueta: "Grasas (g)", placeholder: "3" },
  { clave: "grasasSaturadas", etiqueta: "Grasas saturadas (g)", placeholder: "1" },
  { clave: "calorias", etiqueta: "Calorías (kcal)", placeholder: "120" },
];

const aporte: { clave: keyof CapturaManual; etiqueta: string; placeholder: string }[] = [
  { clave: "fibra", etiqueta: "Fibra (g)", placeholder: "2" },
  { clave: "proteina", etiqueta: "Proteína (g)", placeholder: "6" },
];

const vacia: CapturaManual = {
  producto: "",
  porcion: "",
  azucares: "",
  sodio: "",
  grasas: "",
  grasasSaturadas: "",
  fibra: "",
  proteina: "",
  calorias: "",
  ingredientes: "",
};

function Campo({
  campo,
  valor,
  onChange,
}: {
  campo: { clave: keyof CapturaManual; etiqueta: string; placeholder: string };
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground">{campo.etiqueta}</span>
      <input
        value={valor}
        placeholder={campo.placeholder}
        inputMode={campo.clave === "producto" ? "text" : "decimal"}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-2xl border border-input bg-card px-3 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
      />
    </label>
  );
}

function Ingresar() {
  const navigate = useNavigate();
  const [captura, setCaptura] = useState<CapturaManual>(vacia);
  const [errores, setErrores] = useState<readonly string[]>([]);
  const [enviando, setEnviando] = useState(false);

  function escribir(clave: keyof CapturaManual) {
    return (valor: string) => setCaptura((actual) => ({ ...actual, [clave]: valor }));
  }

  async function analizar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const preparado = textoDesdeCaptura(captura);
    if ("errores" in preparado) {
      setErrores(preparado.errores);
      return;
    }

    setEnviando(true);
    setErrores([]);
    const resultado = await traducirEtiqueta(preparado.texto, preparado.producto);
    setEnviando(false);

    if (!resultado.ok) {
      setErrores(resultado.errores);
      return;
    }

    const id = await publicarReporte(resultado.reporte);
    if (id) void navigate({ to: "/resultado", search: { id } });
    else void navigate({ to: "/resultado" });
  }

  return (
    <PhoneShell>
      <h1 className="text-2xl font-extrabold text-foreground">Ingresar datos</h1>
      <p className="mt-1 text-sm text-muted-foreground">Porción, nutrientes e ingredientes.</p>

      <form className="mt-6 space-y-4" onSubmit={(event) => void analizar(event)}>
        {datos.map((campo) => (
          <Campo key={campo.clave} campo={campo} valor={captura[campo.clave]} onChange={escribir(campo.clave)} />
        ))}

        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-foreground">Vigilar</legend>
          <div className="grid grid-cols-2 gap-3">
            {vigilar.map((campo) => (
              <Campo key={campo.clave} campo={campo} valor={captura[campo.clave]} onChange={escribir(campo.clave)} />
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-level-low">Aporte</legend>
          <div className="grid grid-cols-2 gap-3">
            {aporte.map((campo) => (
              <Campo key={campo.clave} campo={campo} valor={captura[campo.clave]} onChange={escribir(campo.clave)} />
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-sm font-semibold text-foreground">Ingredientes</span>
          <textarea
            value={captura.ingredientes}
            placeholder="azúcar, polvo de estrellas"
            onChange={(event) => setCaptura((actual) => ({ ...actual, ingredientes: event.target.value }))}
            className="mt-1 min-h-20 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </label>

        {errores.length > 0 && (
          <ul className="space-y-1 rounded-2xl bg-accent/60 p-4 text-sm text-foreground">
            {errores.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 text-lg font-bold text-primary-foreground disabled:opacity-60"
        >
          {enviando ? "Analizando..." : "Analizar"}
        </button>
      </form>
    </PhoneShell>
  );
}
