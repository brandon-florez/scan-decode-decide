import { createWorker } from "tesseract.js";

/** Lee el texto de una foto en este navegador. La imagen no se envía a ningún servidor. */
export async function leerTextoDeImagen(imagen: Blob): Promise<string> {
  const lector = await createWorker("spa");
  try {
    const lectura = await lector.recognize(imagen);
    return lectura.data.text.trim();
  } finally {
    await lector.terminate();
  }
}
