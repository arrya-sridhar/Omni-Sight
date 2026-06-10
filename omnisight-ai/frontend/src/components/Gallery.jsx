import React from "react";
import { Film, Calendar, CheckCircle, Percent } from "lucide-react";

export default function Gallery({ results, onPlayKeyframe }) {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!results || results.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto text-center py-16 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
        <Film className="mx-auto text-gray-500 mb-4 animate-pulse" size={48} />
        <p className="text-gray-400 text-lg">No matching keyframes found.</p>
        <p className="text-gray-500 text-sm mt-1">Try broadening your search query or decreasing the threshold.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckCircle size={20} className="text-emerald-400" />
          Search Results ({results.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {results.map((result, idx) => {
          const scorePercent = Math.round(result.score * 100);
          
          return (
            <div 
              key={result.keyframe_id || idx}
              onClick={() => onPlayKeyframe && onPlayKeyframe(result)}
              className="group cursor-pointer bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              {/* Image container */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                <img
                  src={`http://localhost:8000${result.image_url}`}
                  alt={result.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback to placeholder if backend is not running
                    e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80";
                  }}
                />
                
                {/* Score badge */}
                <div className="absolute top-3 right-3 bg-indigo-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-0.5 backdrop-blur-sm shadow-md">
                  <span>{scorePercent}</span>
                  <Percent size={10} />
                </div>
                
                {/* Timestamp tag */}
                <div className="absolute bottom-3 left-3 bg-slate-950/80 text-white text-xs font-mono px-2 py-0.5 rounded backdrop-blur-sm">
                  {formatTime(result.timestamp)}
                </div>
              </div>

              {/* Details */}
              <div className="p-4">
                <h3 className="text-white text-sm font-semibold truncate" title={result.filename}>
                  {result.filename}
                </h3>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-2">
                  <Film size={12} />
                  <span>Keyframe #{idx + 1}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
