import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "user",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await register(formData);

      if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "driver") {
        navigate("/driver");
      } else {
        navigate("/book");
      }
    } catch (error) {
      console.log("Registration failed", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🚗</div>
          <h1 className="text-3xl font-bold text-white">Register</h1>
          <p className="text-gray-300 text-sm mt-1">Create your RideSquad account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-200 mb-1">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 outline-none focus:border-purple-400 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-200 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 outline-none focus:border-purple-400 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-200 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 outline-none focus:border-purple-400 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-200 mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 outline-none focus:border-purple-400 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-200 mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-purple-400 transition"
            >
              <option value="user" className="text-black">User</option>
              <option value="driver" className="text-black">Driver</option>
              <option value="admin" className="text-black">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 transition disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-gray-300 text-center mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;