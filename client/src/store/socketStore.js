import { create } from "zustand";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const useSocketStore = create((set, get) => ({
  socket: null,
  drivers: [],
  assignedDriver: null,
  driverReached: false,
  connected: false,

  connectSocket: () => {
    const existingSocket = get().socket;
    if (existingSocket) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("✅ Frontend connected to socket server");
      set({ connected: true });
    });

    socket.on("disconnect", () => {
      console.log("❌ Frontend disconnected from socket server");
      set({ connected: false });
    });

    socket.on("drivers:all", (drivers) => {
      set({ drivers });
    });

    socket.on("ride:driver-assigned", (data) => {
      set({ assignedDriver: data.driver, driverReached: false });
      console.log("🚗 Driver assigned:", data.driver);
    });

    socket.on("driver:reached", (data) => {
      set({ driverReached: true });
      console.log("✅ Driver reached pickup:", data.driverId);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
    }

    set({
      socket: null,
      drivers: [],
      assignedDriver: null,
      driverReached: false,
      connected: false,
    });
  },
}));