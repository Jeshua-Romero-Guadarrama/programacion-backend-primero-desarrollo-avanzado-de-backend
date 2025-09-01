const { Router } = require('express');
const path = require('path');
const { productManager } = require('../di');

const router = Router();

router.get('/', (_req, res) => res.redirect('/home'));

router.get('/home', async (_req, res) => {
  const products = await productManager.getProducts();
  res.render('home', { title: 'Home', heading: 'Productos (HTTP)', products });
});

router.get('/realtimeproducts', async (_req, res) => {
  const products = await productManager.getProducts();
  res.render('realTimeProducts', { title: 'Tiempo real', heading: 'Productos (Tiempo real)', products });
});

module.exports = router;
