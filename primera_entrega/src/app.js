const express = require('express');
const path = require('path');
const { ensureFile } = require('./utils/fileUtils');

const productsRouter = require('./routes/products.router');
const cartsRouter = require('./routes/carts.router');

const app = express();

// Middleware para JSON
app.use(express.json());

// Rutas base
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Salud del servicio
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Asegurar existencia de archivos de datos antes de iniciar
const dataDir = path.join(__dirname, 'data');
const productsFile = path.join(dataDir, 'products.json');
const cartsFile = path.join(dataDir, 'carts.json');

async function bootstrap() {
  await ensureFile(productsFile, '[]');
  await ensureFile(cartsFile, '[]');
  const PORT = 8080;
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('Error al iniciar la aplicación:', err);
  process.exit(1);
});

app.get('/', (req, res) => {
  res.type('html').send(`
    <h1>API tienda</h1>
    <p>Rutas disponibles:</p>
    <ul>
      <li>GET <code>/health</code></li>
      <li>GET/POST/PUT/DELETE <code>/api/products</code></li>
      <li>POST <code>/api/carts</code></li>
      <li>GET <code>/api/carts/:cid</code></li>
      <li>POST <code>/api/carts/:cid/product/:pid</code></li>
    </ul>
  `);
});
