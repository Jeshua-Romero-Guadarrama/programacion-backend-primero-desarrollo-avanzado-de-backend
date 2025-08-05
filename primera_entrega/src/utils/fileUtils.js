// src/utils/fileUtils.js
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

/**
 * Asegura que exista el directorio y el archivo.
 * Si el archivo no existe, lo crea con el contenido por defecto.
 */
async function ensureFile(filePath, defaultContent = '[]') {
  const dir = path.dirname(filePath);
  await fsp.mkdir(dir, { recursive: true });
  try {
    await fsp.access(filePath, fs.constants.F_OK);
  } catch {
    await fsp.writeFile(filePath, defaultContent, 'utf8');
  }
}

/**
 * Lee un archivo JSON y devuelve el objeto/array correspondiente.
 * Si el archivo está vacío o corrupto, retorna el defaultVal y lo reescribe.
 */
async function readJSON(filePath, defaultVal = []) {
  await ensureFile(filePath, JSON.stringify(defaultVal, null, 2));
  const raw = await fsp.readFile(filePath, 'utf8');
  try {
    return JSON.parse(raw || '[]');
  } catch {
    await fsp.writeFile(filePath, JSON.stringify(defaultVal, null, 2), 'utf8');
    return defaultVal;
  }
}

/**
 * Escribe un objeto/array como JSON con formato legible.
 */
async function writeJSON(filePath, data) {
  await ensureFile(filePath, '[]');
  const json = JSON.stringify(data, null, 2);
  await fsp.writeFile(filePath, json, 'utf8');
}

module.exports = {
  ensureFile,
  readJSON,
  writeJSON,
};
