const path = require('path');
const { readJSON, writeJSON } = require('../utils/fileUtils');

class ProductManager {
  constructor() {
    // Ruta absoluta al archivo de persistencia (products.json)
    this.filePath = path.join(__dirname, '..', 'data', 'products.json');
  }

  // Lee todos los productos del archivo JSON (si no existe, retorna [])
  async _getAll() {
    return await readJSON(this.filePath, []);
  }

  // Persiste en disco el arreglo completo de productos (sobrescribe el archivo)
  async _saveAll(products) {
    await writeJSON(this.filePath, products);
  }

  // Calcula el próximo ID numérico autoincremental a partir del máximo existente
  _nextId(products) {
    // ID autoincremental numérico basado en el máximo existente
    const maxId = products.reduce((acc, p) => {
      const idNum = Number(p.id);
      return Number.isFinite(idNum) && idNum > acc ? idNum : acc;
    }, 0);
    return maxId + 1;
  }

  // Valida los campos obligatorios para la creación de un producto nuevo
  _validateNew(payload) {
    const errores = [];
    if (typeof payload.title !== 'string' || !payload.title.trim()) errores.push('title');
    if (typeof payload.description !== 'string' || !payload.description.trim()) errores.push('description');
    if (typeof payload.code !== 'string' || !payload.code.trim()) errores.push('code');
    if (typeof payload.price !== 'number' || isNaN(payload.price)) errores.push('price');
    if (typeof payload.status !== 'boolean') errores.push('status');
    if (typeof payload.stock !== 'number' || isNaN(payload.stock)) errores.push('stock');
    if (typeof payload.category !== 'string' || !payload.category.trim()) errores.push('category');
    if (!Array.isArray(payload.thumbnails)) errores.push('thumbnails');
    return errores;
  }

  // Devuelve el listado completo de productos
  async getProducts() {
    return await this._getAll();
  }

  // Busca un producto por id (numérico); si no existe, retorna null
  async getProductById(id) {
    const products = await this._getAll();
    const pid = Number(id);
    return products.find(p => Number(p.id) === pid) || null;
  }

  // Crea un producto nuevo:
  // - Valida campos requeridos
  // - Garantiza unicidad de 'code'
  // - Genera id autoincremental
  async addProduct(payload) {
    const products = await this._getAll();

    // Validación de campos obligatorios
    const errores = this._validateNew(payload);
    if (errores.length > 0) {
      const msg = `Campos inválidos o faltantes: ${errores.join(', ')}`;
      const err = new Error(msg);
      err.statusCode = 400; // Bad Request
      throw err;
    }

    // (Opcional) Validar unicidad de 'code' para evitar duplicados
    if (products.some(p => p.code === payload.code)) {
      const err = new Error('El campo "code" ya existe en otro producto.');
      err.statusCode = 409; // Conflict
      throw err;
    }

    // Construcción del objeto a persistir
    const nuevo = {
      id: this._nextId(products),
      title: payload.title,
      description: payload.description,
      code: payload.code,
      price: payload.price,
      status: payload.status,
      stock: payload.stock,
      category: payload.category,
      thumbnails: payload.thumbnails,
    };

    products.push(nuevo);       // Agrega al arreglo en memoria
    await this._saveAll(products); // Persiste en disco
    return nuevo;               // Devuelve el nuevo producto creado
  }

  // Actualiza campos de un producto existente:
  // - No permite modificar 'id'
  // - Valida que 'code' no duplique el de otro producto
  async updateProduct(id, updates) {
    const products = await this._getAll();
    const pid = Number(id);
    const idx = products.findIndex(p => Number(p.id) === pid);
    if (idx === -1) {
      const err = new Error('Producto no encontrado.');
      err.statusCode = 404; // Not Found
      throw err;
    }

    // No permitir actualizar/eliminar id
    if ('id' in updates) delete updates.id;

    // Si intenta cambiar 'code' a uno existente en otro producto, rechazar
    if (updates.code && products.some(p => p.code === updates.code && Number(p.id) !== pid)) {
      const err = new Error('El campo "code" ya existe en otro producto.');
      err.statusCode = 409; // Conflict
      throw err;
    }

    // Mezcla inmutable: conserva lo anterior y sobreescribe con updates
    const actualizado = { ...products[idx], ...updates };
    products[idx] = actualizado;

    await this._saveAll(products); // Persiste cambios
    return actualizado;            // Devuelve el producto actualizado
  }

  // Elimina un producto por id; si no existe, 404
  async deleteProduct(id) {
    const products = await this._getAll();
    const pid = Number(id);
    const idx = products.findIndex(p => Number(p.id) === pid);
    if (idx === -1) {
      const err = new Error('Producto no encontrado.');
      err.statusCode = 404; // Not Found
      throw err;
    }
    const eliminado = products.splice(idx, 1)[0]; // Remueve y obtiene el eliminado
    await this._saveAll(products);                // Persiste la nueva lista
    return eliminado;                             // Devuelve el producto eliminado
  }
}

module.exports = ProductManager;
