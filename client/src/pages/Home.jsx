import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const Home = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-white mb-4">
          Ride<span className="text-blue-400">Squad</span>
        </h1>
        <p className="text-gray-300 text-lg mb-2">
          Book rides. Split fares. Ride together.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          India ka pehla Social Ride platform — apne dost ko mid-route pick karo aur fare split karo automatically.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Link
              to="/book"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition"
            >
              Book a Ride 🚀
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition"
              >
                Get Started 🚀
              </Link>
              <Link
                to="/login"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg transition border border-white/20"
              >
                Login
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="bg-white/10 rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-2">🗺️</div>
            <h3 className="text-white font-semibold mb-1">Real-time Tracking</h3>
            <p className="text-gray-400 text-sm">
              Live driver tracking on map
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="text-white font-semibold mb-1">Social Ride</h3>
            <p className="text-gray-400 text-sm">
              Dost ko invite karo, fare split karo
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="text-white font-semibold mb-1">Auto Fare Split</h3>
            <p className="text-gray-400 text-sm">
              Distance based smart fare calculation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;