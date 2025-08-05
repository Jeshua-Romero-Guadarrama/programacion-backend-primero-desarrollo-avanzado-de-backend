# API de Productos y Carritos (Node.js + Express)

API para gestionar **productos** y **carritos de compra** con persistencia en archivos JSON usando el sistema de archivos. Cumple los requisitos de la *Primera Entrega* del curso: rutas separadas, IDs autogenerados, y operaciones CRUD.

## Tecnologías

- Node.js
- Express
- File System (fs/promises)

## Estructura del proyecto

```

primera_entrega/
├─ .gitignore
└─ src/
│  ├─ routes/
│  │  ├─ products.router.js
│  │  └─ carts.router.js
│  ├─ managers/
│  │  ├─ ProductManager.js
│  │  └─ CartManager.js
│  ├─ utils/
│  │  └─ fileUtils.js
│  ├─ data/
│  │  ├─ products.json
│  │  └─ carts.json
│  └─ app.js
├─ README.md
├─ package-lock.json
├─ package.json
└─ test_api.ps

````

## Instalación

```bash
npm install
````

## Ejecución

* Desarrollo (reinicio automático con nodemon):

  ```bash
  npm run dev
  ```
* Producción:

  ```bash
  npm start
  ```

El servidor escucha en **[http://localhost:8080](http://localhost:8080)**.

## Endpoints

### Productos `/api/products`

* `GET /` → lista todos los productos.
* `GET /:pid` → obtiene un producto por id.
* `POST /` → crea un producto (el `id` se **autogenera**).
* `PUT /:pid` → actualiza campos del producto (no permite cambiar el `id`).
* `DELETE /:pid` → elimina un producto por id.

**Campos del producto**:

* `title` (string, requerido)
* `description` (string, requerido)
* `code` (string, requerido y único)
* `price` (number, requerido)
* `status` (boolean, requerido)
* `stock` (number, requerido)
* `category` (string, requerido)
* `thumbnails` (array de strings, requerido)

### Carritos `/api/carts`

* `POST /` → crea un carrito `{ id, products: [] }`.
* `GET /:cid` → lista los productos del carrito (array de `{ product, quantity }`).
* `POST /:cid/product/:pid` → agrega el producto `pid` al carrito `cid`.
  Si ya existe en el carrito, **incrementa** `quantity`.

## Ejemplos con cURL

> Para **Git Bash / Linux / macOS**:

### Crear un producto

```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Laptop Pro 14",
    "description": "Equipo portátil de alto rendimiento",
    "code": "LP14-001",
    "price": 28999.90,
    "status": true,
    "stock": 50,
    "category": "computo",
    "thumbnails": ["images/lp14-front.jpg", "images/lp14-back.jpg"]
  }'
```

### Listar todos

```bash
curl http://localhost:8080/api/products
```

### Obtener por id

```bash
curl http://localhost:8080/api/products/1
```

### Actualizar (precio/stock)

```bash
curl -X PUT http://localhost:8080/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price":27999.90,"stock":45}'
```

### Eliminar

```bash
curl -X DELETE http://localhost:8080/api/products/1
```

### Carritos: crear

```bash
curl -X POST http://localhost:8080/api/carts
```

### Carritos: agregar producto (cid=1, pid=2)

```bash
curl -X POST http://localhost:8080/api/carts/1/product/2
```

### Carritos: consultar

```bash
curl http://localhost:8080/api/carts/1
```

## Ejemplos equivalentes en PowerShell

```powershell
# Crear producto
$data = @{
  title       = "Laptop Pro 14"
  description = "Equipo portátil de alto rendimiento"
  code        = "LP14-001"
  price       = 28999.90
  status      = $true
  stock       = 50
  category    = "computo"
  thumbnails  = @("images/lp14-front.jpg","images/lp14-back.jpg")
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri "http://localhost:8080/api/products" -ContentType "application/json" -Body $data

# Listar todos
Invoke-RestMethod -Method GET -Uri "http://localhost:8080/api/products"

# Obtener por id
Invoke-RestMethod -Method GET -Uri "http://localhost:8080/api/products/1"

# Actualizar
$upd = @{ price = 27999.90; stock = 45 } | ConvertTo-Json
Invoke-RestMethod -Method PUT -Uri "http://localhost:8080/api/products/1" -ContentType "application/json" -Body $upd

# Eliminar
Invoke-RestMethod -Method DELETE -Uri "http://localhost:8080/api/products/1"

# Carritos
$cart = Invoke-RestMethod -Method POST -Uri "http://localhost:8080/api/carts"
Invoke-RestMethod -Method POST -Uri "http://localhost:8080/api/carts/$($cart.data.id)/product/2"
Invoke-RestMethod -Method GET -Uri "http://localhost:8080/api/carts/$($cart.data.id)"
```

## Pruebas automatizadas (PowerShell)

Para ejecutar toda la batería de pruebas de una sola vez:

1. Archivo `test_api.ps1` en la raíz:

  ```powershell
  try {
    chcp 65001 > $null
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
  } catch {}

  $BaseUrl = "http://localhost:8080"

  function Step($title) {
    Write-Host ""
    Write-Host "===================================================="
    Write-Host ">> $title"
    Write-Host "===================================================="
  }

  function Get-AllProducts {
    return Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/products"
  }

  function Find-ProductIdByCode([string]$code) {
    $all = Get-AllProducts
    foreach ($p in $all.data) {
      if ($p.code -eq $code) { return $p.id }
    }
    return $null
  }

  function Ensure-Product([hashtable]$product){
    # Si ya existe por code, reusar id; si no, crearlo
    $existingId = Find-ProductIdByCode $product.code
    if ($existingId) {
      Step "Producto con code '$($product.code)' ya existe. Reusando id=$existingId"
      return $existingId
    }
    $body = $product | ConvertTo-Json
    try {
      $resp = Invoke-RestMethod -Method POST -Uri "$BaseUrl/api/products" -ContentType "application/json" -Body $body
      ($resp | ConvertTo-Json -Depth 6) | Write-Host
      return $resp.data.id
    } catch {
      # Si aun así fallara por 409, intentar re-leer
      $fallback = Find-ProductIdByCode $product.code
      if ($fallback) { return $fallback }
      throw
    }
  }

  # -------------------- Productos --------------------

  # Producto 1
  $p1Spec = @{
    title       = "Laptop Pro 14"
    description = "Equipo portátil de alto rendimiento"
    code        = "LP14-001"
    price       = 28999.90
    status      = $true
    stock       = 50
    category    = "computo"
    thumbnails  = @("images/lp14-front.jpg","images/lp14-back.jpg")
  }

  # Producto 2
  $p2Spec = @{
    title       = "Mouse Inalámbrico"
    description = "Mouse óptico 1600dpi"
    code        = "MS-001"
    price       = 399.00
    status      = $true
    stock       = 200
    category    = "accesorios"
    thumbnails  = @("images/mouse.jpg")
  }

  Step "Asegurar producto 1 (crea o reutiliza)"
  $p1id = Ensure-Product $p1Spec
  Write-Host "p1id = $p1id"

  Step "Asegurar producto 2 (crea o reutiliza)"
  $p2id = Ensure-Product $p2Spec
  Write-Host "p2id = $p2id"

  Step "Listar todos los productos"
  (Get-AllProducts | ConvertTo-Json -Depth 6) | Write-Host

  Step "Obtener producto 1 por id"
  Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/products/$p1id" | ConvertTo-Json -Depth 6 | Write-Host

  Step "Actualizar producto 1 (precio/stock)"
  $upd = @{ price = 27999.90; stock = 45 } | ConvertTo-Json
  Invoke-RestMethod -Method PUT -Uri "$BaseUrl/api/products/$p1id" -ContentType "application/json" -Body $upd | ConvertTo-Json -Depth 6 | Write-Host

  Step "Eliminar producto 1"
  Invoke-RestMethod -Method DELETE -Uri "$BaseUrl/api/products/$p1id" | ConvertTo-Json -Depth 6 | Write-Host

  # -------------------- Carritos --------------------
  Step "Crear carrito"
  $cart = Invoke-RestMethod -Method POST -Uri "$BaseUrl/api/carts"
  $cid = $cart.data.id
  ($cart | ConvertTo-Json -Depth 6) | Write-Host
  Write-Host "cid = $cid"

  Step "Agregar producto 2 al carrito (dos veces)"
  Invoke-RestMethod -Method POST -Uri "$BaseUrl/api/carts/$cid/product/$p2id" | ConvertTo-Json -Depth 6 | Write-Host
  Invoke-RestMethod -Method POST -Uri "$BaseUrl/api/carts/$cid/product/$p2id" | ConvertTo-Json -Depth 6 | Write-Host

  Step "Consultar productos del carrito"
  Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/carts/$cid" | ConvertTo-Json -Depth 6 | Write-Host

  Step "FIN"
  ```

2. Ejecutar:

  ```powershell
  # En una terminal PowerShell, con el servidor ya corriendo
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
  .\test_api.ps1
  ```

## Reset de datos

```powershell
'[]' | Set-Content -Encoding UTF8 .\src\data\products.json
'[]' | Set-Content -Encoding UTF8 .\src\data\carts.json
```

### Resultados esperados (resumen)

* **Productos**: creación/lectura/actualización/eliminación OK; `code` único (409 si se repite).
* **Carritos**: `POST /api/carts` crea `{ id, products: [] }`; `POST /:cid/product/:pid` agrega o incrementa `quantity`; `GET /:cid` lista productos del carrito.
* Los archivos `src/data/products.json` y `src/data/carts.json` muestran los cambios en JSON legible.

## Validación visual

* Revisar `src/data/products.json` y `src/data/carts.json` después de cada operación.
* Deben reflejar los cambios en un formato legible (JSON con sangría).

## Notas

* La ruta raíz `/` no está definida por defecto. Usar `/health`, `/api/products`, `/api/carts`.
* `id` de productos y carritos se autogeneran y **no es editable** por API.
* Si se intenta repetir `code` de producto, la API responde **409**.