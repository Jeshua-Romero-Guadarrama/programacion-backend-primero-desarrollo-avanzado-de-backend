const { Router } = require('express');
const CartManager = require('../managers/CartManager');

const router = Router();
const cartManager = new CartManager();

// POST /api/carts
router.post('/', async (req, res) => {
  try {
    const nuevo = await cartManager.createCart();
    res.status(201).json({ status: 'ok', data: nuevo });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// GET /api/carts/:cid
router.get('/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const cart = await cartManager.getCartById(cid);
    if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado.' });
    res.json({ status: 'ok', data: cart.products });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// POST /api/carts/:cid/product/:pid
router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const cartActualizado = await cartManager.addProductToCart(cid, pid);
    res.status(201).json({ status: 'ok', data: cartActualizado });
  } catch (e) {
    const code = e.statusCode || 500;
    res.status(code).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
