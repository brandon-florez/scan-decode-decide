/**
 * Ordena el texto de una etiqueta real al lenguaje fuente.
 * Reconoce los nombres que sí aparecen en una etiqueta en español
 * y deja fuera los nutrientes que no vienen. No inventa cantidades.
 */

import { NUTRIENTES, type IdNutriente, type Unidad } from "@/traductor/lenguaje-fuente";

type IdCampo = "porcion" | IdNutriente | "ingredientes";

type FraseCampo = {
  id: IdCampo;
  palabras: string;
  unidad: Unidad | null;
  sal: boolean;
};

type Hallazgo = {
  id: IdCampo;
  inicio: number;
  fin: number;
  unidad: Unidad | null;
  sal: boolean;
};

const FRASES: readonly FraseCampo[] = [
  { id: "porcion", palabras: "tamano de la porcion", unidad: "g", sal: false },
  { id: "porcion", palabras: "porcion", unidad: "g", sal: false },
  { id: "azucares", palabras: "de los cuales azucares", unidad: "g", sal: false },
  { id: "azucares", palabras: "de los cuales azticares", unidad: "g", sal: false },
  { id: "azucares", palabras: "de las cuales azucares", unidad: "g", sal: false },
  { id: "azucares", palabras: "azticares", unidad: "g", sal: false },
  { id: "azucares", palabras: "azucares totales", unidad: "g", sal: false },
  { id: "azucares", palabras: "azucares", unidad: "g", sal: false },
  { id: "sodio", palabras: "sodio", unidad: "mg", sal: false },
  { id: "sodio", palabras: "sal", unidad: "g", sal: true },
  { id: "grasasSaturadas", palabras: "de las cuales saturadas", unidad: "g", sal: false },
  { id: "grasasSaturadas", palabras: "de los cuales saturadas", unidad: "g", sal: false },
  { id: "grasasSaturadas", palabras: "grasas saturadas", unidad: "g", sal: false },
  { id: "grasasSaturadas", palabras: "grasa saturada", unidad: "g", sal: false },
  { id: "grasas", palabras: "grasa total", unidad: "g", sal: false },
  { id: "grasas", palabras: "grasas", unidad: "g", sal: false },
  { id: "fibra", palabras: "fibra alimentaria", unidad: "g", sal: false },
  { id: "fibra", palabras: "fibra dietetica", unidad: "g", sal: false },
  { id: "fibra", palabras: "fibra", unidad: "g", sal: false },
  { id: "proteina", palabras: "proteinas", unidad: "g", sal: false },
  { id: "proteina", palabras: "proteina", unidad: "g", sal: false },
  { id: "calorias", palabras: "contenido energetico", unidad: "kcal", sal: false },
  { id: "calorias", palabras: "valor energetico", unidad: "kcal", sal: false },
  { id: "calorias", palabras: "cont energetico", unidad: "kcal", sal: false },
  { id: "calorias", palabras: "calorias", unidad: "kcal", sal: false },
  { id: "calorias", palabras: "energia", unidad: "kcal", sal: false },
  { id: "ingredientes", palabras: "ingredientes", unidad: null, sal: false },
];

const RECHAZO: Record<string, readonly string[]> = {
  azucares: ["anadidos", "anadido"],
  grasas: ["trans"],
  energia: ["de"],
  "contenido energetico": ["de"],
  "valor energetico": ["de"],
  "cont energetico": ["de"],
};

const ETIQUETA: Record<IdNutriente, string> = {
  azucares: "Azúcares",
  sodio: "Sodio",
  grasas: "Grasas",
  grasasSaturadas: "Grasas saturadas",
  fibra: "Fibra",
  proteina: "Proteína",
  calorias: "Calorías",
};

const ACENTOS: Record<string, string> = {
  á: "a",
  à: "a",
  ä: "a",
  â: "a",
  é: "e",
  è: "e",
  ë: "e",
  ê: "e",
  í: "i",
  ì: "i",
  ï: "i",
  î: "i",
  ó: "o",
  ò: "o",
  ö: "o",
  ô: "o",
  ú: "u",
  ù: "u",
  ü: "u",
  û: "u",
  ñ: "n",
};

/**
 * Devuelve el lenguaje fuente, o null si el texto no trae ningún dato reconocible.
 * Porción, nutrientes e ingredientes quedan en el orden del traductor.
 */
