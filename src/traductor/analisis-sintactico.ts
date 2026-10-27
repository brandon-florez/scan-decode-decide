/**
 * Paso 3 del traductor. Comprueba que los tokens formen una etiqueta
 * y construye el árbol. No asigna niveles ni traduce ingredientes.
 *
 * Etiqueta     → Porción Nutrientes Ingredientes
 * Porción      → "Porción" ":" Número Unidad
 * Nutrientes   → Nutriente { Nutriente }
 * Nutriente    → Nombre ":" Número Unidad
 * Ingredientes → "Ingredientes" ":" Ingrediente { "," Ingrediente }
 */

import type { IdNutriente } from "@/traductor/lenguaje-fuente";
import { idDeNutriente } from "@/traductor/lenguaje-fuente";
import { analizarLexico, type ErrorLexico, type Posicion, type Token } from "@/traductor/analisis-lexico";

const FRASE_NUTRIENTE: Record<IdNutriente, string> = {
  azucares: "los azúcares",
  sodio: "el sodio",
  grasas: "las grasas",
  grasasSaturadas: "las grasas saturadas",
  fibra: "la fibra",
  proteina: "la proteína",
  calorias: "las calorías",
};

export type NodoCantidad = {
  tipo: "cantidad";
  valor: number;
  lexema: string;
  unidad: string;
  posicion: Posicion;
};

export type NodoPorcion = {
  tipo: "porcion";
  posicion: Posicion;
  cantidad: NodoCantidad;
};

export type NodoNutriente = {
  tipo: "nutriente";
  id: IdNutriente;
  nombre: string;
  posicion: Posicion;
  cantidad: NodoCantidad;
};

export type NodoIngredientes = {
  tipo: "ingredientes";
  posicion: Posicion;
  nombres: readonly string[];
};

export type ArbolEtiqueta = {
  tipo: "etiqueta";
  porcion: NodoPorcion;
  nutrientes: readonly NodoNutriente[];
  ingredientes: NodoIngredientes;
};

export type ErrorSintactico = {
  mensaje: string;
  posicion: Posicion;
};

export type ResultadoSintactico =
  | { valido: true; arbol: ArbolEtiqueta }
  | { valido: false; errores: readonly ErrorSintactico[] };

export type ResultadoTexto =
  | {
      valido: true;
      tokens: readonly Token[];
      arbol: ArbolEtiqueta;
      erroresLexicos: readonly ErrorLexico[];
      erroresSintacticos: readonly ErrorSintactico[];
    }
  | {
      valido: false;
      tokens: readonly Token[];
      erroresLexicos: readonly ErrorLexico[];
      erroresSintacticos: readonly ErrorSintactico[];
    };

export function analizarTexto(texto: string): ResultadoTexto {
  const lexico = analizarLexico(texto);
  const sintaxis = analizarSintaxis(lexico.tokens);

  if (lexico.errores.length === 0 && sintaxis.valido) {
    return {
      valido: true,
      tokens: lexico.tokens,
      arbol: sintaxis.arbol,
      erroresLexicos: lexico.errores,
      erroresSintacticos: [],
    };
  }

  return {
    valido: false,
    tokens: lexico.tokens,
    erroresLexicos: lexico.errores,
    erroresSintacticos: sintaxis.valido ? [] : sintaxis.errores,
  };
}

export function analizarSintaxis(tokens: readonly Token[]): ResultadoSintactico {
  const parser = new Parser(tokens);
  return parser.etiqueta();
}

export function describirArbol(arbol: ArbolEtiqueta): readonly string[] {
  const lineas = [
    "Etiqueta",
    "  Porción",
    `    ${arbol.porcion.cantidad.lexema} ${arbol.porcion.cantidad.unidad}`,
    "  Nutrientes",
  ];

  for (const nutriente of arbol.nutrientes) {
    lineas.push(`    ${nutriente.nombre}`, `      ${nutriente.cantidad.lexema} ${nutriente.cantidad.unidad}`);
  }

  lineas.push("  Ingredientes");
  for (const nombre of arbol.ingredientes.nombres) lineas.push(`    ${nombre}`);
  return lineas;
}

class Parser {
  private indice = 0;
  private readonly errores: ErrorSintactico[] = [];

  constructor(private readonly tokens: readonly Token[]) {}

  etiqueta(): ResultadoSintactico {
    const porcion = this.leerPorcion();
    const nutrientes = this.leerNutrientes();
    const ingredientes = this.leerIngredientes();

    if (this.ver()) {
      this.errores.push({
        mensaje: "Sobran elementos al final de la etiqueta.",
        posicion: this.posicionActual(),
      });
    }

    if (!porcion || nutrientes.length === 0 || !ingredientes || this.errores.length > 0) {
      return { valido: false, errores: this.errores };
    }

    return {
      valido: true,
      arbol: { tipo: "etiqueta", porcion, nutrientes, ingredientes },
    };
  }

