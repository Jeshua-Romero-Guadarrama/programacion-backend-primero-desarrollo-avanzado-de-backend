const { Router } = require('express');
const ProductManager = require('../managers/ProductManager');

const router = Router();
const productManager = new ProductManager();

/**
 * GET /api/products
 * Lista todos los productos almacenados.
 * Respuesta: { status: 'ok', data: [ ...productos ] }
 */
router.get('/', async (req, res) => {
  try {
    const productos = await productManager.getProducts();
    res.json({ status: 'ok', data: productos });
  } catch (e) {
    // Error interno (lectura de archivo, etc.)
    res.status(500).json({ status: 'error', message: e.message });
  }
});

/**
 * GET /api/products/:pid
 * Obtiene un producto por su id.
 * - Si no existe: 404
 * Respuesta: { status: 'ok', data: producto }
 */
router.get('/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    const producto = await productManager.getProductById(pid);
    if (!producto) return res.status(404).json({ status: 'error', message: 'Producto no encontrado.' });
    res.json({ status: 'ok', data: producto });
  } catch (e) {
    // Error interno
    res.status(500).json({ status: 'error', message: e.message });
  }
});

/**
 * POST /api/products
 * Crea un nuevo producto.
 * - El id se autogenera (no debe venir en el body).
 * - Valida campos obligatorios y unicidad de 'code'.
 * - Si falta/está mal un campo: 400
 * - Si 'code' existe en otro producto: 409
 * Respuesta: 201 + { status: 'ok', data: productoCreado }
 */
router.post('/', async (req, res) => {
  try {
    const nuevo = await productManager.addProduct(req.body);
    res.status(201).json({ status: 'ok', data: nuevo });
  } catch (e) {
    // Si el manager trae statusCode (400/409), se respeta; si no, 500
    const code = e.statusCode || 500;
    res.status(code).json({ status: 'error', message: e.message });
  }
});

/**
 * PUT /api/products/:pid
 * Actualiza campos de un producto existente.
 * - No permite modificar 'id'.
 * - Valida que 'code' (si se envía) no duplique el de otro producto (409).
 * - Si no existe el producto: 404
 * Respuesta: { status: 'ok', data: productoActualizado }
 */
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

/**
 * DELETE /api/products/:pid
 * Elimina un producto por id.
 * - Si no existe: 404
 * Respuesta: { status: 'ok', data: productoEliminado }
 */
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