export function ordenarEtiquetaReal(texto: string): string | null {
  const preparado = preparar(texto);
  const plano = aplanar(preparado).replaceAll("cuates", "cuales");
  const hallazgos = buscarCampos(plano);
  if (hallazgos.length === 0) return null;

  const ingredientes = zonaDeIngredientes(hallazgos);
  const dosColumnas = tieneDosColumnas(plano);
  const porcion = primeraCantidad(preparado, hallazgos, "porcion", ingredientes, dosColumnas) ?? leerPorcionDeRacion(plano);
  const nutrientes: Partial<Record<IdNutriente, { valor: number; unidad: Unidad }>> = {};

  for (const id of NUTRIENTES) {
    const cantidad = primeraCantidad(preparado, hallazgos, id, ingredientes, dosColumnas);
    if (cantidad) nutrientes[id] = cantidad;
  }

  const nombres = leerIngredientes(preparado, hallazgos, ingredientes);
  const lineas: string[] = [];

  if (porcion) lineas.push(`Porción: ${formatearValor(porcion.valor)} ${porcion.unidad}`);
  for (const id of NUTRIENTES) {
    const cantidad = nutrientes[id];
    if (!cantidad) continue;
    lineas.push(`${ETIQUETA[id]}: ${formatearValor(cantidad.valor)} ${cantidad.unidad}`);
  }
  if (nombres.length > 0) lineas.push(`Ingredientes: ${nombres.join(", ")}`);

  if (lineas.length === 0) return null;
  return lineas.join("\n");
}

function preparar(texto: string): string {
  return texto.replace(/[\u00a0\u2000-\u200b\t]/g, " ");
}

function aplanar(texto: string): string {
  let plano = "";
  for (const caracter of texto) {
    const minuscula = caracter.toLowerCase();
    plano += ACENTOS[minuscula] ?? minuscula;
  }
  return plano;
}

function buscarCampos(plano: string): Hallazgo[] {
  const encontrados: Hallazgo[] = [];

  for (const frase of FRASES) {
    const partes = frase.palabras.split(" ");
    let cursor = 0;
    while (cursor < plano.length) {
      if (!esInicioDePalabra(plano, cursor)) {
        cursor += 1;
        continue;
      }
      const fin = coincide(plano, cursor, partes);
      if (fin === undefined) {
        cursor += 1;
        continue;
      }
      if (!rechazado(plano, fin, frase.palabras)) {
        encontrados.push({ id: frase.id, inicio: cursor, fin, unidad: frase.unidad, sal: frase.sal });
      }
      cursor = fin;
    }
  }

  encontrados.sort((a, b) => a.inicio - b.inicio || b.fin - a.fin);
  const elegidos: Hallazgo[] = [];
  let ocupadoHasta = -1;
  for (const hallazgo of encontrados) {
    if (hallazgo.inicio < ocupadoHasta) continue;
    elegidos.push(hallazgo);
    ocupadoHasta = hallazgo.fin;
  }
  return elegidos;
}

function coincide(plano: string, inicio: number, partes: readonly string[]): number | undefined {
  let cursor = inicio;
  for (let indice = 0; indice < partes.length; indice += 1) {
    const parte = partes[indice] ?? "";
    if (!plano.startsWith(parte, cursor)) return undefined;
    cursor += parte.length;
    const quedaOtra = indice < partes.length - 1;
    if (!quedaOtra) break;
    while (esSeparador(plano[cursor] ?? "")) cursor += 1;
  }

  if (esLetra(plano[cursor] ?? "")) return undefined;
  return cursor;
}

function rechazado(plano: string, fin: number, palabras: string): boolean {
  const vetos = RECHAZO[palabras];
  if (!vetos) return false;
  let cursor = fin;
  while (esEspacio(plano[cursor] ?? "")) cursor += 1;
  const siguiente = leerPalabra(plano, cursor);
  return vetos.includes(siguiente);
}

function zonaDeIngredientes(hallazgos: readonly Hallazgo[]): { desde: number; hasta: number } | null {
  const lista = hallazgos.find((hallazgo) => hallazgo.id === "ingredientes");
  if (!lista) return null;
  return { desde: lista.fin, hasta: Number.POSITIVE_INFINITY };
}

function tieneDosColumnas(plano: string): boolean {
  return plano.includes("por 100") && (plano.includes("racion") || plano.includes("porcion"));
}

function leerPorcionDeRacion(plano: string): { valor: number; unidad: "ml" } | undefined {
  const encontrada = /racion\s*=\s*(\d+(?:[.,]\d+)?)\s*m[li]/.exec(plano);
  const crudo = encontrada?.[1];
  if (!crudo) return undefined;
  const valor = Number(crudo.replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) return undefined;
  return { valor, unidad: "ml" };
}