  private leerPorcion(): NodoPorcion | undefined {
    const token = this.ver();
    if (!token || !esPorcion(token)) {
      this.errores.push({ mensaje: "Falta la porción.", posicion: this.posicionActual() });
      return undefined;
    }

    this.avanzar();
    const cantidad = this.leerCantidad("la porción");
    if (!cantidad) {
      this.sincronizar();
      return undefined;
    }

    return { tipo: "porcion", posicion: token.posicion, cantidad };
  }

  private leerNutrientes(): NodoNutriente[] {
    const nutrientes: NodoNutriente[] = [];
    const vistos = new Set<IdNutriente>();
    let vioNutriente = false;

    while (this.esNutrienteActual()) {
      const token = this.ver();
      if (!token) break;
      vioNutriente = true;
      const id = idDeNutriente(token.lexema);
      this.avanzar();

      if (!id) {
        this.errores.push({ mensaje: `Nutriente no reconocido: ${token.lexema}.`, posicion: token.posicion });
        this.sincronizar();
        continue;
      }

      const repetido = vistos.has(id);
      if (repetido) {
        this.errores.push({ mensaje: `${token.lexema} está repetido.`, posicion: token.posicion });
      }

      const cantidad = this.leerCantidad(FRASE_NUTRIENTE[id]);
      if (!cantidad) {
        this.sincronizar();
        continue;
      }

      vistos.add(id);
      if (!repetido) {
        nutrientes.push({
          tipo: "nutriente",
          id,
          nombre: token.lexema,
          posicion: token.posicion,
          cantidad,
        });
      }
    }

    if (!vioNutriente) {
      this.errores.push({
        mensaje: "Falta al menos un nutriente.",
        posicion: this.posicionActual(),
      });
    }

    return nutrientes;
  }

  private leerIngredientes(): NodoIngredientes | undefined {
    const token = this.ver();
    if (!token || !esIngredientes(token)) {
      this.errores.push({ mensaje: "Falta la lista de ingredientes.", posicion: this.posicionActual() });
      return undefined;
    }

    this.avanzar();
    if (!this.consumirDosPuntos("los ingredientes")) {
      this.sincronizar();
      return undefined;
    }

    const nombres: string[] = [];
    if (this.ver()?.tipo !== "ingrediente") {
      this.errores.push({ mensaje: "Falta la lista de ingredientes.", posicion: this.posicionActual() });
      return undefined;
    }

    while (this.ver()?.tipo === "ingrediente") {
      const ingrediente = this.ver();
      if (!ingrediente) break;
      nombres.push(ingrediente.lexema);
      this.avanzar();

      if (this.ver()?.tipo === "separador" && this.ver()?.lexema === ",") {
        this.avanzar();
        if (this.ver()?.tipo !== "ingrediente") {
          this.errores.push({
            mensaje: "Falta un ingrediente después de la coma.",
            posicion: this.posicionActual(),
          });
          break;
        }
      }
    }

    return { tipo: "ingredientes", posicion: token.posicion, nombres };
  }

  private leerCantidad(frase: string): NodoCantidad | undefined {
    if (!this.consumirDosPuntos(frase)) return undefined;

    const numero = this.ver();
    if (numero?.tipo !== "numero") {
      this.errores.push({ mensaje: `Falta el número de ${frase}.`, posicion: this.posicionActual() });
      return undefined;
    }
    this.avanzar();

    const unidad = this.ver();
    if (unidad?.tipo !== "unidad") {
      this.errores.push({ mensaje: `Falta la unidad de ${frase}.`, posicion: this.posicionActual() });
      return undefined;
    }
    this.avanzar();

    const valor = Number(numero.lexema.replace(",", "."));
    if (!Number.isFinite(valor)) {
      this.errores.push({ mensaje: "Número mal formado.", posicion: numero.posicion });
      return undefined;
    }

    return {
      tipo: "cantidad",
      valor,
      lexema: numero.lexema,
      unidad: unidad.lexema,
      posicion: numero.posicion,
    };
  }

  private consumirDosPuntos(frase: string): boolean {
    const token = this.ver();
    if (token?.tipo === "separador" && token.lexema === ":") {
      this.avanzar();
      return true;
    }
    this.errores.push({ mensaje: `Falta ":" después de ${frase}.`, posicion: this.posicionActual() });
    return false;
  }

  private sincronizar(): void {
    while (this.ver() && !this.esInicioDeCampo()) this.avanzar();
  }

  private esInicioDeCampo(): boolean {
    const token = this.ver();
    if (!token) return false;
    return esPorcion(token) || esIngredientes(token) || this.esNutrienteActual();
  }

  private esNutrienteActual(): boolean {
    const token = this.ver();
    return token?.tipo === "nutriente";
  }

  private ver(): Token | undefined {
    return this.tokens[this.indice];
  }

  private avanzar(): void {
    this.indice += 1;
  }

  private posicionActual(): Posicion {
    return this.ver()?.posicion ?? this.tokens[this.tokens.length - 1]?.posicion ?? { linea: 1, columna: 1 };
  }
}

function esPorcion(token: Token): boolean {
  return token.tipo === "palabra_clave" && normalizar(token.lexema) === "porcion";
}

function esIngredientes(token: Token): boolean {
  return token.tipo === "palabra_clave" && normalizar(token.lexema) === "ingredientes";
}

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}
