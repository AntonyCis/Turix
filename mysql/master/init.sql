-- ============================================
-- TURIX - Sistema de Gestión de Viajes Turísticos
-- Schema + Seed Data
-- Motor: MySQL 8.0 con InnoDB
-- ============================================

CREATE DATABASE IF NOT EXISTS turix_db;
USE turix_db;

-- ============================================
-- TABLA: users
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA: categories
-- ============================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA: trips (paquetes de viaje / destinos)
-- ============================================
CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    destination VARCHAR(200) NOT NULL,
    available_slots INT NOT NULL DEFAULT 0,
    category_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_days INT NOT NULL DEFAULT 1,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_code (code),
    INDEX idx_category (category_id),
    INDEX idx_active (is_active),
    INDEX idx_price (price),
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA: orders
-- ============================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLA: order_items
-- ============================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    trip_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SEED: Categorías
-- ============================================
INSERT INTO categories (name, description, icon) VALUES
('Aventura', 'Viajes de aventura y deportes extremos', '🏔️'),
('Cultural', 'Tours culturales e históricos', '🏛️'),
('Playa', 'Destinos de playa y relajación', '🏖️'),
('Ecoturismo', 'Turismo ecológico y naturaleza', '🌿'),
('Gastronómico', 'Experiencias culinarias y gastronomía local', '🍽️');

-- ============================================
-- SEED: Admin user (password: admin123)
-- bcrypt hash generado con 10 salt rounds
-- ============================================
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@turix.ec', '$2b$10$hJCe/8GtQvZk9Wmv5DErLebI.74n/geT5vC.vraIwCn/xCmYnSp1i', 'Administrador Turix', 'admin');

-- ============================================
-- SEED: Paquetes de Viaje (destinos ecuatorianos)
-- ============================================
INSERT INTO trips (code, name, description, destination, available_slots, category_id, price, duration_days, image_url) VALUES
('GAL-001', 'Expedición Galápagos Premium',
 'Recorrido de 5 días por las islas encantadas. Incluye snorkel con lobos marinos, avistamiento de tortugas gigantes, iguanas marinas y piqueros de patas azules. Visita a la Estación Charles Darwin y navegación entre islas.',
 'Islas Galápagos, Ecuador', 20, 1, 1250.00, 5, '/images/galapagos.jpg'),

('QUI-001', 'Quito Colonial & Mitad del Mundo',
 'Tour completo por el centro histórico Patrimonio de la Humanidad UNESCO. Visita a La Compañía, Basílica del Voto Nacional, Panecillo y monumento de la Mitad del Mundo. Incluye almuerzo típico y transporte.',
 'Quito, Pichincha', 30, 2, 85.00, 1, '/images/quito.jpg'),

('MON-001', 'Montañita Surf & Sol',
 'Escapada de fin de semana a la capital del surf ecuatoriano. Incluye clases de surf para principiantes, hospedaje frente al mar, tour de avistamiento de ballenas (temporada) y vida nocturna.',
 'Montañita, Santa Elena', 25, 3, 180.00, 3, '/images/montanita.jpg'),

('YAS-001', 'Selva Amazónica - Yasuní',
 'Inmersión total en el Parque Nacional Yasuní, reserva de biósfera UNESCO. Caminatas nocturnas, avistamiento de fauna silvestre, convivencia con comunidades Waorani y navegación por ríos amazónicos.',
 'Parque Nacional Yasuní, Orellana', 12, 4, 650.00, 4, '/images/yasuni.jpg'),

('CUE-001', 'Ruta Gastronómica Cuenca',
 'Descubre la cocina cuencana: desde el mote pillo y hornado hasta el cuy asado. Visitas a mercados tradicionales, talleres de cocina, degustación de destilados artesanales y tour por el centro histórico.',
 'Cuenca, Azuay', 15, 5, 120.00, 2, '/images/cuenca.jpg'),

('BAN-001', 'Baños de Agua Santa Extremo',
 'Adrenalina pura en la capital de la aventura: puenting desde el puente de San Francisco, canopy sobre cascadas, rafting nivel III-IV, columpio al fin del mundo y paseo en chiva por la Ruta de las Cascadas.',
 'Baños, Tungurahua', 20, 1, 200.00, 2, '/images/banos.jpg'),

('OTA-001', 'Otavalo: Mercados y Tradición Andina',
 'Visita al mercado artesanal indígena más grande de Sudamérica. Incluye taller de tejidos, visita a la cascada de Peguche, laguna de Cuicocha y almuerzo típico en hacienda colonial.',
 'Otavalo, Imbabura', 25, 2, 95.00, 1, '/images/otavalo.jpg'),

('MAN-001', 'Playa de los Frailes & Puerto López',
 'Relax total en la playa más hermosa de Ecuador continental. Avistamiento de ballenas jorobadas (junio-septiembre), visita a Isla de la Plata y tour por el Parque Nacional Machalilla.',
 'Puerto López, Manabí', 18, 3, 220.00, 3, '/images/frailes.jpg');
