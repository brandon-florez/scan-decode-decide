/**
 * Paso 2 del traductor. Parte el texto de la etiqueta en tokens.
 * No decide si la porción falta ni qué nivel tiene un nutriente:
 * solo reconoce lexema, tipo y posición, o avisa si el texto no se puede leer.
 */

import { frasesDelLenguaje, idDeNutriente, SECUENCIA_CAMPOS, UNIDADES } from "@/traductor/lenguaje-fuente";

export const TIPOS_TOKEN = [
  "palabra_clave",
  "nutriente",
  "numero",
  "unidad",
  "ingrediente",
  "separador",
] as const;

export type TipoToken = (typeof TIPOS_TOKEN)[number];

export type Posicion = {
  linea: number;
  columna: number;
};

export type Token = {
  tipo: TipoToken;
  lexema: string;
  posicion: Posicion;
};

export type ErrorLexico = {
  mensaje: string;
  lexema: string;
  posicion: Posicion;
};

export type ResultadoLexico = {
  tokens: readonly Token[];
  errores: readonly ErrorLexico[];
};

const PALABRAS_CLAVE = new Set(
  SECUENCIA_CAMPOS.filter((campo) => campo.id === "porcion" || campo.id === "ingredientes").map((campo) =>
    normalizar(campo.etiqueta),
  ),
);

const NOMBRES_UNIDAD = new Set(UNIDADES.map((unidad) => normalizar(unidad)));
const FRASES = frasesDelLenguaje();
const FRASES_CONOCIDAS = new Set(FRASES);

type Cursor = {
  texto: string;
  i: number;
  linea: number;
  columna: number;
};

export function analizarLexico(texto: string): ResultadoLexico {
  const cursor: Cursor = { texto, i: 0, linea: 1, columna: 1 };
  const tokens: Token[] = [];
  const errores: ErrorLexico[] = [];
  let modoIngredientes = false;
  let esperaDosPuntos = false;

  while (cursor.i < cursor.texto.length) {
    if (modoIngredientes) {
      leerIngrediente(cursor, tokens, errores);
      modoIngredientes = false;
      continue;
    }

    saltarEspacios(cursor);
    if (cursor.i >= cursor.texto.length) break;

    const actual = caracter(cursor);
    const posicion = marcar(cursor);

    if (esLetra(actual)) {
      const lexema = leerTermino(cursor);
      const clave = normalizar(lexema);
      const tipo = tipoDePalabra(clave);

      if (!tipo) {
        errores.push({
          mensaje: `Palabra no reconocida: ${lexema}.`,
          lexema,
          posicion,
        });
        esperaDosPuntos = false;
        continue;
      }

      tokens.push({ tipo, lexema, posicion });
      esperaDosPuntos = tipo === "palabra_clave" && clave === "ingredientes";
      continue;
    }

    if (esDigito(actual) || (actual === "-" && esDigito(mirar(cursor, 1)))) {
      leerNumero(cursor, tokens, errores, posicion);
      esperaDosPuntos = false;
      continue;
    }

    if (actual === ":" || actual === ",") {
      avanzar(cursor);
      tokens.push({ tipo: "separador", lexema: actual, posicion });
      if (actual === ":" && esperaDosPuntos) modoIngredientes = true;
      esperaDosPuntos = false;
      continue;
    }

    avanzar(cursor);
    errores.push({
      mensaje: `Carácter no válido: ${mostrarCaracter(actual)}.`,
      lexema: actual,
      posicion,
    });
    esperaDosPuntos = false;
  }

  return { tokens, errores };
}

function leerIngrediente(cursor: Cursor, tokens: Token[], errores: ErrorLexico[]): void {
  for (;;) {
    saltarEspaciosEnLinea(cursor);
    if (cursor.i >= cursor.texto.length || esFinDeLinea(caracter(cursor))) {
      const anterior = tokens[tokens.length - 1];
      if (anterior?.tipo === "separador" && anterior.lexema === ",") {
        errores.push({
          mensaje: "Ingrediente vacío.",
          lexema: "",
          posicion: marcar(cursor),
        });
      }
      return;
    }

    if (caracter(cursor) === ",") {
      const posicion = marcar(cursor);
      errores.push({ mensaje: "Ingrediente vacío.", lexema: "", posicion });
      avanzar(cursor);
      tokens.push({ tipo: "separador", lexema: ",", posicion });
      continue;
    }

    const posicion = marcar(cursor);
    let lexema = "";

    while (cursor.i < cursor.texto.length) {
      const actual = caracter(cursor);
      if (actual === "," || esFinDeLinea(actual)) break;
      if (!esCaracterDeIngrediente(actual)) {
        errores.push({
          mensaje: `Carácter no válido: ${mostrarCaracter(actual)}.`,
          lexema: actual,
          posicion: marcar(cursor),
        });
        avanzar(cursor);
        continue;
      }
      lexema += actual;
      avanzar(cursor);
    }

    const nombre = lexema.trim().replace(/\s+/g, " ");
    if (nombre.length === 0) {
      errores.push({ mensaje: "Ingrediente vacío.", lexema: "", posicion });
    } else {
      tokens.push({ tipo: "ingrediente", lexema: nombre, posicion });
    }

    if (caracter(cursor) === ",") {
      const posicionComa = marcar(cursor);
      avanzar(cursor);
      tokens.push({ tipo: "separador", lexema: ",", posicion: posicionComa });
      continue;
    }

    return;
  }
}

