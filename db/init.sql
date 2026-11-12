-- Se ejecuta automaticamente SOLO la primera vez que se crea el volumen de datos.
CREATE TABLE IF NOT EXISTS productos (
  id        SERIAL PRIMARY KEY,
  nombre    VARCHAR(120) NOT NULL,
  categoria VARCHAR(60)  NOT NULL,
  precio    NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  stock     INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

INSERT INTO productos (nombre, categoria, precio, stock) VALUES
  ('Laptop Lenovo IdeaPad 15', 'Laptops', 649.90, 12),
  ('Mouse inalambrico Logitech M170', 'Perifericos', 14.50, 80),
  ('Monitor Samsung 24 pulgadas', 'Monitores', 139.00, 25);
