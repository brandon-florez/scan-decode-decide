import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { levelClasses, levelDot, levelLabel } from "@/data/nutrilex";
import { formatearMomento, leerHistorial, type EntradaHistorial } from "@/traductor/historial";

export function TarjetaAnalisis({ entrada }: { entrada: EntradaHistorial }) {
  return (
    <li>
      <Link
        to="/resultado"
        search={{ id: entrada.id }}
        className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
      >
        <div>
          <p className="font-bold text-foreground">{entrada.producto}</p>
          <p className="text-sm text-muted-foreground">{formatearMomento(entrada.creadoEn)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${levelClasses[entrada.nivel]}`}>
          {levelDot[entrada.nivel]} {levelLabel[entrada.nivel]}
        </span>
      </Link>
    </li>
  );
}

export function ListaAnalisis({ limite, className = "mt-3" }: { limite?: number; className?: string }) {
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [entradas, setEntradas] = useState<readonly EntradaHistorial[]>([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let vigente = true;
    void leerHistorial().then((lectura) => {
      if (!vigente) return;
      if (!lectura.ok) {
        setMensaje(lectura.mensaje);
        setEstado("error");
        return;
      }
      setEntradas(limite === undefined ? lectura.entradas : lectura.entradas.slice(0, limite));
      setEstado("listo");
    });
    return () => {
      vigente = false;
    };
  }, [limite]);

  if (estado === "cargando") {
    return <p className={`${className} text-sm text-muted-foreground`}>Cargando historial...</p>;
  }
  if (estado === "error") {
    return <p className={`${className} text-sm text-destructive`}>{mensaje}</p>;
  }
  if (entradas.length === 0) {
    return <p className={`${className} text-sm text-muted-foreground`}>Todavía no hay productos analizados.</p>;
  }

  return (
    <ul className={`${className} space-y-3`}>
      {entradas.map((entrada) => (
        <TarjetaAnalisis key={entrada.id} entrada={entrada} />
      ))}
    </ul>
  );
}
