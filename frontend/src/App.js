import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import "./App.css";

const socket = io.connect("http://localhost:5000");

function App() {
  const [currentRoom, setCurrentRoom] = useState(null); // Hanya simpan 1 room
  const [history, setHistory] = useState([]); // State untuk tabel history

  // ID Ruangan yang ingin dipantau (Hardcode ID 1)
  const TARGET_ROOM_ID = 1;

  // Fetch Data
  const fetchData = async () => {
    try {
      // 1. Ambil Data Room
      const resRoom = await axios.get("http://localhost:5000/api/rooms");
      // Cari room dengan ID 1
      const foundRoom = resRoom.data.find((r) => r.id === TARGET_ROOM_ID);
      setCurrentRoom(foundRoom);

      // 2. Ambil Data History
      const resHistory = await axios.get(
        `http://localhost:5000/api/history/${TARGET_ROOM_ID}`
      );
      setHistory(resHistory.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen event real-time
    socket.on("room_update", (data) => {
      // Cek apakah update yang masuk milik ruangan yang sedang kita pantau
      if (data.room_id == TARGET_ROOM_ID) {
        // gunakan == untuk antisipasi string vs int
        console.log("Update received for Room 1:", data);
        fetchData(); // Refresh data status & history
      }
    });

    return () => socket.off("room_update");
  }, []);

  // Logika Warna
  const getStatusColor = (status) => {
    if (status === "OCCUPIED") return "#ff4d4d"; // Merah cerah
    if (status === "AVAILABLE") return "#4caf50"; // Hijau cerah
    return "grey";
  };

  return (
    <div className="App">
      <h1>Monitoring Ruang VIP 1</h1>

      {/* 1. TAMPILAN STATUS UTAMA */}
      <div className="monitor-container">
        {currentRoom ? (
          <div
            className="big-status-card"
            style={{ backgroundColor: getStatusColor(currentRoom.status) }}
          >
            <h2>STATUS SAAT INI</h2>
            <h1 style={{ fontSize: "3rem", margin: "10px 0" }}>
              {currentRoom.status}
            </h1>
            <p>
              Terakhir Terdeteksi:{" "}
              {currentRoom.last_motion_detected
                ? new Date(currentRoom.last_motion_detected).toLocaleString()
                : "-"}
            </p>
          </div>
        ) : (
          <p>Loading Room Data...</p>
        )}
      </div>

      {/* 2. TAMPILAN TABEL HISTORY */}
      <div
        className="history-container"
        style={{ marginTop: "30px", padding: "0 20px" }}
      >
        <h3>Riwayat Deteksi Gerakan (10 Terakhir)</h3>
        <table
          border="1"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "10px",
          }}
        >
          <thead style={{ backgroundColor: "#f0f0f0" }}>
            <tr>
              <th style={{ padding: "10px" }}>Waktu</th>
              <th style={{ padding: "10px" }}>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((log) => (
                <tr key={log.id}>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    {new Date(log.recorded_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    {log.motion_detected === 1 ? (
                      <span style={{ color: "red", fontWeight: "bold" }}>
                        Gerakan Terdeteksi
                      </span>
                    ) : (
                      <span style={{ color: "green" }}>Tidak Ada Gerakan</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="2"
                  style={{ textAlign: "center", padding: "10px" }}
                >
                  Belum ada data history
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
