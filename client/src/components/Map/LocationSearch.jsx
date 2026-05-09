import { useState, useEffect, useRef } from "react";

const LocationSearch = ({ label, onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const selectedRef = useRef(false);

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

  const handleSelect = (place) => {
    const name = place.properties.formatted || place.properties.name;
    const lat = place.geometry.coordinates[1];
    const lng = place.geometry.coordinates[0];

    selectedRef.current = true;
    setQuery(name);
    setShowDropdown(false);
    setResults([]);

    onSelect({ name, lat, lng });
  };

  return (
    <div className="relative w-full">
      <label className="block text-sm text-gray-200 mb-1">{label}</label>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${label}...`}
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 outline-none focus:border-blue-400"
        />

        {loading && (
          <div className="absolute right-3 top-3 text-gray-400 text-sm">
            Searching...
          </div>
        )}
      </div>

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

      {showDropdown && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-lg p-3 text-sm text-gray-400">
          No results found. Try different keywords.
        </div>
      )}
    </div>
  );
};

export default LocationSearch;