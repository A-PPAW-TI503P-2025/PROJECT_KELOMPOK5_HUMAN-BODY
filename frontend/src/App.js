import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

const socket = io.connect("http://localhost:5000");

function App() {
  const [rooms, setRooms] = useState([]);

  // Fetch data awal saat load
  useEffect(() => {
    fetchRooms();

    // Listen event dari Backend
    socket.on("room_update", (data) => {
      console.log("Update received:", data);
      fetchRooms(); // Refresh data jika ada notifikasi socket
    });

    return () => socket.off("room_update");
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/rooms');
      setRooms(res.data);
    } catch (error) {
      console.error("Error fetching rooms", error);
    }
  };

  // Logika Warna Indikator
  const getStatusColor = (status) => {
    if (status === 'OCCUPIED') return 'red';   // Merah: Ada orang
    if (status === 'AVAILABLE') return 'green'; // Hijau: Kosong
    // Logika Ghost Booking (Ungu) bisa ditambahkan jika ada data reservasi
    return 'grey';
  };

  return (
    <div className="App">
      <h1>Simore Dashboard</h1>
      <div className="room-container">
        {rooms.map(room => (
          <div key={room.id} className="room-card" style={{ backgroundColor: getStatusColor(room.status) }}>
            <h2>{room.name}</h2>
            <p>Status: <strong>{room.status}</strong></p>
            <p>Last Motion: {new Date(room.last_motion_detected).toLocaleTimeString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;