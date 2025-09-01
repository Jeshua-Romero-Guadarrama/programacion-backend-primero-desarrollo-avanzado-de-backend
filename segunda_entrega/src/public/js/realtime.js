// src/public/js/realtime.js
const socket = io();

const $form = document.getElementById('createForm');
const $btnCreate = document.getElementById('btnCreate');
const $list = document.getElementById('productsList');
const $flash = document.getElementById('flash');

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}

function fmtCurrency(n) {
  try {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n));
  } catch {
    return n;
  }
}

function flash(msg, type = 'success', ms = 2500) {
  if (!$flash) return;
  const id = `al-${Date.now()}`;
  $flash.innerHTML = `
    <div id="${id}" class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(msg)}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
  }, ms);
}

function render(products) {
  if (!$list) return;
  if (!Array.isArray(products) || products.length === 0) {
    $list.innerHTML = `<li class="list-group-item text-muted">No hay productos.</li>`;
    return;
  }
  $list.innerHTML = products.map(p => `
    <li class="list-group-item d-flex justify-content-between align-items-start">
      <div class="ms-2 me-auto">
        <div class="fw-semibold">${escapeHtml(p.title)} <span class="text-muted">[${escapeHtml(p.code)}]</span></div>
        <small class="text-muted">ID: ${p.id} · </small>
        <small>Precio: <span class="badge text-bg-success">${fmtCurrency(p.price)}</span></small>
        <small class="ms-2">Stock: <span class="badge text-bg-info">${p.stock}</span></small>
      </div>
      <button class="btn btn-sm btn-outline-danger del" data-id="${p.id}">Eliminar</button>
    </li>
  `).join('');
}

socket.on('products:list', render);

$form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData($form);
  const payload = Object.fromEntries(fd.entries());

  payload.price = parseFloat(payload.price);
  payload.stock = parseInt(payload.stock, 10);
  payload.status = fd.get('status') === 'on';
  payload.thumbnails = (payload.thumbnails || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  $btnCreate?.setAttribute('disabled', 'disabled');

  socket.emit('product:create', payload, (resp) => {
    $btnCreate?.removeAttribute('disabled');
    if (!resp?.ok) {
      flash(resp?.error || 'Error al crear producto', 'danger');
      return;
    }
    $form.reset();
    flash('Producto creado correctamente');
  });
});

$list?.addEventListener('click', (e) => {
  const btn = e.target.closest('button.del');
  if (!btn) return;
  const id = btn.dataset.id;
  if (!id) return;
  if (!confirm(`¿Eliminar producto #${id}?`)) return;

  btn.setAttribute('disabled', 'disabled');
  socket.emit('product:delete', id, (resp) => {
    btn.removeAttribute('disabled');
    if (!resp?.ok) {
      flash(resp?.error || 'Error al eliminar', 'danger');
      return;
    }
    flash(`Producto #${id} eliminado`);
  });
});
