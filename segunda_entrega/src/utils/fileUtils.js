const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

/**
 * Asegura que exista el directorio y el archivo de datos.
 * - Crea recursivamente el directorio contenedor si no existe.
 * - Si el archivo no existe, lo crea con 'defaultContent'.
 * Nota: no valida si el contenido es JSON válido, solo garantiza su existencia.
 */
async function ensureFile(filePath, defaultContent = '[]') {
  const dir = path.dirname(filePath);
  await fsp.mkdir(dir, { recursive: true }); // crea carpeta(s) si no existen
  try {
    await fsp.access(filePath, fs.constants.F_OK); // verifica existencia del archivo
  } catch {
    await fsp.writeFile(filePath, defaultContent, 'utf8'); // si no existe, lo inicializa
  }
}

/**
 * Lee un archivo JSON y devuelve el objeto/array parseado.
 * - Si el archivo no existe, se crea con 'defaultVal' (vía ensureFile).
 * - Si el archivo está vacío o con JSON inválido, retorna 'defaultVal'
 *   y sobreescribe el archivo con 'defaultVal' en formato legible.
 */
async function readJSON(filePath, defaultVal = []) {
  // Garantiza que exista el archivo con el contenido por defecto equivalente a defaultVal
  await ensureFile(filePath, JSON.stringify(defaultVal, null, 2));
  const raw = await fsp.readFile(filePath, 'utf8');
  try {
    // raw puede ser cadena vacía; en ese caso, intenta parsear '[]' por seguridad
    return JSON.parse(raw || '[]');
  } catch {
    // Si el JSON está corrupto, repara el archivo con defaultVal y devuelve defaultVal
    await fsp.writeFile(filePath, JSON.stringify(defaultVal, null, 2), 'utf8');
    return defaultVal;
  }
}

/**
 * Escribe un objeto/array como JSON "bonito" (indentado) en 'filePath'.
 * - Asegura que el archivo exista antes de escribir.
 * - Sobrescribe completamente el contenido anterior.
 */
async function writeJSON(filePath, data) {
  await ensureFile(filePath, '[]'); // asegura ruta y archivo
  const json = JSON.stringify(data, null, 2); // pretty print con 2 espacios
  await fsp.writeFile(filePath, json, 'utf8'); // persistencia atómica simple
}

// Exporta las utilidades para usarlas en managers, routers, etc.
module.exports = {
  ensureFile,
  readJSON,
  writeJSON,
};
