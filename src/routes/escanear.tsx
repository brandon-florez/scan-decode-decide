import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, Loader2 } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { ordenarEtiquetaReal } from "@/traductor/etiqueta-real";
import { leerTextoDeImagen } from "@/traductor/lectura-imagen";
import { publicarReporte } from "@/traductor/historial";
import { traducirEtiqueta } from "@/traductor/traduccion";

export const Route = createFileRoute("/escanear")({
  component: Escanear,
  head: () => ({
    meta: [
      { title: "Escanear etiqueta | NutriLex" },
      {
        name: "description",
        content: "Sube una foto de la etiqueta y NutriLex la traduce a lenguaje cotidiano.",
      },
      { property: "og:title", content: "Escanear etiqueta | NutriLex" },
      {
        property: "og:description",
        content: "Sube una foto de la etiqueta y NutriLex la traduce a lenguaje cotidiano.",
      },
    ],
  }),
});

function Escanear() {
  const navigate = useNavigate();
  const archivoRef = useRef<HTMLInputElement>(null);
  const vistaRef = useRef<string | null>(null);
  const [fase, setFase] = useState<"elegir" | "leyendo" | "corregir">("elegir");
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [avisoLectura, setAvisoLectura] = useState("");
  const [errores, setErrores] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    return () => {
      if (vistaRef.current) URL.revokeObjectURL(vistaRef.current);
    };
  }, []);

  function mostrarFoto(url: string) {
    if (vistaRef.current) URL.revokeObjectURL(vistaRef.current);
    vistaRef.current = url;
    setVistaPrevia(url);
  }

  function elegirFoto() {
    archivoRef.current?.click();
  }

  async function alElegirArchivo(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setFase("corregir");
      setAvisoLectura("El archivo tiene que ser una imagen de la etiqueta.");
      setTexto("");
      setErrores([]);
      return;
    }

    mostrarFoto(URL.createObjectURL(archivo));
    setFase("leyendo");
    setAvisoLectura("");
    setErrores([]);
    setTexto("");

    try {
      const leido = await leerTextoDeImagen(archivo);
      const ordenado = leido ? ordenarEtiquetaReal(leido) : null;
      setTexto(ordenado ?? leido);
      if (!leido) {
        setAvisoLectura("No se leyó texto en la foto. Escríbelo en el recuadro para poder analizarlo.");
      } else if (ordenado) {
        setAvisoLectura("Revisa el texto ordenado. Corrígelo si no coincide con la foto y luego analízalo.");
      } else {
        setAvisoLectura("No pude ordenar este texto al formato de la etiqueta. Corrígelo en el recuadro y luego analízalo.");
      }
    } catch {
      setTexto("");
      setAvisoLectura(
        "No se pudo leer la foto en este navegador. Escribe el texto de la etiqueta en el recuadro.",
      );
    }
    setFase("corregir");
  }

  async function analizar() {
    setEnviando(true);
    setErrores([]);
    const ordenado = ordenarEtiquetaReal(texto);
    const fuente = ordenado ?? texto;
    if (fuente !== texto) {
      setTexto(fuente);
      setAvisoLectura("Revisa el texto ordenado. Corrígelo si no coincide con la foto y luego analízalo.");
    }
    const resultado = await traducirEtiqueta(fuente, "Etiqueta de la foto");
    setEnviando(false);

    if (!resultado.ok) {
      setErrores([...resultado.errores]);
      return;
    }

    const id = await publicarReporte(resultado.reporte);
    if (id) void navigate({ to: "/resultado", search: { id } });
    else void navigate({ to: "/resultado" });
  }

  return (
    <PhoneShell>
      <h1 className="text-2xl font-extrabold text-foreground">Escanear etiqueta</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Elige una foto guardada. La imagen se queda en este navegador.
      </p>

      <input
        ref={archivoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void alElegirArchivo(event)}
      />

      <div className="relative mt-6 flex aspect-[3/4] items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-primary/40 bg-accent/50">
        {fase === "elegir" && <Camera className="size-16 text-primary/60" />}
        {fase !== "elegir" && vistaPrevia && (
          <img src={vistaPrevia} alt="Foto de la etiqueta elegida" className="size-full object-contain" />
        )}
        {fase === "leyendo" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-center">
            <Loader2 className="size-14 animate-spin text-primary" />
            <p className="mt-4 text-lg font-bold text-foreground">Leyendo la etiqueta...</p>
          </div>
        )}
      </div>

      {fase === "corregir" && (
        <div className="mt-6 space-y-3">
          {avisoLectura && <p className="text-sm text-muted-foreground">{avisoLectura}</p>}
          <label className="block text-sm font-bold text-foreground" htmlFor="texto-leido">
            Texto de la etiqueta
          </label>
          <textarea
            id="texto-leido"
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            rows={8}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
            placeholder={"Porción: 30 g\nAzúcares: 12 g\nIngredientes: ..."}
          />
          <p className="text-xs text-muted-foreground">Se ordena sola. Lo que falte no se inventa.</p>
          {errores.length > 0 && (
            <ul className="space-y-1 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errores.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {fase === "corregir" ? (
          <>
            <button
              type="button"
              onClick={() => void analizar()}
              disabled={enviando || texto.trim() === ""}
              className="flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 text-lg font-bold text-primary-foreground disabled:opacity-60"
            >
              {enviando ? "Analizando..." : "Analizar esta etiqueta"}
            </button>
            <button
              type="button"
              onClick={elegirFoto}
              disabled={enviando}
              className="flex w-full items-center justify-center rounded-2xl border border-border bg-card px-5 py-4 text-base font-bold text-foreground disabled:opacity-60"
            >
              Elegir otra foto
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={elegirFoto}
            disabled={fase === "leyendo"}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-5 text-lg font-bold text-primary-foreground disabled:opacity-60"
          >
            <Camera className="size-6" />
            {fase === "leyendo" ? "Leyendo..." : "Tomar foto"}
          </button>
        )}
      </div>
    </PhoneShell>
  );
}
