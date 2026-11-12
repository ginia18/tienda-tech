const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

const PORT = Number(process.env.APP_PORT || 3000);

// Salud: comprueba que la API y la base de datos responden
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'down', detail: err.message });
  }
});

function validar(body) {
  const { nombre, categoria, precio, stock } = body;
  if (!nombre || typeof nombre !== 'string') return 'nombre es obligatorio';
  if (!categoria || typeof categoria !== 'string') return 'categoria es obligatoria';
  if (typeof precio !== 'number' || precio < 0) return 'precio debe ser un numero >= 0';
  if (!Number.isInteger(stock) || stock < 0) return 'stock debe ser un entero >= 0';
  return null;
}

// CREATE
app.post('/api/productos', async (req, res) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ error });
  const { nombre, categoria, precio, stock } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO productos (nombre, categoria, precio, stock) VALUES ($1,$2,$3,$4) RETURNING *',
      [nombre, categoria, precio, stock]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ (lista)
app.get('/api/productos', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM productos ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ (uno)
app.get('/api/productos/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
app.put('/api/productos/:id', async (req, res) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ error });
  const { nombre, categoria, precio, stock } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE productos SET nombre=$1, categoria=$2, precio=$3, stock=$4 WHERE id=$5 RETURNING *',
      [nombre, categoria, precio, stock, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete('/api/productos/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM productos WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`API escuchando en el puerto ${PORT}`));
