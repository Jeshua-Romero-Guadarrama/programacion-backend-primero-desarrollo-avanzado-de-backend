const { Router } = require('express');
const { productManager } = require('../di');
const Product = require('../models/product.model');
const { getIO } = require('../socket');

const router = Router();

function buildLink(req, page) {
  const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
  url.searchParams.set('page', page);
  return url.toString();
}

router.get('/', async (req, res) => {
  try {
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const page = Math.max(1, Number(req.query.page) || 1);
    const sort = (req.query.sort || '').toLowerCase();
    const sortStage = sort === 'asc' ? { price: 1 } : sort === 'desc' ? { price: -1 } : {};

    const q = (req.query.query ?? '').trim();
    const category = req.query.category?.trim();
    const status = req.query.status;
    const filter = {};
    if (q) {
      if (q.startsWith('category:')) filter.category = q.split(':')[1];
      else if (q.startsWith('status:')) filter.status = q.split(':')[1] === 'true';
      else if (q === 'available') { filter.status = true; filter.stock = { $gt: 0 }; }
      else filter.category = q;
    }
    if (category) filter.category = category;
    if (status != null) filter.status = String(status) === 'true';

    const [total, docs] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).sort(sortStage).skip((page - 1) * limit).limit(limit).lean()
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;

    res.json({
      status: 'success',
      payload: docs,
      totalPages,
      prevPage: hasPrevPage ? page - 1 : null,
      nextPage: hasNextPage ? page + 1 : null,
      page,
      hasPrevPage,
      hasNextPage,
      prevLink: hasPrevPage ? buildLink(req, page - 1) : null,
      nextLink: hasNextPage ? buildLink(req, page + 1) : null
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/:pid', async (req, res) => {
  try {
    const producto = await productManager.getProductById(req.params.pid);
    if (!producto) return res.status(404).json({ status: 'error', message: 'Producto no encontrado.' });
    res.json({ status: 'success', payload: producto });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const nuevo = await productManager.addProduct(req.body);
    getIO().emit('products:list', await productManager.getProducts());
    res.status(201).json({ status: 'success', payload: nuevo });
  } catch (e) {
    res.status(e.statusCode || 500).json({ status: 'error', message: e.message });
  }
});

router.put('/:pid', async (req, res) => {
  try {
    const actualizado = await productManager.updateProduct(req.params.pid, req.body);
    getIO().emit('products:list', await productManager.getProducts());
    res.json({ status: 'success', payload: actualizado });
  } catch (e) {
    res.status(e.statusCode || 500).json({ status: 'error', message: e.message });
  }
});

router.delete('/:pid', async (req, res) => {
  try {
    const eliminado = await productManager.deleteProduct(req.params.pid);
    getIO().emit('products:list', await productManager.getProducts());
    res.json({ status: 'success', payload: eliminado });
  } catch (e) {
    res.status(e.statusCode || 500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
