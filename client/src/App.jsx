import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Shared/Navbar";
import ProtectedRoute from "./components/Shared/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BookRide from "./pages/BookRide";
import RideHistory from "./pages/RideHistory";

// Placeholder pages (baad me banenge)
const DriverDashboard = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <h1 className="text-white text-3xl">Driver Dashboard (Coming Soon)</h1>
  </div>
);

const AdminDashboard = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <h1 className="text-white text-3xl">Admin Dashboard (Coming Soon)</h1>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/book"
          element={
            <ProtectedRoute>
              <BookRide />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <RideHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver"
          element={
            <ProtectedRoute>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;