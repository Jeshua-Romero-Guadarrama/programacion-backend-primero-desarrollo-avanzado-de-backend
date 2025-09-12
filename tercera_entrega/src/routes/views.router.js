const { Router } = require('express');
const Product = require('../models/product.model');
const Cart = require('../models/cart.model');

const router = Router();

router.get('/', (_req, res) => res.redirect('/home'));

router.get('/home', async (_req, res) => {
  const products = await Product.find().limit(20).lean();
  res.render('home', { title: 'Home', heading: 'Productos (HTTP)', products });
});

router.get('/realtimeproducts', async (_req, res) => {
  const products = await Product.find().lean();
  res.render('realTimeProducts', { title: 'Tiempo real', heading: 'Productos (Tiempo real)', products });
});

/** Catálogo con paginación y filtros (vista) */
router.get('/products', async (req, res) => {
  const limit = Math.max(1, Number(req.query.limit) || 10);
  const page = Math.max(1, Number(req.query.page) || 1);
  const sort = (req.query.sort || '').toLowerCase();
  const q = (req.query.query ?? '').trim();
  const sortStage = sort === 'asc' ? { price: 1 } : sort === 'desc' ? { price: -1 } : {};
  const filter = {};
  if (q) {
    if (q.startsWith('category:')) filter.category = q.split(':')[1];
    else if (q.startsWith('status:')) filter.status = q.split(':')[1] === 'true';
    else if (q === 'available') { filter.status = true; filter.stock = { $gt: 0 }; }
    else filter.category = q;
  }
  const [total, items] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(sortStage).skip((page - 1) * limit).limit(limit).lean()
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  const baseUrl = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
  baseUrl.searchParams.delete('page');
  const base = baseUrl.toString();
  const link = (p) => `${base}${base.includes('?') ? '&' : '?'}page=${p}`;

  res.render('products', {
    title: 'Productos',
    heading: 'Catálogo',
    items,
    page,
    totalPages,
    hasPrevPage,
    hasNextPage,
    prevLink: hasPrevPage ? link(page - 1) : null,
    nextLink: hasNextPage ? link(page + 1) : null,
    q,
    sort,
    limit
  });
});

router.get('/products/:pid', async (req, res) => {
  const prod = await Product.findById(req.params.pid).lean();
  if (!prod) return res.status(404).render('products', { title: 'Producto', heading: 'No encontrado' });
  res.render('product', { title: prod.title, heading: prod.title, prod });
});

router.get('/carts/:cid', async (req, res) => {
  const cart = await Cart.findById(req.params.cid).populate('products.product').lean();
  if (!cart) return res.status(404).render('home', { title: 'Carrito', heading: 'Carrito no encontrado' });
  res.render('cart', { title: `Carrito ${cart._id}`, heading: 'Carrito', cart });
});

module.exports = router;