function leerNumero(
  cursor: Cursor,
  tokens: Token[],
  errores: ErrorLexico[],
  posicion: Posicion,
): void {
  let lexema = "";
  if (caracter(cursor) === "-") lexema += avanzar(cursor);
  lexema += leerDigitos(cursor);
  const decimal = caracter(cursor);

  if ((decimal === "." || decimal === ",") && esDigito(mirar(cursor, 1))) {
    lexema += decimal;
    avanzar(cursor);
    lexema += leerDigitos(cursor);
  }

  const sobra = caracter(cursor);
  const separadorDeMas = sobra === "." || (sobra === "," && esDigito(mirar(cursor, 1)));
  if (separadorDeMas) {
    lexema += avanzar(cursor);
    if (esDigito(caracter(cursor))) lexema += leerDigitos(cursor);
    while (esDigito(caracter(cursor)) || caracter(cursor) === "." || caracter(cursor) === ",") {
      lexema += avanzar(cursor);
    }
    errores.push({ mensaje: "Número mal formado.", lexema, posicion });
    return;
  }

  const unidadPegada = mirarUnidad(cursor);
  if (esLetra(caracter(cursor)) && !unidadPegada) {
    while (esLetra(caracter(cursor))) lexema += avanzar(cursor);
    errores.push({ mensaje: "Número mal formado.", lexema, posicion });
    return;
  }

  tokens.push({ tipo: "numero", lexema, posicion });
}

function leerTermino(cursor: Cursor): string {
  let frase = "";
  let mejor = "";
  let finMejor = copiarCursor(cursor);

  while (esLetra(caracter(cursor))) {
    if (frase) frase += " ";
    frase += leerLetras(cursor);
    const clave = normalizar(frase);
    if (FRASES_CONOCIDAS.has(clave)) {
      mejor = frase;
      finMejor = copiarCursor(cursor);
    }
    if (!FRASES.some((conocida) => conocida.startsWith(`${clave} `))) break;
    const antesDelEspacio = copiarCursor(cursor);
    saltarEspaciosEnLinea(cursor);
    if (!esLetra(caracter(cursor))) {
      restaurarCursor(cursor, antesDelEspacio);
      break;
    }
  }

  if (mejor) {
    restaurarCursor(cursor, finMejor);
    return mejor;
  }
  return frase;
}

function copiarCursor(cursor: Cursor): Cursor {
  return { texto: cursor.texto, i: cursor.i, linea: cursor.linea, columna: cursor.columna };
}

function restaurarCursor(cursor: Cursor, copia: Cursor): void {
  cursor.i = copia.i;
  cursor.linea = copia.linea;
  cursor.columna = copia.columna;
}

function leerLetras(cursor: Cursor): string {
  let lexema = "";
  while (esLetra(caracter(cursor))) lexema += avanzar(cursor);
  return lexema;
}

function leerDigitos(cursor: Cursor): string {
  let lexema = "";
  while (esDigito(caracter(cursor))) lexema += avanzar(cursor);
  return lexema;
}

function mirarUnidad(cursor: Cursor): string | undefined {
  let letras = "";
  let offset = 0;
  while (esLetra(mirar(cursor, offset))) {
    letras += mirar(cursor, offset);
    offset += 1;
  }
  if (!NOMBRES_UNIDAD.has(normalizar(letras))) return undefined;
  return letras;
}

function saltarEspacios(cursor: Cursor): void {
  while (cursor.i < cursor.texto.length) {
    const actual = caracter(cursor);
    if (actual !== " " && actual !== "\t" && actual !== "\n" && actual !== "\r") return;
    avanzar(cursor);
  }
}

function saltarEspaciosEnLinea(cursor: Cursor): void {
  while (cursor.i < cursor.texto.length) {
    const actual = caracter(cursor);
    if (actual !== " " && actual !== "\t") return;
    avanzar(cursor);
  }
}

function tipoDePalabra(clave: string): TipoToken | undefined {
  if (PALABRAS_CLAVE.has(clave)) return "palabra_clave";
  if (idDeNutriente(clave)) return "nutriente";
  if (NOMBRES_UNIDAD.has(clave)) return "unidad";
  return undefined;
}

function marcar(cursor: Cursor): Posicion {
  return { linea: cursor.linea, columna: cursor.columna };
}

function caracter(cursor: Cursor): string {
  return cursor.texto[cursor.i] ?? "";
}

function mirar(cursor: Cursor, desplazamiento: number): string {
  return cursor.texto[cursor.i + desplazamiento] ?? "";
}

function avanzar(cursor: Cursor): string {
  const actual = caracter(cursor);
  if (actual === "") return "";
  cursor.i += 1;
  if (actual === "\n") {
    cursor.linea += 1;
    cursor.columna = 1;
  } else if (actual !== "\r") {
    cursor.columna += 1;
  }
  return actual;
}

function esLetra(valor: string): boolean {
  return /\p{L}/u.test(valor);
}

function esDigito(valor: string): boolean {
  return valor >= "0" && valor <= "9";
}

function esFinDeLinea(valor: string): boolean {
  return valor === "\n" || valor === "\r" || valor === "";
}

function esCaracterDeIngrediente(valor: string): boolean {
  return esLetra(valor) || esDigito(valor) || valor === " " || valor === "(" || valor === ")" || valor === "-" || valor === "/";
}

function mostrarCaracter(valor: string): string {
  if (valor === "\n") return "salto de línea";
  if (valor === "\t") return "tabulador";
  return valor;
}

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}
