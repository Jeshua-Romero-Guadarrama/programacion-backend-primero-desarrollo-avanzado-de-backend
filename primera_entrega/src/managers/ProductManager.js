const path = require('path');
const { readJSON, writeJSON } = require('../utils/fileUtils');

class ProductManager {
  constructor() {
    this.filePath = path.join(__dirname, '..', 'data', 'products.json');
  }

  async _getAll() {
    return await readJSON(this.filePath, []);
  }

  async _saveAll(products) {
    await writeJSON(this.filePath, products);
  }

  _nextId(products) {
    // ID autoincremental numérico basado en el máximo existente
    const maxId = products.reduce((acc, p) => {
      const idNum = Number(p.id);
      return Number.isFinite(idNum) && idNum > acc ? idNum : acc;
    }, 0);
    return maxId + 1;
  }

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

  async getProducts() {
    return await this._getAll();
  }

  async getProductById(id) {
    const products = await this._getAll();
    const pid = Number(id);
    return products.find(p => Number(p.id) === pid) || null;
  }

  async addProduct(payload) {
    const products = await this._getAll();

    // Validación de campos obligatorios
    const errores = this._validateNew(payload);
    if (errores.length > 0) {
      const msg = `Campos inválidos o faltantes: ${errores.join(', ')}`;
      const err = new Error(msg);
      err.statusCode = 400;
      throw err;
    }

    // (Opcional) Validar unicidad de 'code'
    if (products.some(p => p.code === payload.code)) {
      const err = new Error('El campo "code" ya existe en otro producto.');
      err.statusCode = 409;
      throw err;
    }

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

    products.push(nuevo);
    await this._saveAll(products);
    return nuevo;
  }

  async updateProduct(id, updates) {
    const products = await this._getAll();
    const pid = Number(id);
    const idx = products.findIndex(p => Number(p.id) === pid);
    if (idx === -1) {
      const err = new Error('Producto no encontrado.');
      err.statusCode = 404;
      throw err;
    }

    // No permitir actualizar/eliminar id
    if ('id' in updates) delete updates.id;

    // Si intenta cambiar 'code' a uno existente en otro producto, rechazar
    if (updates.code && products.some(p => p.code === updates.code && Number(p.id) !== pid)) {
      const err = new Error('El campo "code" ya existe en otro producto.');
      err.statusCode = 409;
      throw err;
    }

    const actualizado = { ...products[idx], ...updates };
    products[idx] = actualizado;
    await this._saveAll(products);
    return actualizado;
  }

  async deleteProduct(id) {
    const products = await this._getAll();
    const pid = Number(id);
    const idx = products.findIndex(p => Number(p.id) === pid);
    if (idx === -1) {
      const err = new Error('Producto no encontrado.');
      err.statusCode = 404;
      throw err;
    }
    const eliminado = products.splice(idx, 1)[0];
    await this._saveAll(products);
    return eliminado;
  }
}

module.exports = ProductManager;
