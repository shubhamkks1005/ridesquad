import { useState, useEffect, useRef } from "react";

const LocationSearch = ({ label, onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const selectedRef = useRef(false);
  const inputRef = useRef(null);

  const isPickupField = label.toLowerCase().includes("pickup");

  // LocalStorage se recent locations lao
  const getRecentLocations = () => {
    const saved = localStorage.getItem("recentLocations");
    return saved ? JSON.parse(saved) : [];
  };

  // LocalStorage me recent location save karo
  const saveRecentLocation = (location) => {
    let recent = getRecentLocations();

    // Duplicate hatao
    recent = recent.filter((loc) => loc.name !== location.name);

    // Naya location top pe
    recent.unshift(location);

    // Max 5 recent locations
    if (recent.length > 5) {
      recent = recent.slice(0, 5);
    }

    localStorage.setItem("recentLocations", JSON.stringify(recent));
  };

  // GPS se current location detect karo
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Tumhara browser location support nahi karta.");
      return;
    }

    setGpsLoading(true);
    setShowRecent(false);
    setShowDropdown(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const key = import.meta.env.VITE_GEOAPIFY_KEY;
          const res = await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${key}&lang=en`
          );
          const data = await res.json();

          let name = "Current Location";

          if (data.features && data.features.length > 0) {
            name = data.features[0].properties.formatted || "Current Location";
          }

          const location = { name, lat, lng };

          selectedRef.current = true;
          setQuery(name);
          saveRecentLocation(location);
          onSelect(location);
        } catch (error) {
          console.error("Reverse geocoding error:", error);

          const location = {
            name: "Current Location",
            lat,
            lng,
          };

          selectedRef.current = true;
          setQuery("Current Location");
          saveRecentLocation(location);
          onSelect(location);
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        console.error("GPS error:", error);
        setGpsLoading(false);

        if (error.code === 1) {
          alert("Location permission deny ho gayi. Browser settings me allow karo.");
        } else if (error.code === 2) {
          alert("Location unavailable hai. Windows/browser location on karke dobara try karo.");
        } else if (error.code === 3) {
          alert("Location request timeout ho gayi. Dobara try karo.");
        } else {
          alert("Location detect nahi ho payi. Search use karo.");
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  // Search API call
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current = false;
      return;
    }

    if (query.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setShowRecent(false);

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const key = import.meta.env.VITE_GEOAPIFY_KEY;
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
            query
          )}&apiKey=${key}&limit=5&lang=en&filter=countrycode:in`
        );
        const data = await res.json();
        setResults(data.features || []);
        setShowDropdown(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // API result select
  const handleSelect = (place) => {
    const name = place.properties.formatted || place.properties.name;
    const lat = place.geometry.coordinates[1];
    const lng = place.geometry.coordinates[0];

    const location = { name, lat, lng };

    selectedRef.current = true;
    setQuery(name);
    setShowDropdown(false);
    setShowRecent(false);
    setResults([]);

    saveRecentLocation(location);
    onSelect(location);
  };

  // Recent result select
  const handleRecentSelect = (location) => {
    selectedRef.current = true;
    setQuery(location.name);
    setShowRecent(false);
    setShowDropdown(false);
    setResults([]);

    saveRecentLocation(location);
    onSelect(location);
  };

  // Input focus pe recent dikhao
  const handleFocus = () => {
    if (query.length < 3) {
      const recent = getRecentLocations();
      if (recent.length > 0) {
        setShowRecent(true);
        setShowDropdown(false);
      }
    }
  };

  // Outside click pe dropdown band
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
        setShowRecent(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const recentLocations = getRecentLocations();

  return (
    <div className="relative w-full" ref={inputRef}>
      <label className="block text-sm text-gray-200 mb-1">{label}</label>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder={`Search ${label}...`}
          className={`w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 outline-none focus:border-blue-400 ${
            isPickupField ? "pr-28" : ""
          }`}
        />

        {loading && (
          <div className="absolute right-3 top-3 text-gray-400 text-sm">
            Searching...
          </div>
        )}

        {isPickupField && !loading && (
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={gpsLoading}
            className="absolute right-2 top-1.5 bg-blue-500/30 hover:bg-blue-500/50 text-blue-300 text-xs px-3 py-1.5 rounded-md transition disabled:opacity-50"
          >
            {gpsLoading ? "Detecting..." : "📍 GPS"}
          </button>
        )}
      </div>

      {/* Recent Locations */}
      {showRecent && recentLocations.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-lg max-h-60 overflow-y-auto shadow-xl">
          <li className="px-4 py-2 text-xs text-gray-400 border-b border-white/10">
            Recent Locations
          </li>
          {recentLocations.map((loc, idx) => (
            <li
              key={idx}
              onClick={() => handleRecentSelect(loc)}
              className="px-4 py-3 text-sm text-gray-200 hover:bg-blue-500/30 cursor-pointer border-b border-white/10 last:border-b-0"
            >
              <span className="text-yellow-400 mr-2">🕐</span>
              {loc.name}
            </li>
          ))}
        </ul>
      )}

      {/* Search Results */}
      {showDropdown && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-lg max-h-60 overflow-y-auto shadow-xl">
          {results.map((place, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(place)}
              className="px-4 py-3 text-sm text-gray-200 hover:bg-blue-500/30 cursor-pointer border-b border-white/10 last:border-b-0"
            >
              <span className="text-blue-400 mr-2">📍</span>
              {place.properties.formatted || place.properties.name}
            </li>
          ))}
        </ul>
      )}

      {/* No Results */}
      {showDropdown && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-lg p-3 text-sm text-gray-400">
          No results found. Try different keywords.
        </div>
      )}
    </div>
  );
};

export default LocationSearch;