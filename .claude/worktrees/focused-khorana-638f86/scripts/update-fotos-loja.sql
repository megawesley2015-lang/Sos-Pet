-- ============================================================
-- SOS Pet — Atualização de fotos dos produtos da loja
--
-- Cole e execute no Supabase SQL Editor.
-- Fontes: Unsplash (uso livre, licença Unsplash)
-- ============================================================

-- ── Plaquinha QR Code SOS Pet (produto interno) ─────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1587300132061-2df72dfcc2d5?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name = 'Plaquinha QR Code SOS Pet';

-- ── Coleira Refletiva ────────────────────────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name = 'Coleira Refletiva com Identificação';

-- ── Peitoral Safety Walk ─────────────────────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name = 'Peitoral Refletivo Safety Walk';

-- ── Rastreador GPS ───────────────────────────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name = 'Rastreador GPS para Pets';

-- ── Coleira Antipuxão ────────────────────────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name = 'Coleira Antipuxão com Alça de Controle';

-- ── Tag Metálica ─────────────────────────────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name = 'Tag Metálica de Identificação Personalizada';

-- ── Shampoo Hipoalergênico ───────────────────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name = 'Shampoo Hipoalergênico para Cães';

-- ── Kit Primeiros Socorros ───────────────────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name = 'Kit Primeiros Socorros Veterinário';

-- ── Bebedouro Portátil ───────────────────────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name = 'Bebedouro Portátil para Passeios';

-- ── Petisco Natural ──────────────────────────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name = 'Petisco Natural Palito de Frango';

-- ── My Family Brasil (silicone QR Code) ─────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name ILIKE '%My Family%' OR name ILIKE '%Silicone%QR%';

-- ── Pet Print (aço inox) ─────────────────────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name ILIKE '%Pet Print%' OR name ILIKE '%Dupla Face%';

-- ── Pinnpet (kit identificação) ──────────────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1587300132061-2df72dfcc2d5?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name ILIKE '%Pinnpet%' OR name ILIKE '%Kit Identifica%';

-- ── Zocprint (acrílico) ──────────────────────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name ILIKE '%Zocprint%' OR name ILIKE '%Acrílico%';

-- ── Plaquinha.com (medalha latão) ────────────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name ILIKE '%Plaquinha.com%' OR name ILIKE '%Medalha%';

-- ── Palecon (combo plaquinha + camiseta) ─────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name ILIKE '%Palecon%' OR name ILIKE '%Camiseta%';

-- ── Printful (produtos personalizados) ──────────────────────
UPDATE store_products SET photo_url =
  'https://images.unsplash.com/photo-1581888227599-779811939961?w=600&h=600&fit=crop&auto=format&q=80'
WHERE name ILIKE '%Printful%';

-- ── Confirmar ────────────────────────────────────────────────
SELECT name, category, LEFT(photo_url, 60) AS foto_preview
FROM store_products
ORDER BY sort_order;
