const { Router } = require('express');
const ProductManager = require('../managers/ProductManager');

const router = Router();
const productManager = new ProductManager();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const productos = await productManager.getProducts();
    res.json({ status: 'ok', data: productos });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// GET /api/products/:pid
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

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const nuevo = await productManager.addProduct(req.body);
    res.status(201).json({ status: 'ok', data: nuevo });
  } catch (e) {
    const code = e.statusCode || 500;
    res.status(code).json({ status: 'error', message: e.message });
  }
});

// PUT /api/products/:pid
router.put('/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    const actualizado = await productManager.updateProduct(pid, req.body);
    res.json({ status: 'ok', data: actualizado });
  } catch (e) {
    const code = e.statusCode || 500;
    res.status(code).json({ status: 'error', message: e.message });
  }
});

// DELETE /api/products/:pid
router.delete('/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    const eliminado = await productManager.deleteProduct(pid);
    res.json({ status: 'ok', data: eliminado });
  } catch (e) {
    const code = e.statusCode || 500;
    res.status(code).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