function primeraCantidad(
  texto: string,
  hallazgos: readonly Hallazgo[],
  id: IdCampo,
  ingredientes: { desde: number; hasta: number } | null,
  dosColumnas: boolean,
): { valor: number; unidad: Unidad } | undefined {
  for (let indice = 0; indice < hallazgos.length; indice += 1) {
    const hallazgo = hallazgos[indice];
    if (!hallazgo || hallazgo.id !== id || hallazgo.unidad === null) continue;
    if (caeEnIngredientes(hallazgo.inicio, ingredientes)) continue;
    const limite = limiteDelCampo(hallazgos, indice, ingredientes, texto.length);
    const segmento = recorteDeColumna(texto.slice(hallazgo.fin, limite), dosColumnas);
    let cantidades = leerCantidades(segmento, hallazgo.unidad, dosColumnas);
    if (cantidades.length === 0 && id === "porcion") {
      cantidades = leerCantidades(segmento, "ml", dosColumnas);
    }
    const elegida = elegirCantidad(cantidades, dosColumnas);
    if (!elegida) continue;
    if (hallazgo.sal) return { valor: elegida.valor * 400, unidad: "mg" };
    return elegida;
  }
  return undefined;
}

function recorteDeColumna(segmento: string, dosColumnas: boolean): string {
  if (!dosColumnas) return segmento;
  const lineas = segmento.split(/\r?\n/);
  return lineas.find((linea) => /\d/.test(linea)) ?? "";
}

function limiteDelCampo(
  hallazgos: readonly Hallazgo[],
  indice: number,
  ingredientes: { desde: number; hasta: number } | null,
  largo: number,
): number {
  for (let siguiente = indice + 1; siguiente < hallazgos.length; siguiente += 1) {
    const hallazgo = hallazgos[siguiente];
    if (!hallazgo) continue;
    if (caeEnIngredientes(hallazgo.inicio, ingredientes)) continue;
    return hallazgo.inicio;
  }
  return largo;
}

function caeEnIngredientes(inicio: number, ingredientes: { desde: number; hasta: number } | null): boolean {
  if (!ingredientes) return false;
  return inicio >= ingredientes.desde && inicio < ingredientes.hasta;
}

type Lectura = { valor: number; unidad: Unidad; opciones: number[] };

function elegirCantidad(cantidades: readonly Lectura[], dosColumnas: boolean): Lectura | undefined {
  const primera = cantidades[0];
  const segunda = cantidades[1];
  if (!dosColumnas || !primera || !segunda) return primera;
  if (primera.unidad === "kcal" && segunda.unidad === "kcal") return corregirKcalDeRacion(primera.valor, segunda);
  if (primera.unidad !== "g" || segunda.unidad !== "g") return segunda;
  if (primera.opciones.length === 1 && segunda.opciones.length === 1) return segunda;
  return { valor: elegirPar(primera.opciones, segunda.opciones, segunda.valor), unidad: "g", opciones: segunda.opciones };
}

function corregirKcalDeRacion(base: number, segunda: Lectura): Lectura {
  if (base <= 0 || segunda.valor / base >= 0.5) return segunda;
  const corregida = Number(`1${String(Math.round(segunda.valor))}`);
  const relacion = corregida / base;
  if (relacion < 1.5 || relacion > 4) return segunda;
  return { valor: corregida, unidad: "kcal", opciones: [corregida] };
}

function elegirPar(bases: readonly number[], valores: readonly number[], respaldo: number): number {
  const candidatos: { valor: number; distancia: number }[] = [];
  for (const base of bases) {
    for (const valor of valores) {
      if (base <= 0 || valor <= 0) continue;
      const relacion = valor / base;
      if (relacion < 0.35 || relacion > 6) continue;
      candidatos.push({ valor, distancia: Math.abs(Math.log(relacion) - Math.log(2.5)) });
    }
  }
  const primero = candidatos[0];
  if (!primero) return respaldo;
  const mejorDistancia = candidatos.reduce((menor, candidato) => Math.min(menor, candidato.distancia), primero.distancia);
  const cercanos = candidatos.filter((candidato) => candidato.distancia <= mejorDistancia + 0.02);
  cercanos.sort((a, b) => a.valor - b.valor);
  return cercanos[0]?.valor ?? respaldo;
}

