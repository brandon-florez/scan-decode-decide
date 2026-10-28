import { createWorker, OEM, PSM } from "tesseract.js";

/**
 * Lee el texto de una foto en este navegador.
 * El modelo de español es public/spa.traineddata. No se descarga
 * y la imagen no se envía a ningún servidor.
 * Si la foto trae la tabla y los ingredientes en dos columnas,
 * se leen por separado: la tabla sin las líneas verticales.
 */
export async function leerTextoDeImagen(imagen: Blob): Promise<string> {
  const lector = await createWorker("spa", OEM.LSTM_ONLY, {
    langPath: directorioDelModelo(),
    gzip: false,
    cacheMethod: "none",
  });
  try {
    const lienzo = await lienzoDe(imagen);
    const corte = buscarCorte(lienzo);
    if (!corte) {
      const lectura = await lector.recognize(imagen);
      return lectura.data.text.trim();
    }
    const izquierda = prepararTabla(lienzo, corte.izquierda);
    const derecha = recortar(lienzo, corte.derecha);
    await lector.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      user_defined_dpi: "300",
    });
    const tabla = await lector.recognize(izquierda);
    await lector.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
      user_defined_dpi: "300",
    });
    const lista = await lector.recognize(derecha);
    return `${tabla.data.text.trim()}\n${lista.data.text.trim()}`.trim();
  } finally {
    await lector.terminate();
  }
}

function directorioDelModelo(): string {
  const archivo = new URL("/spa.traineddata", window.location.origin);
  return archivo.href.slice(0, archivo.href.lastIndexOf("/"));
}

async function lienzoDe(imagen: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(imagen);
  const lienzo = document.createElement("canvas");
  lienzo.width = bitmap.width;
  lienzo.height = bitmap.height;
  const contexto = lienzo.getContext("2d", { willReadFrequently: true });
  contexto?.drawImage(bitmap, 0, 0);
  bitmap.close();
  return lienzo;
}

function buscarCorte(lienzo: HTMLCanvasElement): { izquierda: number; derecha: number } | null {
  const contexto = lienzo.getContext("2d", { willReadFrequently: true });
  if (!contexto) return null;
  const { width, height } = lienzo;
  const pixeles = contexto.getImageData(0, 0, width, height).data;
  const paso = 3;
  const yDesde = Math.floor(height * 0.08);
  const yHasta = Math.floor(height * 0.9);
  const muestras = Math.max(1, Math.floor((yHasta - yDesde) / paso));
  const umbral = Math.max(2, muestras * 0.03);
  const oscuros = new Uint16Array(width);

  for (let x = 0; x < width; x += 1) {
    let cuenta = 0;
    for (let y = yDesde; y < yHasta; y += paso) {
      const indice = (y * width + x) * 4;
      const luz = ((pixeles[indice] ?? 0) + (pixeles[indice + 1] ?? 0) + (pixeles[indice + 2] ?? 0)) / 3;
      if (luz < 165) cuenta += 1;
    }
    oscuros[x] = cuenta;
  }

  let mejorInicio = 0;
  let mejorAncho = 0;
  let corrida = 0;
  let inicio = 0;
  const desde = Math.floor(width * 0.32);
  const hasta = Math.floor(width * 0.78);
  for (let x = desde; x < hasta; x += 1) {
    if ((oscuros[x] ?? 0) <= umbral) {
      if (corrida === 0) inicio = x;
      corrida += 1;
      if (corrida > mejorAncho) {
        mejorAncho = corrida;
        mejorInicio = inicio;
      }
    } else {
      corrida = 0;
    }
  }

  if (mejorAncho < width * 0.02) return null;
  return { izquierda: mejorInicio, derecha: Math.max(0, mejorInicio - 8) };
}

function prepararTabla(origen: HTMLCanvasElement, ancho: number): HTMLCanvasElement {
  const recorte = document.createElement("canvas");
  recorte.width = Math.max(1, ancho);
  recorte.height = origen.height;
  const contexto = recorte.getContext("2d", { willReadFrequently: true });
  if (!contexto) return recorte;
  contexto.drawImage(origen, 0, 0, ancho, origen.height, 0, 0, ancho, origen.height);
  const imagen = contexto.getImageData(0, 0, recorte.width, recorte.height);
  const pixeles = imagen.data;
  const alto = recorte.height;

  for (let indice = 0; indice < pixeles.length; indice += 4) {
    const luz = ((pixeles[indice] ?? 0) + (pixeles[indice + 1] ?? 0) + (pixeles[indice + 2] ?? 0)) / 3;
    const tinta = luz < 155 ? 0 : 255;
    pixeles[indice] = tinta;
    pixeles[indice + 1] = tinta;
    pixeles[indice + 2] = tinta;
  }

  const columnas: number[] = [];
  for (let x = 0; x < recorte.width; x += 1) {
    let oscuros = 0;
    for (let y = 0; y < alto; y += 2) {
      if ((pixeles[(y * recorte.width + x) * 4] ?? 255) === 0) oscuros += 1;
    }
    if (oscuros / (alto / 2) > 0.55) columnas.push(x);
  }
  for (const x of columnas) {
    for (const delta of [-1, 0, 1]) {
      const xx = x + delta;
      if (xx < 0 || xx >= recorte.width) continue;
      for (let y = 0; y < alto; y += 1) {
        const indice = (y * recorte.width + xx) * 4;
        pixeles[indice] = 255;
        pixeles[indice + 1] = 255;
        pixeles[indice + 2] = 255;
      }
    }
  }
  contexto.putImageData(imagen, 0, 0);

  const escala = 3;
  const grande = document.createElement("canvas");
  grande.width = recorte.width * escala;
  grande.height = alto * escala;
  const destino = grande.getContext("2d");
  if (!destino) return recorte;
  destino.imageSmoothingEnabled = false;
  destino.drawImage(recorte, 0, 0, grande.width, grande.height);
  return grande;
}

function recortar(origen: HTMLCanvasElement, desde: number): HTMLCanvasElement {
  const ancho = Math.max(1, origen.width - desde);
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = origen.height;
  const contexto = lienzo.getContext("2d");
  if (!contexto) return lienzo;
  contexto.drawImage(origen, desde, 0, ancho, origen.height, 0, 0, ancho, origen.height);
  return lienzo;
}
