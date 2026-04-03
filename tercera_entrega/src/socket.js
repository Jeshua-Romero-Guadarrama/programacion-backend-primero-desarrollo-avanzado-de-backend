const { Server } = require('socket.io');
const { productManager } = require('./di');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer); // cliente servirá /socket.io/socket.io.js automáticamente

  io.on('connection', async (socket) => {
    // Enviar lista inicial de productos apenas se conecta el cliente
    socket.emit('products:list', await productManager.getProducts());

    // Crear producto desde la vista (WebSocket)
    socket.on('product:create', async (payload, ack) => {
      try {
        const created = await productManager.addProduct(payload);
        io.emit('products:list', await productManager.getProducts());
        ack && ack({ ok: true, data: created });
      } catch (e) {
        ack && ack({ ok: false, error: e.message });
      }
    });

    // Eliminar producto desde la vista (WebSocket)
    socket.on('product:delete', async (pid, ack) => {
      try {
        await productManager.deleteProduct(pid);
        io.emit('products:list', await productManager.getProducts());
        ack && ack({ ok: true });
      } catch (e) {
        ack && ack({ ok: false, error: e.message });
      }
    });
  });
}

function getIO() {
  if (!io) throw new Error('Socket.io no inicializado');
  return io;
}

module.exports = { initSocket, getIO };
