import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
      const data = await login(formData);

      if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "driver") {
        navigate("/driver");
      } else {
        navigate("/book");
      }
    } catch (error) {
      console.log("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Login
        </h1>
        <p className="text-gray-300 text-center mb-6">
          Welcome back to RideSquad
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-200 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-300 outline-none focus:border-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-200 mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-300 outline-none focus:border-blue-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-gray-300 text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-blue-400 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;