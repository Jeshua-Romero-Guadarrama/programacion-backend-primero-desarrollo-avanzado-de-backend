// src/app.js
const express = require('express');
const path = require('path');
const http = require('http');
const { engine } = require('express-handlebars');
const { ensureFile } = require('./utils/fileUtils');

const productsRouter = require('./routes/products.router');
const cartsRouter = require('./routes/carts.router');
const viewsRouter = require('./routes/views.router');
const { initSocket } = require('./socket');

const app = express();

// -------- Middlewares base --------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Public estático (para /js/realtime.js, css, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Handlebars
app.engine('handlebars', engine({
  defaultLayout: 'main',
  helpers: {
    currency(value, curr = 'MXN') {
      try {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: curr }).format(Number(value));
      } catch {
        return value;
      }
    }
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));
app.use((req, res, next) => {
  res.locals.year = new Date().getFullYear();
  next();
});

// -------- Rutas de la API --------
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// -------- Vistas --------
app.use('/', viewsRouter);

// Salud del servicio
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

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

  // Crear servidor HTTP y adjuntar Socket.io
  server = http.createServer(app);
  initSocket(server);

  // Arrancar servidor
  server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });

  // Apagado limpio (Ctrl+C / señales de plataforma)
  const shutdown = (signal) => {
    console.log(`\nRecibido ${signal}. Cerrando servidor...`);
    server.close(() => {
      console.log('Servidor cerrado. ¡Hasta luego!');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Error al iniciar la aplicación:', err);
  process.exit(1);
});
