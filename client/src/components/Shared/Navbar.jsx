import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path
      ? "text-blue-400 font-semibold"
      : "text-gray-300 hover:text-white";
  };

  return (
    <nav className="w-full bg-slate-900/90 backdrop-blur-md text-white border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-blue-400">
          🚗 RideSquad
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-5">
          {user ? (
            <>
              {/* User Links */}
              {user.role === "user" && (
                <>
                  <Link to="/book" className={`text-sm transition ${isActive("/book")}`}>
                    Book Ride
                  </Link>
                  <Link to="/history" className={`text-sm transition ${isActive("/history")}`}>
                    History
                  </Link>
                </>
              )}

              {/* Driver Links */}
              {user.role === "driver" && (
                <Link to="/driver" className={`text-sm transition ${isActive("/driver")}`}>
                  Dashboard
                </Link>
              )}

              {/* Admin Links */}
              {user.role === "admin" && (
                <Link to="/admin" className={`text-sm transition ${isActive("/admin")}`}>
                  Admin Panel
                </Link>
              )}

              {/* User Info + Logout */}
              <div className="flex items-center gap-3 ml-2 pl-4 border-l border-white/10">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`text-sm transition ${isActive("/login")}`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;