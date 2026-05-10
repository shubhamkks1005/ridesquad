import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const Home = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-4 pt-20 pb-16">
        <div className="text-center max-w-3xl">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
            Ride<span className="text-blue-400">Squad</span>
          </h1>
          <p className="text-gray-300 text-xl mb-2">
            Book rides. Add stops. Split fares.
          </p>
          <p className="text-gray-400 text-sm mb-8 max-w-lg mx-auto">
            India ka pehla Social Ride platform — apne dost ko mid-route pick
            karo aur fare automatically split karo. Ola, Uber, Rapido me ye
            feature nahi milega.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to={
                  user.role === "admin"
                    ? "/admin"
                    : user.role === "driver"
                    ? "/driver"
                    : "/book"
                }
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition"
              >
                {user.role === "admin"
                  ? "Admin Panel"
                  : user.role === "driver"
                  ? "Driver Dashboard"
                  : "Book a Ride"}{" "}
                🚀
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
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">
          Why Choose RideSquad?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon="🗺️"
            title="Real-time Tracking"
            desc="Live driver tracking on premium map with smooth movement"
          />
          <FeatureCard
            icon="👥"
            title="Social Ride"
            desc="Add multiple stops, pick friends on the way"
          />
          <FeatureCard
            icon="💰"
            title="Auto Fare Split"
            desc="Distance based smart fare calculation for each passenger"
          />
          <FeatureCard
            icon="🛣️"
            title="Road Routing"
            desc="Actual road-based route, not straight lines"
          />
        </div>

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            How Social Ride Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <StepCard
              step="1"
              title="Book Ride"
              desc="Select pickup & destination"
            />
            <StepCard
              step="2"
              title="Add Stops"
              desc="Add friend's pickup locations"
            />
            <StepCard
              step="3"
              title="Fare Split"
              desc="See fare breakdown per person"
            />
            <StepCard
              step="4"
              title="Track Live"
              desc="Track driver in real-time"
            />
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Built With</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "React",
              "Node.js",
              "MongoDB",
              "Socket.io",
              "Leaflet",
              "MapTiler",
              "Geoapify",
              "OSRM",
              "Tailwind CSS",
              "Zustand",
            ].map((tech) => (
              <span
                key={tech}
                className="bg-white/10 border border-white/10 text-gray-300 px-4 py-2 rounded-full text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center">
        <p className="text-gray-500 text-sm">
          Built by Shubham Kumar Kushwaha | M.Tech CS, IIIT Lucknow
        </p>
      </footer>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white/10 rounded-xl p-6 border border-white/10 hover:border-blue-400/30 transition">
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="text-white font-semibold mb-1">{title}</h3>
    <p className="text-gray-400 text-sm">{desc}</p>
  </div>
);

// Step Card Component
const StepCard = ({ step, title, desc }) => (
  <div className="bg-white/10 rounded-xl p-6 border border-white/10 text-center">
    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">
      {step}
    </div>
    <h3 className="text-white font-semibold mb-1">{title}</h3>
    <p className="text-gray-400 text-sm">{desc}</p>
  </div>
);

export default Home;