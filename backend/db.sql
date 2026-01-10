CREATE DATABASE simore_db;
USE simore_db;

-- Tabel Rooms (Sesuai ERD)
CREATE TABLE rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    status ENUM('AVAILABLE', 'OCCUPIED') DEFAULT 'AVAILABLE',
    last_motion_detected DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Reservations (Untuk fitur Ghost Booking)
CREATE TABLE reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT,
    customer_name VARCHAR(100),
    start_time DATETIME,
    end_time DATETIME,
    status ENUM('ACTIVE', 'COMPLETED', 'NO_SHOW'),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Tabel Logs (Untuk history sensor)
CREATE TABLE sensor_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT,
    motion_detected BOOLEAN,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Data Dummy Awal
INSERT INTO rooms (name, status) VALUES ('VIP Room 1', 'AVAILABLE'), ('VIP Room 2', 'AVAILABLE');