function leerCantidades(segmento: string, esperada: Unidad, dosColumnas: boolean): Lectura[] {
  const plano = aplanar(segmento);
  const encontradas: Lectura[] = [];
  let cursor = 0;

  while (cursor < plano.length) {
    if (!esDigito(plano[cursor] ?? "")) {
      cursor += 1;
      continue;
    }
    if ((plano[cursor - 1] ?? "") === "-") {
      while (esDigito(plano[cursor] ?? "")) cursor += 1;
      continue;
    }

    let numero = "";
    while (esDigito(plano[cursor] ?? "")) {
      numero += plano[cursor] ?? "";
      cursor += 1;
    }
    const separador = plano[cursor] ?? "";
    const sigue = plano[cursor + 1] ?? "";
    if ((separador === "." || separador === ",") && (esDigito(sigue) || sigue === "J" || sigue === "j")) {
      numero += ".";
      cursor += 1;
      while (esDigito(plano[cursor] ?? "") || plano[cursor] === "J" || plano[cursor] === "j") {
        const digito = plano[cursor] === "J" || plano[cursor] === "j" ? "7" : (plano[cursor] ?? "");
        numero += digito;
        cursor += 1;
      }
    }

    const finNumero = cursor;
    while (esEspacio(plano[cursor] ?? "")) cursor += 1;
    const unidad = leerUnidad(plano, cursor);
    if (!unidad) {
      if (esperada === "g" && numero !== "9") {
        const recuperada = gramoLeidoComoNueve(numero, plano[finNumero] ?? "");
        if (dosColumnas) {
          const opciones = opcionesDeGramo(numero);
          const valor = recuperada ?? opciones[0];
          if (valor !== undefined && opciones.length > 0) encontradas.push({ valor, unidad: "g", opciones });
        } else if (recuperada !== undefined) {
          encontradas.push({ valor: recuperada, unidad: "g", opciones: [recuperada] });
        }
      }
      cursor = finNumero;
      continue;
    }
    if (unidad.unidad !== esperada) {
      cursor = unidad.fin;
      continue;
    }

    const antes = plano[finNumero - numero.length - 1] ?? "";
    const cifra =
      unidad.unidad === "kcal" && (antes === "v" || antes === "l" || antes === "i") && !numero.startsWith("1")
        ? `1${numero}`
        : numero;
    const valor = Number(cifra);
    if (Number.isFinite(valor)) encontradas.push({ valor, unidad: esperada, opciones: [valor] });
    cursor = unidad.fin;
  }

  return encontradas;
}

function opcionesDeGramo(numero: string): number[] {
  const opciones: number[] = [];
  const agregar = (valor: number) => {
    if (!Number.isFinite(valor) || valor <= 0) return;
    if (opciones.some((otra) => Math.abs(otra - valor) < 0.001)) return;
    opciones.push(valor);
  };

  agregar(Number(numero));
  if (numero.endsWith("9")) {
    const sinNueve = numero.slice(0, -1);
    if (sinNueve.length > 0 && sinNueve !== ".") agregar(Number(sinNueve));
    if (!numero.includes(".") && sinNueve.length === 2) {
      const decena = sinNueve[0];
      const unidad = sinNueve[1];
      if (decena && unidad) agregar(Number(`${decena}.${unidad}`));
    }
  }
  if (!numero.includes(".") && numero.length === 2) {
    const decena = numero[0];
    const unidad = numero[1];
    if (decena && unidad) agregar(Number(`${decena}.${unidad}`));
  }
  if (!numero.includes(".") && numero.endsWith("0") && numero.length >= 3) {
    const sinCero = numero.slice(0, -1);
    agregar(Number(sinCero));
    if (sinCero.length === 2) {
      const decena = sinCero[0];
      const unidad = sinCero[1];
      if (decena && unidad) agregar(Number(`${decena}.${unidad}`));
    }
  }
  return opciones;
}

/**
 * En varias fotos la «g» pegada al número se lee como 9: «40 g» sale «409»
 * y «4.5 g» sale «4.59». Solo se recupera ese caso, cuando no hay unidad.
 */
function gramoLeidoComoNueve(numero: string, despues: string): number | undefined {
  if (esLetra(despues) || !numero.endsWith("9")) return undefined;
  const decimal = numero.includes(".");
  const enteroLargo = !decimal && numero.length >= 3;
  if (!decimal && !enteroLargo) return undefined;
  const valor = Number(numero.slice(0, -1));
  if (!Number.isFinite(valor)) return undefined;
  return valor;
}

