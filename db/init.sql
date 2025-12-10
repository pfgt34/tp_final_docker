-- Initialise la base et insère des données de démonstration
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

INSERT INTO items (name, description)
SELECT 'Item A', 'Description A'
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name='Item A');

INSERT INTO items (name, description)
SELECT 'Item B', 'Description B'
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name='Item B');
