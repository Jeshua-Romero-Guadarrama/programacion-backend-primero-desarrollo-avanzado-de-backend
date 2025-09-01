const path = require('path');
const { readJSON, writeJSON } = require('../utils/fileUtils');
const { productManager } = require('../di');

class CartManager {
  constructor() {
    // Ruta absoluta al archivo de persistencia de carritos (carts.json)
    this.filePath = path.join(__dirname, '..', 'data', 'carts.json');
    // Se instancia ProductManager para validar la existencia de productos al agregarlos al carrito
    this.productManager = productManager;
  }

  // Lee todos los carritos desde el archivo JSON (si no existe, devuelve [])
  async _getAll() {
    return await readJSON(this.filePath, []);
  }

  // Guarda el arreglo completo de carritos en el archivo JSON (sobrescribe el contenido)
  async _saveAll(carts) {
    await writeJSON(this.filePath, carts);
  }

  // Genera el siguiente id numérico incremental en base al máximo id existente
  _nextId(carts) {
    const maxId = carts.reduce((acc, c) => {
      const idNum = Number(c.id);
      // Solo considera ids numéricos válidos; conserva el máximo
      return Number.isFinite(idNum) && idNum > acc ? idNum : acc;
    }, 0);
    return maxId + 1; // Siguiente id
  }

  // Crea un carrito nuevo con id único y arreglo de productos vacío
  async createCart() {
    const carts = await this._getAll();
    const nuevo = {
      id: this._nextId(carts),
      products: [], // Cada elemento tendrá la forma { product: <idProducto>, quantity: <n> }
    };
    carts.push(nuevo);            // Agrega el carrito a la colección
    await this._saveAll(carts);   // Persiste cambios
    return nuevo;                 // Devuelve el carrito creado
  }

  // Devuelve el carrito cuyo id sea igual a 'id'; si no existe, retorna null
  async getCartById(id) {
    const carts = await this._getAll();
    const cid = Number(id);
    return carts.find(c => Number(c.id) === cid) || null;
  }

  // Agrega un producto al carrito indicado:
  // - Si el carrito no existe: 404
  // - Si el producto no existe: 404
  // - Si el producto ya está en el carrito: incrementa 'quantity'
  // - Si no está: lo agrega con 'quantity' = 1
  async addProductToCart(cid, pid) {
    const carts = await this._getAll();
    const cartId = Number(cid);
    const productId = Number(pid);

    // Buscar índice del carrito destino
    const cartIdx = carts.findIndex(c => Number(c.id) === cartId);
    if (cartIdx === -1) {
      const err = new Error('Carrito no encontrado.');
      err.statusCode = 404; // Se propaga para que el router responda con 404
      throw err;
    }

    // Verificar que el producto exista en la base de productos
    const product = await this.productManager.getProductById(productId);
    if (!product) {
      const err = new Error('Producto no encontrado (no se puede agregar al carrito).');
      err.statusCode = 404; // Producto inexistente -> 404
      throw err;
    }

    // Referencia al carrito encontrado
    const cart = carts[cartIdx];

    // Buscar si ya existe una línea para ese producto dentro del carrito
    const itemIdx = cart.products.findIndex(it => Number(it.product) === productId);

    if (itemIdx === -1) {
      // Si no existe, se agrega una nueva entrada con cantidad 1
      cart.products.push({ product: productId, quantity: 1 });
    } else {
      // Si ya existe, se incrementa la cantidad en 1 (agregado unitario)
      cart.products[itemIdx].quantity += 1; // Se agrega de uno en uno
    }

    // Reemplazar el carrito modificado y persistir el arreglo completo
    carts[cartIdx] = cart;
    await this._saveAll(carts);

    // Devolver el carrito actualizado (con sus productos y cantidades)
    return cart;
  }
}

module.exports = CartManager;
