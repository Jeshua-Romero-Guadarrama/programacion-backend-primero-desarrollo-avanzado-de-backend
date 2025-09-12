const Product = require('../models/product.model');

class ProductManager {
  async getProducts() {
    return await Product.find().lean();
  }

  async getProductById(id) {
    return await Product.findById(id).lean();
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

  async addProduct(payload) {
    const errores = this._validateNew(payload);
    if (errores.length) {
      const err = new Error(`Campos inválidos o faltantes: ${errores.join(', ')}`);
      err.statusCode = 400; throw err;
    }
    const exists = await Product.exists({ code: payload.code });
    if (exists) { const err = new Error('El campo "code" ya existe en otro producto.'); err.statusCode = 409; throw err; }
    const nuevo = await Product.create(payload);
    return nuevo.toObject();
  }

  async updateProduct(id, updates) {
    if ('id' in updates) delete updates.id;
    if (updates.code) {
      const exists = await Product.exists({ code: updates.code, _id: { $ne: id } });
      if (exists) { const err = new Error('El campo "code" ya existe en otro producto.'); err.statusCode = 409; throw err; }
    }
    const actualizado = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true, lean: true });
    if (!actualizado) { const err = new Error('Producto no encontrado.'); err.statusCode = 404; throw err; }
    return actualizado;
  }

  async deleteProduct(id) {
    const borrado = await Product.findByIdAndDelete(id, { lean: true });
    if (!borrado) { const err = new Error('Producto no encontrado.'); err.statusCode = 404; throw err; }
    return borrado;
  }
}

module.exports = ProductManager;
