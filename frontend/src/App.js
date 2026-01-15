import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import io from "socket.io-client";
import "./App.css";

const socket = io.connect("http://localhost:5000");

function App() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null); // ID Ruangan yang dipilih
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Daftar Semua Ruangan (Untuk Sidebar)
  const fetchRooms = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/rooms");
      setRooms(res.data);

      // Jika belum ada ruangan yang dipilih, pilih ruangan pertama otomatis
      if (!selectedRoomId && res.data.length > 0) {
        setSelectedRoomId(res.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching rooms", error);
    }
  }, [selectedRoomId]);

  // 2. Fetch History untuk Ruangan yang Dipilih
  const fetchHistory = useCallback(async (roomId) => {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/history/${roomId}`
      );
      setHistory(res.data);
    } catch (error) {
      console.error("Error fetching history", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect Awal & Socket IO
  useEffect(() => {
    fetchRooms();

    socket.on("room_update", (data) => {
      // 1. Refresh list ruangan (agar indikator warna di sidebar update)
      fetchRooms();

      // 2. Jika update terjadi di ruangan yang sedang kita buka, refresh juga history-nya
      if (selectedRoomId && data.room_id == selectedRoomId) {
        fetchHistory(selectedRoomId);
      }
    });

    return () => socket.off("room_update");
  }, [fetchRooms, fetchHistory, selectedRoomId]);

  // Effect saat User Klik Ruangan di Sidebar
  useEffect(() => {
    if (selectedRoomId) {
      fetchHistory(selectedRoomId);
    }
  }, [selectedRoomId, fetchHistory]);

  // Helper untuk mendapatkan data ruangan yang sedang aktif
  const activeRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="dashboard-container">
      {/* --- SIDEBAR --- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Simore</h2>
          <span className="subtitle">Smart Monitoring</span>
        </div>

        <nav className="room-list">
          <p className="menu-label">DAFTAR RUANGAN</p>
          {rooms.map((room) => (
            <button
              key={room.id}
              className={`room-item ${
                selectedRoomId === room.id ? "active" : ""
              }`}
              onClick={() => setSelectedRoomId(room.id)}
            >
              <span className="room-name">{room.name}</span>
              {/* Indikator Status Kecil di Sidebar */}
              <span
                className={`status-dot ${
                  room.status === "OCCUPIED" ? "red" : "green"
                }`}
              ></span>
            </button>
          ))}
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="main-content">
        {activeRoom ? (
          <>
            <header className="content-header">
              <h1>Monitoring {activeRoom.name}</h1>
              <p className="last-update">
                Last Update:{" "}
                {activeRoom.last_motion_detected
                  ? new Date(activeRoom.last_motion_detected).toLocaleString()
                  : "-"}
              </p>
            </header>

            {/* STATUS CARD */}
            <div className={`status-card ${activeRoom.status.toLowerCase()}`}>
              <div className="status-icon">
                {activeRoom.status === "OCCUPIED" ? "🚶‍♂️" : "✅"}
              </div>
              <div className="status-info">
                <h3>Status Ruangan</h3>
                <h2 className="status-text">{activeRoom.status}</h2>
                <p className="status-desc">
                  {activeRoom.status === "OCCUPIED"
                    ? "Ada aktivitas terdeteksi di dalam ruangan."
                    : "Ruangan kosong, siap digunakan atau dibersihkan."}
                </p>
              </div>
            </div>

            {/* HISTORY TABLE */}
            <section className="history-section">
              <h3>Riwayat Aktivitas</h3>
              <div className="table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Waktu Recorded</th>
                      <th>Status Deteksi</th>
                      <th>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: "center" }}>
                          Loading data...
                        </td>
                      </tr>
                    ) : history.length > 0 ? (
                      history.map((log) => (
                        <tr key={log.id}>
                          <td>{new Date(log.recorded_at).toLocaleString()}</td>
                          <td>
                            <span
                              className={`badge ${
                                log.motion_detected ? "occupied" : "available"
                              }`}
                            >
                              {log.motion_detected ? "Motion" : "Idle"}
                            </span>
                          </td>
                          <td>
                            {log.motion_detected
                              ? "Gerakan manusia terdeteksi"
                              : "Tidak ada gerakan (Timer check)"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          style={{ textAlign: "center", color: "#888" }}
                        >
                          Belum ada riwayat data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <div className="empty-state">
            Pilih ruangan dari sidebar untuk melihat detail.
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
