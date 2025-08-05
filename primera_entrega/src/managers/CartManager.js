const path = require('path');
const { readJSON, writeJSON } = require('../utils/fileUtils');
const ProductManager = require('./ProductManager');

class CartManager {
  constructor() {
    this.filePath = path.join(__dirname, '..', 'data', 'carts.json');
    this.productManager = new ProductManager();
  }

  async _getAll() {
    return await readJSON(this.filePath, []);
  }

  async _saveAll(carts) {
    await writeJSON(this.filePath, carts);
  }

  _nextId(carts) {
    const maxId = carts.reduce((acc, c) => {
      const idNum = Number(c.id);
      return Number.isFinite(idNum) && idNum > acc ? idNum : acc;
    }, 0);
    return maxId + 1;
  }

  async createCart() {
    const carts = await this._getAll();
    const nuevo = {
      id: this._nextId(carts),
      products: [],
    };
    carts.push(nuevo);
    await this._saveAll(carts);
    return nuevo;
  }

  async getCartById(id) {
    const carts = await this._getAll();
    const cid = Number(id);
    return carts.find(c => Number(c.id) === cid) || null;
  }

  async addProductToCart(cid, pid) {
    const carts = await this._getAll();
    const cartId = Number(cid);
    const productId = Number(pid);

    const cartIdx = carts.findIndex(c => Number(c.id) === cartId);
    if (cartIdx === -1) {
      const err = new Error('Carrito no encontrado.');
      err.statusCode = 404;
      throw err;
    }

    // Verificar que el producto exista
    const product = await this.productManager.getProductById(productId);
    if (!product) {
      const err = new Error('Producto no encontrado (no se puede agregar al carrito).');
      err.statusCode = 404;
      throw err;
    }

    const cart = carts[cartIdx];
    const itemIdx = cart.products.findIndex(it => Number(it.product) === productId);

    if (itemIdx === -1) {
      cart.products.push({ product: productId, quantity: 1 });
    } else {
      cart.products[itemIdx].quantity += 1; // Se agrega de uno en uno
    }

    carts[cartIdx] = cart;
    await this._saveAll(carts);
    return cart;
  }
}

module.exports = CartManager;
