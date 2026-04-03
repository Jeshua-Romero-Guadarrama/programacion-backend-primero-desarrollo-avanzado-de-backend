const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

class CartManager {
  async createCart() {
    const nuevo = await Cart.create({ products: [] });
    return nuevo.toObject();
  }

  async getCartById(id) {
    return await Cart.findById(id).lean();
  }

  async getCartByIdPopulated(id) {
    return await Cart.findById(id).populate('products.product').lean();
  }

  async addProductToCart(cid, pid) {
    const [cart, product] = await Promise.all([
      Cart.findById(cid),
      Product.findById(pid).lean()
    ]);
    if (!cart) { const err = new Error('Carrito no encontrado.'); err.statusCode = 404; throw err; }
    if (!product) { const err = new Error('Producto no encontrado (no se puede agregar al carrito).'); err.statusCode = 404; throw err; }

    const item = cart.products.find(p => String(p.product) === String(pid));
    if (item) item.quantity += 1;
    else cart.products.push({ product: pid, quantity: 1 });

    await cart.save();
    return cart.toObject();
  }

  async removeProductFromCart(cid, pid) {
    const cart = await Cart.findById(cid);
    if (!cart) { const err = new Error('Carrito no encontrado.'); err.statusCode = 404; throw err; }
    const before = cart.products.length;
    cart.products = cart.products.filter(p => String(p.product) !== String(pid));
    if (cart.products.length === before) { const err = new Error('Producto no estaba en el carrito.'); err.statusCode = 404; throw err; }
    await cart.save();
    return cart.toObject();
  }

  async updateCartProducts(cid, items) {
    if (!Array.isArray(items)) { const err = new Error('Se espera un arreglo "products".'); err.statusCode = 400; throw err; }
    for (const it of items) {
      if (!it?.product) { const err = new Error('Cada item requiere "product".'); err.statusCode = 400; throw err; }
      if (it.quantity == null || Number(it.quantity) < 1) { const err = new Error('Cada item requiere "quantity" >= 1.'); err.statusCode = 400; throw err; }
    }
    const ids = items.map(i => i.product);
    const existing = await Product.find({ _id: { $in: ids } }).select('_id').lean();
    if (existing.length !== ids.length) { const err = new Error('Uno o más productos no existen.'); err.statusCode = 404; throw err; }

    const cart = await Cart.findById(cid);
    if (!cart) { const err = new Error('Carrito no encontrado.'); err.statusCode = 404; throw err; }
    cart.products = items.map(i => ({ product: i.product, quantity: Number(i.quantity) }));
    await cart.save();
    return cart.toObject();
  }

  async updateProductQuantity(cid, pid, quantity) {
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) { const err = new Error('Cantidad inválida (debe ser número >= 1).'); err.statusCode = 400; throw err; }
    const cart = await Cart.findById(cid);
    if (!cart) { const err = new Error('Carrito no encontrado.'); err.statusCode = 404; throw err; }
    const item = cart.products.find(p => String(p.product) === String(pid));
    if (!item) { const err = new Error('Producto no está en el carrito.'); err.statusCode = 404; throw err; }
    item.quantity = qty;
    await cart.save();
    return cart.toObject();
  }

  async clearCart(cid) {
    const cart = await Cart.findById(cid);
    if (!cart) { const err = new Error('Carrito no encontrado.'); err.statusCode = 404; throw err; }
    cart.products = [];
    await cart.save();
    return cart.toObject();
  }
}

module.exports = CartManager;
