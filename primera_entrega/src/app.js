const express = require('express');
const path = require('path');
const { ensureFile } = require('./utils/fileUtils');

const productsRouter = require('./routes/products.router');
const cartsRouter = require('./routes/carts.router');

const app = express();

// -------- Middlewares base --------
// Límite de tamaño al JSON para evitar cargas excesivas accidentales
app.use(express.json({ limit: '1mb' }));

// -------- Rutas de la API --------
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Salud del servicio
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Portada simple
app.get('/', (_req, res) => {
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

// -------- 404 para rutas no encontradas --------
app.use((req, res, _next) => {
  res.status(404).json({
    status: 'error',
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// -------- Manejador centralizado de errores --------
app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    status: 'error',
    message: err.message || 'Error interno del servidor',
  });
});

// -------- Bootstrap / Arranque seguro --------
const dataDir = path.join(__dirname, 'data');
const productsFile = path.join(dataDir, 'products.json');
const cartsFile = path.join(dataDir, 'carts.json');

const PORT = Number(process.env.PORT) || 8080;
let server;

async function bootstrap() {
  // Asegurar archivos de persistencia
  await ensureFile(productsFile, '[]');
  await ensureFile(cartsFile, '[]');

  // Arrancar servidor
  server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });

  // Apagado limpio (Ctrl+C / señales de plataforma)
  const shutdown = (signal) => {
    console.log(`\nRecibido ${signal}. Cerrando servidor...`);
    server.close(() => {
      console.log('Servidor cerrado. ¡Hasta luego!');
      process.exit(0);
    });
    // Forzar salida si tarda demasiado
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Error al iniciar la aplicación:', err);
  process.exit(1);
});
