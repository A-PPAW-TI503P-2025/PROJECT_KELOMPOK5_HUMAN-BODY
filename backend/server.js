require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Koneksi Database
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) console.error("Database connection failed:", err);
  else console.log("Connected to MySQL Database");
});

// API endpoint untuk Sensor IoT (Sesuai Sequence Diagram)
// Sensor -> Backend : POST /api/update
app.post("/api/update", (req, res) => {
  const { room_id, motion } = req.body; // motion: 1 (gerak) atau 0 (diam)

  // Logika Sesuai Flowchart
  let newStatus = motion == 1 ? "OCCUPIED" : "AVAILABLE";
  let query = "";

  if (motion == 1) {
    // Jika ada gerak, langsung set OCCUPIED dan update waktu terakhir gerak
    query = `UPDATE rooms SET status='OCCUPIED', last_motion_detected=NOW() WHERE id=?`;
  } else {
    // Jika tidak ada gerak, logika timer biasanya ditangani di hardware atau cek selisih waktu
    // Di sini kita update status sederhana untuk simulasi
    query = `UPDATE rooms SET status='AVAILABLE' WHERE id=?`;
  }

  db.query(query, [room_id], (err, result) => {
    if (err) return res.status(500).send(err);

    // Catat Log
    db.query(
      `INSERT INTO sensor_logs (room_id, motion_detected) VALUES (?, ?)`,
      [room_id, motion]
    );

    // Kirim update Real-time ke Frontend via Socket.io
    io.emit("room_update", { room_id, status: newStatus });

    res.status(200).json({ message: "Data received", status: newStatus });
  });
});

// API untuk Frontend mengambil status awal
app.get("/api/rooms", (req, res) => {
  db.query("SELECT * FROM rooms", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.get("/api/history/:roomId", (req, res) => {
  const roomId = req.params.roomId;
  // Ambil 10 log terakhir, urutkan dari yang terbaru
  const query = `
        SELECT * FROM sensor_logs 
        WHERE room_id = ? 
        ORDER BY recorded_at DESC 
        LIMIT 10
    `;
  db.query(query, [roomId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
