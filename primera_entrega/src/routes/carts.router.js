const { Router } = require('express');
const CartManager = require('../managers/CartManager');

const router = Router();
const cartManager = new CartManager();

/**
 * POST /api/carts
 * Crea un carrito nuevo con { id, products: [] }
 * Respuesta: 201 + { status: 'ok', data: <carrito> }
 */
router.post('/', async (req, res) => {
  try {
    const nuevo = await cartManager.createCart();
    res.status(201).json({ status: 'ok', data: nuevo });
  } catch (e) {
    // Error inesperado del servidor / persistencia
    res.status(500).json({ status: 'error', message: e.message });
  }
});

/**
 * GET /api/carts/:cid
 * Devuelve SOLO el arreglo de productos del carrito indicado (formato [{ product, quantity }, ...])
 * - Si no existe el carrito: 404
 */
router.get('/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const cart = await cartManager.getCartById(cid);
    if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado.' });
    res.json({ status: 'ok', data: cart.products });
  } catch (e) {
    // Error inesperado del servidor / lectura de archivo
    res.status(500).json({ status: 'error', message: e.message });
  }
});

/**
 * POST /api/carts/:cid/product/:pid
 * Agrega un producto al carrito:
 * - Verifica que el carrito exista (404 si no)
 * - Verifica que el producto exista (404 si no)
 * - Si el producto ya está en el carrito, incrementa quantity
 * - Si no, lo agrega con quantity = 1
 * Respuesta: 201 + carrito actualizado completo
 */
router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const cartActualizado = await cartManager.addProductToCart(cid, pid);
    res.status(201).json({ status: 'ok', data: cartActualizado });
  } catch (e) {
    // Si el manager trae e.statusCode (404 por carrito/producto inexistente), se respeta; sino 500
    const code = e.statusCode || 500;
    res.status(code).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
