-- TURIX - reparación única de texto UTF-8 guardado como latin1.
-- Ejecútalo SOLO en una base que muestre texto como "LÃ³pez".
-- No es necesario para una instalación nueva: init.sql ya importa en utf8mb4.

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE turix_db;

START TRANSACTION;

-- C383C2 identifica en este conjunto los bytes UTF-8 interpretados como latin1.
UPDATE categories
SET description = CONVERT(BINARY CONVERT(description USING latin1) USING utf8mb4)
WHERE HEX(description) LIKE '%C383C2%';

-- Los emojis dañados por la misma conversión comienzan con C3B0C5B8.
UPDATE categories
SET icon = CONVERT(BINARY CONVERT(icon USING latin1) USING utf8mb4)
WHERE HEX(icon) LIKE '%C3B0C5B8%';

UPDATE trips
SET name = CONVERT(BINARY CONVERT(name USING latin1) USING utf8mb4)
WHERE HEX(name) LIKE '%C383C2%';

UPDATE trips
SET description = CONVERT(BINARY CONVERT(description USING latin1) USING utf8mb4)
WHERE HEX(description) LIKE '%C383C2%';

UPDATE trips
SET destination = CONVERT(BINARY CONVERT(destination USING latin1) USING utf8mb4)
WHERE HEX(destination) LIKE '%C383C2%';

COMMIT;
