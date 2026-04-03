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
