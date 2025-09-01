const ProductManager = require('./managers/ProductManager');

// ÚNICA instancia compartida por routers, vistas y sockets
const productManager = new ProductManager();

module.exports = { productManager };
