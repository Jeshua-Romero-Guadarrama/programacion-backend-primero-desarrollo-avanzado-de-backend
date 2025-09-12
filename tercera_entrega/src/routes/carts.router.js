const { Router } = require('express');
const CartManager = require('../managers/CartManager');

const router = Router();
const cartManager = new CartManager();

/** POST /api/carts -> crea carrito */
router.post('/', async (_req, res) => {
  try {
    const nuevo = await cartManager.createCart();
    res.status(201).json({ status: 'success', payload: nuevo });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

/** GET /api/carts/:cid -> productos con populate */
router.get('/:cid', async (req, res) => {
  try {
    const cart = await cartManager.getCartByIdPopulated(req.params.cid);
    if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado.' });
    res.json({ status: 'success', payload: cart.products });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

/** POST /api/carts/:cid/product/:pid -> agrega/incrementa */
router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const cart = await cartManager.addProductToCart(req.params.cid, req.params.pid);
    res.status(201).json({ status: 'success', payload: cart });
  } catch (e) {
    res.status(e.statusCode || 500).json({ status: 'error', message: e.message });
  }
});

/** DELETE /api/carts/:cid/products/:pid -> elimina un producto del carrito */
router.delete('/:cid/products/:pid', async (req, res) => {
  try {
    const cart = await cartManager.removeProductFromCart(req.params.cid, req.params.pid);
    res.json({ status: 'success', payload: cart });
  } catch (e) {
    res.status(e.statusCode || 500).json({ status: 'error', message: e.message });
  }
});

/** PUT /api/carts/:cid -> reemplaza todos los productos con arreglo [{ product, quantity }] */
router.put('/:cid', async (req, res) => {
  try {
    const items = req.body?.products;
    const cart = await cartManager.updateCartProducts(req.params.cid, items);
    res.json({ status: 'success', payload: cart });
  } catch (e) {
    res.status(e.statusCode || 500).json({ status: 'error', message: e.message });
  }
});

/** PUT /api/carts/:cid/products/:pid -> actualiza SOLO cantidad */
router.put('/:cid/products/:pid', async (req, res) => {
  try {
    const cart = await cartManager.updateProductQuantity(req.params.cid, req.params.pid, req.body?.quantity);
    res.json({ status: 'success', payload: cart });
  } catch (e) {
    res.status(e.statusCode || 500).json({ status: 'error', message: e.message });
  }
});

/** DELETE /api/carts/:cid -> vacía el carrito */
router.delete('/:cid', async (req, res) => {
  try {
    const cart = await cartManager.clearCart(req.params.cid);
    res.json({ status: 'success', payload: cart });
  } catch (e) {
    res.status(e.statusCode || 500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
