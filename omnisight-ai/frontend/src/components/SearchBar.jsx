import React, { useState } from "react";
import { Search, Sliders, Play } from "lucide-react";

export default function SearchBar({ onSearch, isLoading }) {
  const [query, setQuery] = useState("");
  const [threshold, setThreshold] = useState(0.2);
  const [limit, setLimit] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch({ query, threshold, limit });
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 shadow-2xl transition-all duration-300 hover:border-white/40">
          <Search className="text-gray-400 ml-4 mr-2 flex-shrink-0" size={24} />
          <input
            type="text"
            placeholder="Search keyframes (e.g. 'a red car speeding', 'person walking a dog')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            className="w-full bg-transparent border-0 outline-none px-2 py-3 text-white placeholder-gray-400 text-lg disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl mr-2 text-gray-400 hover:text-white hover:bg-white/10 transition-all ${showFilters ? "text-white bg-white/10" : ""}`}
            title="Search Filters"
          >
            <Sliders size={20} />
          </button>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg shadow-indigo-600/30"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Search</span>
                <Play size={16} fill="white" />
              </>
            )}
          </button>
        </div>

        {/* Filters dropdown */}
        {showFilters && (
          <div className="absolute top-full left-0 right-0 mt-3 p-6 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-3xl z-10 flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-gray-300">Similarity Threshold</label>
                <span className="text-sm font-mono text-indigo-400 font-bold">{threshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-xs text-gray-500 mt-1 block">Higher threshold yields more precise matches.</span>
            </div>

            <div className="w-full md:w-48">
              <label className="text-sm font-semibold text-gray-300 block mb-2">Max Results</label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
              >
                <option value={5}>5 results</option>
                <option value={10}>10 results</option>
                <option value={20}>20 results</option>
                <option value={50}>50 results</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
