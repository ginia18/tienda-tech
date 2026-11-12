# Tienda Tech – API CRUD contenerizada

API REST para gestionar el inventario de una tienda de tecnología (laptops, periféricos, monitores…). Está hecha con **Node.js + Express**, usa **PostgreSQL** como base de datos y se ejecuta con **Docker Compose**.

## 1. Requisitos

| Herramienta | Versión recomendada | Comprobar con |
|---|---|---|
| Docker Engine / Docker Desktop | 24 o superior | `docker --version` |
| Docker Compose (plugin v2) | 2.20 o superior | `docker compose version` |
| Git | cualquiera reciente | `git --version` |
| curl (para probar la API) | cualquiera | `curl --version` |

Puertos libres en tu máquina: **3000** (API) y **5433** (PostgreSQL). Se pueden cambiar en `.env`.

No necesitas instalar Node.js ni PostgreSQL: todo corre dentro de contenedores.

## 2. Estructura del proyecto

```
tienda-tech/
├── src/
│   ├── index.js          # Servidor Express y rutas del CRUD
│   └── db.js             # Conexión a PostgreSQL (pool)
├── db/
│   └── init.sql          # Crea la tabla productos e inserta datos de ejemplo
├── Dockerfile            # Imagen de la API (node:22-alpine)
├── docker-compose.yml    # Servicios: db (PostgreSQL) y api
├── package.json
├── .env.example          # Plantilla de variables de entorno (sin credenciales reales)
├── .gitignore            # Excluye .env y node_modules
├── .dockerignore
└── README.md
```

## 3. Preparación de variables de entorno

```bash
git clone https://github.com/ginia18/tienda-tech.git tienda-tech
cd tienda-tech
cp .env.example .env
```

Abre `.env` y cambia al menos `POSTGRES_PASSWORD`.

| Variable | Descripción | Valor de ejemplo |
|---|---|---|
| `POSTGRES_USER` | Usuario de PostgreSQL | `tienda_user` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `cambia_esta_clave` |
| `POSTGRES_DB` | Nombre de la base de datos | `tienda_db` |
| `APP_PORT` | Puerto de la API en tu máquina | `3000` |
| `DB_PORT_HOST` | Puerto de PostgreSQL en tu máquina | `5433` |

> El archivo `.env` está en `.gitignore`: nunca lo subas al repositorio.

## 4. Construir, iniciar y detener

```bash
# Construir las imágenes e iniciar todo en segundo plano
docker compose up -d --build

# Ver el estado (db debe aparecer "healthy" y api "running")
docker compose ps

# Ver logs
docker compose logs -f api

# Detener y eliminar contenedores (los datos se conservan en el volumen)
docker compose down

# Detener y BORRAR también los datos (reinicia la base desde cero)
docker compose down -v
```

Comprobación rápida:

```bash
curl http://localhost:3000/health
# {"status":"ok","db":"ok"}
```

## 5. Inicialización de la base de datos

El archivo `db/init.sql` se monta en `/docker-entrypoint-initdb.d/` y PostgreSQL lo ejecuta **automáticamente solo la primera vez** que se crea el volumen `pgdata`. Crea la tabla `productos` e inserta 3 productos de ejemplo.

Si cambias `init.sql` o las credenciales y quieres que se vuelva a aplicar:

```bash
docker compose down -v
docker compose up -d --build
```

Para entrar a la base de datos y revisar los datos:

```bash
docker compose exec db psql -U tienda_user -d tienda_db -c "SELECT * FROM productos;"
```

(Usa el valor que pusiste en `POSTGRES_USER` y `POSTGRES_DB`.)

## 6. Ejemplos de solicitudes al CRUD

Modelo de producto: `nombre` (texto), `categoria` (texto), `precio` (número ≥ 0), `stock` (entero ≥ 0).

**Crear (POST)**
```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Teclado mecanico Redragon","categoria":"Perifericos","precio":39.99,"stock":30}'
```

**Listar (GET)**
```bash
curl http://localhost:3000/api/productos
```

**Obtener uno (GET)**
```bash
curl http://localhost:3000/api/productos/1
```

**Actualizar (PUT)** – se envían todos los campos
```bash
curl -X PUT http://localhost:3000/api/productos/4 \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Teclado mecanico Redragon","categoria":"Perifericos","precio":34.99,"stock":25}'
```

**Eliminar (DELETE)** – responde `204 No Content`
```bash
curl -i -X DELETE http://localhost:3000/api/productos/4
```

Códigos de respuesta: `201` creado, `200` correcto, `204` eliminado, `400` datos inválidos, `404` no existe, `500` error del servidor.

> Nota: PostgreSQL devuelve `precio` como texto (`"649.90"`) porque la columna es `NUMERIC`; así se evita perder precisión.

## 7. Errores frecuentes

### Error 1: `port is already allocated` / `address already in use`
- **Causa:** otro programa (u otro contenedor) ya usa el puerto 3000 o 5433.
- **Solución:** cambia `APP_PORT` o `DB_PORT_HOST` en `.env` y ejecuta `docker compose up -d` otra vez. Para ver quién usa el puerto: `lsof -i :3000` (Linux/macOS) o `netstat -ano | findstr :3000` (Windows).

### Error 2: `password authentication failed for user "tienda_user"`
- **Causa:** cambiaste `POSTGRES_PASSWORD` (o el usuario) en `.env` después de la primera ejecución. PostgreSQL guardó las credenciales antiguas en el volumen `pgdata` y no las vuelve a leer.
- **Solución:** vuelve a la contraseña original o recrea el volumen (se pierden los datos): `docker compose down -v && docker compose up -d --build`.

### Error 3: `The "POSTGRES_PASSWORD" variable is not set` o la base no arranca
- **Causa:** no existe el archivo `.env` (olvidaste copiar `.env.example`) o tiene variables vacías.
- **Solución:** `cp .env.example .env`, completa los valores y ejecuta `docker compose up -d --build`.

### Error 4: la tabla `productos` no existe (`relation "productos" does not exist`)
- **Causa:** el volumen `pgdata` ya existía de una ejecución anterior y `init.sql` no se volvió a ejecutar.
- **Solución:** `docker compose down -v` y luego `docker compose up -d --build`.

### Error 5: `curl: (7) Failed to connect to localhost port 3000`
- **Causa:** la API aún no terminó de arrancar, o falló al iniciar.
- **Solución:** revisa `docker compose ps` y `docker compose logs api`; espera unos segundos a que `db` esté `healthy` y repite la solicitud.

### Error 6: `Cannot connect to the Docker daemon`
- **Causa:** Docker no está iniciado.
- **Solución:** abre Docker Desktop (Windows/macOS) o ejecuta `sudo systemctl start docker` (Linux).

## 8. Limpieza completa

```bash
docker compose down -v --rmi local
```
