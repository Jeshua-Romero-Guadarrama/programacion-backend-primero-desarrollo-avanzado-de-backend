const { Router } = require('express');
const { productManager } = require('../di');
const { getIO } = require('../socket');

const router = Router();

/**
 * GET /api/products
 */
router.get('/', async (_req, res) => {
  try {
    const productos = await productManager.getProducts();
    res.json({ status: 'ok', data: productos });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

/**
 * GET /api/products/:pid
 */
router.get('/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    const producto = await productManager.getProductById(pid);
    if (!producto) return res.status(404).json({ status: 'error', message: 'Producto no encontrado.' });
    res.json({ status: 'ok', data: producto });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

/**
 * POST /api/products
 * Emite 'products:list' tras crear
 */
router.post('/', async (req, res) => {
  try {
    const nuevo = await productManager.addProduct(req.body);
    // Emitir lista actualizada para tiempo real
    getIO().emit('products:list', await productManager.getProducts());
    res.status(201).json({ status: 'ok', data: nuevo });
  } catch (e) {
    const code = e.statusCode || 500;
    res.status(code).json({ status: 'error', message: e.message });
  }
});

/**
 * PUT /api/products/:pid
 * (Opcional) emitir para que /realtimeproducts también vea cambios de update
 */
router.put('/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    const actualizado = await productManager.updateProduct(pid, req.body);
    getIO().emit('products:list', await productManager.getProducts()); // opcional
    res.json({ status: 'ok', data: actualizado });
  } catch (e) {
    const code = e.statusCode || 500;
    res.status(code).json({ status: 'error', message: e.message });
  }
});

/**
 * DELETE /api/products/:pid
 * Emite 'products:list' tras eliminar
 */
router.delete('/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    const eliminado = await productManager.deleteProduct(pid);
    // Emitir lista actualizada para tiempo real
    getIO().emit('products:list', await productManager.getProducts());
    res.json({ status: 'ok', data: eliminado });
  } catch (e) {
    const code = e.statusCode || 500;
    res.status(code).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