function leerUnidad(plano: string, inicio: number): { unidad: Unidad; fin: number } | undefined {
  const opciones: readonly { palabra: string; unidad: Unidad }[] = [
    { palabra: "miligramos", unidad: "mg" },
    { palabra: "miligramo", unidad: "mg" },
    { palabra: "gramos", unidad: "g" },
    { palabra: "gramo", unidad: "g" },
    { palabra: "kilocalorias", unidad: "kcal" },
    { palabra: "kcal", unidad: "kcal" },
    { palabra: "cal", unidad: "kcal" },
    { palabra: "ml", unidad: "ml" },
    { palabra: "mg", unidad: "mg" },
    { palabra: "gr", unidad: "g" },
    { palabra: "g", unidad: "g" },
    { palabra: "q", unidad: "g" },
  ];

  for (const opcion of opciones) {
    if (!plano.startsWith(opcion.palabra, inicio)) continue;
    if (esLetra(plano[inicio + opcion.palabra.length] ?? "")) continue;
    return { unidad: opcion.unidad, fin: inicio + opcion.palabra.length };
  }
  return undefined;
}

function leerIngredientes(
  texto: string,
  hallazgos: readonly Hallazgo[],
  zona: { desde: number; hasta: number } | null,
): string[] {
  if (!zona) return [];
  const limite = Number.isFinite(zona.hasta) ? zona.hasta : texto.length;
  const trozo = cortarNotas(texto.slice(zona.desde, limite))
    .replace(/^\s*:\s*/, "")
    .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])-\s*[\r\n]+\s*[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\r\n]{0,3}\s*([a-záéíóúüñ]{2,})/g, "$1$2")
    .replace(/\(\s*\d+(?:[.,]\d+)?\s*%\s*\)/g, " ")
    .replace(/\d+(?:[.,]\d+)?\s*%/g, " ")
    .replace(/[\r\n]+/g, " ");
  const partes = trozo.split(/[,;]+/);
  const nombres: string[] = [];

  for (const parte of partes) {
    const limpio = parte
      .replace(/[•·*]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^[-–]\s*/, "")
      .replace(/\.+$/, "")
      .trim();
    if (limpio.length === 0) continue;
    const nombre = [...limpio]
      .filter((caracter) => esCaracterDeIngrediente(caracter))
      .join("")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\s+\d$/, "");
    const leido = corregirNombre(nombre);
    if (leido.length > 0) nombres.push(leido);
  }

  return nombres;
}

function corregirNombre(nombre: string): string {
  const plano = nombre.toLowerCase().replace(/\s+/g, " ").trim();
  if (plano === "tata") return "patata";
  if (/^ce-?\s*y?\s*la$/.test(plano)) return "cebolla";
  return nombre
    .replace(/^\s*o\s+/i, "")
    .replace(/\bdema[ií]z\b/gi, "de maíz")
    .replace(/\s+[-–—]\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cortarNotas(trozo: string): string {
  const plano = aplanar(trozo);
  const marcas = ["puede contener", "puedecontener", "cultivadas de forma"];
  let fin = trozo.length;
  for (const marca of marcas) {
    const indice = plano.indexOf(marca);
    if (indice >= 0 && indice < fin) fin = indice;
  }
  return trozo.slice(0, fin);
}

function formatearValor(valor: number): string {
  if (Number.isInteger(valor)) return String(valor);
  return String(valor);
}

function leerPalabra(plano: string, inicio: number): string {
  let palabra = "";
  let cursor = inicio;
  while (esLetra(plano[cursor] ?? "")) {
    palabra += plano[cursor] ?? "";
    cursor += 1;
  }
  return palabra;
}

function esInicioDePalabra(plano: string, indice: number): boolean {
  if (indice === 0) return true;
  return !esLetra(plano[indice - 1] ?? "");
}

function esSeparador(valor: string): boolean {
  return esEspacio(valor) || valor === "." || valor === "|" || valor === "-" || valor === "—" || valor === "–" || valor === "*" || valor === ":";
}

function esEspacio(valor: string): boolean {
  return valor === " " || valor === "\n" || valor === "\r";
}

function esLetra(valor: string): boolean {
  return /\p{L}/u.test(valor);
}

function esDigito(valor: string): boolean {
  return valor >= "0" && valor <= "9";
}

function esCaracterDeIngrediente(valor: string): boolean {
  return esLetra(valor) || esDigito(valor) || valor === " " || valor === "(" || valor === ")" || valor === "-" || valor === "/";
}
